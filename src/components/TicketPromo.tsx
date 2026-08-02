import { CreditCard, Send, Sparkles } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';
import AnimatedSection from './AnimatedSection';

export default function TicketPromo() {
  const { lang } = useLang();
  const t = translations.tickets;

  return (
    <section id="tickets" className="py-24 md:py-32 bg-ted-bg relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-ted-red/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <AnimatedSection>
          <div className="relative group">
            
            {/* The Ticket Card */}
            <div className="bg-ted-bg-card rounded-3xl p-1 border border-ted-border shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-ted-red/30">
              
              {/* Inner wrapper for the border glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-ted-red/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="bg-ted-bg rounded-[1.4rem] p-8 md:p-12 relative z-10 overflow-hidden">
                
                {/* Decorative cutouts for ticket look */}
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-ted-bg rounded-full border border-ted-border border-l-0 shadow-[inset_-4px_0_10px_rgba(0,0,0,0.1)]" />
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-ted-bg rounded-full border border-ted-border border-r-0 shadow-[inset_4px_0_10px_rgba(0,0,0,0.1)]" />
                {/* Dashed line down the middle (hidden on small screens) */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-ted-border/50 hidden lg:block" />

                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                  
                  {/* Left side: Information */}
                  <div className="space-y-8 text-center lg:text-left relative">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ted-red/10 text-ted-red text-sm font-bold tracking-[0.2em] uppercase">
                      <Sparkles size={16} />
                      Premium Ticket
                    </div>
                    
                    <div>
                      <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-ted-text mb-6 leading-[1.1]">
                        {t.title[lang]}
                      </h2>
                      <p className="text-ted-text-secondary text-lg md:text-xl leading-relaxed">
                        {t.desc[lang]}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Price and Action */}
                  <div className="flex flex-col items-center justify-center space-y-8 relative">
                    <div className="w-full max-w-sm p-6 rounded-2xl bg-gradient-to-br from-ted-bg-alt to-ted-bg border border-ted-border/50 shadow-inner">
                      <div className="flex items-center gap-4 mb-4 text-ted-text-secondary">
                        <CreditCard size={24} className="text-ted-red" />
                        <span className="text-sm font-bold tracking-widest uppercase">{t.priceLabel[lang]}</span>
                      </div>
                      <div className="text-4xl md:text-5xl font-black text-ted-text font-mono tracking-tight">
                        {t.price[lang]}
                      </div>
                    </div>

                    <a
                      href="https://t.me/TEDxSergeliBot?start=ticket"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-3 w-full max-w-sm px-8 py-5 bg-ted-red text-white text-lg font-bold rounded-xl hover:bg-ted-red-dark transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(235,0,40,0.5)] group"
                    >
                      <Send size={20} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                      {t.ctaBtn[lang]}
                    </a>
                  </div>

                </div>
              </div>
            </div>
            
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
