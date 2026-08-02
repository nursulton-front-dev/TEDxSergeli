import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { SeatPicker, getSeatDetails, type Language } from './SeatPicker';

interface SeatPickerAppProps {
  lang?: Language;
}

export const SeatPickerApp: React.FC<SeatPickerAppProps> = ({ lang = 'uz' }) => {
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      const webApp = window.Telegram.WebApp as any;
      if (webApp.enableClosingConfirmation) {
        webApp.enableClosingConfirmation();
      }
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleSelectSeat = async (seatNumber: number) => {
    const details = getSeatDetails(seatNumber);

    try {
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }

      const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const chatId = user?.id;

      // 1. Direct API call to lock seat & trigger bot message
      await fetch('/api/select-seat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          seatNumber: details.seatNumber
        })
      });

      // 2. Fallback WebApp.sendData if keyboard button mode
      const payload = JSON.stringify({
        seatNumber: details.seatNumber,
        sector: details.sector,
        row: details.row,
        seat: details.seat,
        seatId: details.seatId,
        bookingExpiresAt: Date.now() + 15 * 60 * 1000
      });

      if (window.Telegram?.WebApp?.sendData) {
        try {
          window.Telegram.WebApp.sendData(payload);
        } catch (_err) {
          // sendData may fail if opened via inline keyboard, ignore
        }
      }

      // Close Mini App
      setTimeout(() => {
        if (window.Telegram?.WebApp?.close) {
          window.Telegram.WebApp.close();
        }
      }, 300);
    } catch (err) {
      console.error('Error selecting seat in Mini App:', err);
    }
  };

  const timerTexts = {
    uz: "Band qilish vaqti",
    ru: "Время на бронирование",
    en: "Reservation timer"
  };

  const expiredTexts = {
    uz: "⚠️ Vaqt tugadi!",
    ru: "⚠️ Время вышло!",
    en: "⚠️ Time expired!"
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-start p-2 sm:p-4 select-none pb-24">
      <div className="w-full max-w-5xl mx-auto">
        {/* Countdown Timer Banner */}
        <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 px-4 mb-3 flex items-center justify-between text-xs sm:text-sm font-semibold text-amber-300 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 text-amber-400 ${timeLeft > 0 ? 'animate-spin' : ''}`} />
            <span>{timerTexts[lang]}:</span>
          </div>
          <div className={`font-mono text-sm sm:text-base font-black px-3 py-1 rounded-xl border ${
            timeLeft > 0 
              ? 'text-amber-400 bg-amber-950/60 border-amber-500/40' 
              : 'text-red-400 bg-red-950/60 border-red-500/40 animate-pulse'
          }`}>
            ⏱️ {timeLeft > 0 ? formattedTime : expiredTexts[lang]}
          </div>
        </div>

        {/* Hall Seat Map Component */}
        <SeatPicker
          lang={lang}
          onSelectSeat={handleSelectSeat}
        />
      </div>
    </div>
  );
};
