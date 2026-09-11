import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  X,
  Loader2,
  Mail,
  Lock,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2, 
  ArrowLeft
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ---------------------------------------------------------------------------
// IMPORTAÇÃO EM MASSA
// Campos do modelo de planilha, na ordem em que aparecem no arquivo baixado
// (usada tanto pra montar o cabeçalho do modelo quanto pra pré-preencher o
// mapeamento de colunas quando o gestor sobe uma planilha gerada por aqui).
// ---------------------------------------------------------------------------
const CONTRACT_TYPES = ['CLT', 'Estagiário', 'Aprendiz', 'Contrato Intermitente', 'Temporário', 'CNPJ', 'Sócio'];

const IMPORT_FIELDS = [
  { key: 'primeiroNome', label: 'Primeiro Nome', required: true },
  { key: 'sobrenome', label: 'Sobrenome', required: true },
  { key: 'telefone', label: 'DDD+Telefone', required: false },
  { key: 'rg', label: 'RG', required: false },
  { key: 'cpf', label: 'CPF', required: true },
  { key: 'pis', label: 'PIS', required: false },
  { key: 'dataNascimento', label: 'Data Nascimento', required: false },
  { key: 'email', label: 'E-mail', required: false },
  { key: 'departamento', label: 'Departamento', required: false },
  { key: 'tipoContrato', label: 'Tipo de contratação', required: true },
  { key: 'cargo', label: 'Cargo', required: true },
  { key: 'salario', label: 'Salário bruto', required: false },
  { key: 'dataAdmissao', label: 'Data de admissão', required: true },
];

