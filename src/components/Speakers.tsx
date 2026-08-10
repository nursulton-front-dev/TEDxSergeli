import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { User, HelpCircle, X, ChevronRight, Sparkles } from 'lucide-react';
import AnimatedSection from './AnimatedSection';
import { useLang } from '../i18n/LanguageContext';
import { translations, type Lang } from '../i18n/translations';

interface SpeakerItem {
  id: string;
  name: Record<Lang, string>;
  title: Record<Lang, string>;
  bio: Record<Lang, string>;
  image: string;
}

function SpeakerCard({
  speaker,
  index,
  onSelect,
}: {
  speaker: SpeakerItem;
  index: number;
  onSelect: (speaker: SpeakerItem) => void;
}) {
  const { lang } = useLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const t = translations.speakers;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative cursor-pointer h-full"
      onClick={() => onSelect(speaker)}
    >
      <div className="relative h-full flex flex-col rounded-2xl overflow-hidden bg-gradient-to-b from-ted-bg-card to-ted-bg border border-ted-border hover:border-ted-red/40 shadow-sm hover:shadow-xl hover:shadow-ted-red/5 transition-all duration-500">
        {/* Image Container */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-ted-bg-alt">
          <img
            src={speaker.image}
            alt={speaker.name[lang]}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ted-bg-card via-transparent to-transparent opacity-80" />
          
          <div className="absolute top-3 left-3 px-3 py-1 bg-ted-red/90 text-white font-bold text-xs uppercase tracking-wider rounded-full backdrop-blur-md flex items-center gap-1 shadow-md">
            <Sparkles size={12} />
            <span>TEDx Speaker</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-ted-text font-black text-xl md:text-2xl leading-tight group-hover:text-ted-red transition-colors duration-300">
              {speaker.name[lang]}
            </h3>
            <p className="text-ted-red font-semibold text-sm mt-1.5 line-clamp-2">
              {speaker.title[lang]}
            </p>
            <p className="text-ted-text-secondary text-xs md:text-sm mt-3 line-clamp-3 leading-relaxed">
              {speaker.bio[lang]}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-ted-border/60 flex items-center justify-between text-ted-red font-semibold text-sm group-hover:translate-x-1 transition-transform duration-300">
            <span>{t.readBio[lang]}</span>
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TeaserCard({ role, topic, index }: { role: string; topic: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative h-full"
    >
      <div className="relative h-full aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-ted-bg-card to-ted-bg border border-ted-border shadow-sm flex flex-col justify-between p-6">
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity duration-500 text-ted-text">
          <User size={110} strokeWidth={1.5} />
          <HelpCircle size={36} className="absolute mt-10 ml-10 text-ted-red" />
        </div>
        
        <div className="relative z-10 flex justify-between items-center">
          <span className="text-xs uppercase font-bold tracking-widest text-ted-text-secondary/70 bg-ted-bg-alt/80 px-2.5 py-1 rounded border border-ted-border">
            TBA
          </span>
        </div>

        <div className="relative z-10">
          <div className="h-0.5 w-8 bg-ted-red mb-3 group-hover:w-full transition-all duration-500" />
          <h3 className="text-ted-text font-black text-lg leading-tight">{role}</h3>
          <p className="text-ted-text-secondary text-xs mt-1 font-medium">{topic}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Speakers() {
  const { lang } = useLang();
  const t = translations.speakers;
  const [selectedSpeaker, setSelectedSpeaker] = useState<SpeakerItem | null>(null);

  useEffect(() => {
    if (!selectedSpeaker) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSpeaker(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedSpeaker]);

  return (
    <section id="speakers" className="py-24 md:py-32 bg-ted-bg-alt relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-ted-red/[0.03] rounded-full blur-[100px] -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-ted-red/[0.02] rounded-full blur-[120px] translate-x-1/3" />

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
            <p className="text-ted-text-secondary max-w-md text-base md:text-lg">
              {t.subtitle[lang]}
            </p>
          </div>
        </AnimatedSection>

        {/* Real Speakers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {t.list.map((speaker, i) => (
            <SpeakerCard
              key={speaker.id}
              speaker={speaker}
              index={i}
              onSelect={(s) => setSelectedSpeaker(s)}
            />
          ))}
        </div>

        {/* Upcoming Speakers Teasers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {t.teasers.map((teaser, i) => (
            <TeaserCard
              key={i}
              role={teaser[lang]}
              topic={t.tba[lang]}
              index={t.list.length + i}
            />
          ))}
        </div>
      </div>

      {/* Speaker Bio Modal */}
      <AnimatePresence>
        {selectedSpeaker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 overflow-y-auto"
          >
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setSelectedSpeaker(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full max-w-2xl bg-ted-bg border border-ted-border rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setSelectedSpeaker(null)}
                aria-label={t.closeModal[lang]}
                className="absolute top-4 right-4 z-20 p-2 bg-ted-bg/80 border border-ted-border text-ted-text hover:text-ted-red hover:bg-ted-bg-alt rounded-full transition-colors backdrop-blur-md"
              >
                <X size={20} />
              </button>

              <div className="overflow-y-auto p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
                  <img
                    src={selectedSpeaker.image}
                    alt={selectedSpeaker.name[lang]}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover border-2 border-ted-red/20 shadow-lg flex-shrink-0"
                  />
                  <div className="text-center sm:text-left">
                    <span className="inline-block px-3 py-1 bg-ted-red/10 text-ted-red font-bold text-xs uppercase tracking-wider rounded-full mb-3">
                      TEDx Speaker
                    </span>
                    <h3 className="text-2xl md:text-3xl font-black text-ted-text">
                      {selectedSpeaker.name[lang]}
                    </h3>
                    <p className="text-ted-red font-semibold text-base mt-2">
                      {selectedSpeaker.title[lang]}
                    </p>
                  </div>
                </div>

                <div className="border-t border-ted-border pt-6">
                  <h4 className="text-xs uppercase font-bold text-ted-text-secondary tracking-wider mb-3">
                    {t.readBio[lang]}
                  </h4>
                  <p className="text-ted-text text-base leading-relaxed whitespace-pre-line">
                    {selectedSpeaker.bio[lang]}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
