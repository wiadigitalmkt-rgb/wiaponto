import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export default function MonthNavigator({ month, year, onChange }) {
  const handlePrev = () => {
    if (month === 1) onChange({ month: 12, year: year - 1 });
    else onChange({ month: month - 1, year });
  };
  const handleNext = () => {
    if (month === 12) onChange({ month: 1, year: year + 1 });
    else onChange({ month: month + 1, year });
  };

  return (
    <div className="inline-flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
      <button onClick={handlePrev} className="p-1.5 rounded hover:bg-slate-100 transition-colors">
        <ChevronLeft size={18} className="text-slate-600" />
      </button>
      <span className="text-sm font-semibold text-slate-700 px-3 min-w-[140px] text-center capitalize">
        {MONTHS[month - 1]} {year}
      </span>
      <button onClick={handleNext} className="p-1.5 rounded hover:bg-slate-100 transition-colors">
        <ChevronRight size={18} className="text-slate-600" />
      </button>
    </div>
  );
}