import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, ShieldCheck, Search } from 'lucide-react';

interface ScanResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  guest?: string;
  seat?: number;
  sector?: number;
  row?: number;
  ticketId?: string;
}

export const Scanner: React.FC = () => {
  const [scanResult, setScanResult] = useState<ScanResult>({ status: 'idle' });
  const [manualId, setManualId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [volunteerId, setVolunteerId] = useState<number | null>(null);
  const [volunteerName, setVolunteerName] = useState<string>('Nazoratchi');

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scanTimeoutRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();

      const user = window.Telegram.WebApp.initDataUnsafe?.user;
      if (user?.id) {
        setVolunteerId(user.id);
        setVolunteerName(user.first_name || user.username || 'Nazoratchi');
      }
    }

    startCamera();

    return () => {
      stopCamera();
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const html5Qrcode = new Html5Qrcode('qr-reader');
      html5QrcodeRef.current = html5Qrcode;

      const config = { fps: 10, qrbox: { width: 260, height: 260 } };

      await html5Qrcode.start(
        { facingMode: 'environment' },
        config,
        onScanSuccess,
        onScanFailure
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera Start Error:', err);
      setCameraError('Kameraga ruxsat berilmadi yoki kamera topilmadi.');
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.error('Stop Camera Error:', e);
      }
    }
    setIsScanning(false);
  };

  const triggerHaptic = (type: 'success' | 'error' | 'warning') => {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
      }
    } catch (e) {
      console.error('Haptic error:', e);
    }
  };

  const handleVerifyTicket = async (ticketCode: string) => {
    if (scanResult.status === 'loading') return;

    setScanResult({ status: 'loading' });

    try {
      const res = await fetch('/api/verify-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticketCode,
          volunteerId: volunteerId
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        triggerHaptic('success');
        setScanResult({
          status: 'success',
          message: data.message || 'KIRISHGA RUXSAT!',
          guest: data.guest,
          seat: data.seat,
          sector: data.sector,
          row: data.row,
          ticketId: data.ticketId
        });
      } else {
        triggerHaptic('error');
        setScanResult({
          status: 'error',
          message: data.message || 'Chipta yaroqsiz yoki topilmadi!'
        });
      }
    } catch (err) {
      triggerHaptic('error');
      setScanResult({
        status: 'error',
        message: 'Tarmoqda xatolik yuz berdi!'
      });
    }

    // Auto resume scanner after 3 seconds
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      setScanResult({ status: 'idle' });
    }, 3000);
  };

  const onScanSuccess = (decodedText: string) => {
    if (scanResult.status === 'loading' || scanResult.status === 'success') return;
    handleVerifyTicket(decodedText);
  };

  const onScanFailure = (_error: string) => {
    // Ignore minor frame scan misses
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    handleVerifyTicket(manualId.trim());
    setManualId('');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-between p-4 relative overflow-hidden select-none">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between py-3 border-b border-zinc-800 z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-red-500" />
          <div>
            <h1 className="text-base font-black tracking-wider text-white">TEDxSergeli</h1>
            <p className="text-[10px] text-zinc-400">Nazoratchi: <span className="text-red-400 font-semibold">{volunteerName}</span></p>
          </div>
        </div>

        <button
          onClick={() => {
            if (isScanning) stopCamera();
            else startCamera();
          }}
          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Kamera ishlamoqda' : 'Kamerani yoqish'}</span>
        </button>
      </div>

      {/* Center Viewfinder Container */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center my-4 relative">
        <div className="w-full aspect-square max-w-[320px] rounded-3xl overflow-hidden border-2 border-red-600/60 shadow-[0_0_40px_rgba(230,43,30,0.25)] relative bg-black flex items-center justify-center">
          <div id="qr-reader" className="w-full h-full object-cover"></div>

          {/* Viewfinder Target Reticle Frame */}
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-red-500/40 rounded-3xl flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-red-500 rounded-2xl relative animate-pulse">
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg"></div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-lg"></div>
            </div>
          </div>
        </div>

        {cameraError && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-800/80 rounded-2xl text-red-300 text-xs text-center max-w-xs">
            {cameraError}
          </div>
        )}

        <p className="text-xs text-zinc-400 mt-4 text-center">
          Chiptadagi QR-kodni kameraning markaziy ramkasiga to'g'rilang
        </p>
      </div>

      {/* Manual Search Fallback */}
      <div className="w-full max-w-md mb-4 z-10">
        <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Chipta ID (masalan: TEDX-849201)"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl transition-colors flex-shrink-0 cursor-pointer"
          >
            Tekshirish
          </button>
        </form>
      </div>

      {/* Fullscreen Overlay Popup Status */}
      {scanResult.status === 'success' && (
        <div className="fixed inset-0 z-50 bg-emerald-600 flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn">
          <CheckCircle className="w-24 h-24 mb-4 text-white animate-bounce" />
          <h2 className="text-3xl font-black tracking-tight mb-2">
            ✅ {scanResult.message}
          </h2>
          <div className="bg-emerald-700/60 backdrop-blur-md border border-emerald-400/40 rounded-3xl p-6 w-full max-w-xs space-y-3 mt-2 shadow-2xl">
            <div className="text-xl font-bold text-emerald-100">
              👤 {scanResult.guest}
            </div>
            <div className="text-lg font-black bg-emerald-950/40 py-2 px-4 rounded-xl text-white">
              📍 Joy №{scanResult.seat} (Sektor {scanResult.sector})
            </div>
            <div className="text-xs text-emerald-200 font-mono">
              ID: {scanResult.ticketId}
            </div>
          </div>
          <p className="text-xs text-emerald-100 mt-6 animate-pulse">
            3 sekunddan so'ng keyingi chipta сканерланади...
          </p>
        </div>
      )}

      {scanResult.status === 'error' && (
        <div className="fixed inset-0 z-50 bg-red-600 flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn">
          <XCircle className="w-24 h-24 mb-4 text-white animate-pulse" />
          <h2 className="text-3xl font-black tracking-tight mb-4">
            ❌ KIRISH TAQIQLANADI!
          </h2>
          <div className="bg-red-950/60 backdrop-blur-md border border-red-400/40 rounded-3xl p-6 w-full max-w-xs space-y-2 text-red-100 font-bold text-sm shadow-2xl">
            <AlertTriangle className="w-8 h-8 text-amber-300 mx-auto mb-1" />
            <p>{scanResult.message}</p>
          </div>
          <p className="text-xs text-red-200 mt-6 animate-pulse">
            3 sekunddan so'ng qayta сканерланади...
          </p>
        </div>
      )}

      {scanResult.status === 'loading' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
          <RefreshCw className="w-16 h-16 animate-spin text-red-500 mb-4" />
          <p className="text-base font-bold text-zinc-300">Chipta bazadan tekshirilmoqda...</p>
        </div>
      )}
    </div>
  );
};
