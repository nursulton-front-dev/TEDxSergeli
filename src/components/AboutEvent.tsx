import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import AnimatedSection from './AnimatedSection';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

function Counter({ value, label, index }: { value: string; label: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
      className="text-center"
    >
      <div className="text-3xl md:text-5xl font-black text-ted-red mb-2">{value}</div>
      <div className="text-sm text-ted-text-secondary uppercase tracking-wider">{label}</div>
    </motion.div>
  );
}

export default function AboutEvent() {
  const { lang } = useLang();
  const t = translations.about;

  const stats = [
    { value: '100+', label: t.stats.attendees[lang] },
    { value: '10+', label: t.stats.speakers[lang] },
    { value: '1', label: t.stats.day[lang] },
    { value: '∞', label: t.stats.ideas[lang] },
  ];

  return (
    <section id="about" className="py-24 md:py-32 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ted-red/[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <AnimatedSection>
          <span className="text-ted-red text-sm font-semibold tracking-[0.2em] uppercase">
            {t.label[lang]}
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl lg:text-6xl font-black text-ted-text leading-tight max-w-3xl">
            {t.titleStart[lang]}
            <span className="text-ted-red"> {t.titleAccent[lang]}</span>
          </h2>
        </AnimatedSection>

        <div className="mt-16 grid md:grid-cols-2 gap-12 items-center">
          <AnimatedSection delay={0.1}>
            <div className="space-y-6">
              <p className="text-ted-text-secondary text-lg leading-relaxed">
                {t.desc1[lang]}
              </p>
              <p className="text-ted-text-secondary text-lg leading-relaxed">
                {t.desc2[lang]}
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="relative">
              <div className="aspect-video rounded-lg bg-ted-bg-alt border border-ted-border overflow-hidden flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full border-2 border-ted-red/30 flex items-center justify-center mx-auto mb-4">
                    <div
                      className="ml-1"
                      style={{
                        width: 0,
                        height: 0,
                        borderTop: '8px solid transparent',
                        borderLeft: '14px solid #EB0028',
                        borderBottom: '8px solid transparent',
                      }}
                    />
                  </div>
                  <p className="text-ted-text-secondary text-sm">{t.videoTeaser[lang]}</p>
                </div>
              </div>
              <div className="absolute -bottom-3 -right-3 w-full h-full border border-ted-red/15 rounded-lg -z-10" />
            </div>
          </AnimatedSection>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <Counter key={stat.label} value={stat.value} label={stat.label} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
