import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { translations } from '../i18n/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function VolunteerModal({ isOpen, onClose }: Props) {
  const { lang } = useLang();
  const t = translations.cta.form;

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [school, setSchool] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      const timeout = setTimeout(() => {
        setName('');
        setAge('');
        setSchool('');
        setContact('');
        setStatus('idle');
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age.trim() || !school.trim() || !contact.trim()) {
      setStatus('error');
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/volunteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), age: age.trim(), school: school.trim(), contact: contact.trim() }),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-ted-bg border border-ted-border rounded-lg shadow-2xl p-6 md:p-8"
          >
            <button
              onClick={onClose}
              aria-label={t.closeBtn[lang]}
              className="absolute top-4 right-4 p-1.5 text-ted-text-secondary hover:text-ted-red transition-colors"
            >
              <X size={20} />
            </button>

            {status === 'success' ? (
              <div className="text-center py-6">
                <h3 className="text-2xl font-bold text-ted-text mb-2">{t.successTitle[lang]}</h3>
                <p className="text-ted-text-secondary">{t.successMsg[lang]}</p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 bg-ted-red text-white font-semibold rounded hover:bg-ted-red-dark transition-colors"
                >
                  {t.closeBtn[lang]}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className="text-2xl font-bold text-ted-text mb-1">{t.title[lang]}</h3>
                <p className="text-ted-text-secondary text-sm mb-6">{t.subtitle[lang]}</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-ted-text mb-1.5">
                      {t.nameLabel[lang]}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.namePlaceholder[lang]}
                      maxLength={100}
                      className="w-full px-4 py-2.5 bg-ted-bg-alt border border-ted-border rounded text-ted-text placeholder:text-ted-text-secondary/60 focus:outline-none focus:border-ted-red transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ted-text mb-1.5">
                      {t.ageLabel[lang]}
                    </label>
                    <input
                      type="text"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder={t.agePlaceholder[lang]}
                      maxLength={10}
                      className="w-full px-4 py-2.5 bg-ted-bg-alt border border-ted-border rounded text-ted-text placeholder:text-ted-text-secondary/60 focus:outline-none focus:border-ted-red transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ted-text mb-1.5">
                      {t.schoolLabel[lang]}
                    </label>
                    <input
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder={t.schoolPlaceholder[lang]}
                      maxLength={100}
                      className="w-full px-4 py-2.5 bg-ted-bg-alt border border-ted-border rounded text-ted-text placeholder:text-ted-text-secondary/60 focus:outline-none focus:border-ted-red transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ted-text mb-1.5">
                      {t.contactLabel[lang]}
                    </label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder={t.contactPlaceholder[lang]}
                      maxLength={50}
                      className="w-full px-4 py-2.5 bg-ted-bg-alt border border-ted-border rounded text-ted-text placeholder:text-ted-text-secondary/60 focus:outline-none focus:border-ted-red transition-colors"
                    />
                  </div>
                </div>

                {status === 'error' && (
                  <p className="mt-4 text-sm text-ted-red">
                    {!name.trim() || !age.trim() || !school.trim() || !contact.trim() ? t.requiredError[lang] : t.errorMsg[lang]}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="mt-6 w-full px-6 py-3 bg-ted-red text-white font-semibold rounded hover:bg-ted-red-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? t.submitting[lang] : t.submitBtn[lang]}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
