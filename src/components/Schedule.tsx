import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Clock, Coffee, Music, Sparkles, User, Video, Camera, Award, Mic, CheckCircle2, ChevronRight, X } from 'lucide-react';
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

interface ScheduleItemData {
  time: string;
  title?: Record<Lang, string>;
  desc?: Record<Lang, string>;
  type: string;
  speakerId?: string;
  name?: Record<Lang, string>;
  image?: string;
}

interface SectionData {
  id: string;
  badge: Record<Lang, string>;
  title: Record<Lang, string>;
  desc?: Record<Lang, string>;
  timeRange: string;
  items: ScheduleItemData[];
}

function SectionBadgeIcon({ id }: { id: string }) {
  switch (id) {
    case 'preshow':
      return <Clock className="w-4 h-4 text-ted-red" />;
    case 'part1':
      return <Sparkles className="w-4 h-4 text-ted-red" />;
    case 'part2':
    case 'part3':
      return <Mic className="w-4 h-4 text-ted-red" />;
    case 'break':
      return <Coffee className="w-4 h-4 text-amber-500" />;
    case 'part4':
      return <Award className="w-4 h-4 text-ted-red" />;
    default:
      return <Clock className="w-4 h-4 text-ted-red" />;
  }
}

function ScheduleItemCard({
  item,
  index,
  onSelectSpeaker,
}: {
  item: ScheduleItemData;
  index: number;
  onSelectSpeaker?: (speakerId: string) => void;
}) {
  const { lang } = useLang();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const [imgError, setImgError] = useState(false);

  const isTalk = item.type === 'talk' && item.name;
  const isBreak = item.type === 'break';
  const isPrep = item.type === 'prep';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="relative pl-6 md:pl-10 pb-8 last:pb-2 group"
    >
      {/* Timeline Node Bullet */}
      <div
        className={`absolute left-0 top-1 -translate-x-1/2 w-4 h-4 rounded-full border-2 transition-all duration-300 z-10 ${
          isTalk
            ? 'bg-ted-red border-ted-red group-hover:scale-125 group-hover:shadow-[0_0_12px_rgba(235,0,40,0.8)]'
            : isBreak
            ? 'bg-amber-500 border-amber-500 group-hover:scale-125'
            : 'bg-ted-bg border-ted-red/60 group-hover:border-ted-red'
        }`}
      />

      {/* Main Content Box */}
      {isTalk ? (
        /* Speaker Talk Card */
        <div
          onClick={() => item.speakerId && onSelectSpeaker?.(item.speakerId)}
          className="rounded-2xl bg-gradient-to-br from-ted-bg-card via-ted-bg-card/90 to-ted-bg border border-ted-border hover:border-ted-red/60 p-4 md:p-5 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-ted-red/10 cursor-pointer"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Speaker Avatar */}
            <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-ted-bg-alt flex-shrink-0 border border-ted-red/30 shadow-md">
              {!imgError && item.image ? (
                <img
                  src={item.image}
                  alt={item.name?.[lang] || ''}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-ted-red/10 text-ted-red">
                  <User size={28} />
                </div>
              )}
            </div>

            {/* Speaker Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-ted-red/10 text-ted-red border border-ted-red/20">
                    <Clock size={12} className="mr-1 inline-block" />
                    {item.time}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-ted-red text-white rounded-md shadow-xs">
                    TEDx Speaker
                  </span>
                </div>
                <span className="text-xs font-semibold text-ted-red flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  <span>{translations.schedule.bioBtn[lang]}</span>
                  <ChevronRight size={14} />
                </span>
              </div>

              <h4 className="text-ted-text font-black text-base md:text-lg leading-snug group-hover:text-ted-red transition-colors">
                {item.name?.[lang]}
              </h4>
              <p className="text-ted-text-secondary text-xs md:text-sm font-medium mt-0.5 line-clamp-2">
                {item.title?.[lang]}
              </p>
            </div>
          </div>
        </div>
      ) : isBreak ? (
        /* Break / Networking Block */
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-ted-bg-card to-ted-bg border border-amber-500/30 p-5 md:p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500 pointer-events-none">
            <Music size={80} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Clock size={12} className="mr-1 inline-block" />
                {item.time}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-black rounded-md flex items-center gap-1 font-sans">
                <Coffee size={12} />
                {translations.schedule.breakBadge[lang]}
              </span>
            </div>

            <h4 className="text-ted-text font-black text-lg md:text-xl flex items-center gap-2">
              <Music className="text-amber-400 flex-shrink-0" size={20} />
              <span>{item.title?.[lang]}</span>
            </h4>

            {item.desc?.[lang] && (
              <p className="text-amber-200/80 text-xs md:text-sm font-semibold mt-2 pl-7 flex items-center gap-1.5">
                <Clock size={14} className="text-amber-400" />
                {item.desc[lang]}
              </p>
            )}
          </div>
        </div>
      ) : isPrep ? (
        /* Pre-Show Item */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-3.5 rounded-xl bg-ted-bg-card/60 border border-ted-border/60 hover:border-ted-red/30 transition-all">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-ted-red/70 flex-shrink-0" />
            <span className="text-ted-text font-medium text-sm md:text-base">
              {item.title?.[lang]}
            </span>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold tabular-nums bg-ted-red/10 text-ted-red border border-ted-red/20 shadow-xs w-fit">
            {item.time}
          </span>
        </div>
      ) : (
        /* General Program Item (Opening/Closing) */
        <div className="rounded-xl bg-ted-bg-card border border-ted-border hover:border-ted-red/40 p-4 transition-all">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums bg-ted-red/10 text-ted-red border border-ted-red/20">
              <Clock size={12} className="mr-1 inline-block" />
              {item.time}
            </span>
            {item.time.includes('14:05') && <Video size={14} className="text-ted-red" />}
            {item.time.includes('16:20') && <Camera size={14} className="text-ted-red" />}
          </div>

          <h4 className="text-ted-text font-bold text-base md:text-lg group-hover:text-ted-red transition-colors">
            {item.title?.[lang]}
          </h4>
          {item.desc?.[lang] && (
            <p className="text-ted-text-secondary text-xs md:text-sm mt-1">
              {item.desc[lang]}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function Schedule() {
  const { lang } = useLang();
  const t = translations.schedule;
  const sections = t.sections as unknown as SectionData[];
  const allSpeakers = translations.speakers.list as unknown as SpeakerItem[];
  const [activeTab, setActiveTab] = useState<string>('all');
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

  const handleSelectSpeaker = (speakerId: string) => {
    const speaker = allSpeakers.find((s) => s.id === speakerId);
    if (speaker) {
      setSelectedSpeaker(speaker);
    }
  };

  const filteredSections = activeTab === 'all'
    ? sections
    : sections.filter((s) => s.id === activeTab);

  return (
    <section id="schedule" className="py-24 md:py-32 bg-ted-bg relative overflow-hidden">
      {/* Background Lighting Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-ted-red/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-[400px] h-[400px] bg-ted-red/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <AnimatedSection>
          <div className="text-center mb-12">
            <span className="text-ted-red text-sm font-semibold tracking-[0.2em] uppercase">
              {t.label[lang]}
            </span>
            <h2 className="mt-3 text-3xl sm:text-5xl lg:text-6xl font-black text-ted-text tracking-tight">
              {t.titleStart[lang]} <span className="text-ted-red">{t.titleAccent[lang]}</span>
            </h2>
            <div className="mt-4 flex items-center justify-center gap-2 text-ted-text-secondary text-sm md:text-base">
              <Clock size={18} className="text-ted-red" />
              <span className="font-medium">{t.dayLabel[lang]}</span>
            </div>
          </div>
        </AnimatedSection>

        {/* Filter Tabs Navigation */}
        <AnimatedSection>
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-12 no-scrollbar px-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${
                activeTab === 'all'
                  ? 'bg-ted-red text-white shadow-lg shadow-ted-red/20'
                  : 'bg-ted-bg-card border border-ted-border text-ted-text-secondary hover:text-ted-text hover:border-ted-red/40'
              }`}
            >
              {t.filterAll[lang]}
            </button>

            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 transition-all duration-300 ${
                  activeTab === sec.id
                    ? 'bg-ted-red text-white shadow-lg shadow-ted-red/20'
                    : 'bg-ted-bg-card border border-ted-border text-ted-text-secondary hover:text-ted-text hover:border-ted-red/40'
                }`}
              >
                <SectionBadgeIcon id={sec.id} />
                <span>{sec.badge[lang]}</span>
              </button>
            ))}
          </div>
        </AnimatedSection>

        {/* Timeline Content List */}
        <div className="space-y-12">
          {filteredSections.map((sec) => (
            <div key={sec.id} className="relative">
              {/* Section Header Banner */}
              <div className="sticky top-20 z-20 mb-4 bg-ted-bg/95 backdrop-blur-md py-3 border-b border-ted-border/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-ted-red/10 border border-ted-red/30 text-ted-red font-black text-xs uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                    <SectionBadgeIcon id={sec.id} />
                    {sec.badge[lang]}
                  </span>
                  <h3 className="text-ted-text font-black text-lg md:text-xl truncate">
                    {sec.title[lang]}
                  </h3>
                </div>
                <span className="text-ted-text-secondary text-xs font-semibold tabular-nums hidden sm:inline-block bg-ted-bg-card px-2.5 py-1 rounded border border-ted-border">
                  {sec.timeRange}
                </span>
              </div>

              {/* Section Description if present */}
              {sec.desc?.[lang] && (
                <div className="mb-6 p-4 rounded-xl bg-ted-bg-card/70 border border-ted-border/80 text-ted-text-secondary text-xs sm:text-sm font-medium leading-relaxed italic">
                  "{sec.desc[lang]}"
                </div>
              )}

              {/* Vertical Timeline Track */}
              <div className="relative ml-2 sm:ml-4">
                <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-gradient-to-b from-ted-red via-ted-red/50 to-ted-border" />

                <div className="space-y-2">
                  {sec.items.map((item, idx) => (
                    <ScheduleItemCard
                      key={idx}
                      item={item}
                      index={idx}
                      onSelectSpeaker={handleSelectSpeaker}
                    />
                  ))}
                </div>
              </div>
            </div>
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
                aria-label={translations.speakers.closeModal[lang]}
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
                    {translations.speakers.readBio[lang]}
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

