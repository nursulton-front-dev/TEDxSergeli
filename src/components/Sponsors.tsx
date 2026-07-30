import AnimatedSection from './AnimatedSection';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

export default function Sponsors() {
  const { lang } = useLang();
  const t = translations.sponsors;

  const tiers = [
    { name: t.gold[lang], count: 2, size: 'w-48 h-28 md:w-56 md:h-32' },
    { name: t.silver[lang], count: 3, size: 'w-40 h-24 md:w-44 md:h-28' },
    { name: t.bronze[lang], count: 4, size: 'w-32 h-20 md:w-36 md:h-24' },
  ];

  return (
    <section id="sponsors" className="py-24 md:py-32 bg-white relative">
      <div className="max-w-6xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-ted-red text-sm font-semibold tracking-[0.2em] uppercase">
              {t.label[lang]}
            </span>
            <h2 className="mt-4 text-3xl md:text-5xl lg:text-6xl font-black text-ted-text">
              {t.titleStart[lang]} <span className="text-ted-red">{t.titleAccent[lang]}</span>
            </h2>
            <p className="mt-4 text-ted-text-secondary text-lg max-w-xl mx-auto">
              {t.subtitle[lang]}
            </p>
          </div>
        </AnimatedSection>

        <div className="space-y-16">
          {tiers.map((tier, tierIndex) => (
            <AnimatedSection key={tier.name} delay={tierIndex * 0.15}>
              <div>
                <h3 className="text-center text-sm font-semibold tracking-[0.15em] uppercase text-ted-text-secondary mb-8">
                  {tier.name}
                </h3>
                <div className="flex flex-wrap items-center justify-center gap-6">
                  {Array.from({ length: tier.count }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-center rounded-lg border border-ted-border bg-ted-bg-alt hover:border-ted-red/30 transition-all duration-300 ${tier.size}`}
                    >
                      <span className="text-ted-text-secondary/30 text-xs font-medium tracking-wider uppercase">
                        {t.logoPlaceholder[lang]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.4}>
          <div className="mt-16 text-center">
            <a
              href="#apply"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-ted-red text-ted-red font-semibold rounded hover:bg-ted-red hover:text-white transition-all duration-300"
            >
              {t.becomeBtn[lang]}
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
