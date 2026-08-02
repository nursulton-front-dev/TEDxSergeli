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
            
            {/* The Ticket Container */}
            <div className="bg-[#0A0A0A] rounded-[24px] border border-white/10 shadow-2xl shadow-black/50 relative overflow-hidden flex flex-col md:flex-row text-white">
              
              {/* Left Cutout */}
              <div className="hidden md:block absolute top-1/2 -left-6 -translate-y-1/2 w-12 h-12 bg-ted-bg rounded-full border border-white/10 border-l-0 shadow-[inset_-3px_0_6px_rgba(0,0,0,0.2)]" />
              
              {/* Right Cutout */}
              <div className="hidden md:block absolute top-1/2 -right-6 -translate-y-1/2 w-12 h-12 bg-ted-bg rounded-full border border-white/10 border-r-0 shadow-[inset_3px_0_6px_rgba(0,0,0,0.2)]" />

              {/* Top/Bottom cutouts for mobile */}
              <div className="md:hidden absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-ted-bg rounded-full border border-white/10 border-t-0 shadow-[inset_0_-3px_6px_rgba(0,0,0,0.2)]" />
              <div className="md:hidden absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-ted-bg rounded-full border border-white/10 border-b-0 shadow-[inset_0_3px_6px_rgba(0,0,0,0.2)]" />

              {/* Dashed line separator */}
              <div className="hidden md:block absolute top-10 bottom-10 left-[60%] w-px border-l-2 border-dashed border-white/15" />
              <div className="md:hidden absolute left-10 right-10 top-[55%] h-px border-t-2 border-dashed border-white/15" />

              {/* Left Side: Info */}
              <div className="p-8 md:p-12 md:w-[60%] flex flex-col justify-center">
                
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ted-red/10 text-[#E62B1E] border border-ted-red/20 text-xs md:text-sm font-bold tracking-wider mb-6 w-max shadow-[0_0_15px_rgba(230,43,30,0.15)]">
                  {t.badge[lang]}
                </div>
                
                {/* Heading */}
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight tracking-tight text-white">
                  {t.title[lang]}
                </h2>
                
                {/* Subheading */}
                <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-8">
                  {t.desc[lang]}
                </p>

                {/* Features List */}
                <ul className="space-y-4">
                  {t.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <span className="text-gray-200 font-medium md:text-lg">
                        {feature[lang]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Side: Price & Action */}
              <div className="p-8 md:p-12 md:w-[40%] flex flex-col items-center justify-center bg-white/[0.02]">
                <div className="text-center mb-8 w-full">
                  <p className="text-sm text-gray-500 uppercase tracking-widest mb-3 font-bold">
                    {t.priceLabel[lang]}
                  </p>
                  
                  {/* Prices */}
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-lg text-gray-500 line-through font-medium decoration-[#E62B1E]/60 decoration-2">
                      {t.oldPrice[lang]}
                    </span>
                    <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
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
