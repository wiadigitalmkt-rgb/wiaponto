import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { 
  Clock, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Calendar,
  ExternalLink,
  MessageSquare,
  Moon,
  Monitor,
  CheckCircle2,
  X,
  History,
  Search,
  MapPin,
  Camera,
  AlertCircle,
  Loader2,
  Smartphone,
  Tablet
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ============================================================================
// FUNÇÕES UTILITÁRIAS DE CÁLCULO DE HORAS
// ============================================================================

const timeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === '-' || timeStr.trim() === '') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

const minutesToHHMM = (mins) => {
  if (mins === null || isNaN(mins) || mins < 0) return '-';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Converte "R$ 1.500,00", "1500,00", "1500.00" ou "1500" para 1500 (Number).
// Employees.salary é TEXT no banco, então isso é necessário antes de calcular
// o valor da hora extra.
const parseSalaryToNumber = (raw) => {
  if (raw === null || raw === undefined || raw === '') return 0;
  if (typeof raw === 'number') return raw;
  let clean = String(raw).replace(/R\$\s?/gi, '').trim();
  if (clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  }
  const value = parseFloat(clean);
  return isNaN(value) ? 0 : value;
};

// Divisor padrão CLT para jornada de 44h semanais (salário mensal / 220h =
// valor da hora normal).
const MONTHLY_HOURS_DIVISOR = 220;
const formatCurrencyBRL = (value) =>
  (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const minutesToDisplayHours = (mins) => {
  if (!mins || mins <= 0) return '0h';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

const minutesToFullDisplay = (mins) => {
  if (mins === null || isNaN(mins) || mins < 0) return '00h 00min';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}min`;
};

// Formata minutos podendo ser negativo (banco de horas em débito) —
// os helpers acima assumem sempre positivo.
const formatSignedHours = (mins) => {
  const sign = mins < 0 ? '-' : '';
  const abs = Math.abs(mins || 0);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}h ${String(m).padStart(2, '0')}min`;
};

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher) — base pros feriados
// móveis (Carnaval, Sexta-feira Santa, Corpus Christi).
const getEasterDate = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

const addDaysToDate = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const dateToISO = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// Feriados nacionais fixos + móveis (calculados a partir da Páscoa) do ano
// informado. Não inclui feriados estaduais/municipais, que variam por
// cidade — se precisar, dá pra somar outra lista depois.
const getBrazilianHolidays = (year) => {
  const easter = getEasterDate(year);
  const fixed = [
    `${year}-01-01`, // Confraternização Universal
    `${year}-04-21`, // Tiradentes
    `${year}-05-01`, // Dia do Trabalho
    `${year}-09-07`, // Independência do Brasil
    `${year}-10-12`, // Nossa Senhora Aparecida
    `${year}-11-02`, // Finados
    `${year}-11-15`, // Proclamação da República
    `${year}-12-25`, // Natal
  ];
  const movable = [
    dateToISO(addDaysToDate(easter, -47)), // Carnaval (terça-feira)
    dateToISO(addDaysToDate(easter, -2)),  // Sexta-feira Santa
    dateToISO(addDaysToDate(easter, 60)),  // Corpus Christi
  ];
  return new Set([...fixed, ...movable]);
};

const WEEKDAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const getWeekdayName = (isoDate) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  return WEEKDAY_NAMES[new Date(y, m - 1, d).getDay()];
};

// "AAAA-MM-DD" -> "DD/MM/AAAA"
const formatDDMMYYYY = (isoDate) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};

// Mostra o ícone certo pelo tipo de dispositivo gravado de verdade no ponto
// (device_type, detectado em PunchClock.jsx). Registros antigos sem esse
// campo caem no ícone de desktop como padrão neutro.
const DeviceIcon = ({ deviceType, className }) => {
  if (deviceType === 'mobile') return <Smartphone className={className} />;
  if (deviceType === 'tablet') return <Tablet className={className} />;
  return <Monitor className={className} />;
};

const AUDIT_ACTION_LABELS = {
  adicionado: 'Ponto adicionado',
  editado: 'Ponto editado',
  removido: 'Ponto removido',
  aprovado: 'Ponto aprovado',
  rejeitado: 'Ponto rejeitado',
  falta_justificada: 'Falta justificada',
  trocar_jornada: 'Jornada trocada',
  anotacao: 'Anotação',
  ajuste_aprovado: 'Solicitação de ajuste aprovada',
  ajuste_rejeitado: 'Solicitação de ajuste rejeitada',
  banco_horas: 'Lançamento no banco de horas'
};

// Quantos minutos o colaborador deveria trabalhar nesse dia, segundo a
// jornada cadastrada em employee_work_schedules.week_days — considera
// feriado (jornada prevista vira 0) e troca de jornada (journey_swaps: usa
// o dia-da-semana do dia trocado, não o do dia real).
const getScheduledMinutesForDate = (dateISO, schedule, isHoliday, swapMap) => {
  if (isHoliday && !swapMap[dateISO]) return 0;

  const effectiveDateISO = swapMap[dateISO] || dateISO;
  const [y, m, d] = effectiveDateISO.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay(); // 0=domingo...6=sábado

  if (!schedule || !Array.isArray(schedule.week_days)) return 0;
  const dayConfig = schedule.week_days.find((w) => w.weekday === weekday);
  if (!dayConfig || !dayConfig.active) return 0;

  const entry = timeToMinutes(dayConfig.entry);
  const exit = timeToMinutes(dayConfig.exit);
  if (entry === null || exit === null) return 0;

  let total = Math.max(0, exit - entry);
  if (dayConfig.has_break) {
    const ls = timeToMinutes(dayConfig.lunch_start);
    const le = timeToMinutes(dayConfig.lunch_end);
    if (ls !== null && le !== null) total -= Math.max(0, le - ls);
  }
  return Math.max(0, total);
};

// isExtraDouble = true quando o dia não tinha jornada prevista (folga,
// domingo, feriado não trocado) — nesse caso TODO o trabalhado vira hora
// extra 100%, em vez de 50%.
// targetDailyMinutes = null significa "colaborador sem jornada cadastrada"
// (diferente de "0min porque é folga") — nesse caso não dá pra saber o que
// é extra, então nada é contado como extra e o dia fica marcado como
// scheduleMissing pra avisar o gestor, em vez de assumir 100% errado.
const processDayRecord = (record, targetDailyMinutes = 0, isExtraDouble = false) => {
  let totalDayMinutes = 0;
  let nightMinutes = 0;

  const newBatidas = record.batidas.map((b) => {
    const mEnt = timeToMinutes(b.entrada);
    let mSai = timeToMinutes(b.saida);

    if (mEnt !== null && mSai !== null) {
      if (mSai < mEnt || b.isNight) {
        mSai += 1440;
      }
      const diff = Math.max(0, mSai - mEnt);
      totalDayMinutes += diff;

      if (b.isNight) {
        nightMinutes += diff;
      }

      return { ...b, saldo: minutesToHHMM(diff) };
    }
    return { ...b, saldo: '-' };
  });

  const scheduleMissing = targetDailyMinutes === null;
  const trabalhadoStr = minutesToDisplayHours(totalDayMinutes);
  const extraMinutes = scheduleMissing ? 0 : Math.max(0, totalDayMinutes - targetDailyMinutes);
  const horaExtraStr = minutesToDisplayHours(extraMinutes);
  const extra50Minutes = isExtraDouble ? 0 : extraMinutes;
  const extra100Minutes = isExtraDouble ? extraMinutes : 0;

  return {
    ...record,
    batidas: newBatidas,
    trabalhado: trabalhadoStr,
    horaExtra: horaExtraStr,
    totalDayMinutes,
    targetDailyMinutes,
    scheduleMissing,
    extraMinutes,
    extra50Minutes,
    extra100Minutes,
    nightMinutes
  };
};

// Nomes dos meses em pt-BR, na mesma ordem que Date.getMonth() (0-11) —
// usado tanto para o rótulo padrão quanto para gerar as opções do dropdown.
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getMonthLabel(date) {
  return `${MONTH_NAMES[date.getMonth()]}/${date.getFullYear()}`;
}

// Gera os últimos `count` meses (do mais recente ao mais antigo), sempre
// incluindo o mês atual. Antes essa lista era fixa ("Agosto/2026" até
// "Março/2026"), então a partir de setembro/2026 nem dava pra selecionar
// o mês atual no filtro — por isso os pontos batidos "sumiam" no Espelho.
function generateRecentMonths(count = 12) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    months.push(getMonthLabel(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return months;
}

function getFileKind(url, fileName) {
  const name = (fileName || url || '').toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(name)) return 'image';
  if (/\.(mp4|webm|mov|ogv)(\?|$)/.test(name)) return 'video';
  if (/\.pdf(\?|$)/.test(name)) return 'pdf';
  return 'other';
}

