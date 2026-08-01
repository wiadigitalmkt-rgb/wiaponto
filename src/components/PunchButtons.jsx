import { Clock, Coffee, RotateCcw, LogOut } from 'lucide-react';
import { PUNCH_LABELS } from '@/lib/clockUtils';

const ICONS = {
  entry: Clock,
  break: Coffee,
  return: RotateCcw,
  exit: LogOut,
};

const COLORS = {
  entry: 'bg-green-500 hover:bg-green-600',
  break: 'bg-amber-500 hover:bg-amber-600',
  return: 'bg-blue-500 hover:bg-blue-600',
  exit: 'bg-red-500 hover:bg-red-600',
};

export default function PunchButtons({ nextPunch, selected, onSelect }) {
  const types = ['entry', 'break', 'return', 'exit'];

  return (
    <div className="grid grid-cols-2 gap-3">
      {types.map(type => {
        const Icon = ICONS[type];
        const isNext = nextPunch === type;
        const isDone = types.indexOf(type) < types.indexOf(nextPunch);
        const isSelected = selected === type;
        const disabled = !isNext;

        return (
          <button
            key={type}
            onClick={() => !disabled && onSelect(type)}
            disabled={disabled}
            className={`
              relative flex flex-col items-center gap-2 p-4 rounded-xl font-medium text-sm
              transition-all duration-200 border-2
              ${isSelected
                ? 'border-[#ff8b00] bg-[#ff8b00]/10 text-[#ff8b00] ring-2 ring-[#ff8b00]/30'
                : isDone
                  ? 'border-green-200 bg-green-50 text-green-600 opacity-60'
                  : isNext
                    ? 'border-[#1a2c6a]/20 bg-white text-[#1a2c6a] hover:border-[#ff8b00] hover:shadow-md cursor-pointer'
                    : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
              }
            `}
          >
            {isDone && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px]">✓</span>
            )}
            <Icon size={24} />
            <span>{PUNCH_LABELS[type]}</span>
          </button>
        );
      })}
    </div>
  );
}