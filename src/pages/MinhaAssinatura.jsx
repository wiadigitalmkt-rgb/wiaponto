import React, { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, PenLine, CheckCircle2, X } from 'lucide-react';

const STORAGE_BUCKET = 'admissao-documentos';

// ---------------------------------------------------------------------------
// Mesma lógica de desenho usada em PreencherAdmissao.jsx (SignaturePad) —
// aqui reaproveitada como página independente, pra qualquer gestor ou dono
// da conta que nunca passou pelo processo de admissão também poder ter uma
// assinatura própria salva (usada em "Assinar como Gestor" / "Assinar como
// Empregadora", nos contratos).
// ---------------------------------------------------------------------------
export default function MinhaAssinatura() {
  const { user: loggedInUser, isLoadingAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(null);
  const [redoing, setRedoing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isLoadingAuth || !loggedInUser?.id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('Employees')
        .select('signature_path')
        .eq('id', loggedInUser.id)
        .maybeSingle();
      setCurrentUrl(data?.signature_path || null);
      setLoading(false);
    })();
  }, [isLoadingAuth, loggedInUser]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [redoing]);

  function getCanvasPoint(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e) {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasPoint(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasDrawn) setHasDrawn(true);
  }

  function stopDraw() {
    drawingRef.current = false;
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  async function handleConfirm() {
    const canvas = canvasRef.current;
    canvas.toBlob(
      async (blob) => {
        if (!blob || !loggedInUser?.id) return;
        setUploading(true);
        try {
          const file = new File([blob], `assinatura-${Date.now()}.png`, { type: 'image/png' });
          const path = `${loggedInUser.id}/assinatura-${Date.now()}.png`;

          const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(path, file, { upsert: true });
          if (uploadError) throw uploadError;

          // IMPORTANTE: grava a URL pública completa, não só o caminho —
          // foi exatamente esse bug que deixou a assinatura do colaborador
          // quebrada por um tempo.
          const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

          const { error: empError } = await supabase
            .from('Employees')
            .update({ signature_path: urlData.publicUrl })
            .eq('id', loggedInUser.id);
          if (empError) throw empError;

          setCurrentUrl(urlData.publicUrl);
          setRedoing(false);
          setHasDrawn(false);
        } catch (err) {
          console.error(err);
          alert('Erro ao salvar a assinatura: ' + err.message);
        } finally {
          setUploading(false);
        }
      },
      'image/png',
      1
    );
  }

  if (isLoadingAuth || loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f7] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#ff8b00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f7] flex flex-col font-sans text-slate-700">
      <Navbar selectedCompany="Sua Empresa" />

      <main className="flex-1 max-w-xl w-full mx-auto p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Minha assinatura</h1>
          <p className="text-xs text-slate-500">
            Usada quando você assina contratos como gestor responsável ou, se você for o dono
            da conta, como representante da empregadora.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
          {currentUrl && !redoing ? (
            <div className="flex items-center gap-4">
              <img
                src={currentUrl}
                alt="Sua assinatura"
                className="w-40 h-20 object-contain border border-slate-200 rounded-lg bg-white"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#ff8b00]" /> Assinatura salva
                </p>
                <button
                  onClick={() => setRedoing(true)}
                  className="text-xs text-[#ff8b00] hover:underline font-medium mt-1"
                >
                  Refazer assinatura
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Desenhe sua assinatura na área abaixo, com o dedo (celular/tablet) ou o mouse.
              </p>
              <canvas
                ref={canvasRef}
                width={600}
                height={220}
                className="w-full rounded-lg border border-slate-200 bg-white touch-none"
                style={{ touchAction: 'none' }}
                onPointerDown={startDraw}
                onPointerMove={draw}
                onPointerUp={stopDraw}
                onPointerLeave={stopDraw}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  disabled={uploading}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Limpar
                </button>
                {currentUrl && (
                  <button
                    onClick={() => setRedoing(false)}
                    disabled={uploading}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  disabled={!hasDrawn || uploading}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white px-4 py-2.5 rounded-xl disabled:opacity-50 transition active:scale-[0.98] bg-[#ff8b00] hover:bg-[#fc9314]"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                  {uploading ? 'Salvando...' : 'Salvar assinatura'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
