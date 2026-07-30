import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import AnimatedSection from './AnimatedSection';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

function TeamCard({ name, role, initials, index }: { name: string; role: string; initials: string; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-30px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="group text-center"
    >
      <div className="relative w-28 h-28 md:w-32 md:h-32 mx-auto mb-4">
        <div className="w-full h-full rounded-full bg-ted-bg-card border border-ted-border flex items-center justify-center group-hover:border-ted-red/30 transition-all duration-300">
          <span className="text-2xl font-bold text-ted-text/10 group-hover:text-ted-red/20 transition-colors">
            {initials}
          </span>
        </div>
        <div className="absolute -inset-1 rounded-full border border-transparent group-hover:border-ted-red/15 transition-all duration-500" />
      </div>
      <h3 className="text-ted-text font-semibold">{name}</h3>
      <p className="text-ted-red text-sm mt-1">{role}</p>
    </motion.div>
  );
}

export default function Team() {
  const { lang } = useLang();
  const t = translations.team;

  const members = [
    { role: t.roles.organizer[lang], initials: 'O' },
    { role: t.roles.coOrganizer[lang], initials: 'CO' },
    { role: t.roles.speakerCurator[lang], initials: 'SC' },
    { role: t.roles.marketingLead[lang], initials: 'ML' },
    { role: t.roles.designLead[lang], initials: 'DL' },
    { role: t.roles.logisticsLead[lang], initials: 'LL' },
    { role: t.roles.contentLead[lang], initials: 'CL' },
    { role: t.roles.volunteerLead[lang], initials: 'VL' },
  ];

  return (
    <section id="team" className="py-24 md:py-32 bg-ted-bg-alt relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-ted-red/[0.03] rounded-full blur-[120px] translate-y-1/2 translate-x-1/3" />

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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 md:gap-10">
          {members.map((member, i) => (
            <TeamCard key={i} name={t.tba[lang]} role={member.role} initials={member.initials} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
