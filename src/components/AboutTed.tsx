import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';
import AnimatedSection from './AnimatedSection';

export default function AboutTed() {
  const { lang } = useLang();
  const t = translations.aboutTed;

  return (
    <section className="py-24 md:py-32 bg-ted-bg relative overflow-hidden">
      {/* Subtle red background glow to match AboutEvent style */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-ted-red/[0.03] rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-ted-red/[0.02] rounded-full blur-[100px] translate-y-1/3 translate-x-1/3 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <AnimatedSection>
          {/* Section: About TEDx */}
          <div className="mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-ted-red mb-8 leading-tight">
              {t.aboutTedxTitle[lang]}
            </h2>
            <div className="pl-6 md:pl-8 border-l-4 border-ted-red/30">
              <p className="text-ted-text-secondary text-lg md:text-xl leading-relaxed">
                {t.aboutTedxDesc[lang]}
              </p>
            </div>
          </div>
          
          {/* Section: About TED */}
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-ted-red mb-8 leading-tight">
              {t.aboutTedTitle[lang]}
            </h2>
            <div className="space-y-6 pl-6 md:pl-8 border-l-4 border-ted-red/30">
              <p className="text-ted-text-secondary text-lg md:text-xl leading-relaxed">
                {t.aboutTedDesc1[lang]}
              </p>
              <p className="text-ted-text-secondary text-lg md:text-xl leading-relaxed">
                {t.aboutTedDesc2[lang]}
              </p>
            </div>
          </div>

          {/* Social Links */}
          <div className="mt-16 pt-10 border-t border-ted-border flex flex-col items-center justify-center gap-8 text-center">
            <h3 className="text-lg font-bold text-ted-text uppercase tracking-wider">{t.follow[lang]}</h3>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-ted-text-secondary font-medium">
              <a href="http://www.facebook.com/TED" target="_blank" rel="noopener noreferrer" className="hover:text-ted-red transition-colors flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-ted-bg-alt border border-ted-border flex items-center justify-center group-hover:border-ted-red/30 group-hover:bg-ted-red/5 transition-all">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                </div>
                <span className="text-sm">Facebook</span>
              </a>
              
              <a href="https://instagram.com/ted" target="_blank" rel="noopener noreferrer" className="hover:text-ted-red transition-colors flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-ted-bg-alt border border-ted-border flex items-center justify-center group-hover:border-ted-red/30 group-hover:bg-ted-red/5 transition-all">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </div>
                <span className="text-sm">Instagram</span>
              </a>

              <a href="https://www.linkedin.com/company/ted-conferences" target="_blank" rel="noopener noreferrer" className="hover:text-ted-red transition-colors flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-ted-bg-alt border border-ted-border flex items-center justify-center group-hover:border-ted-red/30 group-hover:bg-ted-red/5 transition-all">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </div>
                <span className="text-sm">LinkedIn</span>
              </a>

              <a href="https://www.tiktok.com/@tedtoks?lang=en" target="_blank" rel="noopener noreferrer" className="hover:text-ted-red transition-colors flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-ted-bg-alt border border-ted-border flex items-center justify-center group-hover:border-ted-red/30 group-hover:bg-ted-red/5 transition-all">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.78-1.15 5.54-3.33 7.39-2.2 1.85-5.36 2.4-8.08 1.48-2.67-.89-4.87-3.1-5.3-5.87-.4-2.61.27-5.4 2.02-7.24 1.71-1.78 4.31-2.58 6.74-2.18.05 1.34.02 2.68.04 4.02-1.2-.1-2.5.09-3.52.7-1.14.65-1.92 1.93-1.96 3.26-.06 1.49.77 2.98 2.08 3.63 1.25.6 2.77.56 3.93-.15 1.37-.8 2.1-2.39 2.15-3.95.12-6.02.05-12.04.09-18.06z"/></svg>
                </div>
                <span className="text-sm">TikTok</span>
              </a>

              <a href="http://twitter.com/TEDTalks" target="_blank" rel="noopener noreferrer" className="hover:text-ted-red transition-colors flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-ted-bg-alt border border-ted-border flex items-center justify-center group-hover:border-ted-red/30 group-hover:bg-ted-red/5 transition-all">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </div>
                <span className="text-sm">X</span>
              </a>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
