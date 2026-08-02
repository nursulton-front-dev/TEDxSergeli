import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Clock, CreditCard, Send } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';
import AnimatedSection from './AnimatedSection';

export default function TicketPromo() {
  const { lang } = useLang();
  const t = translations.tickets;

  // Set the event date (e.g., September 4, 2026)
  const targetDate = new Date('2026-09-04T10:00:00+05:00').getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <section id="tickets" className="py-24 md:py-32 bg-ted-bg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ted-red/[0.04] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-ted-red/[0.03] rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <AnimatedSection>
          <div className="bg-ted-bg-card rounded-[2rem] p-8 md:p-12 border border-ted-border shadow-2xl relative overflow-hidden">
            
            {/* Top decorative badge */}
            <div className="absolute top-0 right-10 w-24 h-32 bg-ted-red/10 rounded-b-full blur-2xl" />

            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              
              {/* Left Column: Text & CTA */}
              <div className="space-y-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ted-red/10 text-ted-red text-sm font-bold tracking-wide uppercase mb-6">
                    <Ticket size={16} />
                    Tickets
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-ted-text mb-4 leading-tight">
                    {t.title[lang]}
                  </h2>
                  <p className="text-ted-text-secondary text-lg leading-relaxed border-l-4 border-ted-red/30 pl-4 italic">
                    {t.desc[lang]}
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-ted-bg border border-ted-border">
                  <div className="w-12 h-12 rounded-full bg-ted-red/10 flex items-center justify-center text-ted-red">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-ted-text-secondary uppercase tracking-wider">{t.priceLabel[lang]}</p>
                    <p className="text-2xl font-black text-ted-text">{t.price[lang]}</p>
                  </div>
                </div>

                <a
                  href="https://t.me/TEDxSergeliBot?start=ticket"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 w-full md:w-auto px-8 py-4 bg-ted-red text-white font-bold rounded-xl hover:bg-ted-red-dark transition-all hover:-translate-y-1 hover:shadow-xl shadow-ted-red/20 group"
                >
                  <Send size={20} className="group-hover:animate-pulse" />
                  {t.ctaBtn[lang]}
                </a>
              </div>

              {/* Right Column: Countdown Timer */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-full aspect-square max-w-[400px] rounded-full border-[8px] border-ted-bg bg-gradient-to-br from-ted-bg-alt to-ted-bg-card shadow-2xl flex flex-col items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border border-ted-border border-dashed animate-[spin_60s_linear_infinite] opacity-50" />
                  
                  <Clock size={32} className="text-ted-red mb-6" />
                  
                  <div className="grid grid-cols-2 gap-4 md:gap-6 text-center">
                    <div>
                      <div className="text-4xl md:text-5xl font-black text-ted-text font-mono">{String(timeLeft.days).padStart(2, '0')}</div>
                      <div className="text-sm font-medium text-ted-text-secondary uppercase tracking-wider mt-1">{t.time.days[lang]}</div>
                    </div>
                    <div>
                      <div className="text-4xl md:text-5xl font-black text-ted-text font-mono">{String(timeLeft.hours).padStart(2, '0')}</div>
                      <div className="text-sm font-medium text-ted-text-secondary uppercase tracking-wider mt-1">{t.time.hours[lang]}</div>
                    </div>
                    <div>
                      <div className="text-4xl md:text-5xl font-black text-ted-text font-mono">{String(timeLeft.minutes).padStart(2, '0')}</div>
                      <div className="text-sm font-medium text-ted-text-secondary uppercase tracking-wider mt-1">{t.time.minutes[lang]}</div>
                    </div>
                    <div>
                      <div className="text-4xl md:text-5xl font-black text-ted-red font-mono">{String(timeLeft.seconds).padStart(2, '0')}</div>
                      <div className="text-sm font-medium text-ted-text-secondary uppercase tracking-wider mt-1">{t.time.seconds[lang]}</div>
                    </div>
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
