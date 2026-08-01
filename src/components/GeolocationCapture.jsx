import { useState, useCallback } from 'react';
import { MapPin, Loader2, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GeolocationCapture({ onCapture, captured }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(captured || null);
  const [error, setError] = useState(null);

  const getLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          );
          const json = await res.json();
          if (json.display_name) address = json.display_name;
        } catch {}
        const result = { lat: latitude, lng: longitude, address };
        setData(result);
        setLoading(false);
        onCapture(result);
      },
      (err) => {
        setError('Não foi possível obter a localização. Verifique as permissões.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [onCapture]);

  if (data) {
    return (
      <div className="rounded-xl border-2 border-[#92e5f7]/50 bg-[#92e5f7]/5 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Check size={18} className="text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800">Localização capturada</p>
            <p className="text-xs text-slate-500 mt-1 break-words">{data.address}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => { setData(null); onCapture(null); }} className="h-8 w-8 flex-shrink-0">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center">
      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
      <Button
        onClick={getLocation}
        disabled={loading}
        variant="outline"
        className="gap-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
        {loading ? 'Obtendo localização...' : 'Capturar Localização'}
      </Button>
    </div>
  );
}