import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, Sparkles, AlertCircle, X } from 'lucide-react';

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
    sectorName = { uz: "1-Sektor", ru: "Сектор 1", en: "Sector 1" };
    seatInSector = n;
    row = Math.floor((n - 1) / 8) + 1;
    seat = ((n - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 96) {
    sector = 2;
    sectorName = { uz: "2-Sektor", ru: "Сектор 2", en: "Sector 2" };
    seatInSector = n - 48;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 144) {
    sector = 3;
    sectorName = { uz: "3-Sektor", ru: "Сектор 3", en: "Sector 3" };
    seatInSector = n - 96;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 192) {
    sector = 4;
    sectorName = { uz: "4-Sektor", ru: "Сектор 4", en: "Sector 4" };
    seatInSector = n - 144;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else {
    sector = 5;
    sectorName = { uz: "2-Etaj (Balkon)", ru: "2-Этаж (Балкон)", en: "2nd Floor (Balcony)" };
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
    if (occupiedSeats.includes(seatNum)) return;
    setSelectedSeat(prev => (prev === seatNum ? null : seatNum));
  };

  const handleConfirm = async () => {
    if (!selectedSeat) return;

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
      // Open bot deep link with selected seat
      const botUsername = 'TEDxSergeliBot';
      window.open(`https://t.me/${botUsername}?start=seat_${selectedSeat}`, '_blank');
    }
  };

  const selectedDetails = selectedSeat ? getSeatDetails(selectedSeat) : null;

  // Render Sector Grid
  const renderSectorGrid = (startNum: number, rowsCount: number = 6, seatsPerRow: number = 8, title: string) => {
    return (
      <div className="bg-zinc-900/60 dark:bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center">
        <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase mb-3 text-center">
          {title}
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${seatsPerRow}, minmax(0, 1fr))` }}>
          {Array.from({ length: rowsCount * seatsPerRow }).map((_, idx) => {
            const seatNum = startNum + idx;
            const isOccupied = occupiedSeats.includes(seatNum);
            const isSelected = selectedSeat === seatNum;
            const details = getSeatDetails(seatNum);

            let btnClass = "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer select-none ";

            if (isOccupied) {
              btnClass += "bg-red-950/40 text-red-700/60 border border-red-900/30 cursor-not-allowed opacity-50";
            } else if (isSelected) {
              btnClass += "bg-red-600 text-white shadow-lg shadow-red-600/50 scale-110 border-2 border-white ring-2 ring-red-500/50 animate-pulse";
            } else {
              btnClass += "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 hover:border-zinc-500";
            }

            return (
              <button
                key={seatNum}
                disabled={isOccupied}
                onClick={() => handleSeatClick(seatNum)}
                title={
                  isOccupied
                    ? `Band / Занято (№${seatNum})`
                    : `${details.sectorName[lang]} | ${details.row}-qator, ${details.seat}-o'rin (№${seatNum})`
                }
                className={btnClass}
              >
                {isSelected ? <Check className="w-3.5 h-3.5" /> : seatNum}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const texts = {
    title: { uz: "TEDxSergeli zali va joy tanlash", ru: "Схема зала и выбор мест TEDxSergeli", en: "TEDxSergeli Hall & Seat Selection" },
    subtitle: { uz: "Barcha joylar bir xil narxda — 49 999 UZS! O'zingizga ma'qul joyni tanlang", ru: "Все места по одной цене — 49 999 UZS! Выберите удобное кресло", en: "All seats at the same price — 49,999 UZS! Choose your preferred seat" },
    stage: { uz: "🎭 SAHNA / STAGE", ru: "🎭 СЦЕНА / STAGE", en: "🎭 STAGE / SAHNA" },
    legendAvailable: { uz: "Bo'sh", ru: "Свободно", en: "Available" },
    legendSelected: { uz: "Tanlangan", ru: "Выбрано", en: "Selected" },
    legendOccupied: { uz: "Band", ru: "Занято", en: "Occupied" },
    floor1: { uz: "1-qavat (Parter)", ru: "1-й Этаж (Партер)", en: "1st Floor (Stalls)" },
    floor2: { uz: "2-qavat (Balkon)", ru: "2-й Этаж (Балкон)", en: "2nd Floor (Balcony)" },
    confirmBtn: { uz: "Joyni band qilish & Telegram'da xarid qilish 🚀", ru: "Забронировать место & Купить в Telegram 🚀", en: "Reserve Seat & Buy in Telegram 🚀" },
    selectPrompt: { uz: "Iltimos, sxemadan o'rningizni tanlang", ru: "Пожалуйста, выберите место на схеме", en: "Please select a seat on the map" }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-zinc-950 text-white rounded-3xl border border-zinc-800/80 shadow-2xl overflow-hidden relative">
      {/* Header Bar */}
      <div className="p-5 sm:p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INTERACTIVE SEAT MAP</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {texts.title[lang]}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            {texts.subtitle[lang]}
          </p>
        </div>

        {/* Legend & Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
          {/* Legend */}
          <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-zinc-700 border border-zinc-600"></span>
              <span className="text-zinc-300">{texts.legendAvailable[lang]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-600"></span>
              <span className="text-zinc-300">{texts.legendSelected[lang]}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-950/60 border border-red-800"></span>
              <span className="text-zinc-400">{texts.legendOccupied[lang]}</span>
            </div>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setZoom(prev => Math.max(0.75, prev - 0.15))}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(prev => Math.min(1.4, prev + 0.15))}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Map Viewport */}
      <div className="p-4 sm:p-8 overflow-x-auto overflow-y-auto max-h-[600px] flex flex-col items-center custom-scrollbar bg-[#09090b]">
        <div
          className="transition-transform duration-200 origin-top flex flex-col items-center gap-8 w-full max-w-4xl py-2"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Stage Element */}
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
            <div className="w-full h-12 rounded-b-3xl bg-gradient-to-b from-red-600/30 via-red-950/20 to-transparent border-b-2 border-red-600/60 shadow-[0_10px_25px_-5px_rgba(230,43,30,0.3)] flex items-center justify-center">
              <span className="text-red-500 font-black tracking-widest text-xs sm:text-sm uppercase drop-shadow">
                {texts.stage[lang]}
              </span>
            </div>
            <div className="w-4/5 h-1.5 bg-gradient-to-r from-transparent via-red-500/40 to-transparent rounded-full mt-1"></div>
          </div>

          {/* 1st Floor Title */}
          <div className="text-xs font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-2">
            <span className="w-8 h-px bg-zinc-800"></span>
            <span>{texts.floor1[lang]}</span>
            <span className="w-8 h-px bg-zinc-800"></span>
          </div>

          {/* 1st Floor Sectors (Grid 2x2 with walkways) */}
          <div className="flex flex-col gap-6 w-full">
            {/* Front Row: Sector 1 (Left) & Sector 2 (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full">
              {renderSectorGrid(1, 6, 8, `Sektor 1 (1-48)`)}
              {renderSectorGrid(49, 6, 8, `Sektor 2 (49-96)`)}
            </div>

            {/* Horizontal Walkway Aisle */}
            <div className="w-full h-6 rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/20 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
                — O'tish yo'lagi / Aisle —
              </span>
            </div>

            {/* Back Row: Sector 3 (Left) & Sector 4 (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full">
              {renderSectorGrid(97, 6, 8, `Sektor 3 (97-144)`)}
              {renderSectorGrid(145, 6, 8, `Sektor 4 (145-192)`)}
            </div>
          </div>

          {/* 2nd Floor Title (Balkon) */}
          <div className="text-xs font-bold tracking-widest text-zinc-500 uppercase flex items-center gap-2 mt-4">
            <span className="w-8 h-px bg-zinc-800"></span>
            <span>{texts.floor2[lang]}</span>
            <span className="w-8 h-px bg-zinc-800"></span>
          </div>

          {/* 2nd Floor Balkon Sector */}
          <div className="w-full max-w-lg">
            {renderSectorGrid(193, 1, 8, `Balkon (193-200)`)}
          </div>
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/90 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
        {selectedDetails ? (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 font-black text-sm flex-shrink-0">
              #{selectedDetails.seatNumber}
            </div>
            <div>
              <div className="text-xs text-zinc-400 font-medium">
                {selectedDetails.sectorName[lang]}
              </div>
              <div className="text-sm font-bold text-white">
                {selectedDetails.row}-qator / {selectedDetails.seat}-o'rin (Joy №{selectedDetails.seatNumber})
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs sm:text-sm text-zinc-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>{texts.selectPrompt[lang]}</span>
          </div>
        )}

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Narx / Цена</div>
            <div className="text-lg sm:text-xl font-black text-white">49 999 <span className="text-xs font-normal text-zinc-400">UZS</span></div>
          </div>

          <button
            disabled={!selectedSeat}
            onClick={handleConfirm}
            className={`px-6 py-3 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
              selectedSeat
                ? "bg-[#E62B1E] text-white hover:bg-red-700 shadow-lg shadow-red-600/40 hover:scale-[1.02] cursor-pointer"
                : "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
            }`}
          >
            <span>{texts.confirmBtn[lang]}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
