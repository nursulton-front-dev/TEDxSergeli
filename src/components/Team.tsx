import { motion, useInView, useMotionValue, useMotionTemplate, useSpring, useTransform } from 'framer-motion';
import { useRef, type MouseEvent } from 'react';
import AnimatedSection from './AnimatedSection';
import { useLang } from '../i18n/LanguageContext';
import { translations, type Lang } from '../i18n/translations';

interface Member {
  photo: string;
  name: string;
  role: string;
}

interface MemberSource {
  photo: string;
  name: Record<Lang, string>;
  roleKey: keyof typeof translations.team.roles;
}

function TeamCard({
  photo,
  name,
  role,
  index,
  featured = false,
  offset = false,
}: Member & { index: number; featured?: boolean; offset?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springCfg = { stiffness: 250, damping: 22, mass: 0.5 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), springCfg);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), springCfg);
  const glowX = useTransform(mouseX, [-0.5, 0.5], ['20%', '80%']);
  const glowY = useTransform(mouseY, [-0.5, 0.5], ['20%', '80%']);
  const glowBackground = useMotionTemplate`radial-gradient(280px circle at ${glowX} ${glowY}, rgba(235,0,40,0.55), transparent 70%)`;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const base = index * 0.1;
  const revealEase = [0.22, 1, 0.36, 1] as const;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 34 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: base, ease: revealEase }}
      className={offset ? 'md:translate-y-10' : undefined}
      style={{ perspective: 1400 }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="group relative rounded-lg overflow-hidden bg-ted-bg-card border border-ted-border transition-colors duration-300 hover:border-ted-red/40 flex flex-col"
      >
        <div
          className={`relative overflow-hidden ${
            featured ? 'aspect-[4/5] md:aspect-[16/12]' : 'aspect-[4/5]'
          }`}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ clipPath: 'inset(100% 0% 0% 0%)', scale: 1.2 }}
            animate={isInView ? { clipPath: 'inset(0% 0% 0% 0%)', scale: 1 } : {}}
            transition={{ duration: 1.1, delay: base + 0.1, ease: revealEase }}
          >
            <img
              src={photo}
              alt={`${name} — ${role}`}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08]"
            />
          </motion.div>

          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay pointer-events-none"
            style={{ background: glowBackground }}
          />
        </div>

        <motion.div
          className={`flex-1 flex flex-col justify-center ${featured ? 'p-5 md:p-7' : 'p-4 md:p-5'}`}
          initial={{ opacity: 0, y: 26 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: base + 0.55, ease: revealEase }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <motion.div
              className="h-0.5 w-8 bg-ted-red transition-all duration-300 ease-out group-hover:w-14"
              style={{ transformOrigin: 'left' }}
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.5, delay: base + 0.8, ease: revealEase }}
            />
            <motion.span
              className="font-black text-ted-text-secondary/40 tabular-nums tracking-widest text-[10px] md:text-xs"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: base + 0.75, ease: revealEase }}
            >
              {String(index + 1).padStart(2, '0')}
            </motion.span>
          </div>
          <h3
            className={`text-ted-text font-bold leading-tight ${
              featured ? 'text-xl md:text-[26px]' : 'text-[15px] md:text-base'
            }`}
          >
            {name}
          </h3>
          <p
            className={`text-ted-text-secondary mt-1 uppercase tracking-wider ${
              featured ? 'text-xs md:text-sm' : 'text-[10px] md:text-xs'
            }`}
          >
            {role}
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function Team() {
  const { lang } = useLang();
  const t = translations.team;

  const leadsSource: MemberSource[] = [
    {
      photo: '/team/baxtiyor.jpg',
      name: { uz: 'Abidjanov Baxtiyor', ru: 'Abidjanov Baxtiyor', en: 'Abidjanov Baxtiyor' },
      roleKey: 'organizer',
    },
    {
      photo: '/team/adolat.jpg',
      name: { uz: 'Tursunova Adolat', ru: 'Tursunova Adolat', en: 'Tursunova Adolat' },
      roleKey: 'coOrganizer',
    },
  ];

  const restSource: MemberSource[] = [
    {
      photo: '/team/abdulloh.jpg',
      name: { uz: 'Mahamadjonov Abdulloh', ru: 'Makhamadjonov Abdulloh', en: 'Makhamadjonov Abdulloh' },
      roleKey: 'smmManager',
    },
    {
      photo: '/team/shoxjahon.jpg',
      name: { uz: 'Muxuddinov Shoxjahon', ru: 'Mukhuddinov Shokhjahon', en: 'Mukhuddinov Shokhjahon' },
      roleKey: 'smmHelper',
    },
    {
      photo: '/team/gulrukhsor.jpg',
      name: { uz: 'Shodiyeva Gulruxsor', ru: 'Shodiyeva Gulrukhsor', en: 'Shodiyeva Gulrukhsor' },
      roleKey: 'headDesigner',
    },
    {
      photo: '/team/farangiz.jpg',
      name: { uz: 'Farangiz Ibraimova', ru: 'Farangiz Ibraimova', en: 'Farangiz Ibraimova' },
      roleKey: 'designerAssistant',
    },
    {
      photo: '/team/nursulton.jpg',
      name: { uz: 'Maxramov Nursulton', ru: 'Makhramov Nursulton', en: 'Makhramov Nursulton' },
      roleKey: 'headWebsiteManager',
    },
    {
      photo: '/team/sardor.jpg',
      name: { uz: 'Xolmirzayev Sardor', ru: 'Kholmirzayev Sardor', en: 'Kholmirzayev Sardor' },
      roleKey: 'websiteDeveloper',
    },
    {
      photo: '/team/akbar.jpg',
      name: { uz: 'Komiljonov Akbar', ru: 'Komiljonov Akbar', en: 'Komiljonov Akbar' },
      roleKey: 'websiteDeveloper',
    },
  ];

  const leads: Member[] = leadsSource.map((m) => ({
    photo: m.photo,
    name: m.name[lang],
    role: t.roles[m.roleKey][lang],
  }));

  const rest: Member[] = restSource.map((m) => ({
    photo: m.photo,
    name: m.name[lang],
    role: t.roles[m.roleKey][lang],
  }));

  return (
    <section id="team" className="py-24 md:py-32 bg-ted-bg-alt relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-ted-red/[0.03] rounded-full blur-[120px] translate-y-1/2 translate-x-1/3" />
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-ted-red/[0.03] rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-ted-red text-sm font-semibold tracking-[0.2em] uppercase">
              {t.label[lang]}
            </span>
            <h2 className="mt-4 text-3xl md:text-5xl lg:text-6xl font-black text-ted-text">
              {t.titleStart[lang]} <span className="text-ted-red">{t.titleAccent[lang]}</span>
            </h2>
            <p className="mt-4 text-ted-text-secondary text-lg max-w-xl mx-auto">
              {t.subtitle[lang]}
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
          {leads.map((member, i) => (
            <TeamCard key={member.photo} {...member} index={i} featured />
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
          {rest.map((member, i) => (
            <TeamCard
              key={member.photo}
              {...member}
              index={i + leads.length}
              offset={i % 3 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