function FilePreviewModal({ file, onClose }) {
  if (!file) return null;
  const kind = getFileKind(file.url, file.name);
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[70] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-700 truncate pr-4">{file.name || 'Arquivo'}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-2">
          {kind === 'image' && <img src={file.url} alt={file.name || 'Arquivo'} className="max-w-full max-h-[75vh] object-contain" />}
          {kind === 'video' && <video src={file.url} controls className="max-w-full max-h-[75vh]" />}
          {kind === 'pdf' && <iframe src={file.url} title={file.name || 'Arquivo'} className="w-full h-[75vh] border-0" />}
          {kind === 'other' && (
            <div className="text-center p-10 text-slate-500 text-xs space-y-3">
              <p>Não é possível pré-visualizar este tipo de arquivo.</p>
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-[#ff8b00] hover:underline font-medium">
                Baixar arquivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPonto() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get('section') === 'ajustes' ? 'ajustes' :
    searchParams.get('section') === 'banco' ? 'banco' :
    searchParams.get('section') === 'holerite' ? 'holerite' : 'pontos'
  ); // 'pontos' | 'resumo' | 'ajustes' | 'banco' | 'holerite'
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthLabel(new Date()));
  const [selectedDepartment, setSelectedDepartment] = useState('Todos');
  
  // Lista dinâmica de colaboradores do Supabase
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // Objeto do colaborador selecionado
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  // Estado para verificar se é um GESTOR
  const [isManager, setIsManager] = useState(true);

  const [expandedRow, setExpandedRow] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyItemId, setHistoryItemId] = useState(null);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapTargetItemId, setSwapTargetItemId] = useState(null);
  const [swapDate, setSwapDate] = useState('');
  const [savingSwap, setSavingSwap] = useState(false);

  const [showAnnotationModal, setShowAnnotationModal] = useState(false);

  // Solicitações de Ajuste (colaborador solicita, gestor aprova/rejeita)
  const [adjustmentRequests, setAdjustmentRequests] = useState([]);
  const [loadingAdjustments, setLoadingAdjustments] = useState(false);
  const [showNewAdjustmentForm, setShowNewAdjustmentForm] = useState(false);
  const [newAdjustment, setNewAdjustment] = useState({
    record_date: '', description: '', proposed_entrada: '', proposed_saida: ''
  });
  const [savingAdjustment, setSavingAdjustment] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [annotationTargetItemId, setAnnotationTargetItemId] = useState(null);
  const [annotationText, setAnnotationText] = useState('');
  const [savingAnnotation, setSavingAnnotation] = useState(false);

  // Banco de Horas (do colaborador selecionado no topo da página)
  const [bankEntries, setBankEntries] = useState([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [showNewBankEntryForm, setShowNewBankEntryForm] = useState(false);
  const [newBankEntry, setNewBankEntry] = useState({ entry_date: '', hours: '', tipo: 'credito', description: '' });
  const [savingBankEntry, setSavingBankEntry] = useState(false);

  // Holerite (do colaborador selecionado no topo da página)
  const [payslips, setPayslips] = useState([]);
  const [loadingPayslips, setLoadingPayslips] = useState(false);
  const [showNewPayslipForm, setShowNewPayslipForm] = useState(false);
  const [newPayslip, setNewPayslip] = useState({ reference_month: '', file: null });
  const [savingPayslip, setSavingPayslip] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showJornadaModal, setShowJornadaModal] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  const [editingRowKey, setEditingRowKey] = useState(null);
  const [editFormData, setEditFormData] = useState({
    isNight: false,
    obs: '',
    entrada: '',
    saida: ''
  });

  const [registros, setRegistros] = useState([]);
  const [currentManagerId, setCurrentManagerId] = useState(null);
  const [currentManagerName, setCurrentManagerName] = useState('');

  // 1. CARREGAR COLABORADORES DO SUPABASE E DETECTAR USUÁRIO LOGADO COM RESTRIÇÃO
  useEffect(() => {
    async function loadEmployees() {
      const { data: authData } = await supabase.auth.getUser();
      const storedSession = JSON.parse(
        localStorage.getItem('userSession') || sessionStorage.getItem('userSession') || '{}'
      );
      
      const sessionUser = storedSession?.user || storedSession || {};
      const currentUserEmail = authData?.user?.email || sessionUser?.email || '';
      const currentUserCpf = sessionUser?.cpf || '';

      const { data, error } = await supabase
        .from('Employees')
        .select('*')
        .order('full_name', { ascending: true });

      if (!error && data && data.length > 0) {
        // Localiza o registro do usuário logado na tabela
        const loggedInEmployee = data.find(e => 
          (currentUserEmail && e.email?.toLowerCase() === currentUserEmail.toLowerCase()) ||
          (currentUserCpf && e.cpf === currentUserCpf)
        );
        if (loggedInEmployee?.id) {
          setCurrentManagerId(loggedInEmployee.id);
          setCurrentManagerName(loggedInEmployee.full_name || '');
        }

        // Verifica os papéis de acesso tanto no banco quanto na sessão armazenada
        const sessionRole = String(sessionUser?.role || sessionUser?.access_type || '').toLowerCase();
        const dbRole = String(loggedInEmployee?.role || loggedInEmployee?.access_type || '').toLowerCase();

        const isUserManager = 
          sessionRole.includes('gestor') || 
          sessionRole.includes('admin') || 
          dbRole.includes('gestor') || 
          dbRole.includes('admin') ||
          (!loggedInEmployee && currentUserEmail.includes('gestor')); // Fallback para perfil gestor sem e-mail direto na tabela

        if (isUserManager || (!loggedInEmployee && currentUserEmail)) {
          // Se for gestor ou se a conta for de gestão, carrega todos os colaboradores
          setIsManager(true);
          setEmployees(data);
          setSelectedUser(prev => prev || loggedInEmployee || data[0]);
        } else if (loggedInEmployee && loggedInEmployee.role === 'colaborador') {
          // Restringe apenas se for estritamente colaborador
          setIsManager(false);
          setEmployees([loggedInEmployee]);
          setSelectedUser(loggedInEmployee);
        } else {
          // Padrão de segurança: Gestor
          setIsManager(true);
          setEmployees(data);
          setSelectedUser(prev => prev || data[0]);
        }
      }
    }
    loadEmployees();
  }, []);

  // 2. BUSCAR PONTOS DO COLABORADOR SELECIONADO DO SUPABASE
  const fetchRecordsFromSupabase = async () => {
    if (!selectedUser) return;

    let query = supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', selectedUser.id);

    const monthMap = {
      'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04',
      'Maio': '05', 'Junho': '06', 'Julho': '07', 'Agosto': '08',
      'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12'
    };

    let startDate = null;
    let endDateExclusive = null;
    let yearNum = null;
    let monthIndex = null; // 0-11

    const parts = selectedMonth.split('/');
    if (parts.length === 2) {
      const monthNum = monthMap[parts[0]];
      yearNum = parts[1];
      if (monthNum && yearNum) {
        startDate = `${yearNum}-${monthNum}-01`;
        // Primeiro dia do mês seguinte como limite exclusivo — evita montar
        // "AAAA-MM-31" (data inválida em meses com menos de 31 dias, como
        // setembro), que fazia o Postgres rejeitar a query e a tela mostrar
        // "Nenhum registro de ponto encontrado" mesmo com pontos batidos.
        monthIndex = parseInt(monthNum, 10) - 1;
        const nextMonthDate = new Date(parseInt(yearNum, 10), monthIndex + 1, 1);
        endDateExclusive = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
        query = query.gte('record_date', startDate).lt('record_date', endDateExclusive);
      }
    }

    const { data, error } = await query.order('record_date', { ascending: false });

    if (error) console.error('Erro ao buscar registros de ponto:', error);

    // Trocas de jornada — usado pra mostrar o selo "Trocado com DD/MM/AAAA"
    // nos dois dias envolvidos.
    const { data: swapsData, error: swapsError } = await supabase
      .from('journey_swaps')
      .select('*')
      .eq('employee_id', selectedUser.id);
    if (swapsError) console.error('Erro ao buscar trocas de jornada:', swapsError);

    const swapMap = {};
    (swapsData || []).forEach((s) => {
      swapMap[s.date_a] = s.date_b;
      swapMap[s.date_b] = s.date_a;
    });

    // Jornada de trabalho cadastrada do colaborador (aba "Jornada de
    // trabalho" em /admin/usuario) — usada pra saber o horário esperado de
    // cada dia da semana e calcular a hora extra corretamente.
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('employee_work_schedules')
      .select('*')
      .eq('employee_id', selectedUser.id)
      .eq('is_active', true)
      .maybeSingle();
    if (scheduleError) console.error('Erro ao buscar jornada de trabalho:', scheduleError);

    // Anotações do gestor por dia.
    const { data: annotationsData, error: annotationsError } = await supabase
      .from('day_annotations')
      .select('*')
      .eq('employee_id', selectedUser.id)
      .order('created_at', { ascending: false });
    if (annotationsError) console.error('Erro ao buscar anotações:', annotationsError);

    const annotationsMap = {};
    (annotationsData || []).forEach((a) => {
      if (!annotationsMap[a.record_date]) annotationsMap[a.record_date] = [];
      annotationsMap[a.record_date].push(a);
    });

    const holidaysSet = yearNum ? getBrazilianHolidays(parseInt(yearNum, 10)) : new Set();

    // Gera uma linha pra CADA dia do mês selecionado, mesmo sem nenhum ponto
    // batido (antes só apareciam dias com pelo menos um registro).
    const grouped = {};
    if (yearNum !== null && monthIndex !== null) {
      const daysInMonth = new Date(parseInt(yearNum, 10), monthIndex + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = `${yearNum}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        grouped[dateKey] = {
          id: dateKey,
          data: dateKey,
          swappedWith: swapMap[dateKey] || null,
          isHoliday: holidaysSet.has(dateKey),
          annotations: annotationsMap[dateKey] || [],
          batidas: []
        };
      }
    }

    if (!error && data) {
      data.forEach((curr) => {
        const dateKey = curr.record_date;
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            id: dateKey,
            data: dateKey,
            swappedWith: swapMap[dateKey] || null,
            isHoliday: holidaysSet.has(dateKey),
            annotations: annotationsMap[dateKey] || [],
            batidas: []
          };
        }
        grouped[dateKey].batidas.push({
          db_id: curr.id,
          entrada: curr.entrada || '-',
          saida: curr.saida || '-',
          isNight: curr.is_night || false,
          obs: curr.obs || '',
          latitude: curr.latitude,
          longitude: curr.longitude,
          photo_url: curr.photo_url,
          approvalStatus: curr.approval_status || 'aprovado',
          outsideGeofence: curr.outside_geofence || false,
          deviceType: curr.device_type || null,
          isJustifiedAbsence: curr.is_justified_absence || false,
          countAsWorked: curr.count_as_worked || false
        });
      });

      // Colaborador sem nenhuma jornada ativa cadastrada em
      // employee_work_schedules — diferente de "tem jornada, mas esse dia
      // específico é folga". Sem isso, todo dia trabalhado seria lido como
      // folga (meta 0) e viraria 100% de hora extra por engano.
      const hasSchedule = !!(
        scheduleData &&
        Array.isArray(scheduleData.week_days) &&
        scheduleData.week_days.some((w) => w.active)
      );

      const processed = Object.values(grouped)
        .map((rec) => {
          if (!hasSchedule) {
            return processDayRecord(rec, null, false);
          }
          const targetMinutes = getScheduledMinutesForDate(rec.id, scheduleData, rec.isHoliday, swapMap);
          return processDayRecord(rec, targetMinutes, targetMinutes === 0);
        })
        .sort((a, b) => (a.id < b.id ? 1 : -1)); // mais recente primeiro, igual antes
      setRegistros(processed);
    }
  };

  useEffect(() => {
    fetchRecordsFromSupabase();

    if (!selectedUser?.id || !supabase) return;

    const channel = supabase
      .channel(`realtime:time_records:${selectedUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_records',
          filter: `employee_id=eq.${selectedUser.id}`
        },
        () => {
          fetchRecordsFromSupabase();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, selectedMonth]);

  const filteredUsers = employees.filter(u => 
    u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Registra uma entrada no histórico de alterações (tabela time_record_audit)
  // pra aparecer no "Ver histórico" do dia. Nunca deve travar a ação
  // principal — se o log falhar, só loga no console.
  const logAudit = async (recordDate, action, description) => {
    if (!selectedUser?.id) return;
    const { error } = await supabase.from('time_record_audit').insert([{
      employee_id: selectedUser.id,
      record_date: recordDate,
      action,
      description: description || null,
      changed_by_id: currentManagerId,
      changed_by_name: currentManagerName || 'Sistema'
    }]);
    if (error) console.error('Erro ao registrar histórico:', error);
  };

  const handleOpenHistory = async (recordDate) => {
    setHistoryItemId(recordDate);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from('time_record_audit')
      .select('*')
      .eq('employee_id', selectedUser.id)
      .eq('record_date', recordDate)
      .order('created_at', { ascending: false });
    if (error) console.error('Erro ao buscar histórico:', error);
    setHistoryEntries(data || []);
    setHistoryLoading(false);
  };

  // TROCAR JORNADA — permuta a jornada prevista entre o dia selecionado e
  // outro dia informado pelo gestor (usado em troca de turno, compensação
  // de folga, etc). Fica registrado em journey_swaps e aparece como selo
  // "Trocado com DD/MM/AAAA" nos dois dias envolvidos.
  const handleConfirmSwap = async () => {
    if (!swapDate || !swapTargetItemId || !selectedUser?.id) return;
    setSavingSwap(true);
    try {
      const { error } = await supabase.from('journey_swaps').insert([{
        employee_id: selectedUser.id,
        date_a: swapTargetItemId,
        date_b: swapDate,
        created_by_id: currentManagerId
      }]);
      if (error) throw error;

      await logAudit(swapTargetItemId, 'trocar_jornada', `Jornada trocada com ${formatDDMMYYYY(swapDate)}`);
      await logAudit(swapDate, 'trocar_jornada', `Jornada trocada com ${formatDDMMYYYY(swapTargetItemId)}`);

      setShowSwapModal(false);
      setSwapDate('');
      setSwapTargetItemId(null);
      fetchRecordsFromSupabase();
      showToast('Jornada trocada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao trocar jornada: ' + err.message);
    } finally {
      setSavingSwap(false);
    }
  };


  // ANOTAÇÃO — nota livre do gestor sobre o dia. Fica salva em
  // day_annotations (pra futuros relatórios) e também aparece no "Ver
  // histórico" desse dia (via logAudit).
  const handleConfirmAnnotation = async () => {
    if (!annotationTargetItemId || !selectedUser?.id || !annotationText.trim()) return;
    setSavingAnnotation(true);
    try {
      const { error } = await supabase.from('day_annotations').insert([{
        employee_id: selectedUser.id,
        record_date: annotationTargetItemId,
        content: annotationText.trim(),
        created_by_id: currentManagerId
      }]);
      if (error) throw error;

      await logAudit(annotationTargetItemId, 'anotacao', annotationText.trim());

      setShowAnnotationModal(false);
      setAnnotationText('');
      setAnnotationTargetItemId(null);
      fetchRecordsFromSupabase();
      showToast('Anotação salva!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar anotação: ' + err.message);
    } finally {
      setSavingAnnotation(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // SOLICITAÇÕES DE AJUSTE — o colaborador pede (via "Solicitar ajuste" no
  // PunchClock), o gestor aprova ou rejeita aqui. Aprovado grava/atualiza o
  // ponto de verdade (passa a contabilizar); rejeitado não mexe em nada no
  // ponto do colaborador.
  const fetchAdjustmentRequests = async () => {
    if (!selectedUser?.id) return;
    setLoadingAdjustments(true);
    const { data, error } = await supabase
      .from('adjustment_requests')
      .select('*')
      .eq('employee_id', selectedUser.id)
      .order('created_at', { ascending: false });
    if (error) console.error('Erro ao buscar solicitações de ajuste:', error);
    setAdjustmentRequests(data || []);
    setLoadingAdjustments(false);
  };

  useEffect(() => {
    if (activeTab === 'ajustes') fetchAdjustmentRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedUser]);

  // BANCO DE HORAS — lançamentos de crédito (horas extras guardadas) ou
  // débito (horas usadas/compensadas) do colaborador selecionado. O saldo
  // é sempre a soma de todos os lançamentos, nunca um número solto editado
  // à mão — assim sempre bate com o histórico.
  const fetchBankEntries = async () => {
    if (!selectedUser?.id) return;
    setLoadingBank(true);
    const { data, error } = await supabase
      .from('time_bank_entries')
      .select('*')
      .eq('employee_id', selectedUser.id)
      .order('entry_date', { ascending: false });
    if (error) console.error('Erro ao buscar banco de horas:', error);
    setBankEntries(data || []);
    setLoadingBank(false);
  };

  useEffect(() => {
    if (activeTab === 'banco') fetchBankEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedUser]);

  const bankBalanceMinutes = bankEntries.reduce((sum, e) => sum + Math.round(Number(e.hours) * 60), 0);

  const handleAddBankEntry = async () => {
    if (!selectedUser?.id || !newBankEntry.entry_date || !newBankEntry.hours) {
      alert('Preencha a data e a quantidade de horas.');
      return;
    }
    const horasNum = Math.abs(parseFloat(newBankEntry.hours.toString().replace(',', '.')));
    if (isNaN(horasNum) || horasNum <= 0) {
      alert('Digite um número de horas válido (ex: 2 ou 1,5).');
      return;
    }
    const signedHours = newBankEntry.tipo === 'debito' ? -horasNum : horasNum;

    setSavingBankEntry(true);
    try {
      const { error } = await supabase.from('time_bank_entries').insert([{
        employee_id: selectedUser.id,
        entry_date: newBankEntry.entry_date,
        hours: signedHours,
        description: newBankEntry.description || null,
        created_by: currentManagerId,
      }]);
      if (error) throw error;

      await logAudit(
        newBankEntry.entry_date,
        'banco_horas',
        `${newBankEntry.tipo === 'debito' ? 'Débito' : 'Crédito'} de ${horasNum}h no banco de horas${newBankEntry.description ? ` — ${newBankEntry.description}` : ''}`
      );

      setNewBankEntry({ entry_date: '', hours: '', tipo: 'credito', description: '' });
      setShowNewBankEntryForm(false);
      fetchBankEntries();
      showToast('Lançamento adicionado ao banco de horas!');
    } catch (err) {
      console.error(err);
      alert('Erro ao adicionar lançamento: ' + err.message);
    } finally {
      setSavingBankEntry(false);
    }
  };

  const handleDeleteBankEntry = async (entry) => {
    if (!window.confirm('Remover este lançamento do banco de horas?')) return;
    try {
      const { error } = await supabase.from('time_bank_entries').delete().eq('id', entry.id);
      if (error) throw error;
      fetchBankEntries();
      showToast('Lançamento removido.');
    } catch (err) {
      console.error(err);
      alert('Erro ao remover: ' + err.message);
    }
  };

  // HOLERITE — PDFs do contracheque, organizados por mês de referência.
  // Reaproveita o mesmo bucket "documents" já usado pra documentos gerais.
  const fetchPayslips = async () => {
    if (!selectedUser?.id) return;
    setLoadingPayslips(true);
    const { data, error } = await supabase
      .from('employee_payslips')
      .select('*')
      .eq('employee_id', selectedUser.id)
      .order('reference_month', { ascending: false });
    if (error) console.error('Erro ao buscar holerites:', error);
    setPayslips(data || []);
    setLoadingPayslips(false);
  };

  useEffect(() => {
    if (activeTab === 'holerite') fetchPayslips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedUser]);

  const handleAddPayslip = async () => {
    if (!selectedUser?.id || !newPayslip.reference_month || !newPayslip.file) {
      alert('Escolha o mês de referência e o arquivo do holerite.');
      return;
    }
    setSavingPayslip(true);
    try {
      const file = newPayslip.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `holerites/${selectedUser.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      const { error } = await supabase.from('employee_payslips').insert([{
        employee_id: selectedUser.id,
        reference_month: newPayslip.reference_month,
        file_name: file.name,
        file_url: urlData.publicUrl,
        uploaded_by: currentManagerId,
      }]);
      if (error) throw error;

      setNewPayslip({ reference_month: '', file: null });
      setShowNewPayslipForm(false);
      fetchPayslips();
      showToast('Holerite anexado!');
    } catch (err) {
      console.error(err);
      alert('Erro ao anexar holerite: ' + err.message);
    } finally {
      setSavingPayslip(false);
    }
  };

  const handleDeletePayslip = async (payslip) => {
    if (!window.confirm('Excluir este holerite?')) return;
    try {
      const { error } = await supabase.from('employee_payslips').delete().eq('id', payslip.id);
      if (error) throw error;
      fetchPayslips();
      showToast('Holerite removido.');
    } catch (err) {
      console.error(err);
      alert('Erro ao remover: ' + err.message);
    }
  };

  const formatReferenceMonth = (val) => {
    if (!val) return '';
    const [y, m] = val.split('-');
    const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return `${MESES[parseInt(m, 10) - 1]}/${y}`;
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedUser?.id || !newAdjustment.record_date || !newAdjustment.description.trim()) {
      alert('Preencha pelo menos a data e a descrição do que aconteceu.');
      return;
    }
    setSavingAdjustment(true);
    try {
      const { error } = await supabase.from('adjustment_requests').insert([{
        employee_id: selectedUser.id,
        record_date: newAdjustment.record_date,
        description: newAdjustment.description.trim(),
        proposed_entrada: newAdjustment.proposed_entrada || null,
        proposed_saida: newAdjustment.proposed_saida || null,
        status: 'pendente'
      }]);
      if (error) throw error;

      setNewAdjustment({ record_date: '', description: '', proposed_entrada: '', proposed_saida: '' });
      setShowNewAdjustmentForm(false);
      fetchAdjustmentRequests();
      showToast('Solicitação enviada! Aguarde a análise do gestor.');
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar solicitação: ' + err.message);
    } finally {
      setSavingAdjustment(false);
    }
  };

  const handleReviewAdjustment = async (request, decision) => {
    setReviewingId(request.id);
    try {
      const { error } = await supabase
        .from('adjustment_requests')
        .update({
          status: decision,
          reviewed_by: currentManagerId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', request.id);
      if (error) throw error;

      // Só ao aprovar é que o ponto de verdade é criado/ajustado — é isso
      // que faz ele "contabilizar". Rejeitado não toca em time_records.
      if (decision === 'aprovado' && (request.proposed_entrada || request.proposed_saida)) {
        const { data: existing } = await supabase
          .from('time_records')
          .select('*')
          .eq('employee_id', request.employee_id)
          .eq('record_date', request.record_date)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existing) {
          await supabase.from('time_records').update({
            entrada: request.proposed_entrada || existing.entrada,
            saida: request.proposed_saida || existing.saida,
            approval_status: 'aprovado'
          }).eq('id', existing.id);
        } else {
          await supabase.from('time_records').insert([{
            employee_id: request.employee_id,
            record_date: request.record_date,
            entrada: request.proposed_entrada || '-',
            saida: request.proposed_saida || '-',
            is_night: false,
            obs: `Ajuste aprovado: ${request.description}`,
            approval_status: 'aprovado'
          }]);
        }
      }

      await logAudit(
        request.record_date,
        decision === 'aprovado' ? 'ajuste_aprovado' : 'ajuste_rejeitado',
        request.description
      );

      fetchAdjustmentRequests();
      fetchRecordsFromSupabase();
      showToast(decision === 'aprovado' ? 'Solicitação aprovada!' : 'Solicitação rejeitada.');
    } catch (err) {
      console.error(err);
      alert('Erro ao revisar solicitação: ' + err.message);
    } finally {
      setReviewingId(null);
    }
  };

  const handleRemoveBatida = async (itemId, batidaIdx, dbId, batida) => {
    if (!isManager) return;
    if (dbId) {
      const { error } = await supabase.from('time_records').delete().eq('id', dbId);
      if (error) {
        alert('Erro ao remover: ' + error.message);
        return;
      }
    }
    await logAudit(itemId, 'removido', `${batida?.entrada || '-'} → ${batida?.saida || '-'} removido`);
    fetchRecordsFromSupabase();
    showToast('Ponto removido com sucesso!');
  };

  // Aprova ou rejeita um ponto batido fora de todas as cercas cadastradas
  // (approval_status = 'pendente', gravado em PunchClock.jsx). Só o gestor
  // vê os botões que chamam isso.
  const handleApproveBatida = async (dbId, decision, recordDate) => {
    if (!isManager || !dbId) return;
    const { error } = await supabase
      .from('time_records')
      .update({
        approval_status: decision, // 'aprovado' | 'rejeitado'
        approved_by: currentManagerId,
        approved_at: new Date().toISOString()
      })
      .eq('id', dbId);

    if (error) {
      alert('Erro ao atualizar aprovação: ' + error.message);
      return;
    }
    await logAudit(recordDate, decision, decision === 'aprovado' ? 'Ponto fora da cerca aprovado' : 'Ponto fora da cerca rejeitado');
    fetchRecordsFromSupabase();
    showToast(decision === 'aprovado' ? 'Ponto aprovado!' : 'Ponto rejeitado.');
  };

  const handleStartEdit = (itemId, idx, batida) => {
    if (!isManager) return;
    setEditingRowKey(`${itemId}-${idx}`);
    setEditFormData({
      isNight: batida.isNight || false,
      obs: batida.obs || '',
      entrada: batida.entrada === '-' ? '' : batida.entrada,
      saida: batida.saida === '-' ? '' : batida.saida
    });
  };

  const handleSaveEdit = async (itemId, batidaIdx, dbId, originalBatida) => {
    if (dbId) {
      const novaEntrada = editFormData.entrada.trim() || '-';
      const novaSaida = editFormData.saida.trim() || '-';
      const { error } = await supabase
        .from('time_records')
        .update({
          entrada: novaEntrada,
          saida: novaSaida,
          is_night: editFormData.isNight,
          obs: editFormData.obs
        })
        .eq('id', dbId);

      if (error) {
        alert('Erro ao salvar: ' + error.message);
        return;
      }

      const de = `${originalBatida?.entrada || '-'} → ${originalBatida?.saida || '-'}`;
      const para = `${novaEntrada} → ${novaSaida}`;
      await logAudit(itemId, 'editado', de === para ? para : `${de} passou para ${para}`);
    }
    setEditingRowKey(null);
    fetchRecordsFromSupabase();
    showToast('Ponto atualizado com sucesso!');
  };

  const handleAddPointToDb = async (recordDate) => {
    if (!isManager || !selectedUser) return;
    const { error } = await supabase.from('time_records').insert([
      {
        employee_id: selectedUser.id,
        record_date: recordDate,
        entrada: '08:00',
        saida: '12:00',
        is_night: false,
        obs: ''
      }
    ]);

    if (error) {
      alert('Erro ao adicionar: ' + error.message);
    } else {
      await logAudit(recordDate, 'adicionado', 'Ponto manual adicionado (08:00 → 12:00)');
      fetchRecordsFromSupabase();
      showToast('Ponto adicionado com sucesso!');
    }
  };

  const handleUserClick = () => {
    if (isManager && selectedUser?.id) {
      navigate(`/admin/usuario?id=${selectedUser.id}`);
    }
  };

  const anySemJornada = registros.some((r) => r.scheduleMissing && (r.totalDayMinutes || 0) > 0);
  const totalGeralTrabalhadoMinutos = registros.reduce((acc, curr) => acc + (curr.totalDayMinutes || 0), 0);
  const totalGeralExtraMinutos = registros.reduce((acc, curr) => acc + (curr.extraMinutes || 0), 0);
  const totalGeralExtra50Minutos = registros.reduce((acc, curr) => acc + (curr.extra50Minutes || 0), 0);
  const totalGeralExtra100Minutos = registros.reduce((acc, curr) => acc + (curr.extra100Minutes || 0), 0);
  const totalGeralNoturnoMinutos = registros.reduce((acc, curr) => acc + (curr.nightMinutes || 0), 0);
  const totalGeralDiurnoMinutos = Math.max(0, totalGeralTrabalhadoMinutos - totalGeralNoturnoMinutos - totalGeralExtraMinutos);

  // Valor a pagar de hora extra — padrão CLT: 50% em dia útil, 100% em dia
  // sem jornada prevista (folga/feriado/DSR), + 20% de adicional noturno
  // sobre as horas trabalhadas entre 22h e 5h. Divisor mensal de 220h
  // (jornada de 44h semanais).
  const hourlyRate = parseSalaryToNumber(selectedUser?.salary) / MONTHLY_HOURS_DIVISOR;
  const valorExtra50 = (totalGeralExtra50Minutos / 60) * hourlyRate * 1.5;
  const valorExtra100 = (totalGeralExtra100Minutos / 60) * hourlyRate * 2.0;
  const valorAdicionalNoturno = (totalGeralNoturnoMinutos / 60) * hourlyRate * 0.2;
  const valorTotalAPagar = valorExtra50 + valorExtra100 + valorAdicionalNoturno;

  const handleDownloadPDF = () => {
    window.print();
  };

  const UserDropdownSelector = () => {
    const isColaboradorOnly = !isManager && employees.length <= 1;

    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs font-semibold text-slate-600">Usuário</span>
        {isColaboradorOnly ? (
          <div className="flex items-center justify-between border border-slate-300 rounded px-3 py-1 bg-slate-50 text-xs text-slate-500 min-w-[170px] cursor-not-allowed shadow-xs opacity-90">
            <span className="truncate pr-2">{selectedUser ? selectedUser.full_name : 'Carregando...'}</span>
          </div>
        ) : (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="flex items-center justify-between border border-slate-300 rounded px-3 py-1 bg-white text-xs text-slate-700 hover:border-[#1a2c6a] transition-colors min-w-[170px] focus:outline-none shadow-xs">
              <span className="truncate pr-2">{selectedUser ? selectedUser.full_name : 'Carregando...'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-1.5 bg-white rounded-md shadow-xl border border-slate-200 z-50">
              <div className="relative mb-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Buscar usuário..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 text-xs border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-[#1a2c6a]"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <DropdownMenuItem 
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setUserSearchTerm('');
                      }}
                      className="cursor-pointer text-xs px-2.5 py-2 rounded text-slate-700 transition-colors hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white focus:outline-none"
                    >
                      {user.full_name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-2 py-3 text-xs text-center text-slate-400">
                    Nenhum usuário encontrado
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  const DepartmentDropdownSelector = () => {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs font-semibold text-slate-600">Departamento</span>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="flex items-center justify-between border border-slate-300 rounded px-3 py-1 bg-white text-xs text-slate-700 hover:border-[#1a2c6a] transition-colors focus:outline-none shadow-xs">
            <span>{selectedDepartment}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 p-1.5 bg-white rounded-md shadow-xl border border-slate-200 z-50">
            <DropdownMenuItem 
              onClick={() => setSelectedDepartment('Todos')}
              className="cursor-pointer text-xs px-2.5 py-2 rounded text-slate-700 transition-colors hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white focus:outline-none"
            >
              Todos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const MonthDropdownSelector = () => {
    const months = generateRecentMonths(12);

    return (
      <div className="flex items-center space-x-2">
        <span className="text-xs font-semibold text-slate-600">Mês</span>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="flex items-center justify-between border border-slate-300 rounded px-3 py-1 bg-white text-xs text-slate-700 hover:border-[#1a2c6a] transition-colors focus:outline-none shadow-xs">
            <span>{selectedMonth}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 p-1.5 bg-white rounded-md shadow-xl border border-slate-200 z-50">
            {months.map((month) => (
              <DropdownMenuItem 
                key={month}
                onClick={() => setSelectedMonth(month)}
                className="cursor-pointer text-xs px-2.5 py-2 rounded text-slate-700 transition-colors hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white focus:outline-none"
              >
                {month}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] flex flex-col font-sans text-slate-700 relative">
      <Navbar selectedCompany="Sua Empresa" />

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 min-w-[240px] max-w-[280px] p-5 flex flex-col space-y-6 bg-transparent shrink-0">
          <div>
            <h1 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              PONTO ELETRÔNICO
            </h1>
            
            <div 
              onClick={handleUserClick}
              className={`flex items-center justify-between p-2 rounded-lg text-slate-600 mb-4 transition-colors ${
                isManager 
                  ? 'hover:bg-slate-200/50 cursor-pointer' 
                  : 'cursor-default'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-slate-200/80 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                  {selectedUser ? selectedUser.full_name.substring(0, 2).toUpperCase() : '--'}
                </div>
                <span className="text-sm font-medium max-md:truncate">
                  {selectedUser ? selectedUser.full_name.split(' ')[0] : 'Usuário'}
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            </div>

            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('pontos')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'pontos'
                    ? 'bg-white text-slate-700 hover:bg-[#fc9314] hover:text-white border-l-4 border-[#ff8b00] shadow-sm font-semibold'
                    : 'bg-white text-slate-500 hover:bg-[#fc9314] hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap max-md:truncate">Pontos registrados</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('resumo')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'resumo'
                    ? 'bg-white text-slate-700 hover:bg-[#fc9314] hover:text-white border-l-4 border-[#ff8b00] shadow-sm font-semibold'
                    : 'bg-white text-slate-500 hover:bg-[#fc9314] hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap max-md:truncate">Resumo das horas</span>
              </button>

              <button 
                onClick={() => setActiveTab('ajustes')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'ajustes'
                    ? 'bg-white text-slate-700 hover:bg-[#fc9314] hover:text-white border-l-4 border-[#ff8b00] shadow-sm font-semibold'
                    : 'bg-white text-slate-500 hover:bg-[#fc9314] hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap max-md:truncate">Solicitações de Ajuste</span>
              </button>

              <button 
                onClick={() => setActiveTab('banco')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'banco'
                    ? 'bg-white text-slate-700 hover:bg-[#fc9314] hover:text-white border-l-4 border-[#ff8b00] shadow-sm font-semibold'
                    : 'bg-white text-slate-500 hover:bg-[#fc9314] hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap max-md:truncate">Banco de Horas</span>
              </button>

              <button 
                onClick={() => setActiveTab('holerite')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'holerite'
                    ? 'bg-white text-slate-700 hover:bg-[#fc9314] hover:text-white border-l-4 border-[#ff8b00] shadow-sm font-semibold'
                    : 'bg-white text-slate-500 hover:bg-[#fc9314] hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap max-md:truncate">Holerite</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Conteúdo Central */}
        <main className="flex-1 p-6 pl-0">
          <div className="flex justify-between items-center mb-3 text-xs text-slate-500">
            <div>
              <a 
                href="/admin" 
                className="hover:text-[#ff8b00] hover:underline transition-colors font-medium cursor-pointer"
              >
                Painel
              </a> 
              <ChevronRight className="w-3 h-3 inline mx-1" />{' '}
              <span className="text-[#ff8b00] font-medium">
                {activeTab === 'pontos' ? 'Pontos registrados' : activeTab === 'resumo' ? 'Resumo das horas' : activeTab === 'banco' ? 'Banco de horas' : activeTab === 'holerite' ? 'Holerite' : 'Solicitações de Ajuste'}
              </span>
            </div>
            
            <DepartmentDropdownSelector />
          </div>

          {/* CONTEÚDO DA ABA: PONTOS REGISTRADOS */}
          {activeTab === 'pontos' && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200/80">
              <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600">
                  <MonthDropdownSelector />
                  <UserDropdownSelector />
                </div>

                <button 
                  onClick={() => setShowJornadaModal(true)}
                  className="flex items-center text-xs text-[#ff8b00] font-medium hover:underline cursor-pointer"
                >
                  Ver jornada atual <Calendar className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>

              <div className="grid grid-cols-12 px-6 py-2.5 bg-slate-50/50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <div className="col-span-8"></div>
                <div className="col-span-2 text-right">HORA EXTRA</div>
                <div className="col-span-2 text-right">TRABALHADO</div>
              </div>

              <div className="divide-y divide-slate-200">
                {registros.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Nenhum registro de ponto encontrado para este colaborador.
                  </div>
                ) : (
                  registros.map((item) => {
                    const isExpanded = expandedRow === item.id;
                    const hasPending = item.batidas.some((b) => b.approvalStatus === 'pendente');
                    return (
                      <div key={item.id} className="transition-colors border-b border-slate-200">
                        <div 
                          onClick={() => toggleRow(item.id)}
                          className="grid grid-cols-12 px-6 py-3.5 items-center text-xs hover:bg-slate-50 cursor-pointer"
                        >
                          <div className="col-span-8 flex items-center space-x-3">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="font-semibold text-slate-700 text-xs">
                              {formatDDMMYYYY(item.id)} - {getWeekdayName(item.id)}
                            </span>
                            {item.isHoliday && (
                              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                Feriado
                              </span>
                            )}
                            {item.swappedWith && (
                              <span className="bg-[#ff8b00]/10 text-[#ff8b00] px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                Trocado com {formatDDMMYYYY(item.swappedWith)}
                              </span>
                            )}
                            {hasPending && (
                              <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                <AlertCircle className="w-3 h-3" /> Pendente
                              </span>
                            )}
                          </div>
                          <div className="col-span-2 text-right font-medium text-slate-600">{item.horaExtra}</div>
                          <div className="col-span-2 text-right font-semibold text-slate-800">{item.trabalhado}</div>
                        </div>

                        {isExpanded && (
                          <div className="px-8 py-4 bg-slate-50/40 border-t border-b border-slate-200 text-xs">
                            <div className="flex items-center justify-between mb-4">
                              
                              {/* EXIBE ADICIONAR APENAS PARA GESTOR */}
                              {isManager && (
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger className="flex items-center space-x-1 border border-slate-300 bg-white px-3 py-1 rounded font-medium text-slate-700 hover:bg-[#1a2c6a] hover:text-white transition-colors focus:outline-none">
                                    <span>Adicionar</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="bg-white">
                                    <DropdownMenuItem 
                                      onClick={() => handleAddPointToDb(item.id)}
                                      className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white"
                                    >
                                      Adicionar ponto
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSwapTargetItemId(item.id);
                                        setSwapDate('');
                                        setShowSwapModal(true);
                                      }}
                                      className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white"
                                    >
                                      Trocar jornada
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setAnnotationTargetItemId(item.id);
                                        setAnnotationText('');
                                        setShowAnnotationModal(true);
                                      }}
                                      className="cursor-pointer hover:!bg-[#1a2c6a] hover:!text-white focus:!bg-[#1a2c6a] focus:!text-white data-[highlighted]:!bg-[#1a2c6a] data-[highlighted]:!text-white"
                                    >
                                      Anotação
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}

                              <button 
                                onClick={() => handleOpenHistory(item.id)}
                                className="flex items-center space-x-1 text-[#ff8b00] hover:underline font-medium cursor-pointer ml-auto"
                              >
                                <History className="w-3.5 h-3.5" />
                                <span>Ver histórico</span>
                              </button>
                            </div>

                            {item.annotations && item.annotations.length > 0 && (
                              <div className="space-y-1.5 mb-3">
                                {item.annotations.map((note) => (
                                  <div
                                    key={note.id}
                                    className="flex items-start gap-2 bg-slate-100 border border-slate-200 rounded-md px-3 py-2 text-[11px] text-slate-600"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <div>
                                      <p>{note.content}</p>
                                      <p className="text-slate-400 mt-0.5">
                                        {new Date(note.created_at).toLocaleString('pt-BR')}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="grid grid-cols-12 text-slate-500 font-bold uppercase text-[10px] mb-2 px-2">
                              <div className="col-span-6">DETALHES / LOCALIZAÇÃO E SELFIE</div>
                              <div className="col-span-2 text-center">ENTRADA</div>
                              <div className="col-span-2 text-center">SAÍDA</div>
                              <div className="col-span-2 text-center">SALDO</div>
                            </div>

                            <div className="space-y-2">
                              {item.batidas.map((b, idx) => {
                                const isEditing = editingRowKey === `${item.id}-${idx}`;

                                if (isEditing && isManager) {
                                  return (
                                    <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-md p-2 shadow-sm gap-2">
                                      <button 
                                        onClick={() => setEditingRowKey(null)}
                                        className="text-red-500 font-semibold hover:underline text-xs px-2"
                                      >
                                        Desfazer
                                      </button>

                                      <div className="flex items-center space-x-2">
                                        <label className="flex items-center space-x-1 cursor-pointer bg-slate-50 p-1 rounded border border-slate-200">
                                          <input 
                                            type="checkbox"
                                            checked={editFormData.isNight}
                                            onChange={(e) => setEditFormData({ ...editFormData, isNight: e.target.checked })}
                                            className="rounded border-slate-300 text-[#ff8b00] focus:ring-0"
                                          />
                                          <Moon className="w-3.5 h-3.5 text-slate-600" />
                                        </label>

                                        <input 
                                          type="text"
                                          placeholder="Max 15 caractere"
                                          value={editFormData.obs}
                                          onChange={(e) => setEditFormData({ ...editFormData, obs: e.target.value })}
                                          className="border border-slate-300 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:border-[#1a2c6a]"
                                        />
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <div className="relative flex items-center">
                                          <input 
                                            type="text"
                                            value={editFormData.entrada}
                                            onChange={(e) => setEditFormData({ ...editFormData, entrada: e.target.value })}
                                            className="border border-slate-300 rounded px-2 py-1 text-xs w-16 text-center font-mono focus:outline-none"
                                          />
                                          {editFormData.entrada && (
                                            <X 
                                              onClick={() => setEditFormData({ ...editFormData, entrada: '' })}
                                              className="w-3 h-3 text-red-400 absolute right-1 cursor-pointer" 
                                            />
                                          )}
                                        </div>

                                        <div className="relative flex items-center">
                                          <input 
                                            type="text"
                                            value={editFormData.saida}
                                            onChange={(e) => setEditFormData({ ...editFormData, saida: e.target.value })}
                                            className="border border-slate-300 rounded px-2 py-1 text-xs w-16 text-center font-mono focus:outline-none"
                                          />
                                          {editFormData.saida && (
                                            <X 
                                              onClick={() => setEditFormData({ ...editFormData, saida: '' })}
                                              className="w-3 h-3 text-red-400 absolute right-1 cursor-pointer" 
                                            />
                                          )}
                                        </div>

                                        <span className="text-slate-400 text-xs px-2">-</span>

                                        <button 
                                          onClick={() => handleSaveEdit(item.id, idx, b.db_id, b)}
                                          className="bg-white border border-[#1a2c6a] text-[#1a2c6a] hover:bg-[#1a2c6a] hover:text-white font-medium px-4 py-1 rounded text-xs transition-colors"
                                        >
                                          Salvar
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div key={idx} className="space-y-1">
                                  <div className="group grid grid-cols-12 items-center bg-white border border-slate-200/80 rounded-md py-1.5 px-3 shadow-sm hover:border-slate-300 transition-all">
                                    {/* COLUNA ESQUERDA: BOTOES, LOCALIZAÇÃO E SELFIE */}
                                    <div className="col-span-6 flex items-center space-x-3 overflow-hidden">
                                      {/* EXIBE REMOVER APENAS PARA GESTOR */}
                                      {isManager && (
                                        <button 
                                          onClick={() => handleRemoveBatida(item.id, idx, b.db_id, b)}
                                          className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white font-semibold px-2 py-0.5 rounded text-[10px] transition-opacity shadow-sm shrink-0"
                                        >
                                          Remover
                                        </button>
                                      )}

                                      {/* Selfie Thumbnail */}
                                      {b.photo_url ? (
                                        <button 
                                          onClick={() => setSelectedPhotoModal(b.photo_url)}
                                          className="flex items-center space-x-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-orange-50 hover:text-[#ff8b00] border border-slate-200 rounded px-1.5 py-0.5 transition-colors cursor-pointer shrink-0"
                                          title="Clique para ver a selfie"
                                        >
                                          <img 
                                            src={b.photo_url} 
                                            alt="Selfie" 
                                            className="w-5 h-5 rounded object-cover border border-slate-300"
                                          />
                                          <span className="hidden sm:inline">Selfie</span>
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                                          <Camera className="w-3 h-3" /> S/ Selfie
                                        </span>
                                      )}

                                      {/* Localização GPS */}
                                      {b.latitude && b.longitude ? (
                                        <a 
                                          href={`https://maps.google.com/?q=${b.latitude},${b.longitude}`} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="flex items-center space-x-1 text-slate-600 hover:text-[#ff8b00] bg-slate-50 hover:bg-orange-50 px-2 py-0.5 rounded border border-slate-200/80 font-mono text-[10px] transition-colors truncate"
                                          title="Clique para abrir no Google Maps"
                                        >
                                          <MapPin className="w-3 h-3 text-[#ff8b00] shrink-0" />
                                          <span className="truncate">Lat: {Number(b.latitude).toFixed(4)}, Lng: {Number(b.longitude).toFixed(4)}</span>
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
                                          <MapPin className="w-3 h-3" /> S/ GPS
                                        </span>
                                      )}
                                    </div>

                                    <div className="col-span-2 flex items-center justify-center space-x-1 text-slate-700 font-mono text-xs">
                                      <span>{b.entrada}</span>
                                      {b.entrada !== '-' && <DeviceIcon deviceType={b.deviceType} className="w-3.5 h-3.5 text-slate-400" />}
                                    </div>

                                    <div className="col-span-2 flex items-center justify-center space-x-1 text-slate-700 font-mono text-xs">
                                      <span>{b.saida}</span>
                                      {b.saida !== '-' && <DeviceIcon deviceType={b.deviceType} className="w-3.5 h-3.5 text-slate-400" />}
                                    </div>

                                    <div className="col-span-2 flex items-center justify-between pl-4">
                                      <span className="font-mono text-slate-600 text-xs">{b.saldo}</span>
                                      
                                      {/* EXIBE EDITAR APENAS PARA GESTOR */}
                                      {isManager && (
                                        <button 
                                          onClick={() => handleStartEdit(item.id, idx, b)}
                                          className="text-[#ff8b00] hover:underline text-xs font-medium"
                                        >
                                          Editar
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {b.approvalStatus === 'pendente' && (
                                    <div className="flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
                                      <span className="flex items-center gap-1.5 text-amber-700 font-medium text-[11px]">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Fora da cerca — pendente de aprovação
                                      </span>
                                      {isManager && (
                                        <div className="flex items-center gap-2 shrink-0">
                                          <button
                                            onClick={() => handleApproveBatida(b.db_id, 'aprovado', item.id)}
                                            className="bg-[#ff8b00] hover:bg-[#e07a00] text-white font-medium px-2.5 py-1 rounded text-[10px] transition-colors"
                                          >
                                            Aprovar
                                          </button>
                                          <button
                                            onClick={() => handleApproveBatida(b.db_id, 'rejeitado', item.id)}
                                            className="border border-red-300 text-red-600 hover:bg-red-50 font-medium px-2.5 py-1 rounded text-[10px] transition-colors"
                                          >
                                            Rejeitar
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {b.approvalStatus === 'rejeitado' && (
                                    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-md px-3 py-1.5 text-red-600 font-medium text-[11px]">
                                      <X className="w-3.5 h-3.5" />
                                      Ponto fora da cerca — rejeitado pelo gestor
                                    </div>
                                  )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex justify-end space-x-6 items-center mt-3 pt-2 border-t border-slate-200 text-slate-600 font-medium text-xs">
                              <span>Horas extras: <strong>{item.horaExtra}</strong></span>
                              <span>Trabalhado: <strong>{item.trabalhado}</strong></span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                <div className="grid grid-cols-12 px-6 py-3 items-center text-xs font-bold bg-slate-50/30">
                  <div className="col-span-8"></div>
                  <div className="col-span-2 text-right text-slate-800">
                    {minutesToDisplayHours(totalGeralExtraMinutos)}
                  </div>
                  <div className="col-span-2 text-right text-slate-800">
                    {minutesToDisplayHours(totalGeralTrabalhadoMinutos)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* RESUMO DAS HORAS */}
          {activeTab === 'resumo' && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600">
                  <MonthDropdownSelector />
                  <UserDropdownSelector />
                </div>

                <button 
                  onClick={handleDownloadPDF}
                  className="bg-white border border-slate-300 text-slate-700 hover:bg-[#1a2c6a] hover:text-white px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Baixar em PDF</span>
                </button>
              </div>

              {anySemJornada && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-md p-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>{selectedUser?.full_name || 'Este colaborador'}</strong> não tem jornada de trabalho
                    cadastrada. Sem isso, o sistema não consegue calcular hora extra corretamente — as horas
                    trabalhadas aparecem como normais (0 extra) até a jornada ser configurada em{' '}
                    <strong>Usuários → Jornada de trabalho</strong>.
                  </span>
                </div>
              )}

              {/* Tabela Clean Compacta */}
              <div className="text-[12px] divide-y divide-slate-100">
                <div className="py-2 space-y-1">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3 text-slate-800 font-bold uppercase text-[11px]">1. TRABALHADO</span>
                    <span className="col-span-5 text-slate-600">Horas diurnas</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">{minutesToFullDisplay(totalGeralDiurnoMinutos)}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3"></span>
                    <span className="col-span-5 text-slate-600">Adicional noturno</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">{minutesToFullDisplay(totalGeralNoturnoMinutos)}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3"></span>
                    <span className="col-span-5 text-slate-600">Hora extra</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">{minutesToFullDisplay(totalGeralExtraMinutos)}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center pt-1 font-bold text-slate-900">
                    <span className="col-span-3"></span>
                    <span className="col-span-5">Total Trabalhado</span>
                    <span className="col-span-4 text-right">{minutesToFullDisplay(totalGeralTrabalhadoMinutos)}</span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3 text-slate-800 font-bold uppercase text-[11px]">2. FALTAS</span>
                    <span className="col-span-5 text-slate-600">Dias de falta</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">0 dias</span>
                  </div>
                  <div className="grid grid-cols-12 items-center pt-1 font-bold text-slate-900">
                    <span className="col-span-3"></span>
                    <span className="col-span-5">Horas de atraso + falta s/ justificativa</span>
                    <span className="col-span-4 text-right">00h 00min</span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3 text-slate-800 font-bold uppercase text-[11px]">3. HORA EXTRA 50%</span>
                    <span className="col-span-5 text-slate-600">Dia útil, passou da jornada</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">{minutesToFullDisplay(totalGeralExtra50Minutos)}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center pt-1 font-bold text-slate-900">
                    <span className="col-span-3"></span>
                    <span className="col-span-5">Valor a pagar (50%)</span>
                    <span className="col-span-4 text-right">{formatCurrencyBRL(valorExtra50)}</span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3 text-slate-800 font-bold uppercase text-[11px]">4. HORA EXTRA 100%</span>
                    <span className="col-span-5 text-slate-600">Folga, DSR ou feriado trabalhado</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">{minutesToFullDisplay(totalGeralExtra100Minutos)}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center pt-1 font-bold text-slate-900">
                    <span className="col-span-3"></span>
                    <span className="col-span-5">Valor a pagar (100%)</span>
                    <span className="col-span-4 text-right">{formatCurrencyBRL(valorExtra100)}</span>
                  </div>
                </div>

                <div className="py-2 space-y-1">
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-3 text-slate-800 font-bold uppercase text-[11px]">5. ADICIONAL NOTURNO</span>
                    <span className="col-span-5 text-slate-600">20% sobre horas 22h-5h</span>
                    <span className="col-span-4 text-right font-medium text-slate-700">{minutesToFullDisplay(totalGeralNoturnoMinutos)}</span>
                  </div>
                  <div className="grid grid-cols-12 items-center pt-1 font-bold text-slate-900">
                    <span className="col-span-3"></span>
                    <span className="col-span-5">Valor a pagar (adicional)</span>
                    <span className="col-span-4 text-right">{formatCurrencyBRL(valorAdicionalNoturno)}</span>
                  </div>
                </div>

                <div className="py-2 space-y-1 bg-slate-50 -mx-5 px-5 rounded-b-lg">
                  <div className="grid grid-cols-12 items-center pt-1 font-bold text-slate-900 text-[13px]">
                    <span className="col-span-3"></span>
                    <span className="col-span-5">TOTAL A PAGAR DE EXTRAS</span>
                    <span className="col-span-4 text-right text-[#ff8b00]">{formatCurrencyBRL(valorTotalAPagar)}</span>
                  </div>
                  {hourlyRate === 0 && (
                    <p className="text-[10px] text-slate-400 col-span-12">
                      Cadastre o salário do colaborador em /admin/usuario para calcular o valor em R$.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO DA ABA: SOLICITAÇÕES DE AJUSTE */}
          {activeTab === 'ajustes' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 text-sm">Solicitações de ajuste</h2>
                {!isManager && (
                  <button
                    onClick={() => setShowNewAdjustmentForm((v) => !v)}
                    className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-medium px-4 py-2 rounded transition-colors"
                  >
                    {showNewAdjustmentForm ? 'Cancelar' : 'Nova solicitação'}
                  </button>
                )}
              </div>

              {!isManager && showNewAdjustmentForm && (
                <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Data</label>
                      <input
                        type="date"
                        value={newAdjustment.record_date}
                        onChange={(e) => setNewAdjustment((p) => ({ ...p, record_date: e.target.value }))}
                        className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Entrada correta (opcional)</label>
                      <input
                        type="time"
                        value={newAdjustment.proposed_entrada}
                        onChange={(e) => setNewAdjustment((p) => ({ ...p, proposed_entrada: e.target.value }))}
                        className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Saída correta (opcional)</label>
                      <input
                        type="time"
                        value={newAdjustment.proposed_saida}
                        onChange={(e) => setNewAdjustment((p) => ({ ...p, proposed_saida: e.target.value }))}
                        className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">O que aconteceu?</label>
                    <textarea
                      value={newAdjustment.description}
                      onChange={(e) => setNewAdjustment((p) => ({ ...p, description: e.target.value }))}
                      rows={3}
                      placeholder="Ex: Esqueci de bater o ponto de saída às 18h"
                      className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00] resize-y"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmitAdjustment}
                      disabled={savingAdjustment}
                      className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-medium px-5 py-2 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingAdjustment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Enviar solicitação
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {loadingAdjustments ? (
                  <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                  </div>
                ) : adjustmentRequests.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Nenhuma solicitação registrada.</div>
                ) : (
                  adjustmentRequests.map((req) => (
                    <div key={req.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                      <div>
                        <p className="font-semibold text-slate-700">{formatDDMMYYYY(req.record_date)}</p>
                        <p className="text-slate-600 mt-0.5">{req.description}</p>
                        {(req.proposed_entrada || req.proposed_saida) && (
                          <p className="text-slate-400 mt-1">
                            Proposto: {req.proposed_entrada || '-'} → {req.proposed_saida || '-'}
                          </p>
                        )}
                        <p className="text-slate-400 mt-1">
                          {new Date(req.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          req.status === 'pendente' ? 'bg-amber-100 text-amber-700' :
                          req.status === 'aprovado' ? 'bg-[#ff8b00]/10 text-[#ff8b00]' : 'bg-red-100 text-red-600'
                        }`}>
                          {req.status === 'pendente' ? 'Pendente' : req.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                        </span>
                        {isManager && req.status === 'pendente' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReviewAdjustment(req, 'aprovado')}
                              disabled={reviewingId === req.id}
                              className="bg-[#ff8b00] hover:bg-[#fc9314] text-white px-3 py-1 rounded text-[11px] font-medium transition-colors disabled:opacity-50"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleReviewAdjustment(req, 'rejeitado')}
                              disabled={reviewingId === req.id}
                              className="border border-red-300 text-red-500 hover:bg-red-50 px-3 py-1 rounded text-[11px] font-medium transition-colors disabled:opacity-50"
                            >
                              Rejeitar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* CONTEÚDO DA ABA: BANCO DE HORAS */}
          {activeTab === 'banco' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-slate-500 text-xs">Saldo atual de {selectedUser?.full_name || 'colaborador'}</p>
                  <p className={`text-2xl font-bold ${bankBalanceMinutes < 0 ? 'text-red-500' : 'text-slate-800'}`}>
                    {formatSignedHours(bankBalanceMinutes)}
                  </p>
                </div>
                {isManager && (
                  <button
                    onClick={() => setShowNewBankEntryForm((v) => !v)}
                    className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-medium px-4 py-2 rounded transition-colors self-start"
                  >
                    {showNewBankEntryForm ? 'Cancelar' : '+ Novo lançamento'}
                  </button>
                )}
              </div>

              {isManager && showNewBankEntryForm && (
                <div className="p-5 border-b border-slate-100 space-y-3 bg-slate-50/50 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Data</label>
                      <input
                        type="date"
                        value={newBankEntry.entry_date}
                        onChange={(e) => setNewBankEntry((p) => ({ ...p, entry_date: e.target.value }))}
                        className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Tipo</label>
                      <select
                        value={newBankEntry.tipo}
                        onChange={(e) => setNewBankEntry((p) => ({ ...p, tipo: e.target.value }))}
                        className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                      >
                        <option value="credito">Crédito (colaborador ganha horas)</option>
                        <option value="debito">Débito (colaborador usa/compensa horas)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Quantidade de horas</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={newBankEntry.hours}
                        onChange={(e) => setNewBankEntry((p) => ({ ...p, hours: e.target.value }))}
                        placeholder="Ex: 2 ou 1,5"
                        className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Motivo (opcional)</label>
                    <input
                      type="text"
                      value={newBankEntry.description}
                      onChange={(e) => setNewBankEntry((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Ex: Hora extra do plantão de sábado"
                      className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddBankEntry}
                      disabled={savingBankEntry}
                      className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-medium px-5 py-2 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingBankEntry && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Adicionar lançamento
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {loadingBank ? (
                  <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                  </div>
                ) : bankEntries.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Nenhum lançamento no banco de horas ainda.</div>
                ) : (
                  bankEntries.map((entry) => {
                    const mins = Math.round(Number(entry.hours) * 60);
                    return (
                      <div key={entry.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                        <div>
                          <p className="font-semibold text-slate-700">{formatDDMMYYYY(entry.entry_date)}</p>
                          {entry.description && <p className="text-slate-500 mt-0.5">{entry.description}</p>}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`font-bold ${mins < 0 ? 'text-red-500' : 'text-[#ff8b00]'}`}>
                            {formatSignedHours(mins)}
                          </span>
                          {isManager && (
                            <button
                              onClick={() => handleDeleteBankEntry(entry)}
                              className="text-slate-400 hover:text-red-500"
                              title="Remover lançamento"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* CONTEÚDO DA ABA: HOLERITE */}
          {activeTab === 'holerite' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-slate-500 text-xs">Holerites de {selectedUser?.full_name || 'colaborador'}</p>
                  <p className="text-slate-800 font-bold text-sm mt-0.5">Contracheques anexados</p>
                </div>
                {isManager && (
                  <button
                    onClick={() => setShowNewPayslipForm((v) => !v)}
                    className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-medium px-4 py-2 rounded transition-colors self-start"
                  >
                    {showNewPayslipForm ? 'Cancelar' : '+ Anexar holerite'}
                  </button>
                )}
              </div>

              {isManager && showNewPayslipForm && (
                <div className="p-5 border-b border-slate-100 space-y-3 bg-slate-50/50 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Mês de referência</label>
                      <input
                        type="month"
                        value={newPayslip.reference_month}
                        onChange={(e) => setNewPayslip((p) => ({ ...p, reference_month: e.target.value }))}
                        className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Arquivo (PDF)</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setNewPayslip((p) => ({ ...p, file: e.target.files?.[0] || null }))}
                        className="w-full text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddPayslip}
                      disabled={savingPayslip}
                      className="bg-[#ff8b00] hover:bg-[#fc9314] text-white text-xs font-medium px-5 py-2 rounded transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingPayslip && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Anexar
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100">
                {loadingPayslips ? (
                  <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                  </div>
                ) : payslips.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Nenhum holerite anexado ainda.</div>
                ) : (
                  payslips.map((p) => (
                    <div key={p.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-semibold text-slate-700 capitalize">{formatReferenceMonth(p.reference_month)}</p>
                        <button
                          onClick={() => setPreviewFile({ url: p.file_url, name: p.file_name })}
                          className="text-[#ff8b00] hover:underline text-left"
                        >
                          {p.file_name}
                        </button>
                      </div>
                      {isManager && (
                        <button
                          onClick={() => handleDeletePayslip(p)}
                          className="text-slate-400 hover:text-red-500"
                          title="Remover holerite"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal Ampliador de Foto da Selfie */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setSelectedPhotoModal(null)}>
          <div className="bg-white p-3 rounded-lg shadow-2xl max-w-sm w-full relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#ff8b00]" /> Selfie de Confirmação
              </span>
              <button onClick={() => setSelectedPhotoModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={selectedPhotoModal} alt="Selfie ampliada" className="w-full h-auto rounded-md border border-slate-200" />
          </div>
        </div>
      )}

      <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      {/* Popup / Toast de feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white px-5 py-3 rounded-lg shadow-xl flex items-center space-x-3 z-50">
          <CheckCircle2 className="w-4 h-4 text-[#ff8b00]" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modal Histórico de Alteração */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">Histórico de alteração</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs max-h-[70vh] overflow-y-auto">
              <p className="text-slate-500 font-medium">Dia {formatDDMMYYYY(historyItemId)}</p>

              {historyLoading ? (
                <div className="flex items-center gap-2 text-slate-400 py-6 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                </div>
              ) : historyEntries.length === 0 ? (
                <div className="text-center text-slate-400 py-6">
                  Nenhuma alteração registrada para este dia.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 border-l-2 border-slate-200 ml-2">
                  {historyEntries.map((entry) => (
                    <div key={entry.id} className="relative">
                      <div className={`absolute -left-[31px] top-0 w-3 h-3 rounded-full border-2 bg-white ${
                        entry.action === 'removido' || entry.action === 'rejeitado' ? 'border-red-500' : 'border-[#ff8b00]'
                      }`}></div>
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="text-slate-400 text-[11px]">
                            {new Date(entry.created_at).toLocaleString('pt-BR')}
                          </p>
                          <p className="font-bold text-slate-700">{entry.changed_by_name || 'Sistema'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-700">
                            {AUDIT_ACTION_LABELS[entry.action] || entry.action}
                          </p>
                          <p className="text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                            <Monitor className="w-3 h-3" /> Ponto manual
                          </p>
                          {entry.description && (
                            <p className="italic text-slate-400 text-[11px] mt-1">"{entry.description}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="bg-white border border-[#1a2c6a] text-[#1a2c6a] hover:bg-[#1a2c6a] hover:text-white font-medium px-6 py-2 rounded text-xs transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TROCAR JORNADA */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Trocar jornada</h3>
            <p className="text-xs text-slate-500">
              A jornada prevista do dia <strong>{formatDDMMYYYY(swapTargetItemId)}</strong> passa a ser a mesma
              do dia informado abaixo, e vice-versa. Use para troca de turno, compensação de folga ou mudança
              de escala.
            </p>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Trocar com a data</label>
              <input
                type="date"
                value={swapDate}
                onChange={(e) => setSwapDate(e.target.value)}
                className="w-full border rounded p-2 text-xs focus:outline-none focus:border-[#ff8b00]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSwapModal(false)}
                disabled={savingSwap}
                className="px-4 py-2 border rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSwap}
                disabled={savingSwap || !swapDate}
                className="px-4 py-2 rounded text-xs font-semibold text-white bg-[#ff8b00] hover:bg-[#fc9314] disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingSwap && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirmar troca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FALTA JUSTIFICADA */}
      {/* MODAL: ANOTAÇÃO */}
      {showAnnotationModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Anotação — {formatDDMMYYYY(annotationTargetItemId)}</h3>
            <textarea
              value={annotationText}
              onChange={(e) => setAnnotationText(e.target.value)}
              rows={4}
              placeholder="Escreva uma observação sobre este dia..."
              className="w-full border rounded p-2.5 text-xs focus:outline-none focus:border-[#ff8b00] resize-y"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAnnotationModal(false)}
                disabled={savingAnnotation}
                className="px-4 py-2 border rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAnnotation}
                disabled={savingAnnotation || !annotationText.trim()}
                className="px-4 py-2 rounded text-xs font-semibold text-white bg-[#ff8b00] hover:bg-[#fc9314] disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingAnnotation && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Jornada Atual */}
      {showJornadaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">Jornada atual</h2>
              <button onClick={() => setShowJornadaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <p className="font-semibold text-slate-700">Nome: SEG A SEX 8H AS 12H DAS 14H AS 18H SAB 08H AS 12H</p>
                <p className="text-slate-600 mt-1">Tipo: Padrão</p>
                <p className="text-slate-600 mt-1">Usada desde: 06/08/2026</p>
              </div>

              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] border-b border-slate-200">
                      <th className="p-2.5 font-bold uppercase">DIA DA SEMANA</th>
                      <th className="p-2.5 font-bold uppercase text-center">ENTRADA</th>
                      <th className="p-2.5 font-bold uppercase text-center">SAÍDA</th>
                      <th className="p-2.5 font-bold uppercase text-center">ENTRADA</th>
                      <th className="p-2.5 font-bold uppercase text-center">SAÍDA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="p-2.5 font-medium">Seg, Ter, Qua, Qui, Sex</td>
                      <td className="p-2.5 text-center">08:00</td>
                      <td className="p-2.5 text-center">12:00</td>
                      <td className="p-2.5 text-center">14:00</td>
                      <td className="p-2.5 text-center">18:00</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Sáb</td>
                      <td className="p-2.5 text-center">08:00</td>
                      <td className="p-2.5 text-center">12:00</td>
                      <td className="p-2.5 text-center">-</td>
                      <td className="p-2.5 text-center">-</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Dom</td>
                      <td className="p-2.5 text-center">-</td>
                      <td className="p-2.5 text-center">-</td>
                      <td className="p-2.5 text-center">-</td>
                      <td className="p-2.5 text-center">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-right text-slate-700 font-medium">
                Total de horas semanal: <strong>44h00min</strong>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
              <button className="text-[#ff8b00] font-semibold text-xs hover:underline">
                Configurar jornada
              </button>
              <button 
                onClick={() => setShowJornadaModal(false)}
                className="bg-white border border-[#1a2c6a] text-[#1a2c6a] hover:bg-[#1a2c6a] hover:text-white font-medium px-6 py-2 rounded text-xs transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Widget Flutuante de Suporte */}
      <div className="fixed bottom-6 right-6">
        <button className="w-10 h-10 bg-white border border-[#1a2c6a] text-[#1a2c6a] hover:bg-[#1a2c6a] hover:text-white rounded-md flex items-center justify-center shadow-lg transition-colors">
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Rodapé */}
      <footer className="text-center py-3 text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 WiaPonto - Todos os direitos reservados.
      </footer>
    </div>
  );
}
