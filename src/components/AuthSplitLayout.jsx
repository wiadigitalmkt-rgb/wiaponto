import React from 'react';
import bgLoginImg from '@/pages/bgloginponto.png';
import iconWiaPonto from '@/pages/iconwiaponto.png';

// Moldura das telas de acesso (esqueci minha senha / nova senha).
// Mesmo visual do Login: formulário à esquerda e foto à direita no PC;
// no celular aparece só o formulário, com o ícone da WiaPonto no topo.
export default function AuthSplitLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-[100dvh] w-full flex bg-white lg:h-screen lg:overflow-hidden font-['Inter',-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,sans-serif]">
      <div className="relative w-full lg:w-1/2 min-h-[100dvh] lg:min-h-0 lg:h-full flex flex-col justify-center items-center px-6 py-10 sm:px-12 md:px-16 lg:px-24 lg:py-0">
        {/* Ícone: preso ao topo, só no celular/tablet */}
        <div className="lg:hidden absolute top-0 inset-x-0 px-6 pt-6 sm:px-12 md:px-16">
          <div className="max-w-md w-full mx-auto">
            <img src={iconWiaPonto} alt="WiaPonto" className="h-14 w-auto" />
          </div>
        </div>

        <div className="max-w-md w-full space-y-6">
          {/* Espaço que o ícone ocupa: mantém o formulário na mesma altura do Login */}
          <div className="lg:hidden h-14 mb-6" aria-hidden="true" />

          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold text-[#1e293b] tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-base lg:text-sm font-normal text-slate-500 leading-relaxed">{subtitle}</p>
            )}
          </div>

          {children}
        </div>
      </div>

      <div className="hidden lg:flex w-1/2 h-full relative overflow-hidden bg-black flex-col justify-between p-12 lg:p-16">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgLoginImg})` }}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 space-y-6 mt-auto">
          <div className="max-w-lg space-y-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Facilite a sua rotina!
            </h2>
            <p className="text-slate-100 font-medium text-sm md:text-base leading-relaxed">
              Registre sua jornada de trabalho de forma rápida, segura e sem complicações!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
