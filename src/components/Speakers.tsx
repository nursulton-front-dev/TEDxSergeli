import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { User, HelpCircle } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

function SpeakerCard({ role, topic, index }: { role: string; topic: string; index: number }) {
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
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-ted-bg-card to-ted-bg border border-ted-border shadow-sm">
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity duration-500 text-ted-text">
          <User size={120} strokeWidth={1.5} />
          <HelpCircle size={40} className="absolute mt-12 ml-12 text-ted-red" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ted-bg/90 via-ted-bg/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="h-0.5 w-8 bg-ted-red mb-4 group-hover:w-full transition-all duration-500" />
          <h3 className="text-ted-text font-black text-xl leading-tight">{role}</h3>
          <p className="text-ted-text-secondary text-sm mt-2 font-medium">{topic}</p>
        </div>
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-ted-red/20 rounded-xl transition-all duration-300" />
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
          {t.teasers.map((teaser, i) => (
            <SpeakerCard key={i} role={teaser[lang]} topic={t.tba[lang]} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
