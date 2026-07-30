import AnimatedSection from './AnimatedSection';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

export default function WhatIsTedx() {
  const { lang } = useLang();
  const t = translations.whatIsTedx;

  return (
    <section className="py-24 md:py-32 bg-ted-bg-alt">
      <div className="max-w-4xl mx-auto px-6">
        <AnimatedSection>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-ted-red/40 to-transparent" />
            <h2 className="text-sm font-semibold tracking-[0.2em] uppercase text-ted-red">
              {t.title[lang]}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-l from-ted-red/40 to-transparent" />
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <p className="text-lg md:text-xl leading-relaxed text-ted-text-secondary text-center">
            {t.description[lang]}
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="mt-10 text-center">
            <a
              href="https://www.ted.com/tedx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-ted-red hover:text-ted-red-dark transition-colors text-sm font-medium group"
            >
              {t.link[lang]}
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