function columnLetter(index) {
  let letter = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

// Aceita "DD/MM/AAAA" (como o gestor normalmente digita no Excel), datas
// nativas do Excel (quando a célula já está formatada como data) e datas já
// em ISO ("AAAA-MM-DD"). Qualquer outra coisa retorna null (linha marcada
// como erro na validação).
function parseImportDate(value) {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value)) {
    return value.toISOString().split('T')[0];
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

export default function Employees() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [usersData, setUsersData] = useState([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos'); // Mantém 'Todos' por padrão
  const [itemsPerPage, setItemsPerPage] = useState('10');

  // Modais
  const [showAccessModal, setShowAccessModal] = useState(false);

  // Importação em massa
  const [importStep, setImportStep] = useState(1);
  const [importFile, setImportFile] = useState(null);
  const [importHeaders, setImportHeaders] = useState([]);
  const [importRows, setImportRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [validatingImport, setValidatingImport] = useState(false);
  const [importValidRows, setImportValidRows] = useState([]);
  const [importErrorRows, setImportErrorRows] = useState([]);
  const [selectedImportRows, setSelectedImportRows] = useState({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importResult, setImportResult] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    primeiroNome: '',
    sobrenome: '',
    email: '',
    senha: '',
    cpf: '',
    dataAdmissao: '',
    tipoAcesso: 'Colaborador',
    departamento: '',
    cargo: '',
    salario: '',
    tipoContrato: '',
    inicioJornada: '',
    jornada: '',
  });

  // 1. CARREGAR COLABORADORES DO SUPABASE
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapeia os dados do Banco garantindo 'Ativo' para quem não tem status definido
      const formatted = (data || []).map((emp) => {
        const nameParts = (emp.full_name || '').split(' ');
        const initials = nameParts.length > 1 
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
          : (emp.full_name || 'UC').substring(0, 2).toUpperCase();

        return {
          id: emp.id,
          initials,
          name: emp.full_name || 'Sem nome',
          email: emp.email || '-',
          cargo: emp.position || '(Preencher)',
          departamento: emp.department || '-',
          tipoAcesso: emp.role === 'gestor' || emp.role === 'admin' ? 'Gestor' : 'Colaborador',
          status: emp.status ? emp.status.trim() : 'Ativo',
          photoUrl: emp.photo_url || '',
        };
      });

      setUsersData(formatted);
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // -------------------------------------------------------------------------
  // IMPORTAÇÃO EM MASSA
  // -------------------------------------------------------------------------

  function resetImportWizard() {
    setImportStep(1);
    setImportFile(null);
    setImportHeaders([]);
    setImportRows([]);
    setColumnMapping({});
    setImportValidRows([]);
    setImportErrorRows([]);
    setSelectedImportRows({});
    setImportResult(null);
    setImportProgress({ done: 0, total: 0 });
  }

  function handleDownloadTemplate() {
    const headers = IMPORT_FIELDS.map((f) => `${f.label}${f.required ? '*' : ''}`);
    const notaLinha = [
      '', '', '(00) 00000-0000', '', '000.000.000-00', '', 'DD/MM/AAAA', '', '',
      `Use: ${CONTRACT_TYPES.join(' / ')}`, '', '', 'DD/MM/AAAA'
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, notaLinha]);
    ws['!cols'] = headers.map(() => ({ wch: 24 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cadastro Colaboradores');
    XLSX.writeFile(wb, 'modelo-cadastro-colaboradores.xlsx');
  }

  function handleImportFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false, defval: '' });

        if (!rows.length) {
          alert('Essa planilha está vazia.');
          return;
        }

        const headerRow = rows[0].map((h) => String(h || '').trim());
        // Ignora a linha de exemplo/dica (a que o modelo baixado inclui) e
        // qualquer linha totalmente vazia.
        const dataRows = rows.slice(1).filter((r) =>
          r.some((cell) => String(cell || '').trim() !== '')
        );

        setImportHeaders(headerRow);
        setImportRows(dataRows);

        // Pré-preenche o mapeamento assumindo a mesma ordem do modelo
        // baixado — se o gestor usou o arquivo gerado por aqui, já cai
        // tudo certo sem precisar mexer em nada no passo 2.
        const autoMap = {};
        IMPORT_FIELDS.forEach((field, idx) => {
          if (idx < headerRow.length) autoMap[field.key] = idx;
        });
        setColumnMapping(autoMap);
      } catch (err) {
        console.error(err);
        alert('Não consegui ler essa planilha. Confira se é um arquivo .xlsx válido.');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleValidateImport() {
    const missing = IMPORT_FIELDS.filter((f) => f.required && columnMapping[f.key] === undefined);
    if (missing.length > 0) {
      alert('Mapeie os campos obrigatórios antes de continuar: ' + missing.map((f) => f.label).join(', '));
      return;
    }

    setValidatingImport(true);
    try {
      const { data: existing, error } = await supabase.from('Employees').select('cpf');
      if (error) throw error;
      const existingCpfSet = new Set(
        (existing || []).map((e) => (e.cpf || '').replace(/\D/g, '')).filter(Boolean)
      );

      const valid = [];
      const invalid = [];
      const seenInFile = new Set();

      importRows.forEach((row, rowIndex) => {
        const get = (key) => {
          const colIdx = columnMapping[key];
          if (colIdx === undefined) return '';
          return String(row[colIdx] ?? '').trim();
        };

        const primeiroNome = get('primeiroNome');
        const sobrenome = get('sobrenome');
        const cpfDigits = get('cpf').replace(/\D/g, '');
        const tipoContratoRaw = get('tipoContrato');
        const tipoContrato = CONTRACT_TYPES.find((t) => t.toLowerCase() === tipoContratoRaw.toLowerCase());
        const cargo = get('cargo');
        const dataAdmissaoRaw = get('dataAdmissao');
        const dataAdmissao = parseImportDate(dataAdmissaoRaw);
        const dataNascimentoRaw = get('dataNascimento');

        const errors = [];
        if (!primeiroNome) errors.push('Primeiro nome vazio');
        if (!sobrenome) errors.push('Sobrenome vazio');
        if (cpfDigits.length !== 11) errors.push('CPF inválido');
        if (!cargo) errors.push('Cargo vazio');
        if (!tipoContratoRaw) errors.push('Tipo de contratação vazio');
        else if (!tipoContrato) errors.push(`Tipo de contratação inválido (use: ${CONTRACT_TYPES.join(', ')})`);
        if (!dataAdmissaoRaw) errors.push('Data de admissão vazia');
        else if (!dataAdmissao) errors.push('Data de admissão em formato inválido (use DD/MM/AAAA)');
        if (dataNascimentoRaw && !parseImportDate(dataNascimentoRaw)) errors.push('Data de nascimento em formato inválido');
        if (cpfDigits && existingCpfSet.has(cpfDigits)) errors.push('CPF já cadastrado no sistema');
        if (cpfDigits && seenInFile.has(cpfDigits)) errors.push('CPF duplicado nesta planilha');
        if (cpfDigits) seenInFile.add(cpfDigits);

        const record = {
          rowIndex,
          primeiroNome,
          sobrenome,
          cpfDigits,
          cpfDisplay: get('cpf'),
          telefone: get('telefone'),
          rg: get('rg'),
          pis: get('pis'),
          dataNascimento: parseImportDate(dataNascimentoRaw),
          email: get('email'),
          departamento: get('departamento'),
          tipoContrato: tipoContrato || tipoContratoRaw,
          cargo,
          salario: get('salario'),
          dataAdmissao,
        };

        if (errors.length > 0) {
          invalid.push({ ...record, errors });
        } else {
          valid.push(record);
        }
      });

      setImportErrorRows(invalid);
      setImportValidRows(valid);
      setSelectedImportRows(Object.fromEntries(valid.map((r) => [r.rowIndex, true])));
      setImportStep(3);
    } catch (err) {
      console.error(err);
      alert('Erro ao validar a planilha: ' + err.message);
    } finally {
      setValidatingImport(false);
    }
  }

  async function handleConfirmImport() {
    const rowsToImport = importValidRows.filter((r) => selectedImportRows[r.rowIndex]);
    if (rowsToImport.length === 0) {
      alert('Selecione ao menos um colaborador pra cadastrar.');
      return;
    }

    setImporting(true);
    setImportProgress({ done: 0, total: rowsToImport.length });
    const results = { success: 0, failed: [] };

    // Um insert por linha (em vez de um insert só com todo mundo) — assim
    // um problema em UM colaborador (ex: alguma restrição do banco que a
    // validação daqui não previu) não derruba a importação inteira; o
    // resto continua sendo cadastrado normalmente.
    for (const row of rowsToImport) {
      try {
        const fullName = `${row.primeiroNome} ${row.sobrenome}`.trim();
        const payload = {
          full_name: fullName,
          first_name: row.primeiroNome,
          last_name: row.sobrenome,
          phone: row.telefone || null,
          rg: row.rg || null,
          cpf: row.cpfDigits,
          pis_pasep: row.pis || null,
          birth_date: row.dataNascimento,
          email: row.email || null,
          department: row.departamento || null,
          contract_type: row.tipoContrato,
          position: row.cargo,
          salary: row.salario || null,
          admission_date: row.dataAdmissao,
          // Padrão inicial = CPF, igual ao "Resetar senha" na edição do
          // usuário — o colaborador consegue entrar com CPF + CPF até
          // trocar a senha (Login.jsx já cobre login sem e-mail cadastrado).
          password_hash: row.cpfDigits,
          role: 'colaborador',
          access_type: 'Colaborador',
          status: 'Ativo'
        };
        const { error } = await supabase.from('Employees').insert([payload]);
        if (error) throw error;
        results.success += 1;
      } catch (err) {
        console.error(err);
        results.failed.push({ nome: `${row.primeiroNome} ${row.sobrenome}`.trim(), motivo: err.message });
      }
      setImportProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }

    setImporting(false);
    setImportResult(results);
    await fetchEmployees();
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenModal = (e) => {
    e.preventDefault();
    setShowAccessModal(true);
  };

  // 2. INSERIR NOVO COLABORADOR NO SUPABASE E SUPABASE AUTH
  const handleConfirmCreate = async () => {
    const fullName = `${formData.primeiroNome} ${formData.sobrenome}`.trim();

    try {
      // Criação do usuário na tabela Employees
      const { data, error } = await supabase.from('Employees').insert([
        {
          full_name: fullName,
          first_name: formData.primeiroNome,
          last_name: formData.sobrenome,
          email: formData.email.toLowerCase().trim(),
          password_hash: formData.senha,
          cpf: formData.cpf,
          admission_date: formData.dataAdmissao || null,
          role: formData.tipoAcesso === 'Gestor' ? 'gestor' : 'colaborador',
          access_type: formData.tipoAcesso,
          department: formData.departamento || null,
          position: formData.cargo || null,
          salary: formData.salario || null,
          contract_type: formData.tipoContrato || null,
          work_schedule: formData.jornada || '08:00 - 18:00',
          status: 'Ativo'
        },
      ]).select();

      if (error) throw error;

      // Cria a conta de autenticação no Supabase Auth
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase().trim(),
        password: formData.senha,
        options: {
          data: {
            full_name: fullName,
            role: formData.tipoAcesso === 'Gestor' ? 'gestor' : 'colaborador',
          }
        }
      });

      if (authError && !authError.message.includes('already registered')) {
        console.warn('Aviso no Supabase Auth:', authError.message);
      }

      setShowAccessModal(false);
      setFormData({
        primeiroNome: '',
        sobrenome: '',
        email: '',
        senha: '',
        cpf: '',
        dataAdmissao: '',
        tipoAcesso: 'Colaborador',
        departamento: '',
        cargo: '',
        salario: '',
        tipoContrato: '',
        inicioJornada: '',
        jornada: '',
      });

      if (data && data[0]?.id) {
        navigate(`/admin/usuario?id=${data[0].id}`);
      } else {
        await fetchEmployees();
        setCurrentView('list');
      }
    } catch (err) {
      alert('Erro ao salvar colaborador: ' + err.message);
    }
  };

  const filteredUsers = usersData.filter((user) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.tipoAcesso.toLowerCase().includes(term) ||
      user.cargo.toLowerCase().includes(term);

    const userStatus = user.status.toLowerCase();
    const matchesStatus = 
      statusFilter === 'Todos' || 
      (statusFilter === 'Ativos' && (userStatus === 'ativo' || userStatus === '')) ||
      (statusFilter === 'Inativos' && userStatus === 'inativo');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#edf2f7] flex flex-col font-sans text-slate-700 relative">
      <Navbar selectedCompany="Sua Empresa" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {currentView === 'list' && (
          <>
            <div className="text-xs text-slate-500 mb-4">
              <Link to="/admin" className="hover:text-[#ff8b00] hover:underline transition-colors font-medium">
                Painel
              </Link> 
              <ChevronRight className="w-3 h-3 inline mx-1 text-slate-400" />
              <span className="text-[#ff8b00] font-medium">Usuários</span>
            </div>

            <div className="flex justify-between items-center mb-5">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Usuários
              </h1>

              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="bg-[#ff8b00] hover:bg-[#fc9314] text-white font-medium px-4 py-2 rounded-md text-xs flex items-center space-x-1.5 shadow-sm transition-colors focus:outline-none cursor-pointer">
                  <span>Adicionar</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-lg rounded-md p-1 z-50">
                  <DropdownMenuItem 
                    onClick={() => setCurrentView('create')}
                    className="text-xs text-slate-700 cursor-pointer py-2 hover:bg-slate-100"
                  >
                    Novo Colaborador
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => { resetImportWizard(); setCurrentView('import'); }}
                    className="text-xs text-slate-700 cursor-pointer py-2 hover:bg-slate-100"
                  >
                    Importar Usuários
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Digite o nome, e-mail do usuário ou tipo de acesso"
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-[#ff8b00] transition-colors"
                  />
                </div>

                <div className="w-full sm:w-auto flex justify-end">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-slate-200 rounded px-3 py-1.5 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:border-[#ff8b00] cursor-pointer min-w-[110px]"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Ativos">Ativos</option>
                    <option value="Inativos">Inativos</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-6">NOME</th>
                      <th className="py-3 px-6">E-MAIL</th>
                      <th className="py-3 px-6">CARGO</th>
                      <th className="py-3 px-6">DEPARTAMENTO</th>
                      <th className="py-3 px-6">TIPO DE ACESSO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#ff8b00]" />
                          Carregando colaboradores do banco de dados...
                        </td>
                      </tr>
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr 
                          key={user.id} 
                          onClick={() => navigate(`/admin/usuario?id=${user.id}`)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-6">
                            <div className="flex items-center space-x-3">
                              {user.photoUrl ? (
                                <img
                                  src={user.photoUrl}
                                  alt={user.name}
                                  className="w-8 h-8 rounded-full object-cover object-top border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-slate-600 text-xs shrink-0">
                                  {user.initials}
                                </div>
                              )}
                              <span className="font-semibold text-slate-800 hover:text-[#ff8b00] transition-colors">
                                {user.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-slate-600">{user.email}</td>
                          <td className="py-3.5 px-6 text-slate-600">{user.cargo}</td>
                          <td className="py-3.5 px-6 text-slate-600">{user.departamento}</td>
                          <td className="py-3.5 px-6 text-slate-600">{user.tipoAcesso}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 bg-white">
                <div><span>{filteredUsers.length} Resultados</span></div>
                <div className="flex items-center space-x-2">
                  <span>Itens por página</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(e.target.value)}
                    className="border border-slate-200 rounded px-2 py-1 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:border-[#ff8b00]"
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* CADASTRO */}
        {currentView === 'create' && (
          <>
            <div className="text-xs text-slate-500 mb-4">
              <Link to="/admin" className="hover:text-[#ff8b00] hover:underline transition-colors font-medium">Painel</Link> 
              <ChevronRight className="w-3 h-3 inline mx-1 text-slate-400" />
              <button onClick={() => setCurrentView('list')} className="hover:text-[#ff8b00] hover:underline transition-colors font-medium">Usuários</button>
              <ChevronRight className="w-3 h-3 inline mx-1 text-slate-400" />
              <span className="text-[#ff8b00] font-medium">Novo Cadastro</span>
            </div>

            <form onSubmit={handleOpenModal} className="bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-6 h-6 rounded-full bg-[#ff8b00]/10 text-[#ff8b00] font-bold text-xs flex items-center justify-center">1</div>
                  <h2 className="text-sm font-bold text-slate-800">Campos obrigatórios de Acesso</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primeiro nome*</label>
                    <input 
                      type="text" required placeholder="João"
                      value={formData.primeiroNome}
                      onChange={(e) => handleInputChange('primeiroNome', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sobrenome*</label>
                    <input 
                      type="text" required placeholder="Silva"
                      value={formData.sobrenome}
                      onChange={(e) => handleInputChange('sobrenome', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CPF*</label>
                    <input 
                      type="text" required placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail do Colaborador (Login)*</label>
                    <input 
                      type="email" required placeholder="colaborador@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Senha de Acesso Inicial*</label>
                    <input 
                      type="password" required placeholder="SuaSenhaInicial123"
                      value={formData.senha}
                      onChange={(e) => handleInputChange('senha', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Data de admissão*</label>
                    <input 
                      type="date" required
                      value={formData.dataAdmissao}
                      onChange={(e) => handleInputChange('dataAdmissao', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de acesso *</label>
                    <select
                      value={formData.tipoAcesso}
                      onChange={(e) => handleInputChange('tipoAcesso', e.target.value)}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#ff8b00]"
                    >
                      <option value="Colaborador">Colaborador</option>
                      <option value="Gestor">Gestor</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button type="submit" className="bg-[#ff8b00] hover:bg-[#fc9314] text-white font-semibold px-6 py-2 rounded text-xs transition-colors">
                  Continuar
                </button>
              </div>
            </form>
          </>
        )}

        {/* IMPORTAÇÃO EM MASSA */}
        {currentView === 'import' && (
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => { resetImportWizard(); setCurrentView('list'); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Usuários
            </button>

            {/* Indicador de passos */}
            <div className="flex items-center gap-2 mb-4 text-xs">
              {[
                { n: 1, label: 'Fazer upload' },
                { n: 2, label: 'Mapear dados' },
                { n: 3, label: 'Cadastrar' },
              ].map((step, idx) => (
                <React.Fragment key={step.n}>
                  <div className={`flex items-center gap-1.5 font-medium ${
                    importStep === step.n ? 'text-slate-800' : importStep > step.n ? 'text-[#ff8b00]' : 'text-slate-400'
                  }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      importStep > step.n ? 'bg-[#ff8b00] text-white' :
                      importStep === step.n ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {importStep > step.n ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.n}
                    </span>
                    {step.label}
                  </div>
                  {idx < 2 && <div className="flex-1 h-px bg-slate-200" />}
                </React.Fragment>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200/80">
              {/* PASSO 1 — UPLOAD */}
              {importStep === 1 && (
                <>
                  <div className="p-6 space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm">Cadastro em massa</h3>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Selecione uma planilha do Excel para fazer upload
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={importFile ? importFile.name : ''}
                          placeholder="Selecione excel máx. 500 linhas"
                          className="flex-1 border rounded px-3 py-2 text-xs text-slate-600 bg-slate-50"
                        />
                        <label className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded text-xs cursor-pointer transition-colors shrink-0">
                          Procurar
                          <input type="file" accept=".xlsx,.xls" onChange={handleImportFileChange} className="hidden" />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-1.5 text-[#ff8b00] hover:underline text-xs font-medium mt-2"
                      >
                        <Download className="w-3.5 h-3.5" /> Download arquivo modelo
                      </button>
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex justify-between items-center">
                    <button
                      onClick={() => { resetImportWizard(); setCurrentView('list'); }}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setImportStep(2)}
                      disabled={!importFile}
                      className="bg-[#ff8b00] hover:bg-[#fc9314] text-white font-medium px-5 py-2 rounded text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Continuar
                    </button>
                  </div>
                </>
              )}

              {/* PASSO 2 — MAPEAR DADOS */}
              {importStep === 2 && (
                <>
                  <div className="p-6">
                    <h3 className="font-bold text-slate-800 text-sm mb-1">Mapear dados</h3>
                    <p className="text-slate-500 text-xs mb-4">
                      Confira se cada campo está apontando pra coluna certa da sua planilha.
                    </p>
                    <div className="divide-y divide-slate-100">
                      {IMPORT_FIELDS.map((field) => (
                        <div key={field.key} className="flex items-center justify-between py-3 text-xs">
                          <span className="text-slate-700 font-medium">
                            {field.label}{field.required ? '*' : ''}
                          </span>
                          <select
                            value={columnMapping[field.key] ?? ''}
                            onChange={(e) =>
                              setColumnMapping((prev) => ({
                                ...prev,
                                [field.key]: e.target.value === '' ? undefined : Number(e.target.value),
                              }))
                            }
                            className="border rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#ff8b00] w-48"
                          >
                            <option value="">Não mapear</option>
                            {importHeaders.map((h, idx) => (
                              <option key={idx} value={idx}>
                                {columnLetter(idx)}{h ? ` — ${h}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex justify-between items-center">
                    <button onClick={() => setImportStep(1)} className="text-slate-500 hover:text-slate-700">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleValidateImport}
                      disabled={validatingImport}
                      className="bg-[#ff8b00] hover:bg-[#fc9314] text-white font-medium px-5 py-2 rounded text-xs transition-colors disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {validatingImport && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Continuar
                    </button>
                  </div>
                </>
              )}

              {/* PASSO 3 — VALIDAÇÃO + CADASTRO */}
              {importStep === 3 && (
                <div className="p-6 space-y-6">
                  {importResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <CheckCircle2 className="w-5 h-5 text-[#ff8b00]" />
                        {importResult.success} colaborador(es) cadastrado(s) com sucesso!
                      </div>
                      {importResult.failed.length > 0 && (
                        <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-xs space-y-2">
                          <p className="font-semibold text-red-600">
                            {importResult.failed.length} não puderam ser cadastrados:
                          </p>
                          {importResult.failed.map((f, i) => (
                            <div key={i} className="text-red-600">
                              <strong>{f.nome}</strong> — {f.motivo}
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => { resetImportWizard(); setCurrentView('list'); }}
                        className="bg-[#ff8b00] hover:bg-[#fc9314] text-white font-medium px-5 py-2 rounded text-xs transition-colors"
                      >
                        Concluir
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm mb-3">Validação de planilha</h3>
                        <p className="text-xs font-semibold text-slate-700 mb-2">Linhas com erros</p>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                <th className="py-2 px-3">Nome</th>
                                <th className="py-2 px-3">CPF</th>
                                <th className="py-2 px-3">Erros</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {importErrorRows.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="py-6 text-center text-slate-400">
                                    Nenhum resultado foi encontrado.
                                  </td>
                                </tr>
                              ) : (
                                importErrorRows.map((row) => (
                                  <tr key={row.rowIndex}>
                                    <td className="py-2 px-3 text-slate-700">{row.primeiroNome} {row.sobrenome}</td>
                                    <td className="py-2 px-3 text-slate-600">{row.cpfDisplay || '-'}</td>
                                    <td className="py-2 px-3 text-red-600 flex items-start gap-1">
                                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                      {row.errors.join('; ')}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1.5">{importErrorRows.length} Resultados</p>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800 text-sm mb-3">Importação</h3>
                        <p className="text-xs font-semibold text-slate-700 mb-2">Selecione os colaboradores</p>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                <th className="py-2 px-3 w-8">
                                  <input
                                    type="checkbox"
                                    checked={importValidRows.length > 0 && importValidRows.every((r) => selectedImportRows[r.rowIndex])}
                                    onChange={(e) =>
                                      setSelectedImportRows(
                                        Object.fromEntries(importValidRows.map((r) => [r.rowIndex, e.target.checked]))
                                      )
                                    }
                                    className="accent-[#ff8b00]"
                                  />
                                </th>
                                <th className="py-2 px-3">Nome</th>
                                <th className="py-2 px-3">CPF</th>
                                <th className="py-2 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {importValidRows.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="py-6 text-center text-slate-400">
                                    Nenhum colaborador válido encontrado na planilha.
                                  </td>
                                </tr>
                              ) : (
                                importValidRows.map((row) => (
                                  <tr key={row.rowIndex}>
                                    <td className="py-2 px-3">
                                      <input
                                        type="checkbox"
                                        checked={!!selectedImportRows[row.rowIndex]}
                                        onChange={(e) =>
                                          setSelectedImportRows((prev) => ({ ...prev, [row.rowIndex]: e.target.checked }))
                                        }
                                        className="accent-[#ff8b00]"
                                      />
                                    </td>
                                    <td className="py-2 px-3 font-semibold text-slate-700">{row.primeiroNome} {row.sobrenome}</td>
                                    <td className="py-2 px-3 text-slate-600">{row.cpfDigits}</td>
                                    <td className="py-2 px-3 text-slate-500">Pronto pra cadastrar</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1.5">{importValidRows.length} Resultados</p>
                      </div>

                      {importing && (
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Cadastrando {importProgress.done} de {importProgress.total}...
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <button onClick={() => setImportStep(2)} disabled={importing} className="text-slate-500 hover:text-slate-700 disabled:opacity-40">
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { resetImportWizard(); setCurrentView('list'); }}
                            disabled={importing}
                            className="border border-red-300 text-red-500 hover:bg-red-50 px-4 py-2 rounded text-xs font-medium transition-colors disabled:opacity-40"
                          >
                            Sair
                          </button>
                          <button
                            onClick={handleConfirmImport}
                            disabled={importing || importValidRows.length === 0}
                            className="bg-[#ff8b00] hover:bg-[#fc9314] text-white font-medium px-5 py-2 rounded text-xs transition-colors disabled:opacity-40"
                          >
                            Cadastrar
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL CONFIRMAÇÃO DE DADOS */}
      {showAccessModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Confirmar e Salvar no Banco</h3>
              <button onClick={() => setShowAccessModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 text-xs text-slate-700">
                <Mail className="w-5 h-5 text-[#ff8b00]" />
                <div><span className="font-bold">E-mail (Login): </span><span className="font-mono">{formData.email}</span></div>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-700">
                <Lock className="w-5 h-5 text-[#ff8b00]" />
                <div><span className="font-bold">Senha Inicial: </span><span className="font-mono">{formData.senha}</span></div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end space-x-2 bg-slate-50/50">
              <button onClick={() => setShowAccessModal(false)} className="border border-red-500 text-red-500 px-4 py-1.5 rounded text-xs">Cancelar</button>
              <button onClick={handleConfirmCreate} className="bg-[#ff8b00] hover:bg-[#fc9314] text-white px-5 py-1.5 rounded text-xs transition-colors">Salvar no Banco</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
