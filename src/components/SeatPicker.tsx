import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Check, Sparkles, AlertCircle, X } from 'lucide-react';

export type Language = 'uz' | 'ru' | 'en';

type LangMap = Record<Language, string>;

export function getSeatDetails(seatNum: number) {
  const n = Math.max(1, Math.min(200, seatNum || 1));
  let sector = 1;
  let sectorName: LangMap = { uz: "1-Sektor", ru: "Сектор 1", en: "Sector 1" };
  let seatInSector = n;
  let row = 1;
  let seat = 1;
  let floor = 1;

  if (n <= 48) {
    sector = 1;
    sectorName = { uz: "1-Sektor (Chap)", ru: "Сектор 1 (Левый)", en: "Sector 1 (Left)" };
    seatInSector = n;
    row = Math.floor((n - 1) / 8) + 1;
    seat = ((n - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 96) {
    sector = 2;
    sectorName = { uz: "2-Sektor (O'ng)", ru: "Сектор 2 (Правый)", en: "Sector 2 (Right)" };
    seatInSector = n - 48;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 144) {
    sector = 3;
    sectorName = { uz: "3-Sektor (Orqa Chap)", ru: "Сектор 3 (Задний Л.)", en: "Sector 3 (Rear L.)" };
    seatInSector = n - 96;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 192) {
    sector = 4;
    sectorName = { uz: "4-Sektor (Orqa O'ng)", ru: "Сектор 4 (Задний П.)", en: "Sector 4 (Rear R.)" };
    seatInSector = n - 144;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else {
    sector = 5;
    sectorName = { uz: "2-Qavat (Balkon)", ru: "2-Этаж (Балкон)", en: "2nd Floor (Balcony)" };
    seatInSector = n - 192;
    row = 1;
    seat = seatInSector;
    floor = 2;
  }

  return {
    seatNumber: n,
    sector,
    sectorName,
    seatInSector,
    row,
    seat,
    floor,
    seatId: `SEAT-${n}`
  };
}

interface SeatPickerProps {
  lang: Language;
  onSelectSeat?: (seatNumber: number) => void;
  onClose?: () => void;
}

export const SeatPicker: React.FC<SeatPickerProps> = ({ lang, onSelectSeat, onClose }) => {
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchOccupiedSeats();
  }, []);

  const fetchOccupiedSeats = async () => {
    try {
      const res = await fetch('/api/seats');
      const data = await res.json();
      if (data.ok && Array.isArray(data.occupiedSeats)) {
        setOccupiedSeats(data.occupiedSeats);
      }
    } catch (err) {
      console.error('Failed to fetch occupied seats:', err);
    }
  };

  const handleSeatClick = (seatNum: number) => {
    if (occupiedSeats.includes(seatNum) || isSubmitting) return;
    setSelectedSeat(prev => (prev === seatNum ? null : seatNum));
  };

  const handleConfirm = async () => {
    if (!selectedSeat || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Temporarily hold seat on server
      await fetch('/api/seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatNumber: selectedSeat })
      });
    } catch (e) {
      console.error('Seat hold error:', e);
    }

    if (onSelectSeat) {
      onSelectSeat(selectedSeat);
    } else {
      const botUsername = 'TEDxSergeliBot';
      window.open(`https://t.me/${botUsername}?start=seat_${selectedSeat}`, '_blank');
    }
  };

  const selectedDetails = selectedSeat ? getSeatDetails(selectedSeat) : null;

  // Render Sector Grid
  const renderSectorGrid = (startNum: number, rowsCount: number = 6, seatsPerRow: number = 8, title: string) => {
    return (
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-2 sm:p-3 flex flex-col items-center shadow-lg">
        <div className="text-[10px] sm:text-xs font-bold tracking-wider text-zinc-400 uppercase mb-2 text-center">
          {title}
        </div>

        <div className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: `repeat(${seatsPerRow}, minmax(0, 1fr))` }}>
          {Array.from({ length: rowsCount * seatsPerRow }).map((_, idx) => {
            const seatNum = startNum + idx;
            const isOccupied = occupiedSeats.includes(seatNum);
            const isSelected = selectedSeat === seatNum;
            const details = getSeatDetails(seatNum);

            let btnClass = "w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-[9px] sm:text-xs font-bold transition-all duration-150 cursor-pointer select-none ";

            if (isOccupied) {
              btnClass += "bg-red-950/40 text-red-700/60 border border-red-900/30 cursor-not-allowed opacity-50";
            } else if (isSelected) {
              btnClass += "bg-red-600 text-white shadow-md shadow-red-600/50 scale-110 border border-white ring-2 ring-red-500/50 animate-pulse";
            } else {
              btnClass += "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/80 hover:border-zinc-500";
            }

            return (
              <button
                key={seatNum}
                disabled={isOccupied || isSubmitting}
                onClick={() => handleSeatClick(seatNum)}
                title={
                  isOccupied
                    ? `Band / Занято (№${seatNum})`
                    : `${details.sectorName[lang]} | ${details.row}-qator, ${details.seat}-o'rin (№${seatNum})`
                }
                className={btnClass}
              >
                {isSelected ? <Check className="w-3 h-3" /> : seatNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const texts = {
    title: { uz: "TEDxSergeli zali xaritasi", ru: "Интерактивная карта зала TEDxSergeli", en: "TEDxSergeli Interactive Hall Map" },
    subtitle: { uz: "Barcha joylar — 49 999 UZS. O'zingizga yoqqan bo'sh o'rinni tanlang", ru: "Все места — 49 999 UZS. Выберите удобное свободное кресло", en: "All seats — 49,999 UZS. Pick any open seat" },
    stage: { uz: "🎭 SAHNA / STAGE", ru: "🎭 СЦЕНА / STAGE", en: "🎭 STAGE / SAHNA" },
    legendAvailable: { uz: "Bo'sh", ru: "Свободно", en: "Available" },
    legendSelected: { uz: "Tanlangan", ru: "Выбрано", en: "Selected" },
    legendOccupied: { uz: "Band", ru: "Занято", en: "Occupied" },
    floor1: { uz: "1-qavat (Parter)", ru: "1-й Этаж (Партер)", en: "1st Floor (Stalls)" },
    floor2: { uz: "2-qavat (Balkon)", ru: "2-й Этаж (Балкон)", en: "2nd Floor (Balcony)" },
    confirmBtn: { uz: "🚀 Joyni band qilish (49 999 UZS)", ru: "🚀 Забронировать место (49 999 UZS)", en: "🚀 Reserve Seat (49,999 UZS)" },
    selectPrompt: { uz: "O'zingizga yoqqan joyni bosing", ru: "Выберите кресло на карте", en: "Tap a seat on the map" }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-zinc-950 text-white rounded-3xl border border-zinc-800/80 shadow-2xl overflow-hidden relative flex flex-col">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold mb-1">
            <Sparkles className="w-3 h-3" />
            <span>WIDE THEATER HALL</span>
          </div>
          <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white">
            {texts.title[lang]}
          </h3>
          <p className="text-xs text-zinc-400">
            {texts.subtitle[lang]}
          </p>
        </div>

        {/* Legend & Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Legend */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-[11px]">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-zinc-700 border border-zinc-600"></span>
              <span className="text-zinc-300">{texts.legendAvailable[lang]}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-red-600"></span>
              <span className="text-zinc-300">{texts.legendSelected[lang]}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-red-950/60 border border-red-800"></span>
              <span className="text-zinc-400">{texts.legendOccupied[lang]}</span>
            </div>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
            <button
              onClick={() => setZoom(prev => Math.max(0.75, prev - 0.15))}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors text-[10px] font-bold px-1.5"
              title="Reset Zoom"
            >
              100%
            </button>
            <button
              onClick={() => setZoom(prev => Math.min(1.4, prev + 0.15))}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Map Viewport */}
      <div className="p-2 sm:p-6 overflow-x-auto overflow-y-auto max-h-[550px] flex flex-col items-center custom-scrollbar bg-[#09090b]">
        <div
          className="transition-transform duration-200 origin-top flex flex-col items-center gap-6 w-full py-1"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Curved Stage Element */}
          <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
            <div className="w-full h-10 rounded-b-[40px] bg-gradient-to-b from-red-600/40 via-red-950/20 to-transparent border-b-2 border-red-600/80 shadow-[0_10px_30px_-5px_rgba(230,43,30,0.4)] flex items-center justify-center">
              <span className="text-red-500 font-black tracking-widest text-xs sm:text-sm uppercase drop-shadow">
                {texts.stage[lang]}
              </span>
            </div>
            <div className="w-3/4 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent rounded-full mt-1"></div>
          </div>

          {/* 1st Floor Title */}
          <div className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-2">
            <span className="w-8 h-px bg-zinc-800"></span>
            <span>{texts.floor1[lang]}</span>
            <span className="w-8 h-px bg-zinc-800"></span>
          </div>

          {/* 1st Floor Sectors (2 Columns Wide Layout!) */}
          <div className="flex flex-col gap-4 w-full max-w-4xl">
            {/* Front Row: Sector 1 (Left) & Sector 2 (Right) SIDE-BY-SIDE ALWAYS */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full">
              {renderSectorGrid(1, 6, 8, `Sektor 1`)}
              {renderSectorGrid(49, 6, 8, `Sektor 2`)}
            </div>

            {/* Central Aisle */}
            <div className="w-full h-5 rounded-lg border border-dashed border-zinc-800/80 bg-zinc-900/30 flex items-center justify-center">
              <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                — O'tish yo'lagi / Walkway Aisle —
              </span>
            </div>

            {/* Back Row: Sector 3 (Left) & Sector 4 (Right) SIDE-BY-SIDE ALWAYS */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full">
              {renderSectorGrid(97, 6, 8, `Sektor 3`)}
              {renderSectorGrid(145, 6, 8, `Sektor 4`)}
            </div>
          </div>

          {/* 2nd Floor Title (Balkon) */}
          <div className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-2 mt-2">
            <span className="w-8 h-px bg-zinc-800"></span>
            <span>{texts.floor2[lang]}</span>
            <span className="w-8 h-px bg-zinc-800"></span>
          </div>

          {/* 2nd Floor Balkon Sector */}
          <div className="w-full max-w-sm mb-4">
            {renderSectorGrid(193, 1, 8, `Balkon (193-200)`)}
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar (Sticky & Always Visible) */}
      <div className="sticky bottom-0 z-50 p-3 sm:p-4 border-t border-zinc-800/90 bg-zinc-950/95 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
        {selectedDetails ? (
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 font-black text-xs flex-shrink-0">
              #{selectedDetails.seatNumber}
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-medium leading-tight">
                {selectedDetails.sectorName[lang]}
              </div>
              <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                {selectedDetails.row}-qator / {selectedDetails.seat}-o'rin (Joy №{selectedDetails.seatNumber})
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
            <span>{texts.selectPrompt[lang]}</span>
          </div>
        )}

        <button
          disabled={!selectedSeat || isSubmitting}
          onClick={handleConfirm}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 ${
            selectedSeat && !isSubmitting
              ? "bg-[#E62B1E] text-white hover:bg-red-700 shadow-lg shadow-red-600/50 hover:scale-[1.01] active:scale-95 cursor-pointer"
              : "bg-zinc-800 text-zinc-500 border border-zinc-700/80 cursor-not-allowed opacity-60"
          }`}
        >
          {isSubmitting ? (
            <span>Band qilinmoqda...</span>
          ) : (
            <span>{texts.confirmBtn[lang]}</span>
          )}
        </button>
      </div>
    </div>
  );
};
