import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export default function Footer() {
  const { lang } = useLang();
  const t = translations.footer;
  const navT = translations.nav;

  const navLinks = [
    { name: navT.about[lang], href: '#about' },
    { name: navT.speakers[lang], href: '#speakers' },
    { name: navT.schedule[lang], href: '#schedule' },
    { name: navT.team[lang], href: '#team' },
    { name: navT.sponsors[lang], href: '#sponsors' },
  ];

  return (
    <footer className="bg-ted-bg-alt border-t border-ted-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <img src="/tedx-logo-black.png" alt="TEDxSergeli" className="h-8 mb-4" />
            <p className="text-ted-text-secondary text-sm leading-relaxed">
              {t.desc[lang]}
            </p>
          </div>

          <div>
            <h4 className="text-ted-text font-semibold mb-4 text-sm uppercase tracking-wider">
              {t.links[lang]}
            </h4>
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-ted-text-secondary text-sm hover:text-ted-red transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="text-ted-text font-semibold mb-4 text-sm uppercase tracking-wider">
              {t.contact[lang]}
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:tedxsergeli@gmail.com"
                className="text-ted-text-secondary text-sm hover:text-ted-red transition-colors"
              >
                tedxsergeli@gmail.com
              </a>
              <div className="flex items-center gap-3 mt-2">
                <a
                  href="https://instagram.com/tedxsergeli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-ted-border flex items-center justify-center text-ted-text-secondary hover:text-ted-red hover:border-ted-red/30 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <InstagramIcon />
                </a>
                <a
                  href="https://t.me/tedxsergeli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-ted-border flex items-center justify-center text-ted-text-secondary hover:text-ted-red hover:border-ted-red/30 transition-all duration-300"
                  aria-label="Telegram"
                >
                  <TelegramIcon />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-ted-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-ted-text-secondary/70 text-xs text-center md:text-left">
            {t.license[lang]}
          </p>
          <p className="text-ted-text-secondary/50 text-xs">
            &copy; {new Date().getFullYear()} TEDxSergeli
          </p>
        </div>
      </div>
    </footer>
  );
}
