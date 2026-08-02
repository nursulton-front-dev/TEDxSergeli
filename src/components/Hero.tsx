import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowDown, Calendar, MapPin } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

export default function Hero() {
  const { lang } = useLang();
  const t = translations.hero;
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ted-bg"
    >
      <div className="absolute inset-0">
        <motion.div style={{ y: bgY }} className="absolute inset-0">
          <img
            src="/hero-bg.svg"
            alt=""
            className="w-full h-full object-cover scale-110"
          />
        </motion.div>
        <div className="absolute inset-0 bg-ted-bg/92" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(235,0,40,0.06)_0%,_transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-ted-red"
              style={{
                width: `${600 + i * 200}px`,
                height: `${600 + i * 200}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.03,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.02, 0.04, 0.02],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      </div>

      <motion.div
        style={{ opacity: contentOpacity }}
        className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20"
      >
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-heading"
        >
          <span className="block text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] font-black tracking-tight text-ted-red leading-none drop-shadow-sm">
            TEDx
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 md:mt-8"
        >
          <span className="block text-xs sm:text-sm uppercase tracking-[0.2em] text-ted-text-secondary mb-2 font-medium">
            {t.themeLabel[lang]}
          </span>
          <p className="text-3xl sm:text-4xl md:text-5xl font-black italic text-ted-text">
            {t.themeName[lang]}
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-ted-text-secondary text-base md:text-lg leading-relaxed">
            {t.subheadline[lang]}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-ted-text font-medium"
        >
          <div className="flex items-center gap-2 bg-ted-bg-alt px-4 py-2 rounded-full border border-ted-border shadow-sm">
            <Calendar size={16} className="text-ted-red" />
            <span>{t.date[lang]}</span>
          </div>
          <a 
            href={t.locationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-ted-bg-alt px-4 py-2 rounded-full border border-ted-border shadow-sm hover:border-ted-red hover:text-ted-red transition-all cursor-pointer"
          >
            <MapPin size={16} className="text-ted-red" />
            <span>{t.location[lang]}</span>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 flex flex-col items-center justify-center gap-4"
        >
          <div className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#E62B1E] bg-[#E62B1E]/10 px-4 py-1.5 rounded-full animate-pulse border border-[#E62B1E]/20">
            {t.scarcityBadge[lang]}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#tickets"
              className="px-8 py-3.5 bg-ted-red text-white font-bold rounded-xl hover:bg-ted-red-dark transition-all duration-300 hover:shadow-lg hover:shadow-ted-red/30 hover:-translate-y-1"
            >
              {t.applyBtn[lang]}
            </a>
            <a
              href="#about"
              className="px-8 py-3.5 border-2 border-ted-border text-ted-text font-bold rounded-xl hover:border-ted-red hover:text-ted-red transition-all duration-300 hover:-translate-y-1"
            >
              {t.learnMore[lang]}
            </a>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.a
          href="#about"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-ted-text-secondary hover:text-ted-red transition-colors"
        >
          <ArrowDown size={20} />
        </motion.a>
      </motion.div>
    </section>
  );
}
