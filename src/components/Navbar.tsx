import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { translations, type Lang } from '../i18n/translations';

const langLabels: Record<Lang, string> = { uz: 'UZ', ru: 'RU', en: 'EN' };
const langOrder: Lang[] = ['uz', 'ru', 'en'];

export default function Navbar() {
  const { lang, setLang } = useLang();
  const t = translations.nav;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { name: t.home[lang], href: '#home' },
    { name: t.about[lang], href: '#about' },
    { name: t.speakers[lang], href: '#speakers' },
    { name: t.schedule[lang], href: '#schedule' },
    { name: t.team[lang], href: '#team' },
    { name: t.sponsors[lang], href: '#sponsors' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md shadow-lg shadow-black/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <a href="#home" className="flex-shrink-0">
              <img
                src="/tedx-logo-black.png"
                alt="TEDxSergeli"
                className="h-8 md:h-10 w-auto"
              />
            </a>

            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-ted-text-secondary hover:text-ted-text transition-colors duration-200 relative group"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-ted-red group-hover:w-6 transition-all duration-300" />
                </a>
              ))}

              <div className="ml-3 flex items-center border border-ted-border rounded overflow-hidden">
                {langOrder.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      lang === l
                        ? 'bg-ted-red text-white'
                        : 'text-ted-text-secondary hover:text-ted-text'
                    }`}
                  >
                    {langLabels[l]}
                  </button>
                ))}
              </div>

              <a
                href="#apply"
                className="ml-3 px-6 py-2.5 bg-ted-red text-white text-sm font-semibold rounded hover:bg-ted-red-dark transition-colors duration-200"
              >
                {t.apply[lang]}
              </a>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex items-center border border-ted-border rounded overflow-hidden">
                {langOrder.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2 py-1 text-[10px] font-semibold transition-colors ${
                      lang === l
                        ? 'bg-ted-red text-white'
                        : 'text-ted-text-secondary hover:text-ted-text'
                    }`}
                  >
                    {langLabels[l]}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setMobileOpen(true)}
                className="p-2 text-ted-text hover:text-ted-red transition-colors"
                aria-label="Open menu"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute right-0 top-0 bottom-0 w-[300px] bg-white border-l border-ted-border flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-6">
                <img src="/tedx-logo-black.png" alt="TEDxSergeli" className="h-7" />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-ted-text hover:text-ted-red transition-colors"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex flex-col px-6 gap-1 flex-1">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="py-3 text-lg text-ted-text-secondary hover:text-ted-red hover:pl-2 transition-all duration-200 border-b border-ted-border/50"
                  >
                    {link.name}
                  </motion.a>
                ))}
                <motion.a
                  href="#apply"
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 px-6 py-3 bg-ted-red text-white text-center font-semibold rounded hover:bg-ted-red-dark transition-colors"
                >
                  {t.apply[lang]}
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
