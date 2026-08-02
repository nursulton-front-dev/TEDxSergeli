import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';
import { Send } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function StickyCTA() {
  const { lang } = useLang();
  const t = translations.tickets;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show only if scrolled past the hero section
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-ted-bg/90 backdrop-blur-md border-t border-ted-border shadow-[0_-10px_30px_rgba(0,0,0,0.15)] transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-ted-text-secondary uppercase font-bold tracking-wider">{t.priceLabel[lang]}</span>
          <span className="text-xl font-black text-ted-text leading-none mt-1">{t.price[lang]}</span>
        </div>
        <a
          href="https://t.me/TEDxSergeliBot?start=ticket_landing"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 max-w-[200px] flex items-center justify-center gap-2 py-3.5 px-4 bg-[#E62B1E] text-white text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(230,43,30,0.4)] active:scale-95 transition-transform"
        >
          <Send size={16} />
          {lang === 'uz' ? 'Xarid qilish' : lang === 'ru' ? 'Купить билет' : 'Buy Ticket'}
        </a>
      </div>
    </div>
  );
}
