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
    subheadline: {
      uz: "Dunyoni boshqacha ko'rishga undovchi 7 ta ilhomlantiruvchi g'oya. Kuchli netvorking va soha yetakchilari bilan uchrashuv.",
      ru: "7 вдохновляющих идей, которые изменят ваш взгляд на мир. Мощный нетворкинг и инсайты от лидеров индустрии.",
      en: "7 inspiring ideas that will change your perspective. Powerful networking and insights from industry leaders."
    },
    scarcityBadge: {
      uz: "🔥 Atigi 15% chiptalar qoldi",
      ru: "🔥 Осталось всего 15% билетов",
      en: "🔥 Only 15% of tickets left"
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
      uz: "TEDxSergeli sahnasidagi ilhomlantiruvchi spikerlar va ularning g'oyalari.",
      ru: 'Вдохновляющие спикеры на сцене TEDxSergeli и их уникальные идеи.',
      en: 'Inspiring speakers on the TEDxSergeli stage sharing ideas worth spreading.',
    },
    readBio: { uz: 'Batafsil ma\'lumot', ru: 'Подробнее', en: 'Read Bio' },
    closeModal: { uz: 'Yopish', ru: 'Закрыть', en: 'Close' },
    list: [
      {
        id: 'abdulla-azizov',
        name: { uz: 'Abdulla Azizov', ru: 'Абдулла Азизов', en: 'Abdulla Azizov' },
        title: {
          uz: "Farmatsevtika tarmog'ini rivojlantirish agentligi rahbari",
          ru: 'Руководитель Агентства по развитию фармацевтической отрасли',
          en: 'Head of Medical & Pharmaceutical Industry Development Agency',
        },
        bio: {
          uz: "2004-yilda Toshkent jahon iqtisodiyoti va diplomatiya universitetining Xalqaro iqtisodiy munosabatlar yo'nalishini tamomlagan. 2003-yilda Nagoya universitetida (Yaponiya) iqtisodiyot sohasida tahsil olgan. 2006-yilda Oarhus universitetida (Daniya) Moliya magistri darajasini olgan va Oarhus texnik kollejini IT-dasturlash mutaxassisligi bo'yicha tamomlagan. 2006–2019-yillarda Daniyadagi APM-Maersk A/S, Orsted A/S, Carlsberg A/S, Implement consulting group, Vestas A/S va Danfoss kabi kompaniyalarda moliya va biznes-jarayonlarni raqamlashtirish hamda avtomatlashtirish sohasida mehnat qilgan. 2019–2020-yillarda O'zbekiston Respublikasi Davlat soliq qo'mitasi raisi o'rinbosari, 2020–2022-yillarda Sog'liqni saqlash vaziri o'rinbosari, 2022-yildan 'Olmaliq KMK' AJ Boshqaruv raisining raqamlashtirish bo'yicha o'rinbosari lavozimlarida faoliyat yuritgan.",
          ru: "В 2004 году окончил Университет мировой экономики и дипломатии в Ташкенте по специальности «Международные экономические отношения». В 2003 году изучал экономику в Университете Нагоя (Япония). В 2006 году получил степень магистра финансов в Орхусском университете (Дания) и окончил Технический колледж Орхуса по специальности «IT-программирование». В 2006–2019 годах работал в сфере цифровизации и автоматизации финансовых и бизнес-процессов в датских компаниях, таких как APM-Maersk A/S, Orsted A/S, Carlsberg A/S, Implement consulting group, Vestas A/S и Danfoss. В 2019 году — советник и зампредседателя Государственного налогового комитета РУз. С июля 2020 года — заместитель министра здравоохранения. С января 2022 года — заместитель председателя правления АО «Алмалыкский ГМК» по цифровизации.",
          en: "In 2004 he graduated from the University of World Economy and Diplomacy in Tashkent with Bachelor's degree in International Economic Relations. In 2003, he studied economics at Nagoya University (Japan). In 2006, he received a master's degree in Finance from the University of Aarhus (Denmark) and graduated from the Technical College of Aarhus with a professional degree in IT-programming. In 2006-2019, he worked in the field of digitalisation and automation of financial and business processes in Danish companies such as APM-Maersk A/S, Orsted A/S, Carlsberg A/S, Implement consulting group, Vestas A/S and Danfoss. In May-August 2019, Mr. Azizov worked at the State Tax Committee as an advisor to the Chairman. In September 2019, he was appointed Deputy Chairman of the State Tax Committee of the Republic of Uzbekistan. In July 2020, he became Deputy Minister of Health. Since January 2022, he has been the Deputy Chairman of the Board of Almalyk MMC JSC and responsible for digitalization.",
        },
        image: '/speakers/abdulla-azizov.jpg',
      },
      {
        id: 'odilbek-mirzayev',
        name: { uz: 'Odilbek Mirzayev', ru: 'Одилбек Мирзаев', en: 'Odilbek Mirzayev' },
        title: {
          uz: 'PDP Ecosystem va PDP Academy asoschisi hamda CEO',
          ru: 'Основатель и CEO PDP Ecosystem',
          en: 'Founder and CEO of PDP Ecosystem',
        },
        bio: {
          uz: "Odilbek Mirzayev — Toshkentda joylashgan PDP Academy va PDP Ecosystem asoschisi. O'zbekiston Respublikasi Bosh prokuraturasi, Davlat soliq qo'mitasi, Iqtisodiy taraqqiyot va kambag'allikni qisqartirish vazirligi hamda O'zbekiston respublika tovar-xom ashyo birjasida boy tajribaga ega. Toshkent axborot texnologiyalari universiteti bakalavriat bitiruvchisi (2008-2012).",
          ru: "Одилбек Мирзаев — основатель PDP Academy и PDP Ecosystem в Ташкенте. Имеет богатый опыт работы в Генеральной прокуратуре Республики Узбекистан, Государственном налоговом комитете, Министерстве экономического развития и сокращения бедности, а также на Узбекской республиканской товарно-сырьевой бирже. Выпускник Ташкентского университета информационных технологий (2008-2012).",
          en: "Odilbek Mirzayev, based in Tashkent, UZ, is currently a Founder at PDP Academy. Odilbek Mirzayev brings experience from previous roles at General Prosecutor's Office of Republic of Uzbekistan, State Tax Committee of the Republic of Uzbekistan, Ministry of Economic Development and Poverty Reduction of the Republic of Uzbekistan and Uzbek commodity exchange. Odilbek Mirzayev holds a 2008 - 2012 Bachelors @ Tashkent University of Information Technologies.",
        },
        image: '/speakers/odilbek-mirzayev.jpg',
      },
      {
        id: 'abrorbek-sharipov',
        name: { uz: 'Abrorbek Sharipov', ru: 'Аброрбек Шарипов', en: 'Abrorbek Sharipov' },
        title: {
          uz: 'jobster.hr va ishGO.uz asoschisi va CEO',
          ru: 'Основатель и CEO jobster.hr и ishGO.uz',
          en: 'Founder & CEO of jobster.hr and ishGO.uz',
        },
        bio: {
          uz: "Abrorbek Sharipov — jobster.hr va ishGO.uz kabi zamonaviy HR va ishga joylashtirish platformalarining asoschisi hamda rahbari. Mehnat bozori va kadrlar bilan ishlashda innovatsion texnologiyalarni joriy etib kelmoqda.",
          ru: "Аброрбек Шарипов — основатель и руководить инновационных HR- и рекрутинговых платформ jobster.hr и ishGO.uz. Внедряет передовые технологические решения в сферу трудоустройства.",
          en: "Abrorbek Sharipov is the founder and CEO of jobster.hr and ishGO.uz, leading recruitment platforms transforming hiring and HR technology.",
        },
        image: '/speakers/abrorbek-sharipov.jpg',
      },
      {
        id: 'diyora-mamirjanova',
        name: { uz: 'Diyora Mamirjanova', ru: 'Диёра Мамиржанова', en: 'Diyora Mamirjanova' },
        title: {
          uz: "O'zbekiston Jurnalistika va ommaviy kommunikatsiyalar universiteti 1-kurs talabasi",
          ru: 'Студентка 1-го курса Университета журналистики и массовых коммуникаций Узбекистана',
          en: '1st-year student at University of Journalism & Mass Communications',
        },
        bio: {
          uz: "«Biz tarixdagidan ko'ra ko'proq ma'lumotga egamiz, lekin rostdan ham yaxshiroq fikrlaydigan bo'lyapmizmi?»\n\nDiyora axborot asrida tanqidiy fikrlash, axborot iste'moli va fikrlash madaniyati mavzusida o'z fikrlari bilan bo'lishadi.",
          ru: "«У нас есть доступ к большему количеству информации, чем когда-либо, но становимся ли мы лучше мыслить на самом деле?»\n\nДиёра делится глубоким взглядом на критическое мышление и восприятие информации в эпоху информационного изобилия.",
          en: "“We have access to more information than ever, but are we actually becoming better thinkers?”\n\nDiyora explores information overload, critical thinking, and media literacy in the modern era.",
        },
        image: '/speakers/diyora-mamirjanova.jpg',
      },
      {
        id: 'abdulaziz-sharipov',
        name: { uz: 'Abdulaziz Sharipov', ru: 'Абдулазиз Шарипов', en: 'Abdulaziz Sharipov' },
        title: {
          uz: "Konya Anadolu International maktabi o'quvchisi",
          ru: 'Ученик international школы Konya Anadolu International',
          en: 'Student at Konya Anadolu International',
        },
        bio: {
          uz: "Abdulaziz Sharipov — Konya Anadolu International xalqaro maktabi o'quvchisi. Zamonaviy ta'lim, shaxsiy o'sish va yoshlarning kelajakka bo'lgan intilishlari haqida sahnada so'z yuritadi.",
          ru: "Абдулазиз Шарипов — ученик международной школы Konya Anadolu International. Выступает с идеями о современном образовании и личностном росте.",
          en: "Abdulaziz Sharipov is a student at Konya Anadolu International, presenting fresh perspectives on modern learning and personal growth.",
        },
        image: '/speakers/abdulaziz-sharipov.jpg',
      },
      {
        id: 'kamola-sirojiddinova',
        name: { uz: 'Kamola Sirojiddinova', ru: 'Камола Сирожиддинова', en: 'Kamola Sirojiddinova' },
        title: {
          uz: "Sergeli ixtisoslashtirilgan maktabi o'quvchisi",
          ru: 'Ученица Специализированной школы Сергели',
          en: 'Student at Sergeli Specialized School',
        },
        bio: {
          uz: "Kamola Sirojiddinova — Sergeli ixtisoslashtirilgan maktabining faol o'quvchilaridan biri. U jamiyatda va ta'limda yangi imkoniyatlarni kashf etish mavzusida maruza qiladi.",
          ru: "Камола Сирожиддинова — активная ученица Специализированной школы Сергели. Выступает с докладом о поиске новых возможностей в учебе и жизни.",
          en: "Kamola Sirojiddinova is a driven student at Sergeli Specialized School, inspiring youth to embrace new opportunities in education and beyond.",
        },
        image: '/speakers/kamola-sirojiddinova.jpg',
      },
      {
        id: 'eva-korneeva',
        name: { uz: 'Eva Korneeva', ru: 'Ева Корнеева', en: 'Eva Korneeva' },
        title: {
          uz: "Speak Up tillar maktabi o'qituvchisi",
          ru: 'Преподаватель в языковой школе Speak Up',
          en: 'Teacher at Speak Up Language School',
        },
        bio: {
          uz: "«Ta'limning maqsadi bizga tayyor javoblar berish emas, balki to'g'ri savol berishni o'rgatish bo'lsa-chi?»\n\nEva zamonaviy ta'lim falsafasi va qiziquvchanlikning shaxsiy rivojlanishdagi o'rni haqida so'zlaydi.",
          ru: "«Что, если цель образования — не давать готовые ответы, а научить задавать правильные вопросы?»\n\nЕва раскроет ключевую концепцию современного обучения через осознанность и правильные вопросы.",
          en: "“What if the purpose of education isn’t to give us answers, but to teach us how to question?”\n\nEva shares powerful insights on modern pedagogy, curiosity, and questioning status quo.",
        },
        image: '/speakers/eva-korneeva.jpg',
      },
      {
        id: 'sodiq-abdugafarov',
        name: { uz: 'Sodiq Abdugafarov', ru: 'Содик Абдугафаров', en: 'Sodiq Abdugafarov' },
        title: {
          uz: "Ideal Study o'quvchisi",
          ru: 'Ученик Ideal Study',
          en: 'Student at Ideal Study',
        },
        bio: {
          uz: "Sodiq Abdugafarov — Ideal Study o'quvchisi, yoshlarning salohiyatini ro'yobga chiqarish va yangi marralarni zabt etish haqida ilhomlantiruvchi nutq so'zlaydi.",
          ru: "Содик Абдугафаров — ученик Ideal Study, делится мнением о раскрытии потенциала и стремлении к большим целям.",
          en: "Sodiq Abdugafarov is a student at Ideal Study delivering an inspiring talk on unlocking youth potential and achieving high ambitions.",
        },
        image: '/speakers/sodiq-abdugafarov.jpg',
      },
      {
        id: 'laziza-tuymiratova',
        name: { uz: 'Laziza Tuymiratova', ru: 'Лазиза Туймиратова', en: 'Laziza Tuymiratova' },
        title: {
          uz: "21-maktab o'quvchisi, yosh tadqiqotchi",
          ru: 'Ученица 21-й школы, молодой исследователь',
          en: 'Student of 21st school, young researcher',
        },
        bio: {
          uz: "«Kuchning eng oliy belgisi — bahsda yutib chiqish emas, balki o'z kibridan ko'ra haqiqatga ochiq bo'lishdir.»\n\nLaziza mulohaza yuritish, haqiqatni izlash va fikrlash moslashuvchanligi haqida ma'ruza qiladi.",
          ru: "«Высший признак силы — не победа в споре, а способность открыть разум истине, которая выше эго».\n\nЛазиза поднимает вопросы гибкости ума, осознанности и поиска истины.",
          en: "“The ultimate sign of strength isn't winning an argument, but opening your mind to a truth higher than your ego.”\n\nLaziza presents thoughts on intellectual humility, strength, and open-mindedness.",
        },
        image: '/speakers/laziza-tuymiratova.jpg',
      },
      {
        id: 'shamshod-xolmurodov',
        name: { uz: 'Shamshod Xolmurodov', ru: 'Шамшод Холмуродов', en: 'Shamshod Xolmurodov' },
        title: {
          uz: "Sergeli ixtisoslashtirilgan maktabi o'quvchisi",
          ru: 'Ученик Специализированной школы Сергели',
          en: 'Student at Sergeli Specialized School',
        },
        bio: {
          uz: "«Gigiyena paradoksi» bilan tanishing: nima uchun kundalik hayotdagi ozgina kir va mikroblar immun tizimini kuchaytirishning siri bo'lishi mumkin?\n\nShamshod biologiya va immunologiya sohasidagi qiziqarli g'oyasini namoyish etadi.",
          ru: "Откройте для себя «Парадокс гигиены»: почему небольшое количество повседневной грязи на самом деле может быть секретом сильного иммунитета.\n\nШамшод делится интригующим научным взглядом на здоровье и иммунитет.",
          en: "Discover the “Hygiene Paradox” and why a little bit of everyday dirt might actually be the secret to a stronger immune system.\n\nShamshod explores fascinating concepts in human immunity and biology.",
        },
        image: '/speakers/shamshod-xolmurodov.jpg',
      },
    ],
    teasers: [],
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
      uz: "TEDxSergeli Specialized School — ilhomlantiruvchi nutqlar, kuchli networking va yangi g'oyalar jamlangan maskan.", 
      ru: 'TEDxSergeli Specialized School — место вдохновляющих выступлений, сильного нетворкинга и новых идей.', 
      en: 'TEDxSergeli Specialized School — a venue for inspiring talks, strong networking, and new ideas.' 
    },
    fomoNotice: {
      uz: "Barcha o'rinlar bir xil narxda! Erta joy band qilish imkoniyati.",
      ru: "Все места по одной цене! Успейте занять лучшие места заранее.",
      en: "All seats at the same price! Book early to get the best seats."
    },
    soldBadge: {
      uz: '🔥 75% chiptalar sotildi',
      ru: '🔥 75% билетов продано',
      en: '🔥 75% tickets sold'
    },
    limitedSeats: {
      uz: '⚡ Cheklangan 100 ta joy',
      ru: '⚡ Ограничено 100 мест',
      en: '⚡ Limited to 100 seats'
    },
    features: [
      { uz: '📜 Rasmiy litsenziyalangan TEDx tadbiri', ru: '📜 Официальное лицензированное событие TEDx', en: '📜 Officially licensed TEDx event' },
      { uz: '🎤 Mashhur va tajribali spikerlar nutqi', ru: '🎤 Выступления известных спикеров', en: '🎤 Talks by renowned speakers' },
      { uz: "💡 Yangi g'oyalar va ilhom manbai", ru: '💡 Новые идеи и источник вдохновения', en: '💡 New ideas and source of inspiration' },
      { uz: '🤝 Kuchli va foydali networking', ru: '🤝 Мощный полезный нетворкинг', en: '🤝 Powerful and valuable networking' },
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
