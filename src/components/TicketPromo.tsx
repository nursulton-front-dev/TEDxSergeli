import { Send } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';
import AnimatedSection from './AnimatedSection';

export default function TicketPromo() {
  const { lang } = useLang();
  const t = translations.tickets;

  return (
    <section id="tickets" className="py-24 md:py-32 bg-ted-bg relative">
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <AnimatedSection>
          <div className="relative mx-auto max-w-4xl">
            
            <style>{`
              .ticket-mask {
                mask-image: radial-gradient(circle at 50% 0, transparent 24px, black 25px),
                            radial-gradient(circle at 50% 100%, transparent 24px, black 25px);
                mask-composite: intersect;
                -webkit-mask-image: radial-gradient(circle at 50% 0, transparent 24px, black 25px),
                                    radial-gradient(circle at 50% 100%, transparent 24px, black 25px);
                -webkit-mask-composite: destination-in;
              }
              @media (min-width: 768px) {
                .ticket-mask {
                  mask-image: radial-gradient(circle at 0 50%, transparent 24px, black 25px),
                              radial-gradient(circle at 100% 50%, transparent 24px, black 25px);
                  mask-composite: intersect;
                  -webkit-mask-image: radial-gradient(circle at 0 50%, transparent 24px, black 25px),
                                      radial-gradient(circle at 100% 50%, transparent 24px, black 25px);
                  -webkit-mask-composite: destination-in;
                }
              }
            `}</style>

            {/* The Ticket Container */}
            <div className="ticket-mask bg-zinc-50 dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-white/10 shadow-xl shadow-zinc-200/50 dark:shadow-none relative overflow-hidden flex flex-col md:flex-row text-zinc-900 dark:text-white transition-colors duration-300">
              
              {/* Dashed line separator */}
              <div className="hidden md:block absolute top-10 bottom-10 left-[60%] w-px border-l-2 border-dashed border-zinc-200 dark:border-zinc-800 transition-colors duration-300" />
              <div className="md:hidden absolute left-10 right-10 top-[55%] h-px border-t-2 border-dashed border-zinc-200 dark:border-zinc-800 transition-colors duration-300" />

              {/* Left Side: Info */}
              <div className="p-8 md:p-12 md:w-[60%] flex flex-col justify-center">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs md:text-sm font-bold tracking-wider mb-6 w-max transition-colors duration-300">
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
                <ul className="space-y-4">
                  {t.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium md:text-lg transition-colors duration-300">
                        {feature[lang]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Side: Price & Action */}
              <div className="p-8 md:p-12 md:w-[40%] flex flex-col items-center justify-center bg-black/[0.02] dark:bg-white/[0.02] transition-colors duration-300">
                <div className="text-center mb-8 w-full">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 font-bold transition-colors duration-300">
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
                  className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-[#E62B1E] text-white text-lg font-bold rounded-xl hover:bg-[#c52319] transition-all duration-300 hover:-translate-y-1 shadow-[0_0_20px_rgba(230,43,30,0.3)] hover:shadow-[0_0_30px_rgba(230,43,30,0.5)] group"
                >
                  <Send size={22} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform duration-300" />
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
