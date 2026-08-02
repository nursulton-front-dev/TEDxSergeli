import { CheckCircle2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';
import AnimatedSection from './AnimatedSection';

export default function TicketPromo() {
  const { lang } = useLang();
  const t = translations.tickets;

  return (
    <section id="tickets" className="py-24 md:py-32 bg-slate-100 dark:bg-[#0D0D0D] relative transition-colors duration-300">
      <div className="w-full max-w-6xl mx-auto px-4 relative z-10">
        <AnimatedSection>
          <div className="relative w-full">
            
            {/* The Ticket Container: Grid Layout (12 cols) */}
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl text-zinc-900 dark:text-white transition-colors duration-300">
              
              {/* Side Cutouts (Perforation notches) */}
              {/* Top Notch (Desktop) */}
              <div className="hidden lg:block absolute -top-4 left-[58.333%] -translate-x-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0D0D0D] border border-zinc-200 dark:border-zinc-800 z-20 transition-colors duration-300" />
              {/* Bottom Notch (Desktop) */}
              <div className="hidden lg:block absolute -bottom-4 left-[58.333%] -translate-x-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0D0D0D] border border-zinc-200 dark:border-zinc-800 z-20 transition-colors duration-300" />
              {/* Left Notch (Mobile) */}
              <div className="lg:hidden absolute -left-4 top-[56%] -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0D0D0D] border border-zinc-200 dark:border-zinc-800 z-20 transition-colors duration-300" />
              {/* Right Notch (Mobile) */}
              <div className="lg:hidden absolute -right-4 top-[56%] -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0D0D0D] border border-zinc-200 dark:border-zinc-800 z-20 transition-colors duration-300" />

              {/* Left Column (Content): 7 cols on lg, 8 cols on xl */}
              <div className="lg:col-span-7 xl:col-span-8 p-8 md:p-12 bg-white dark:bg-zinc-950 flex flex-col justify-center">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/60 text-xs md:text-sm font-extrabold tracking-wider mb-6 w-max transition-colors duration-300 shadow-sm">
                  {t.badge[lang]}
                </div>
                
                {/* Heading */}
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-[1.15] tracking-tight text-zinc-900 dark:text-white transition-colors duration-300">
                  {t.title[lang]}
                </h2>
                
                {/* Subheading with official full name */}
                <p className="text-zinc-600 dark:text-zinc-300 text-base md:text-lg leading-relaxed mb-6 transition-colors duration-300 font-medium">
                  {t.desc[lang]}
                </p>

                {/* FOMO Notice Callout (Single 📍 Emoji) */}
                <div className="flex items-center gap-3 p-3.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs md:text-sm font-semibold mb-8 transition-colors duration-300 shadow-sm">
                  <span className="text-base flex-shrink-0">📍</span>
                  <span>{t.fomoNotice[lang]}</span>
                </div>

                {/* Features List */}
                <ul className="space-y-3.5">
                  {t.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#E62B1E] flex-shrink-0" />
                      <span className="text-zinc-700 dark:text-zinc-300 font-semibold text-sm md:text-base transition-colors duration-300">
                        {feature[lang]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Column (Price & Button): 5 cols on lg, 4 cols on xl */}
              <div className="lg:col-span-5 xl:col-span-4 p-8 md:p-12 bg-zinc-50 dark:bg-zinc-900/60 flex flex-col justify-center items-center text-center border-t lg:border-t-0 lg:border-l border-dashed border-zinc-300 dark:border-zinc-700 transition-colors duration-300">
                
                {/* Micro-badge / Sold indicator */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-black mb-6 animate-pulse">
                  {t.soldBadge[lang]}
                </div>

                {/* Price Container */}
                <div className="text-center mb-8 w-full space-y-1">
                  <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold transition-colors duration-300">
                    {t.priceLabel[lang]}
                  </p>
                  
                  <div className="flex flex-col items-center justify-center py-1">
                    <span className="text-lg text-zinc-400 dark:text-zinc-500 line-through font-medium decoration-[#E62B1E]/70 decoration-2 transition-colors duration-300">
                      {t.oldPrice[lang]}
                    </span>
                    <span className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight transition-colors duration-300">
                      {t.price[lang]}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 pt-1">
                    {t.limitedSeats[lang]}
                  </p>
                </div>

                {/* Full-width CTA Button with Telegram SVG Logo */}
                <div className="w-full">
                  <a
                    href="https://t.me/TEDxSergeliBot?start=ticket"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full py-4 px-6 bg-[#E62B1E] text-white text-base md:text-lg font-bold rounded-xl shadow-lg shadow-red-600/25 hover:bg-[#c52319] transition-all duration-300 hover:-translate-y-1 hover:shadow-red-600/40 group cursor-pointer text-center"
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0 fill-current group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                    </svg>
                    <span>{t.ctaBtn[lang]}</span>
                  </a>
                </div>

              </div>

            </div>

          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
