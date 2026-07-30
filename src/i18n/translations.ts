export type Lang = 'uz' | 'ru' | 'en';

export const translations = {
  nav: {
    home: { uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' },
    about: { uz: 'Tadbir haqida', ru: 'О мероприятии', en: 'About' },
    speakers: { uz: 'Spikerlar', ru: 'Спикеры', en: 'Speakers' },
    schedule: { uz: 'Dastur', ru: 'Программа', en: 'Schedule' },
    team: { uz: 'Jamoa', ru: 'Команда', en: 'Team' },
    apply: { uz: 'Ariza', ru: 'Подать заявку', en: 'Apply' },
    themeToggle: { uz: 'Mavzuni almashtirish', ru: 'Переключить тему', en: 'Toggle theme' },
  },
  hero: {
    badge: {
      uz: 'Mustaqil tashkil etilgan TED tadbiri',
      ru: 'Независимо организованное мероприятие TED',
      en: 'Independently organized TED event',
    },
    tagline: {
      uz: "Tarqatishga loyiq g'oyalar",
      ru: 'Идеи, достойные распространения',
      en: 'Ideas worth spreading',
    },
    date: {
      uz: "Tez kunda e'lon qilinadi",
      ru: 'Дата будет объявлена',
      en: 'Date to be announced',
    },
    location: {
      uz: "Toshkent, O'zbekiston",
      ru: 'Ташкент, Узбекистан',
      en: 'Tashkent, Uzbekistan',
    },
    applyBtn: { uz: 'Ariza topshirish', ru: 'Подать заявку', en: 'Apply Now' },
    learnMore: { uz: "Batafsil", ru: 'Подробнее', en: 'Learn More' },
  },
  whatIsTedx: {
    title: { uz: 'TEDx nima?', ru: 'Что такое TEDx?', en: 'What is TEDx?' },
    description: {
      uz: "Tarqatishga loyiq g'oyalar ruhida TED TEDx dasturini yaratdi. TEDx — bu odamlarga TED formatidagi tajribani baham ko'rish imkonini beradigan mahalliy, mustaqil tashkil etilgan tadbirlar dasturi. Bizning tadbirimiz TEDxSergeli deb ataladi, bunda x = mustaqil tashkil etilgan TED tadbiri. TEDx tadbirimizda TED Talks videolari va jonli spikerlar birgalikda kichik guruhda chuqur muhokama va samimiy muloqotni rag'batlantiradi. TED konferensiyasi TEDx dasturi uchun umumiy ko'rsatmalar beradi, ammo har bir TEDx tadbiri mustaqil tashkil etiladi.",
      ru: 'В духе идей, достойных распространения, TED создал программу TEDx. TEDx — это программа местных, самостоятельно организованных мероприятий, которые объединяют людей для обмена опытом в формате TED. Наше мероприятие называется TEDxSergeli, где x = независимо организованное мероприятие TED. На нашем мероприятии TEDx видео TED Talks и живые спикеры помогают создать глубокую дискуссию и связи в небольшой группе. Конференция TED предоставляет общие рекомендации для программы TEDx, но отдельные мероприятия TEDx организуются самостоятельно.',
      en: 'In the spirit of ideas worth spreading, TED has created a program called TEDx. TEDx is a program of local, self-organized events that bring people together to share a TED-like experience. Our event is called TEDxSergeli, where x = independently organized TED event. At our TEDx event, TED Talks video and live speakers combine to spark deep discussion and connection in a small group. The TED Conference provides general guidance for the TEDx program, but individual TEDx events are self-organized.',
    },
    link: {
      uz: 'TEDx haqida batafsil ted.com/tedx saytida',
      ru: 'Узнать больше о TEDx на ted.com/tedx',
      en: 'Learn more about TEDx at ted.com/tedx',
    },
  },
  about: {
    label: { uz: 'Tadbir haqida', ru: 'О мероприятии', en: 'About the Event' },
    titleStart: {
      uz: "G'oyalar ilhom bilan",
      ru: 'Где идеи встречают',
      en: 'Where ideas meet',
    },
    titleAccent: {
      uz: 'uchrashadi',
      ru: 'вдохновение',
      en: 'inspiration',
    },
    desc1: {
      uz: "TEDxSergeli — Toshkentning Sergeli tumanida tashkil etilgan mustaqil TEDx tadbir. Biz jamiyatimiz uchun muhim bo'lgan g'oyalarni tarqatish maqsadida ilhomlovchi spikerlarni bir joyga to'playmiz.",
      ru: 'TEDxSergeli — это независимое мероприятие TEDx, организованное в Сергелийском районе Ташкента. Мы собираем вдохновляющих спикеров, чтобы распространять идеи, важные для нашего сообщества.',
      en: 'TEDxSergeli is an independently organized TEDx event in Sergeli district of Tashkent. We bring together inspiring speakers to spread ideas that matter to our community.',
    },
    desc2: {
      uz: "Bizning tadbirimiz — bu faqat ma'ruzalar emas, balki yangi fikrlar, yangi aloqalar va yangi imkoniyatlarni kashf etish uchun yaratilgan makon.",
      ru: 'Наше мероприятие — это не просто лекции, а пространство для открытия новых идей, новых связей и новых возможностей.',
      en: 'Our event is not just talks — it\'s a space for discovering new ideas, new connections, and new opportunities.',
    },
    videoTeaser: {
      uz: 'Tadbir tizeri — tez kunda',
      ru: 'Тизер мероприятия — скоро',
      en: 'Event teaser — coming soon',
    },
    stats: {
      attendees: { uz: 'Ishtirokchilar', ru: 'Участников', en: 'Attendees' },
      speakers: { uz: 'Spikerlar', ru: 'Спикеров', en: 'Speakers' },
      day: { uz: 'Kun', ru: 'День', en: 'Day' },
      ideas: { uz: "G'oyalar", ru: 'Идей', en: 'Ideas' },
    },
  },
  speakers: {
    label: { uz: 'Spikerlar', ru: 'Спикеры', en: 'Speakers' },
    titleStart: { uz: 'Bizning', ru: 'Наши', en: 'Meet our' },
    titleAccent: { uz: 'spikerlarimiz', ru: 'спикеры', en: 'speakers' },
    subtitle: {
      uz: 'Ilhomlovchi spikerlar tez orada e\'lon qilinadi. Kuzatib boring!',
      ru: 'Вдохновляющие спикеры будут объявлены в ближайшее время. Следите за обновлениями!',
      en: 'Inspiring speakers will be announced soon. Stay tuned!',
    },
    tba: { uz: 'Tez kunda', ru: 'Скоро', en: 'Coming soon' },
    topic: { uz: "Ma'ruza mavzusi", ru: 'Тема выступления', en: 'Talk topic' },
  },
  schedule: {
    label: { uz: 'Dastur', ru: 'Программа', en: 'Schedule' },
    titleStart: { uz: 'Tadbir', ru: 'Программа', en: 'Event' },
    titleAccent: { uz: 'dasturi', ru: 'мероприятия', en: 'program' },
    dayLabel: { uz: 'Bir kunlik dastur', ru: 'Однодневная программа', en: 'One-day program' },
    items: [
      {
        time: '09:00',
        title: { uz: "Ro'yxatdan o'tish", ru: 'Регистрация', en: 'Registration' },
        desc: { uz: 'Kirish va tanishuv', ru: 'Вход и нетворкинг', en: 'Entry & networking' },
        type: 'break' as const,
      },
      {
        time: '10:00',
        title: { uz: 'Ochilish marosimi', ru: 'Церемония открытия', en: 'Opening Ceremony' },
        desc: { uz: 'Xush kelibsiz — TEDxSergeli', ru: 'Добро пожаловать — TEDxSergeli', en: 'Welcome — TEDxSergeli' },
        type: 'main' as const,
      },
      {
        time: '10:30',
        title: { uz: '1-sessiya: Ilhom', ru: 'Сессия 1: Вдохновение', en: 'Session 1: Inspiration' },
        desc: { uz: '3 ta spiker — har biri 12 daqiqa', ru: '3 спикера — по 12 минут каждый', en: '3 speakers — 12 minutes each' },
        type: 'talk' as const,
      },
      {
        time: '12:00',
        title: { uz: 'Tanaffus', ru: 'Перерыв', en: 'Break' },
        desc: { uz: 'Suhbat va yengil tamaddi', ru: 'Нетворкинг и перекус', en: 'Networking & refreshments' },
        type: 'break' as const,
      },
      {
        time: '12:30',
        title: { uz: '2-sessiya: Innovatsiya', ru: 'Сессия 2: Инновации', en: 'Session 2: Innovation' },
        desc: { uz: '3 ta spiker — har biri 12 daqiqa', ru: '3 спикера — по 12 минут каждый', en: '3 speakers — 12 minutes each' },
        type: 'talk' as const,
      },
      {
        time: '14:00',
        title: { uz: 'Tushlik', ru: 'Обед', en: 'Lunch' },
        desc: { uz: 'Suhbat va dam olish', ru: 'Нетворкинг и отдых', en: 'Networking & rest' },
        type: 'break' as const,
      },
      {
        time: '15:00',
        title: { uz: '3-sessiya: Harakat', ru: 'Сессия 3: Действие', en: 'Session 3: Action' },
        desc: { uz: '3 ta spiker — har biri 12 daqiqa', ru: '3 спикера — по 12 минут каждый', en: '3 speakers — 12 minutes each' },
        type: 'talk' as const,
      },
      {
        time: '16:30',
        title: { uz: 'Yopilish va fotosessiya', ru: 'Закрытие и фотосессия', en: 'Closing & photo session' },
        desc: { uz: 'Yakuniy so\'z va esdalik suratlar', ru: 'Итоги и памятные фото', en: 'Wrap-up & group photos' },
        type: 'main' as const,
      },
    ],
  },
  team: {
    label: { uz: 'Jamoa', ru: 'Команда', en: 'Team' },
    titleStart: { uz: 'Sahna ortidagi', ru: 'Люди за', en: 'The people' },
    titleAccent: { uz: 'insonlar', ru: 'кулисами', en: 'behind' },
    subtitle: {
      uz: "TEDxSergeli jamoasi — ishtiyoqli va g'oyalar kuchiga ishonuvchi yoshlar.",
      ru: 'Команда TEDxSergeli — увлечённая молодёжь, верящая в силу идей.',
      en: 'The TEDxSergeli team — passionate youth who believe in the power of ideas.',
    },
    roles: {
      organizer: { uz: 'Tashkilotchi', ru: 'Организатор', en: 'Organizer' },
      coOrganizer: { uz: 'Yordamchi tashkilotchi', ru: 'Со-организатор', en: 'Co-Organizer' },
      speakerCurator: { uz: 'Spiker kuratori', ru: 'Куратор спикеров', en: 'Speaker Curator' },
      marketingLead: { uz: 'Marketing rahbari', ru: 'Лид маркетинга', en: 'Marketing Lead' },
      designLead: { uz: 'Dizayn rahbari', ru: 'Лид дизайна', en: 'Design Lead' },
      logisticsLead: { uz: 'Logistika rahbari', ru: 'Лид логистики', en: 'Logistics Lead' },
      contentLead: { uz: 'Kontent rahbari', ru: 'Лид контента', en: 'Content Lead' },
      volunteerLead: { uz: 'Volontyorlar rahbari', ru: 'Лид волонтёров', en: 'Volunteer Lead' },
    },
    tba: { uz: 'Tez kunda', ru: 'Скоро', en: 'Coming soon' },
  },
  cta: {
    label: { uz: "Qo'shiling", ru: 'Присоединяйтесь', en: 'Join us' },
    titleStart: { uz: 'TEDxSergeli', ru: 'Станьте частью', en: 'Be part of' },
    titleAccent: { uz: "ga qo'shiling", ru: 'TEDxSergeli', en: 'TEDxSergeli' },
    subtitle: {
      uz: "Spiker, volontyor yoki ishtirokchi sifatida qo'shiling. G'oyalarni birga tarqatamiz!",
      ru: 'Присоединяйтесь как спикер, волонтёр или участник. Распространяем идеи вместе!',
      en: 'Join as a speaker, volunteer or attendee. Let\'s spread ideas together!',
    },
    speakerBtn: { uz: "Spiker bo'lish", ru: 'Стать спикером', en: 'Apply as Speaker' },
    volunteerBtn: { uz: "Volontyor bo'lish", ru: 'Стать волонтёром', en: 'Apply as Volunteer' },
    cards: {
      speaker: {
        title: { uz: 'Spiker', ru: 'Спикер', en: 'Speaker' },
        desc: {
          uz: "O'z g'oyangizni sahnadagi 12 daqiqada ulashing",
          ru: 'Поделитесь своей идеей за 12 минут на сцене',
          en: 'Share your idea in 12 minutes on stage',
        },
      },
      volunteer: {
        title: { uz: 'Volontyor', ru: 'Волонтёр', en: 'Volunteer' },
        desc: {
          uz: "Tadbirni tashkil etishda jamoamizga qo'shiling",
          ru: 'Присоединяйтесь к нашей команде по организации',
          en: 'Join our team in organizing the event',
        },
      },
      attendee: {
        title: { uz: 'Ishtirokchi', ru: 'Участник', en: 'Attendee' },
        desc: {
          uz: "Ilhomlanish va yangi aloqalar o'rnatish uchun qatnashing",
          ru: 'Участвуйте для вдохновения и новых знакомств',
          en: 'Attend for inspiration and new connections',
        },
      },
    },
    form: {
      title: { uz: 'Volontyor arizasi', ru: 'Заявка волонтёра', en: 'Volunteer application' },
      subtitle: {
        uz: "Ma'lumotlaringizni qoldiring, tez orada siz bilan bog'lanamiz.",
        ru: 'Оставьте свои данные, и мы скоро свяжемся с вами.',
        en: "Leave your details and we'll get in touch soon.",
      },
      nameLabel: { uz: 'Ism familiya', ru: 'Имя и фамилия', en: 'Full name' },
      namePlaceholder: { uz: 'Ismingizni kiriting', ru: 'Введите имя', en: 'Enter your name' },
      phoneLabel: { uz: 'Telefon raqami', ru: 'Номер телефона', en: 'Phone number' },
      phonePlaceholder: { uz: '+998 90 123 45 67', ru: '+998 90 123 45 67', en: '+998 90 123 45 67' },
      messageLabel: { uz: 'Xabar', ru: 'Сообщение', en: 'Message' },
      messagePlaceholder: {
        uz: "Qo'shimcha ma'lumot (ixtiyoriy)",
        ru: 'Дополнительная информация (необязательно)',
        en: 'Additional info (optional)',
      },
      submitBtn: { uz: 'Yuborish', ru: 'Отправить', en: 'Submit' },
      submitting: { uz: 'Yuborilmoqda...', ru: 'Отправка...', en: 'Submitting...' },
      successTitle: { uz: 'Rahmat!', ru: 'Спасибо!', en: 'Thank you!' },
      successMsg: {
        uz: "Arizangiz qabul qilindi. Tez orada siz bilan bog'lanamiz.",
        ru: 'Ваша заявка принята. Мы скоро свяжемся с вами.',
        en: "Your application has been received. We'll be in touch soon.",
      },
      errorMsg: {
        uz: "Xatolik yuz berdi. Iltimos, birozdan so'ng qaytadan urinib ko'ring.",
        ru: 'Произошла ошибка. Пожалуйста, попробуйте ещё раз позже.',
        en: 'Something went wrong. Please try again in a moment.',
      },
      requiredError: {
        uz: "Ism va telefon raqami majburiy",
        ru: 'Имя и номер телефона обязательны',
        en: 'Name and phone number are required',
      },
      closeBtn: { uz: 'Yopish', ru: 'Закрыть', en: 'Close' },
    },
  },
  footer: {
    desc: {
      uz: "TEDxSergeli — Toshkentda tashkil etilgan mustaqil TEDx tadbiri. G'oyalarni tarqatamiz.",
      ru: 'TEDxSergeli — независимое мероприятие TEDx в Ташкенте. Распространяем идеи.',
      en: 'TEDxSergeli — an independently organized TEDx event in Tashkent. Spreading ideas.',
    },
    links: { uz: 'Havolalar', ru: 'Ссылки', en: 'Links' },
    contact: { uz: "Bog'lanish", ru: 'Контакты', en: 'Contact' },
    license: {
      uz: 'Bu mustaqil TEDx tadbiri TED litsenziyasi asosida tashkil etilgan.',
      ru: 'Это независимое мероприятие TEDx организовано по лицензии TED.',
      en: 'This independent TEDx event is operated under license from TED.',
    },
  },
} as const;
