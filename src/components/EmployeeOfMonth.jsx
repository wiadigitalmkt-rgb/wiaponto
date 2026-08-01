import { Award, Star } from 'lucide-react';

export default function EmployeeOfMonth({ settings }) {
  const name = settings?.employee_of_month_name;
  if (!name) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
        <Award size={32} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">Colaborador do Mês ainda não definido</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a2c6a] via-[#1a2c6a] to-[#2a4494] p-6 text-white">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ff8b00]/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#92e5f7]/10 rounded-full blur-3xl" />

      <div className="relative flex items-center gap-5">
        {settings.employee_of_month_photo ? (
          <div className="relative flex-shrink-0">
            <img
              src={settings.employee_of_month_photo}
              alt={name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[#ff8b00]"
            />
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#ff8b00] flex items-center justify-center shadow-lg">
              <Star size={14} className="text-white fill-white" />
            </div>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-[#ff8b00]/20 border-2 border-[#ff8b00]/50 flex items-center justify-center flex-shrink-0">
            <Award size={28} className="text-[#ff8b00]" />
          </div>
        )}

        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ff8b00] text-xs font-bold mb-2">
            <Star size={10} className="fill-white" /> Destaque do Mês
          </div>
          <h3 className="text-lg font-bold truncate">{name}</h3>
          {settings.employee_of_month_role && (
            <p className="text-sm text-[#92e5f7] truncate">{settings.employee_of_month_role}</p>
          )}
          {settings.employee_of_month_reason && (
            <p className="text-xs text-white/60 mt-1 line-clamp-2">{settings.employee_of_month_reason}</p>
          )}
        </div>
      </div>
    </div>
  );
}