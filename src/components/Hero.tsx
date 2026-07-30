import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Calendar, MapPin } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1475721025505-c315fff16fdf?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop'
];

export default function Hero() {
  const { lang } = useLang();
  const t = translations.hero;
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ted-bg"
    >
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentImg}
            src={BACKGROUND_IMAGES[currentImg]}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.3, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full object-cover"
            alt="TEDx Background"
          />
        </AnimatePresence>
        
        {/* Dark overlay to make text readable */}
        <div className="absolute inset-0 bg-ted-bg/80 dark:bg-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(235,0,40,0.15)_0%,_transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-heading"
        >
          <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-ted-red drop-shadow-xl">
            TEDx
          </span>
          <span className="block text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-ted-text drop-shadow-xl">
            Sergeli
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 text-lg sm:text-xl md:text-2xl text-ted-text-secondary max-w-2xl mx-auto font-light leading-relaxed drop-shadow-lg"
        >
          {t.tagline[lang]}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-ted-text font-medium"
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
            className="px-8 py-3.5 border-2 border-ted-text text-ted-text font-medium rounded hover:border-ted-red hover:text-ted-red transition-all duration-300"
          >
            {t.learnMore[lang]}
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <motion.a
          href="#about"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-ted-text hover:text-ted-red transition-colors"
        >
          <ArrowDown size={20} />
        </motion.a>
      </motion.div>
    </section>
  );
}
