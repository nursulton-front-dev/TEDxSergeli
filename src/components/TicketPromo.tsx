import { Send, CheckCircle2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';
import AnimatedSection from './AnimatedSection';

export default function TicketPromo() {
  const { lang } = useLang();
  const t = translations.tickets;

  return (
    <section id="tickets" className="py-24 md:py-32 bg-slate-100 dark:bg-[#0D0D0D] relative transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <AnimatedSection>
          <div className="relative mx-auto max-w-4xl">
            
            {/* The Ticket Container */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none flex flex-col md:flex-row text-zinc-900 dark:text-white transition-colors duration-300">
              
              {/* Side Cutouts (Perforation notches) */}
              {/* Top Notch (Desktop) */}
              <div className="hidden md:block absolute -top-4 left-[60%] -translate-x-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0D0D0D] border border-zinc-200 dark:border-zinc-800 z-20 transition-colors duration-300" />
              {/* Bottom Notch (Desktop) */}
              <div className="hidden md:block absolute -bottom-4 left-[60%] -translate-x-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0D0D0D] border border-zinc-200 dark:border-zinc-800 z-20 transition-colors duration-300" />
              {/* Left Notch (Mobile) */}
              <div className="md:hidden absolute -left-4 top-[55%] -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0D0D0D] border border-zinc-200 dark:border-zinc-800 z-20 transition-colors duration-300" />
              {/* Right Notch (Mobile) */}
              <div className="md:hidden absolute -right-4 top-[55%] -translate-y-1/2 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0D0D0D] border border-zinc-200 dark:border-zinc-800 z-20 transition-colors duration-300" />

              {/* Dashed line separator */}
              <div className="hidden md:block absolute top-8 bottom-8 left-[60%] w-px border-l-2 border-dashed border-zinc-200 dark:border-zinc-800 transition-colors duration-300 pointer-events-none" />
              <div className="md:hidden absolute left-8 right-8 top-[55%] h-px border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 transition-colors duration-300 pointer-events-none" />

              {/* Left Side: Info */}
              <div className="p-8 md:p-12 md:w-[60%] flex flex-col justify-center">
                
                {/* Badge "TEZ KUNDA" */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50 text-xs md:text-sm font-bold tracking-wider mb-6 w-max transition-colors duration-300">
                  {t.badge[lang]}
                </div>
                
                {/* Heading */}
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight tracking-tight text-zinc-900 dark:text-white transition-colors duration-300">
                  {t.title[lang]}
                </h2>
                
                {/* Subheading */}
                <p className="text-zinc-600 dark:text-zinc-400 text-base md:text-lg leading-relaxed mb-8 transition-colors duration-300">
                  {t.desc[lang]}
                </p>

                {/* Features List */}
                <ul className="space-y-3.5">
                  {t.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#E62B1E] flex-shrink-0" />
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium text-sm md:text-base transition-colors duration-300">
                        {feature[lang]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Side: Price & Action */}
              <div className="p-8 md:p-12 md:w-[40%] flex flex-col items-center justify-center bg-zinc-50/70 dark:bg-white/[0.02] rounded-b-[24px] md:rounded-r-[24px] md:rounded-bl-none transition-colors duration-300">
                <div className="text-center mb-8 w-full">
                  <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 font-bold transition-colors duration-300">
                    {t.priceLabel[lang]}
                  </p>
                  
                  {/* Prices */}
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-lg text-zinc-400 dark:text-zinc-500 line-through font-medium decoration-[#E62B1E]/60 decoration-2 transition-colors duration-300">
                      {t.oldPrice[lang]}
                    </span>
                    <span className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight transition-colors duration-300">
                      {t.price[lang]}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <a
                  href="https://t.me/TEDxSergeliBot?start=ticket"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-[#E62B1E] text-white text-base md:text-lg font-bold rounded-xl hover:bg-[#c52319] transition-all duration-300 hover:-translate-y-1 shadow-[0_0_20px_rgba(230,43,30,0.3)] hover:shadow-[0_0_30px_rgba(230,43,30,0.5)] group"
                >
                  <Send size={20} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                  {t.ctaBtn[lang]}
                </a>
              </div>

            </div>

          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
