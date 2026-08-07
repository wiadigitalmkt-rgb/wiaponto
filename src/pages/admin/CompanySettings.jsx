
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Clock, 
  Save, 
  Loader2, 
  MapPin, 
  Phone, 
  FileText, 
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

export default function CompanySettings() {
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dados da Empresa
  const [companyData, setCompanyData] = useState({
    name: '',
    cnpj: '',
    phone: '',
    address: ''
  });

  // Configurações Globais de Ponto
  const [appSettings, setAppSettings] = useState({
    work_start_time: '08:00',
    tolerance_minutes: 10
  });

  // Carregar dados existentes
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [companies, settingsArr] = await Promise.all([
          base44.entities.Company.list(),
          base44.entities.AppSettings.list()
        ]);

        if (companies && companies.length > 0) {
          setCompanyId(companies[0].id);
          setCompanyData({
            name: companies[0].name || '',
            cnpj: companies[0].cnpj || '',
            phone: companies[0].phone || '',
            address: companies[0].address || ''
          });
        }

        if (settingsArr && settingsArr.length > 0) {
          setAppSettings({
            work_start_time: settingsArr[0].work_start_time || '08:00',
            tolerance_minutes: settingsArr[0].tolerance_minutes || 10
          });
        }
      } catch (err) {
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Salvar/Atualizar Empresa
      if (companyId) {
        await base44.entities.Company.update(companyId, companyData);
      } else {
        const newComp = await base44.entities.Company.create(companyData);
        if (newComp) setCompanyId(newComp.id);
      }

      // 2. Atualizar AppSettings (se existir)
      const settingsArr = await base44.entities.AppSettings.list();
      if (settingsArr && settingsArr.length > 0) {
        await base44.entities.AppSettings.update(settingsArr[0].id, appSettings);
      } else {
        await base44.entities.AppSettings.create(appSettings);
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (err) {
      toast.error('Erro ao salvar configurações: ' + (err.message || 'Tente novamente'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-[#1a2c6a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 p-6 space-y-6">
      
      {/* Cabeçalho */}
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2c6a]">Dados da Empresa</h1>
          <p className="text-sm text-slate-500">Configure as informações institucionais e regras gerais do ponto</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6">
        
        {/* Bloco 1: Informações Cadastrais */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="text-[#ff8b00]" size={22} />
            <h2 className="text-base font-bold text-[#1a2c6a]">Perfil do Empregador</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="text-slate-700 mb-1 flex items-center gap-1 block">
                Razão Social / Nome Fantasia
              </label>
              <input 
                type="text"
                required
                placeholder="Ex: Minha Empresa Ltda"
                value={companyData.name}
                onChange={e => setCompanyData({ ...companyData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#ff8b00]"
              />
            </div>

            <div>
              <label className="text-slate-700 mb-1 flex items-center gap-1 block">
                <FileText size={14} className="text-slate-400" /> CNPJ
              </label>
              <input 
                type="text"
                placeholder="00.000.000/0001-00"
                value={companyData.cnpj}
                onChange={e => setCompanyData({ ...companyData, cnpj: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#ff8b00]"
              />
            </div>

            <div>
              <label className="text-slate-700 mb-1 flex items-center gap-1 block">
                <Phone size={14} className="text-slate-400" /> Telefone / WhatsApp de Contato
              </label>
              <input 
                type="text"
                placeholder="(00) 00000-0000"
                value={companyData.phone}
                onChange={e => setCompanyData({ ...companyData, phone: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#ff8b00]"
              />
            </div>

            <div>
              <label className="text-slate-700 mb-1 flex items-center gap-1 block">
                <MapPin size={14} className="text-slate-400" /> Endereço Completo
              </label>
              <input 
                type="text"
                placeholder="Rua, Número, Bairro - Cidade/UF"
                value={companyData.address}
                onChange={e => setCompanyData({ ...companyData, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#ff8b00]"
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Regras do Bate-Ponto */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="text-[#ff8b00]" size={22} />
            <h2 className="text-base font-bold text-[#1a2c6a]">Regras Globais da Jornada</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <label className="text-slate-700 mb-1 block">Horário Padrão de Entrada</label>
              <input 
                type="time"
                value={appSettings.work_start_time}
                onChange={e => setAppSettings({ ...appSettings, work_start_time: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#ff8b00]"
              />
              <p className="text-[10px] text-slate-400 font-normal mt-1">Usado para calcular atrasos nos pontos de entrada.</p>
            </div>

            <div>
              <label className="text-slate-700 mb-1 block">Tolerância de Atraso (minutos)</label>
              <input 
                type="number"
                min="0"
                max="60"
                value={appSettings.tolerance_minutes}
                onChange={e => setAppSettings({ ...appSettings, tolerance_minutes: parseInt(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#ff8b00]"
              />
              <p className="text-[10px] text-slate-400 font-normal mt-1">Minutos permitidos antes de solicitar justificativa.</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 flex items-center gap-2 text-xs text-amber-800">
            <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
            <span>Essas definições são aplicadas automaticamente aos colaboradores cadastrados sem horário específico.</span>
          </div>
        </div>

        {/* Botão de Ação */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#ff8b00] hover:bg-[#e67a00] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md shadow-orange-500/20 flex items-center gap-2 transition"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Salvar Alterações
          </button>
        </div>

      </form>

    </div>
  );
}
