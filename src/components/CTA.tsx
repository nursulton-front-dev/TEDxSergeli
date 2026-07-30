import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

export default function CTA() {
  const { lang } = useLang();
  const t = translations.cta;
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const cards = [t.cards.speaker, t.cards.volunteer, t.cards.attendee];

  return (
    <section id="apply" className="py-24 md:py-32 bg-ted-bg-alt relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(235,0,40,0.04)_0%,_transparent_60%)]" />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto px-6 relative z-10 text-center"
      >
        <span className="text-ted-red text-sm font-semibold tracking-[0.2em] uppercase">
          {t.label[lang]}
        </span>
        <h2 className="mt-4 text-3xl md:text-5xl lg:text-6xl font-black text-ted-text leading-tight">
          {t.titleStart[lang]}
          <span className="text-ted-red"> {t.titleAccent[lang]}</span>
        </h2>
        <p className="mt-6 text-ted-text-secondary text-lg max-w-2xl mx-auto">
          {t.subtitle[lang]}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://forms.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 bg-ted-red text-white font-semibold rounded hover:bg-ted-red-dark transition-all duration-300 hover:shadow-lg hover:shadow-ted-red/20"
          >
            {t.speakerBtn[lang]}
          </a>
          <a
            href="https://forms.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3.5 border border-ted-border text-ted-text font-medium rounded hover:border-ted-red hover:text-ted-red transition-all duration-300"
          >
            {t.volunteerBtn[lang]}
          </a>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6"
        >
          {cards.map((card) => (
            <div
              key={card.title[lang]}
              className="p-6 rounded-lg bg-white border border-ted-border hover:border-ted-red/20 hover:shadow-md transition-all duration-300 text-left"
            >
              <h3 className="text-ted-text font-bold text-lg mb-2">{card.title[lang]}</h3>
              <p className="text-ted-text-secondary text-sm">{card.desc[lang]}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
