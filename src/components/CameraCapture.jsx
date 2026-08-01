import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function CameraCapture({ address, onCapture, capturedUrl }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const addressRef = useRef(address);
  const onCaptureRef = useRef(onCapture);

  const [streaming, setStreaming] = useState(false);
  const [preview, setPreview] = useState(capturedUrl || null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { addressRef.current = address; }, [address]);
  useEffect(() => { onCaptureRef.current = onCapture; }, [onCapture]);

  // Assign srcObject AFTER the video element is rendered (streaming=true → element visible in DOM)
  useEffect(() => {
    if (streaming && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [streaming]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
    streamRef.current = stream;
    // Set streaming=true first so the <video> mounts, then useEffect above assigns srcObject
    setStreaming(true);
  }, []);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Overlay
    const now = new Date();
    const overlay = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(overlay, 10, canvas.height - 18);
    const addr = addressRef.current;
    if (addr) {
      ctx.font = '12px sans-serif';
      ctx.fillText(addr.substring(0, 80), 10, canvas.height - 4);
    }

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) return; // keep camera open on failure

    // Show snapshot preview and close stream
    const localUrl = URL.createObjectURL(blob);
    setPreview(localUrl);
    stopCamera();

    // Upload
    setUploading(true);
    try {
      const file = new File([blob], `ponto_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploading(false);
      onCaptureRef.current(file_url);
    } catch (err) {
      setUploading(false);
      setPreview(null);
      onCaptureRef.current(null);
      alert('Erro ao enviar a foto: ' + (err?.message || 'Tente novamente.'));
    }
  }, [stopCamera]);

  const reset = useCallback(() => {
    setPreview(null);
    onCaptureRef.current(null);
  }, []);

  return (
    <div className="rounded-xl overflow-hidden border-2 border-dashed border-slate-300 bg-slate-100">
      {/* Canvas always hidden — used for snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview after capture */}
      {preview && (
        <div className="relative">
          <img src={preview} alt="Captura" className="w-full aspect-[4/3] object-cover" />
          {uploading ? (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-xs">Enviando foto…</span>
            </div>
          ) : (
            <>
              <Button size="icon" variant="secondary" onClick={reset}
                className="absolute top-2 right-2 h-8 w-8 bg-white/90">
                <RefreshCw size={14} />
              </Button>
              <span className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Check size={12} /> Foto capturada
              </span>
            </>
          )}
        </div>
      )}

      {/* Live camera feed — video is ALWAYS in DOM when streaming, only hidden by preview */}
      <div className={preview ? 'hidden' : 'block'}>
        {streaming ? (
          <div className="relative">
            {/* CRITICAL: muted + playsInline + autoPlay attributes prevent black screen */}
            <video
              ref={videoRef}
              className="w-full aspect-[4/3] object-cover bg-black"
              muted
              playsInline
              autoPlay
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
              <Button type="button" onClick={capture}
                className="bg-[#ff8b00] hover:bg-[#e67a00] text-white rounded-full px-6">
                <Camera size={16} className="mr-2" /> Capturar
              </Button>
              <Button type="button" variant="outline" onClick={stopCamera} className="rounded-full bg-white/90">
                <X size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={startCamera}
            className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-[#ff8b00] transition-colors"
          >
            <Camera size={40} />
            <span className="text-sm font-medium">Clique para abrir a câmera</span>
          </button>
        )}
      </div>
    </div>
  );
}