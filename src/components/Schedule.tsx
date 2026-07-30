import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Clock } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

function ScheduleItem({ item, index, total }: {
  item: { time: string; title: string; desc: string; type: string };
  index: number;
  total: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-30px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative flex gap-4 md:gap-8"
    >
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full border-2 flex-shrink-0 z-10 ${
            item.type === 'talk'
              ? 'bg-ted-red border-ted-red'
              : item.type === 'main'
              ? 'bg-ted-text border-ted-text'
              : 'bg-transparent border-ted-border'
          }`}
        />
        {index < total - 1 && (
          <div className="w-px flex-1 bg-ted-border mt-1" />
        )}
      </div>

      <div className={`flex-1 pb-8 ${item.type === 'break' ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-ted-red font-mono text-sm font-semibold">{item.time}</span>
          {item.type === 'talk' && (
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-ted-red-light text-ted-red rounded">
              Talk
            </span>
          )}
        </div>
        <h3 className="text-ted-text font-bold text-lg group-hover:text-ted-red transition-colors">
          {item.title}
        </h3>
        <p className="text-ted-text-secondary text-sm mt-1">{item.desc}</p>
      </div>
    </motion.div>
  );
}

export default function Schedule() {
  const { lang } = useLang();
  const t = translations.schedule;

  const items = t.items.map((item) => ({
    time: item.time,
    title: item.title[lang],
    desc: item.desc[lang],
    type: item.type,
  }));

  return (
    <section id="schedule" className="py-24 md:py-32 bg-white relative">
      <div className="max-w-4xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-ted-red text-sm font-semibold tracking-[0.2em] uppercase">
              {t.label[lang]}
            </span>
            <h2 className="mt-4 text-3xl md:text-5xl lg:text-6xl font-black text-ted-text">
              {t.titleStart[lang]} <span className="text-ted-red">{t.titleAccent[lang]}</span>
            </h2>
            <div className="mt-4 flex items-center justify-center gap-2 text-ted-text-secondary">
              <Clock size={16} className="text-ted-red" />
              <span>{t.dayLabel[lang]}</span>
            </div>
          </div>
        </AnimatedSection>

        <div className="max-w-2xl mx-auto">
          {items.map((item, i) => (
            <ScheduleItem key={i} item={item} index={i} total={items.length} />
          ))}
        </div>
      </div>
    </section>
  );
}
