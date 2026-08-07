import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getGreeting } from '@/lib/clockUtils';
import EmployeeOfMonth from '@/components/EmployeeOfMonth';
import PointSummaryWidget from '@/components/PointSummaryWidget';
import { CalendarDays, Users, FileText, TrendingUp } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState(null);
  const [settings, setSettings] = useState(null);
  const [stats, setStats] = useState({ total: 0, pending: 0 });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    base44.entities.TimeClock.filter({ date: today, employee_email: user?.email }).then(r => {
      if (r.length > 0) setTodayRecord(r[0]);
    });
    base44.entities.AppSettings.list().then(r => {
      if (r.length > 0) setSettings(r[0]);
    });
    base44.entities.TimeClockRequest.filter({ employee_email: user?.email, status: 'pending' }).then(r => {
      setStats(s => ({ ...s, pending: r.length }));
    });
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    base44.entities.TimeClock.filter({ employee_email: user?.email }).then(r => {
      setStats(s => ({ ...s, total: r.filter(x => x.date >= monthStart).length }));
    });
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a2c6a]">
          {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Colaborador'}! 👋
        </h1>
        <p className="text-slate-500 mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Dias este mês', value: stats.total, icon: CalendarDays, color: 'bg-[#1a2c6a]' },
          { label: 'Solicitações pendentes', value: stats.pending, icon: FileText, color: 'bg-[#ff8b00]' },
          { label: 'Jornada padrão', value: '8h/dia', icon: TrendingUp, color: 'bg-emerald-600' },
          { label: 'Regime', value: 'CLT', icon: Users, color: 'bg-[#1a2c6a]' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PointSummaryWidget todayRecord={todayRecord} />
        <EmployeeOfMonth settings={settings} />
      </div>
    </div>
  );
}
