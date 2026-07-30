import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import AnimatedSection from './AnimatedSection';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

function SpeakerCard({ name, topic, index }: { name: string; topic: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-ted-bg-card border border-ted-border">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl md:text-6xl font-black text-ted-text/[0.05] select-none">
            TBA
          </span>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="h-0.5 w-8 bg-ted-red mb-3 group-hover:w-12 transition-all duration-300" />
          <h3 className="text-ted-text font-bold text-lg">{name}</h3>
          <p className="text-ted-text-secondary text-sm mt-1">{topic}</p>
        </div>
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-ted-red/20 rounded-lg transition-all duration-300" />
      </div>
    </motion.div>
  );
}

export default function Speakers() {
  const { lang } = useLang();
  const t = translations.speakers;

  return (
    <section id="speakers" className="py-24 md:py-32 bg-ted-bg-alt relative">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-ted-red/[0.03] rounded-full blur-[100px] -translate-x-1/2" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <AnimatedSection>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
            <div>
              <span className="text-ted-red text-sm font-semibold tracking-[0.2em] uppercase">
                {t.label[lang]}
              </span>
              <h2 className="mt-4 text-3xl md:text-5xl lg:text-6xl font-black text-ted-text">
                {t.titleStart[lang]} <span className="text-ted-red">{t.titleAccent[lang]}</span>
              </h2>
            </div>
            <p className="text-ted-text-secondary max-w-md text-lg">
              {t.subtitle[lang]}
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SpeakerCard key={i} name={t.tba[lang]} topic={t.topic[lang]} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
