import { motion } from 'framer-motion';
import { ArrowDown, Calendar, MapPin } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

export default function Hero() {
  const { lang } = useLang();
  const t = translations.hero;

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ted-bg"
    >
      <div className="absolute inset-0">
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-heading"
        >
          <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-ted-red">
            TEDx
          </span>
          <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-ted-text">
            Sergeli
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 text-lg sm:text-xl md:text-2xl text-ted-text-secondary max-w-2xl mx-auto font-light leading-relaxed"
        >
          {t.tagline[lang]}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-ted-text-secondary"
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-ted-red" />
            <span>{t.date[lang]}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-ted-red" />
            <span>{t.location[lang]}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#apply"
            className="px-8 py-3.5 bg-ted-red text-white font-semibold rounded hover:bg-ted-red-dark transition-all duration-300 hover:shadow-lg hover:shadow-ted-red/20"
          >
            {t.applyBtn[lang]}
          </a>
          <a
            href="#about"
            className="px-8 py-3.5 border border-ted-border text-ted-text font-medium rounded hover:border-ted-red hover:text-ted-red transition-all duration-300"
          >
            {t.learnMore[lang]}
          </a>
        </motion.div>
      </div>

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
