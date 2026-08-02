import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

export default function Footer() {
  const { lang } = useLang();
  const t = translations.footer;
  const navT = translations.nav;

  const navLinks = [
    { name: navT.home[lang], href: '#home' },
    { name: navT.about[lang], href: '#about' },
    { name: navT.speakers[lang], href: '#speakers' },
    { name: navT.schedule[lang], href: '#schedule' },
    { name: navT.team[lang], href: '#team' },
  ];

  const socials = [
    { name: 'Instagram', href: 'https://instagram.com/tedxsergeli', icon: <InstagramIcon /> },
    { name: 'Telegram', href: 'https://t.me/tedxsergeli', icon: <TelegramIcon /> },
  ];

  return (
    <footer className="relative overflow-hidden bg-ted-bg px-4 md:px-8 pt-4 pb-6 md:pt-6 md:pb-10">
      <div
        className="absolute left-1/2 bottom-0 -translate-x-1/2 w-full max-w-4xl h-[85%] bg-ted-red/25 blur-[110px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto rounded-[1.75rem] md:rounded-[3rem] bg-gradient-to-br from-ted-red-dark to-ted-red overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/20">
        <div className="px-6 md:px-12 lg:px-16 pt-8 md:pt-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 md:pb-10 border-b border-white/15">
            <img src="/tedx-logo-white.png" alt="TEDxSergeli" className="h-12 md:h-14 w-auto" />
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-white/80 text-sm font-medium hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </nav>
          </div>

          <div className="py-12 md:py-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            <div className="max-w-xl">
              <h3 className="text-white text-3xl md:text-4xl lg:text-5xl font-black leading-tight mb-5">
                {t.headline[lang]}
              </h3>
              <p className="text-white/75 text-base md:text-lg leading-relaxed">
                {t.desc[lang]}
              </p>
            </div>

            <div className="flex items-center gap-4 md:gap-5">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-28 md:w-32 flex flex-col items-center gap-2.5 py-5 md:py-6 rounded-2xl bg-white/10 border border-white/15 text-white hover:bg-white/20 hover:border-white/25 transition-all duration-300"
                >
                  {social.icon}
                  <span className="text-sm font-medium">{social.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 px-6 md:px-12 lg:px-16 py-6 md:py-7 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/50 text-xs text-center md:text-left">
            {t.license[lang]}
          </p>
          <div className="flex items-center gap-3 text-xs">
            <a
              href="mailto:tedxsergeli@gmail.com"
              className="text-white/70 hover:text-white transition-colors"
            >
              tedxsergeli@gmail.com
            </a>
            <span className="text-white/30">·</span>
            <span className="text-white/50">&copy; {new Date().getFullYear()} TEDxSergeli</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
