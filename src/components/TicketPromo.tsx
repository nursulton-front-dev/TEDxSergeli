import { Ticket, CreditCard, Send } from 'lucide-react';
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
            
            {/* The Ticket Container */}
            <div className="bg-ted-bg-card rounded-[2rem] border border-ted-border shadow-xl relative overflow-hidden flex flex-col md:flex-row">
              
              {/* Left Cutout */}
              <div className="hidden md:block absolute top-1/2 -left-6 -translate-y-1/2 w-12 h-12 bg-ted-bg rounded-full border border-ted-border border-l-0 shadow-[inset_-3px_0_6px_rgba(0,0,0,0.05)]" />
              
              {/* Right Cutout */}
              <div className="hidden md:block absolute top-1/2 -right-6 -translate-y-1/2 w-12 h-12 bg-ted-bg rounded-full border border-ted-border border-r-0 shadow-[inset_3px_0_6px_rgba(0,0,0,0.05)]" />

              {/* Top/Bottom cutouts for mobile */}
              <div className="md:hidden absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-ted-bg rounded-full border border-ted-border border-t-0" />
              <div className="md:hidden absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-ted-bg rounded-full border border-ted-border border-b-0" />

              {/* Dashed line separator */}
              <div className="hidden md:block absolute top-8 bottom-8 left-[60%] w-px border-l-2 border-dashed border-ted-border/50" />
              <div className="md:hidden absolute left-8 right-8 top-[55%] h-px border-t-2 border-dashed border-ted-border/50" />

              {/* Left Side: Info */}
              <div className="p-10 md:p-14 md:w-[60%] flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ted-red/10 text-ted-red text-sm font-bold tracking-wide uppercase mb-6 w-max">
                  <Ticket size={16} />
                  Tickets
                </div>
                
                <h2 className="text-3xl md:text-5xl font-black text-ted-text mb-4 leading-tight">
                  {t.title[lang]}
                </h2>
                
                <p className="text-ted-text-secondary text-lg leading-relaxed">
                  {t.desc[lang]}
                </p>
              </div>

              {/* Right Side: Price & Action */}
              <div className="p-10 md:p-14 md:w-[40%] flex flex-col items-center justify-center bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="text-center mb-8">
                  <p className="text-sm text-ted-text-secondary uppercase tracking-wider mb-2 font-medium">
                    {t.priceLabel[lang]}
                  </p>
                  <p className="text-4xl font-black text-ted-text">
                    {t.price[lang]}
                  </p>
                </div>

                <a
                  href="https://t.me/TEDxSergeliBot?start=ticket"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-ted-red text-white text-lg font-bold rounded-xl hover:bg-ted-red-dark transition-all hover:-translate-y-1 hover:shadow-lg group"
                >
                  <Send size={20} className="group-hover:animate-pulse" />
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
