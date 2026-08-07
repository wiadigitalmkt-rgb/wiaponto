
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Briefcase, 
  Building2, 
  Calendar, 
  Loader2, 
  X,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    department: 'Operacional',
    position: 'Colaborador',
    admission_date: new Date().toISOString().split('T')[0],
    work_schedule: '08:00 - 18:00',
    role: 'employee'
  });

  // Carregar colaboradores do Supabase
  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.Employees.list();
      setEmployees(data || []);
    } catch (err) {
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Salvar novo colaborador
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      toast.error('Preencha pelo menos o nome e o e-mail!');
      return;
    }

    try {
      setSaving(true);
      await base44.entities.Employees.create(formData);
      toast.success('Colaborador cadastrado com sucesso!');
      setIsModalOpen(false);
      setFormData({
        full_name: '',
        email: '',
        department: 'Operacional',
        position: 'Colaborador',
        admission_date: new Date().toISOString().split('T')[0],
        work_schedule: '08:00 - 18:00',
        role: 'employee'
      });
      loadEmployees();
    } catch (err) {
      toast.error('Erro ao cadastrar colaborador: ' + (err.message || 'Verifique se o e-mail já existe'));
    } finally {
      setSaving(false);
    }
  };

  // Filtragem de busca
  const filteredEmployees = employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100/70 p-6 space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2c6a]">Colaboradores</h1>
          <p className="text-sm text-slate-500">Gerencie a equipe e acesse os cadastros individuais</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#ff8b00] hover:bg-[#e67a00] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition"
        >
          <UserPlus size={18} /> Novo Colaborador
        </button>
      </div>

      {/* Card da Tabela + Busca */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        
        {/* Barra de Pesquisa */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, e-mail ou departamento..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#ff8b00]"
            />
          </div>
        </div>

        {/* Listagem */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-[#1a2c6a]" size={32} />
            <span className="text-sm font-medium">Carregando colaboradores...</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="mx-auto mb-2 text-slate-300" size={40} />
            <p className="font-semibold text-slate-600">Nenhum colaborador encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Cadastre seu primeiro funcionário clicando no botão acima.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Colaborador</th>
                  <th className="py-3 px-6">Departamento / Cargo</th>
                  <th className="py-3 px-6">Jornada</th>
                  <th className="py-3 px-6">Admissão</th>
                  <th className="py-3 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1a2c6a] text-white flex items-center justify-center font-bold text-sm">
                        {emp.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{emp.full_name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <Mail size={12} /> {emp.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-700">{emp.position || 'Colaborador'}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Building2 size={12} /> {emp.department || 'Geral'}
                      </p>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">
                      {emp.work_schedule || '08:00 - 18:00'}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {emp.admission_date ? new Date(emp.admission_date).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={12} /> Ativo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold text-[#1a2c6a] mb-1 flex items-center gap-2">
              <UserPlus size={20} className="text-[#ff8b00]" /> Novo Colaborador
            </h2>
            <p className="text-xs text-slate-500 mb-6">Preencha os dados básicos para acesso ao sistema.</p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-slate-700 mb-1 block">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Maria Silva"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff8b00]"
                />
              </div>

              <div>
                <label className="text-slate-700 mb-1 block">E-mail Corporativo</label>
                <input 
                  type="email" 
                  required
                  placeholder="maria@empresa.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff8b00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 mb-1 block">Departamento</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Comercial"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff8b00]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 mb-1 block">Cargo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Analista"
                    value={formData.position}
                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff8b00]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 mb-1 block">Data de Admissão</label>
                  <input 
                    type="date" 
                    value={formData.admission_date}
                    onChange={e => setFormData({ ...formData, admission_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff8b00]"
                  />
                </div>
                <div>
                  <label className="text-slate-700 mb-1 block">Jornada Padrão</label>
                  <input 
                    type="text" 
                    placeholder="08:00 - 18:00"
                    value={formData.work_schedule}
                    onChange={e => setFormData({ ...formData, work_schedule: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff8b00]"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 py-2.5 rounded-xl bg-[#1a2c6a] hover:bg-[#121f4c] text-white font-bold transition flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
