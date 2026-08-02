export type Lang = 'uz' | 'ru' | 'en';

export const translations = {
  nav: {
    home: { uz: 'Bosh sahifa', ru: 'Главная', en: 'Home' },
    about: { uz: 'Tadbir haqida', ru: 'О мероприятии', en: 'About' },
    speakers: { uz: 'Spikerlar', ru: 'Спикеры', en: 'Speakers' },
    schedule: { uz: 'Dastur', ru: 'Программа', en: 'Schedule' },
    team: { uz: 'Jamoa', ru: 'Команда', en: 'Team' },
    apply: { uz: 'Chipta olish', ru: 'Купить билет', en: 'Get Tickets' },
    themeToggle: { uz: 'Mavzuni almashtirish', ru: 'Переключить тему', en: 'Toggle theme' },
  },
  hero: {
    themeLabel: {
      uz: 'Ushbu yilgi mavzu',
      ru: 'Тема этого года',
      en: "This year's theme",
    },
    themeName: {
      uz: 'Oddiylikdan tashqarida',
      ru: 'За гранью очевидного',
      en: 'Beyond the Obvious',
    },
    date: {
      uz: '4-sentabr, 2026',
      ru: '4 сентября 2026',
      en: 'September 4, 2026',
    },
    location: {
      uz: 'Sergeli ixtisoslashtirilgan maktabi',
      ru: 'Специализированная школа Сергели',
      en: 'Sergeli Specialized School',
    },
    locationLink: 'https://yandex.uz/maps/-/CTv~EDnZ',
    applyBtn: { uz: 'Chipta xarid qilish', ru: 'Купить билет', en: 'Get Tickets' },
    learnMore: { uz: "Batafsil", ru: 'Подробнее', en: 'Learn More' },
  },
  whatIsTedx: {
    title: { uz: 'TEDx nima?', ru: 'Что такое TEDx?', en: 'What is TEDx?' },
    description: {
      uz: "G'oyalarni kashf etish va tarqatish ruhida TED TEDx dasturini yaratdi. TEDx — bu odamlarga TED formatidagi tajribani baham ko'rish imkonini beradigan mahalliy, mustaqil tashkil etilgan tadbirlar dasturi. Bizning tadbirimiz TEDxSergeliSpecializedSchool deb ataladi, bunda x = mustaqil tashkil etilgan TED tadbiri. Bizning TEDxSergeliSpecializedSchool tadbirimizda TED Talks videolari va jonli spikerlar birgalikda kichik guruhda chuqur muhokama va samimiy muloqotni rag'batlantiradi. Spikerlar TEDx tadbirida qatnashish uchun hech qachon pul to'lamaydilar. Arizalarni ko'rib chiqish, spikerlarni tayyorlash, tadbirda qatnashish va tashrif buyurish mutlaqo bepul taqdim etiladi. TED konferensiyasi TEDx dasturi uchun umumiy ko'rsatmalar beradi, ammo har bir TEDx tadbiri, jumladan bizniki ham, mustaqil tashkil etiladi.",
      ru: 'В духе поиска и распространения идей TED создал программу TEDx. TEDx — это программа местных, самостоятельно организованных мероприятий, которые объединяют людей для обмена опытом в стиле TED. Наше мероприятие называется TEDxSergeliSpecializedSchool, где x = независимо организованное мероприятие TED. На нашем мероприятии TEDxSergeliSpecializedSchool видео TED Talks и живые выступления спикеров объединяются, чтобы вызвать глубокую дискуссию и создать связи в небольшой группе. Спикеры никогда не платят за участие в мероприятии TEDx. Рассмотрение заявок, подготовка спикеров и участие в мероприятии, а также посещение предоставляются абсолютно бесплатно. Конференция TED предоставляет общие рекомендации для программы TEDx, но отдельные мероприятия TEDx, включая наше, организуются самостоятельно.',
      en: 'In the spirit of discovering and spreading ideas, TED has created a program called TEDx. TEDx is a program of local, self-organized events that bring people together to share a TED-like experience. Our event is called TEDxSergeliSpecializedSchool, where x = independently organized TED event. At our TEDxSergeliSpecializedSchool event, TED Talks video and live speakers will combine to spark deep discussion and connection in a small group. Speakers never pay to join a TEDx event. Consideration, speaker coaching and event participation along with attendance are all provided free of charge. The TED Conference provides general guidance for the TEDx program, but individual TEDx events, including ours, are self-organized.',
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
      uz: "TEDxSergeliSpecializedSchool — Toshkentning Sergeli tumanida tashkil etilgan mustaqil TEDx tadbir. Biz jamiyatimiz uchun muhim bo'lgan g'oyalarni tarqatish maqsadida ilhomlovchi spikerlarni bir joyga to'playmiz.",
      ru: 'TEDxSergeliSpecializedSchool — это независимое мероприятие TEDx, организованное в Сергелийском районе Ташкента. Мы собираем вдохновляющих спикеров, чтобы распространять идеи, важные для нашего сообщества.',
      en: 'TEDxSergeliSpecializedSchool is an independently organized TEDx event in Sergeli district of Tashkent. We bring together inspiring speakers to spread ideas that matter to our community.',
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
        desc: { uz: 'Xush kelibsiz — TEDxSergeliSpecializedSchool', ru: 'Добро пожаловать — TEDxSergeliSpecializedSchool', en: 'Welcome — TEDxSergeliSpecializedSchool' },
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
  sponsors: {
    label: { uz: 'Homiylar', ru: 'Спонсоры', en: 'Sponsors' },
    titleStart: { uz: 'Bizning', ru: 'Наши', en: 'Our' },
    titleAccent: { uz: 'hamkorlar', ru: 'партнеры', en: 'partners' },
    subtitle: {
      uz: 'Tadbirimizni qo\'llab-quvvatlayotgan tashkilotlarga minnatdorchilik bildiramiz.',
      ru: 'Мы благодарим организации, поддерживающие наше мероприятие.',
      en: 'We thank the organizations supporting our event.'
    },
    gold: { uz: 'Oltin homiylar', ru: 'Золотые спонсоры', en: 'Gold Sponsors' },
    silver: { uz: 'Kumush homiylar', ru: 'Серебряные спонсоры', en: 'Silver Sponsors' },
    bronze: { uz: 'Bronza homiylar', ru: 'Бронзовые спонсоры', en: 'Bronze Sponsors' },
    logoPlaceholder: { uz: 'Logotip', ru: 'Логотип', en: 'Logo' },
    becomeBtn: { uz: 'Homiy bo\'lish', ru: 'Стать спонсором', en: 'Become a Sponsor' },
  },
  team: {
    label: { uz: 'Jamoa', ru: 'Команда', en: 'Team' },
    titleStart: { uz: 'Sahna ortidagi', ru: 'Люди за', en: 'The people' },
    titleAccent: { uz: 'insonlar', ru: 'кулисами', en: 'behind' },
    subtitle: {
      uz: "TEDxSergeliSpecializedSchool jamoasi — ishtiyoqli va g'oyalar kuchiga ishonuvchi yoshlar.",
      ru: 'Команда TEDxSergeliSpecializedSchool — увлечённая молодёжь, верящая в силу идей.',
      en: 'The TEDxSergeliSpecializedSchool team — passionate youth who believe in the power of ideas.',
    },
    roles: {
      organizer: { uz: 'Tashkilotchi', ru: 'Организатор', en: 'Organizer' },
      coOrganizer: { uz: 'Hammualliflik-tashkilotchi', ru: 'Со-организатор', en: 'Co-Organizer' },
      smmManager: { uz: 'SMM menejeri', ru: 'SMM-менеджер', en: 'SMM Manager' },
      smmHelper: { uz: 'SMM yordamchisi', ru: 'Помощник SMM-менеджера', en: 'SMM Helper' },
      headDesigner: { uz: 'Bosh dizayner', ru: 'Главный дизайнер', en: 'Head Designer' },
      designerAssistant: { uz: 'Dizayner yordamchisi', ru: 'Помощник дизайнера', en: 'Designer Assistant' },
      headWebsiteManager: { uz: 'Bosh veb-sayt menejeri', ru: 'Главный менеджер сайта', en: 'Head Website Manager' },
      websiteDeveloper: { uz: 'Veb-sayt dasturchisi', ru: 'Разработчик сайта', en: 'Website Developer' },
    },
  },
  cta: {
    label: { uz: "Qo'shiling", ru: 'Присоединяйтесь', en: 'Join us' },
    titleStart: { uz: 'TEDxSergeliSpecializedSchool', ru: 'Станьте частью', en: 'Be part of' },
    titleAccent: { uz: "ga qo'shiling", ru: 'TEDxSergeliSpecializedSchool', en: 'TEDxSergeliSpecializedSchool' },
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
    headline: {
      uz: "G'OYALARNI BIRGA TARQATAMIZ",
      ru: 'РАСПРОСТРАНЯЕМ ИДЕИ ВМЕСТЕ',
      en: 'SPREADING IDEAS TOGETHER',
    },
    desc: {
      uz: "TEDxSergeliSpecializedSchool — Toshkentda tashkil etilgan mustaqil TEDx tadbiri. G'oyalarni tarqatamiz.",
      ru: 'TEDxSergeliSpecializedSchool — независимое мероприятие TEDx в Ташкенте. Распространяем идеи.',
      en: 'TEDxSergeliSpecializedSchool — an independently organized TEDx event in Tashkent. Spreading ideas.',
    },
    license: {
      uz: 'Bu mustaqil TEDx tadbiri TED litsenziyasi asosida tashkil etilgan.',
      ru: 'Это независимое мероприятие TEDx организовано по лицензии TED.',
      en: 'This independent TEDx event is operated under license from TED.',
    },
  },
  tickets: {
    badge: { uz: '🔥 TEZ KUNDA | JOYLAR CHEKLANGAN', ru: '🔥 СКОРО | МЕСТА ОГРАНИЧЕНЫ', en: '🔥 COMING SOON | LIMITED SEATS' },
    title: { uz: 'Joyingizni hoziroq band qiling!', ru: 'Забронируйте свое место прямо сейчас!', en: 'Book your seat right now!' },
    desc: { 
      uz: "TEDxSergeli — ilhomlantiruvchi nutqlar, kuchli netvorking va yangi g'oyalar jamlangan maskan.", 
      ru: 'TEDxSergeli — это пространство вдохновляющих выступлений, сильного нетворкинга и новых идей.', 
      en: 'TEDxSergeli — a place for inspiring talks, strong networking and new ideas.' 
    },
    features: [
      { uz: '🎤 6+ ta kuchli spiker nutqi', ru: '🎤 6+ сильных выступлений', en: '🎤 6+ powerful speakers' },
      { uz: '🤝 Netvorking va coffee-break zone', ru: '🤝 Нетворкинг и кофе-брейк зона', en: '🤝 Networking and coffee break zone' },
      { uz: "🎁 Esdalik sovg'alari va sertifikat", ru: '🎁 Памятные подарки и сертификат', en: '🎁 Souvenirs and certificate' },
    ],
    priceLabel: { uz: 'CHIPTA NARXI:', ru: 'СТОИМОСТЬ БИЛЕТА:', en: 'TICKET PRICE:' },
    oldPrice: { uz: '80 000 UZS', ru: '80 000 UZS', en: '80 000 UZS' },
    price: { uz: '49 999 UZS', ru: '49 999 UZS', en: '49 999 UZS' },
    ctaBtn: { uz: 'Telegram orqali xarid qilish', ru: 'Купить через Telegram', en: 'Buy via Telegram' },
    time: {
      days: { uz: 'kun', ru: 'дней', en: 'days' },
      hours: { uz: 'soat', ru: 'часов', en: 'hours' },
      minutes: { uz: 'daqiqa', ru: 'минут', en: 'minutes' },
      seconds: { uz: 'soniya', ru: 'секунд', en: 'seconds' }
    }
  },
  aboutTed: {
    aboutTedxTitle: { uz: 'TEDx haqida, x = mustaqil tashkil etilgan tadbir', ru: 'О TEDx, x = независимо организованное мероприятие', en: 'About TEDx, x = independently organized event' },
    aboutTedxDesc: {
      uz: "G'oyalarni kashf etish va tarqatish ruhida TEDx — bu odamlarga TED formatidagi tajribani baham ko'rish imkonini beradigan mahalliy, mustaqil tashkil etilgan tadbirlar dasturi. TEDx tadbirida TED Talks videolari va jonli spikerlar birgalikda kichik guruhda chuqur muhokama va samimiy muloqotni rag'batlantiradi. Ushbu mahalliy, mustaqil tashkil etilgan tadbirlar TEDx nomi bilan ataladi, bunda x = mustaqil tashkil etilgan TED tadbiri. TED konferensiyasi TEDx dasturi uchun umumiy ko'rsatmalar beradi, ammo har bir TEDx tadbiri (ma'lum qoidalar va shartlarga muvofiq) mustaqil tashkil etiladi.",
      ru: 'В духе поиска и распространения идей TEDx — это программа местных, самостоятельно организованных мероприятий, которые объединяют людей для обмена опытом в стиле TED. На мероприятии TEDx видео TED Talks и живые выступления спикеров объединяются, чтобы вызвать глубокую дискуссию и создать связи. Эти местные, самостоятельно организованные мероприятия носят бренд TEDx, где x = независимо организованное мероприятие TED. Конференция TED предоставляет общие рекомендации для программы TEDx, но отдельные мероприятия TEDx организуются самостоятельно. (С учетом определенных правил и норм.)',
      en: 'In the spirit of discovering and spreading ideas, TEDx is a program of local, self-organized events that bring people together to share a TED-like experience. At a TEDx event, TED Talks video and live speakers combine to spark deep discussion and connection. These local, self-organized events are branded TEDx, where x = independently organized TED event. The TED Conference provides general guidance for the TEDx program, but individual TEDx events are self-organized. (Subject to certain rules and regulations.)'
    },
    aboutTedTitle: { uz: 'TED haqida', ru: 'О TED', en: 'About TED' },
    aboutTedDesc1: {
      uz: "TED — bu notijorat, xolis tashkilot bo'lib, suhbatni kuchaytiradigan, tushunishni chuqurlashtiradigan va mazmunli o'zgarishlarga turtki beradigan g'oyalarni kashf etish, muhokama qilish va tarqatishga qaratilgan. Bizning tashkilotimiz qiziquvchanlik, aql, mo'jiza va bilim izlashga (hech qanday yashirin maqsadsiz) bag'ishlangan. Biz dunyoni va boshqalar bilan aloqani chuqurroq tushunishga intilayotgan barcha fan va madaniyat vakillarini qutlaymiz va barchani g'oyalar bilan qatnashishga hamda ularni o'z jamoasida faollashtirishga chorlaymiz.",
      ru: 'TED — это некоммерческая, беспартийная организация, деятельность которой посвящена поиску, обсуждению и распространению идей, способствующих диалогу, углублению понимания и стимулированию значимых изменений. Наша организация посвящена любознательности, разуму, удивлению и поиску знаний — без какой-либо скрытой повестки. Мы приветствуем людей из всех дисциплин и культур, которые ищут более глубокого понимания мира и связей с другими, и мы приглашаем всех взаимодействовать с идеями и активировать их в своем сообществе.',
      en: 'TED is a nonprofit, nonpartisan organization dedicated to discovering, debating and spreading ideas that spark conversation, deepen understanding and drive meaningful change. Our organization is devoted to curiosity, reason, wonder and the pursuit of knowledge — without an agenda. We welcome people from every discipline and culture who seek a deeper understanding of the world and connection with others, and we invite everyone to engage with ideas and activate them in your community.'
    },
    aboutTedDesc2: {
      uz: "TED 1984-yilda Texnologiya, O'yin-kulgi (Entertainment) va Dizayn birlashgan konferensiya sifatida boshlangan, biroq bugungi kunda u ilm-fan va biznesdan tortib ta'lim, san'at va global muammolargacha bo'lgan hamma narsani o'rganuvchi ko'plab butunjahon hamjamiyatlari va tashabbuslarni qamrab oladi. TED.com saytida nashr etilgan yillik konferensiyalarimizdan saralangan TED Talks-dan tashqari, biz original podkastlar, qisqa metrajli videolar seriyasi, animatsion ta'lim darslari (TED-Ed) va 100 dan ortiq tillarga tarjima qilinadigan teledasturlar tayyorlaymiz.",
      ru: 'TED зародился в 1984 году как конференция, где сходились Технологии, Развлечения и Дизайн (Technology, Entertainment and Design), но сегодня он охватывает множество всемирных сообществ и инициатив, исследующих все — от науки и бизнеса до образования, искусств и глобальных проблем. В дополнение к видео TED Talks, собранным на наших ежегодных конференциях и опубликованным на TED.com, мы создаем оригинальные подкасты, короткие видеосериалы, анимированные образовательные уроки (TED-Ed) и телепрограммы, которые переводятся более чем на 100 языков и распространяются через партнерства по всему миру.',
      en: 'TED began in 1984 as a conference where Technology, Entertainment and Design converged, but today it spans a multitude of worldwide communities and initiatives exploring everything from science and business to education, arts and global issues. In addition to the TED Talks curated from our annual conferences and published on TED.com, we produce original podcasts, short video series, animated educational lessons (TED-Ed) and TV programs that are translated into more than 100 languages and distributed via partnerships around the world. Each year, thousands of independently run TEDx events bring people together to share ideas and bridge divides in communities on every continent. Through the Audacious Project, TED has helped catalyze $6.6 billion in funding for projects that support bold solutions to the world\'s most urgent challenges — working to make the world more beautiful, sustainable and just. In 2020, TED launched Countdown, an initiative to accelerate solutions to the climate crisis and mobilize a movement for a net-zero future, and in 2023 TED launched TED Democracy to spark a new kind of conversation focused on realistic pathways towards a more vibrant and equitable future. View a full list of TED’s many programs and initiatives.'
    },
    follow: { uz: 'TED-ni ijtimoiy tarmoqlarda kuzatib boring:', ru: 'Следите за TED в:', en: 'Follow TED on:' }
  }
} as const;
