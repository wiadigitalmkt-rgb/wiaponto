import { Link } from 'react-router-dom';
import { Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PUNCH_LABELS, getNextPunchType } from '@/lib/clockUtils';

export default function PointSummaryWidget({ todayRecord }) {
  const next = getNextPunchType(todayRecord);
  const isDone = next === 'done';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
          <Clock size={16} className="text-[#1a2c6a]" />
          Ponto de Hoje
        </h3>
        <span className="text-xs text-slate-400">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </span>
      </div>

      {/* Status badges */}
      <div className="flex gap-2 mb-4">
        {['entry', 'break', 'return', 'exit'].map(type => {
          const time = todayRecord?.[`${type}_time`];
          return (
            <div key={type} className={`flex-1 rounded-lg p-2 text-center text-xs ${time ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
              <p className="font-medium">{PUNCH_LABELS[type]}</p>
              <p className="text-[11px] mt-0.5">{time || '--:--'}</p>
            </div>
          );
        })}
      </div>

      {isDone ? (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 rounded-xl p-3">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">Jornada completa!</span>
        </div>
      ) : (
        <Link
          to="/ponto"
          className="flex items-center justify-between bg-[#ff8b00] hover:bg-[#e67a00] text-white rounded-xl p-3 transition-colors"
        >
          <span className="text-sm font-semibold">
            Registrar {PUNCH_LABELS[next]}
          </span>
          <ArrowRight size={18} />
        </Link>
      )}
    </div>
  );
}