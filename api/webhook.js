import QRCode from 'qrcode';

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

// Lightweight KV implementation for Upstash Redis
const kv = {
  get: async (key) => {
    if (!KV_URL || !KV_TOKEN) {
      throw new Error('KV REST credentials are not configured');
    }
    try {
      const res = await fetch(`${KV_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data && data.error) {
        throw new Error(String(data.error));
      }
      if (!data.result) return null;

      let parsed = JSON.parse(data.result);
      if (typeof parsed === 'string') {
        try { parsed = JSON.parse(parsed); } catch (_err) { }
      }
      return parsed;
    } catch (e) {
      console.error('KV GET Error:', e);
      throw e;
    }
  },
  set: async (key, value) => {
    if (!KV_URL || !KV_TOKEN) return false;
    try {
      const res = await fetch(`${KV_URL}/set/${key}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KV_TOKEN}` },
        body: typeof value === 'object' ? JSON.stringify(value) : String(value)
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data && data.error) {
        throw new Error(String(data.error));
      }
      return true;
    } catch (e) {
      console.error('KV SET Error:', e);
      return false;
    }
  }
};

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const VOLUNTEER_THREAD_ID = process.env.TELEGRAM_VOLUNTEER_THREAD_ID || process.env.VOLUNTEER_TOPIC_ID || '2';
const TICKET_THREAD_ID = process.env.TELEGRAM_TICKET_THREAD_ID || process.env.TOPIC_ID_TICKETS || process.env.TICKETS_TOPIC_ID || process.env.ADMIN_TOPIC_ID || '4';
const SUPER_ADMIN_ID = '6804139305'; // Founder Telegram ID
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
const BOT_USERNAME = 'TEDxSergeliBot';

// Production WebApp Domain (Prevents Vercel preview login wall)
const PUBLIC_DOMAIN = process.env.PUBLIC_URL || 'https://tedx-sergeli.vercel.app';

// Referral & Bonus Settings (Configurable)
const MAX_BONUS_COVERAGE_PERCENT = parseInt(process.env.MAX_BONUS_COVERAGE_PERCENT || '50', 10);
const REFERRAL_REGISTER_BONUS = 5000;
const REFERRAL_PURCHASE_BONUS = 10000;
const BASE_TICKET_PRICE = 49999;

function getUserKeyboard(lang = 'ru') {
  if (lang === 'uz') {
    return {
      keyboard: [
        [{ text: "🏆 Referallar tanlovi (Top-3)" }],
        [{ text: "🎁 Referal dasturi / Cashback" }],
        [{ text: "🎟 Mening chiptam" }, { text: "ℹ️ Ma'lumot" }]
      ],
      resize_keyboard: true,
      persistent: true
    };
  } else if (lang === 'en') {
    return {
      keyboard: [
        [{ text: "🏆 Referral Contest (Top-3)" }],
        [{ text: "🎁 Referral / Cashback" }],
        [{ text: "🎟 My Ticket" }, { text: "ℹ️ Help" }]
      ],
      resize_keyboard: true,
      persistent: true
    };
  }
  return {
    keyboard: [
      [{ text: "🏆 Конкурс рефералов (Топ-3)" }],
      [{ text: "🎁 Реферальная программа / Кешбэк" }],
      [{ text: "🎟 Мой билет" }, { text: "ℹ️ Инструкция" }]
    ],
    resize_keyboard: true,
    persistent: true
  };
}

function anonymizeUserName(name, username, userId) {
  if (name && typeof name === 'string' && name.trim() && !/^(?:mehmon|guest|гость)$/i.test(name.trim())) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      const firstName = parts[0];
      const lastNameInitial = parts[1].charAt(0).toUpperCase();
      return `${firstName} ${lastNameInitial}.`;
    } else {
      return parts[0];
    }
  }

  if (username && typeof username === 'string' && username.trim()) {
    const cleanUser = username.trim().replace(/^@/, '');
    if (cleanUser.length <= 4) {
      return `@${cleanUser.slice(0, 2)}***`;
    }
    return `@${cleanUser.slice(0, 3)}***`;
  }

  const idStr = String(userId || '');
  return `Участник #${idStr.length > 4 ? idStr.slice(-4) : idStr}`;
}

async function getReferralLeaderboard() {
  const allUserIds = (await kv.get('all_user_ids')) || [];
  if (!Array.isArray(allUserIds) || allUserIds.length === 0) {
    return { topList: [], userRankMap: {}, totalParticipants: 0 };
  }

  const userPromises = allUserIds.map(async (id) => {
    try {
      const u = await kv.get(`user:${id}`);
      return { id: String(id), user: u };
    } catch (_err) {
      return { id: String(id), user: null };
    }
  });

  const rawUsers = await Promise.all(userPromises);

  const extraAdmins = (await kv.get('super_admins')) || [];
  const scanners = (await kv.get('allowed_scanners')) || [];
  const adminSet = new Set([
    SUPER_ADMIN_ID,
    String(ADMIN_CHAT_ID || ''),
    ...extraAdmins.map(a => String(a).toLowerCase().replace('@', '')),
    ...scanners.map(s => String(s).toLowerCase().replace('@', ''))
  ]);

  const candidates = [];
  for (const { id, user } of rawUsers) {
    if (!user) continue;
    const userIdStr = String(id);
    const username = (user.username || '').toLowerCase().replace('@', '');

    if (adminSet.has(userIdStr) || (username && adminSet.has(username))) {
      continue;
    }

    if (user.is_blocked || user.blocked || user.status === 'blocked') {
      continue;
    }

    const invitedCount = typeof user.invited_count === 'number' ? user.invited_count : 0;
    const bonusBalance = typeof user.bonus_balance === 'number' ? user.bonus_balance : 0;
    const displayName = anonymizeUserName(user.name, user.username, id);

    candidates.push({
      userId: userIdStr,
      name: user.name || null,
      username: user.username || null,
      displayName,
      invitedCount,
      bonusBalance
    });
  }

  candidates.sort((a, b) => {
    if (b.invitedCount !== a.invitedCount) {
      return b.invitedCount - a.invitedCount;
    }
    return b.bonusBalance - a.bonusBalance;
  });

  const userRankMap = {};
  candidates.forEach((cand, idx) => {
    cand.rank = idx + 1;
    userRankMap[cand.userId] = idx + 1;
  });

  return {
    topList: candidates,
    userRankMap,
    totalParticipants: candidates.length
  };
}

async function sendReferralContestMessage(chatId, user) {
  const { topList, userRankMap } = await getReferralLeaderboard();
  const userIdStr = String(chatId);
  const userLang = user.lang || 'ru';
  const myInvitedCount = typeof user.invited_count === 'number' ? user.invited_count : 0;
  const userRank = userRankMap[userIdStr] ? userRankMap[userIdStr] : (topList.length + 1);
  const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${chatId}`;

  const medals = ['🥇 1.', '🥈 2.', '🥉 3.', '4.', '5.'];
  let topLines = [];

  const top5 = topList.slice(0, 5);
  if (top5.length === 0) {
    topLines.push('<i>Пока нет участников с приглашениями. Станьте первым!</i>');
  } else {
    top5.forEach((cand, i) => {
      const prefix = medals[i] || `${i + 1}.`;
      topLines.push(`${prefix} ${escapeHtml(cand.displayName)} — <b>${cand.invitedCount}</b> чел.`);
    });
  }

  let text = '';
  let shareText = '';

  if (userLang === 'uz') {
    text = `🔥 <b>TEDx CHIPTA LIDERLARI POYGASI!</b> 🔥\n\n` +
      `Do'stlaringizni taklif havolangiz orqali <b>3-sentabr 23:59</b> ga qadar taklif qiling!\n` +
      `Eng ko'p do'st taklif qilgan <b>TOP-3</b> ishtirokchi <b>TEDxSergeli ga bepul chipta</b> yutib oladi!\n\n` +
      `📊 <b>Joriy TOP peshqadamlar:</b>\n` +
      topLines.join('\n') + `\n` +
      `─────────────────\n` +
      `👤 <b>Sizning o'rningiz:</b> #${userRank} (Taklif qilingan: <b>${myInvitedCount}</b> чел.)\n` +
      `🔗 <b>Sizning havolangiz:</b> <code>${refLink}</code>`;
    shareText = "TEDxSergeli konferensiyasiga taklif qilaman! Ushbu havola orqali ro'yxatdan o'ting:";
  } else if (userLang === 'en') {
    text = `🔥 <b>TEDx TICKET RACE!</b> 🔥\n\n` +
      `Invite friends using your link until <b>September 3, 23:59</b>!\n` +
      `The <b>TOP-3</b> participants with the most referrals will get <b>free tickets to TEDxSergeli</b>!\n\n` +
      `📊 <b>Current Leaderboard TOP:</b>\n` +
      topLines.join('\n') + `\n` +
      `─────────────────\n` +
      `👤 <b>Your Rank:</b> #${userRank} (Invited: <b>${myInvitedCount}</b> friends)\n` +
      `🔗 <b>Your Link:</b> <code>${refLink}</code>`;
    shareText = "Join TEDxSergeli event with me! Register via this link:";
  } else {
    text = `🔥 <b>ГОНКА ЗА БИЛЕТАМИ TEDx!</b> 🔥\n\n` +
      `Приглашай друзей по своей ссылке до <b>3 сентября 23:59</b>!\n` +
      `<b>ТОП-3</b> участника с наибольшим количеством приглашений получат <b>бесплатные билеты на TEDxSergeli</b>!\n\n` +
      `📊 <b>Текущий ТОП лидеров:</b>\n` +
      topLines.join('\n') + `\n` +
      `─────────────────\n` +
      `👤 <b>Ваша позиция:</b> #${userRank} (Приглашено: <b>${myInvitedCount}</b> чел.)\n` +
      `🔗 <b>Ваша ссылка:</b> <code>${refLink}</code>`;
    shareText = "Приглашаю на конференцию TEDxSergeli! Зарегистрируйся по моей ссылке:";
  }

  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;

  return await callTelegram('sendMessage', {
    chat_id: chatId,
    parse_mode: 'HTML',
    text,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: userLang === 'uz' ? "🔗 Havolani ulashish" : userLang === 'en' ? "🔗 Share link" : "🔗 Поделиться ссылкой",
            url: shareUrl
          }
        ]
      ]
    }
  });
}

async function sendReferralInfo(chatId, user) {
  const bonusBalance = typeof user.bonus_balance === 'number' ? user.bonus_balance : 0;
  const invitedCount = typeof user.invited_count === 'number' ? user.invited_count : 0;
  const userLang = user.lang || 'ru';
  const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${chatId}`;

  let text = '';
  let shareText = '';
  if (userLang === 'uz') {
    text = `🎁 <b>TEDxSergeli Referal dasturi:</b>\n` +
      `• <b>+5 000 UZS</b> — har bir taklif qilingan do'stingiz uchun.\n` +
      `• <b>+10 000 UZS</b> — do'stingiz chipta sotib olganida.\n\n` +
      `💰 <b>Sizning keshbek balansingiz:</b> ${bonusBalance.toLocaleString()} UZS\n` +
      `👥 <b>Taklif qilingan do'stlar:</b> ${invitedCount}\n\n` +
      `🔗 <b>Sizning havolangiz:</b> ${refLink}`;
    shareText = "TEDxSergeli konferensiyasiga taklif qilaman! Ushbu havola orqali ro'yxatdan o'ting:";
  } else if (userLang === 'en') {
    text = `🎁 <b>TEDxSergeli Referral Program:</b>\n` +
      `• <b>+5,000 UZS</b> — for each invited friend.\n` +
      `• <b>+10,000 UZS</b> — when your friend buys a ticket.\n\n` +
      `💰 <b>Your cashback balance:</b> ${bonusBalance.toLocaleString()} UZS\n` +
      `👥 <b>Invited friends:</b> ${invitedCount}\n\n` +
      `🔗 <b>Your link:</b> ${refLink}`;
    shareText = "Join TEDxSergeli event with me! Register via this link:";
  } else {
    text = `🎁 <b>Реферальная программа TEDx:</b>\n` +
      `• <b>+5 000 сум</b> — за каждого приглашенного друга.\n` +
      `• <b>+10 000 сум</b> — когда друг покупает билет.\n\n` +
      `💰 <b>Ваш баланс кешбэка:</b> ${bonusBalance.toLocaleString()} сум\n` +
      `👥 <b>Приглашено друзей:</b> ${invitedCount}\n\n` +
      `🔗 <b>Ваша ссылка:</b> ${refLink}`;
    shareText = "Приглашаю на конференцию TEDxSergeli! Зарегистрируйся по моей ссылке:";
  }

  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(shareText)}`;

  return await callTelegram('sendMessage', {
    chat_id: chatId,
    parse_mode: 'HTML',
    text,
    reply_markup: {
      inline_keyboard: [
        [
          { text: userLang === 'uz' ? "🔗 Havolani ulashish" : userLang === 'en' ? "🔗 Share link" : "🔗 Поделиться ссылкой", url: shareUrl }
        ]
      ]
    }
  });
}

async function sendPaymentInstructions(chatId, user) {
  const lang = user.lang || 'ru';
  const seatInfo = getSeatDetails(user.seatNumber || 1);
  const finalPrice = typeof user.finalPrice === 'number' ? user.finalPrice : BASE_TICKET_PRICE;
  const usedBonus = user.used_bonus_amount || 0;
  const promoCode = user.promoCode || null;
  const appliedDiscount = user.appliedDiscount || 0;

  let msg = '';
  if (lang === 'uz') {
    msg = `✅ <b>Joy tanlandi: #${seatInfo.seatNumber} (${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin)</b>\n\n` +
      (promoCode ? `🏷 <b>Promo-kod:</b> <code>${promoCode}</code> (-${appliedDiscount.toLocaleString()} UZS)\n` : '') +
      (usedBonus > 0 ? `🎁 <b>Keshbek bonusi:</b> -${usedBonus.toLocaleString()} UZS\n` : '') +
      `💳 <b>To'lov miqdori:</b> <b>${finalPrice.toLocaleString()} UZS</b>\n` +
      `⏳ <b>Eslatma:</b> To'lov chekini yuborish uchun sizda <b>15 daqiqa</b> bor.\n\n` +
      `💳 <b>Karta raqami:</b> <code>5614 6822 1091 3879</code>\n` +
      `👤 <b>Qabul qiluvchi:</b> Abidjanov Baxtiyor\n\n` +
      `📸 To'lovni amalga oshirgach, <b>chek (скриншот)</b>ni shu yerga yuboring.`;
  } else if (lang === 'en') {
    msg = `✅ <b>Seat selected: #${seatInfo.seatNumber} (${seatInfo.sectorName}, Row ${seatInfo.row} / Seat ${seatInfo.seat})</b>\n\n` +
      (promoCode ? `🏷 <b>Promo Code:</b> <code>${promoCode}</code> (-${appliedDiscount.toLocaleString()} UZS)\n` : '') +
      (usedBonus > 0 ? `🎁 <b>Cashback bonus:</b> -${usedBonus.toLocaleString()} UZS\n` : '') +
      `💳 <b>Amount to pay:</b> <b>${finalPrice.toLocaleString()} UZS</b>\n` +
      `⏳ <b>Notice:</b> You have <b>15 minutes</b> to send your payment receipt screenshot.\n\n` +
      `💳 <b>Card Number:</b> <code>5614 6822 1091 3879</code>\n` +
      `👤 <b>Recipient:</b> Abidjanov Baxtiyor\n\n` +
      `📸 After payment, please send the receipt screenshot here.`;
  } else {
    msg = `✅ <b>Место выбрано: №${seatInfo.seatNumber} (${seatInfo.sectorName}, ${seatInfo.row}-ряд / ${seatInfo.seat}-место)</b>\n\n` +
      (promoCode ? `🏷 <b>Промокод:</b> <code>${promoCode}</code> (-${appliedDiscount.toLocaleString()} UZS)\n` : '') +
      (usedBonus > 0 ? `🎁 <b>Списано бонусов:</b> -${usedBonus.toLocaleString()} UZS\n` : '') +
      `💳 <b>Сумма к оплате:</b> <b>${finalPrice.toLocaleString()} UZS</b>\n` +
      `⏳ <b>Внимание:</b> У вас есть <b>15 минут</b> на отправку чека об оплате.\n\n` +
      `💳 <b>Номер карты:</b> <code>5614 6822 1091 3879</code>\n` +
      `👤 <b>Получатель:</b> Abidjanov Baxtiyor\n\n` +
      `📸 После оплаты отправьте <b>скриншот чека</b> в этот чат.`;
  }

  const seatPickerUrl = `${PUBLIC_DOMAIN}/seat-picker`;
  return await callTelegram('sendMessage', {
    chat_id: chatId,
    parse_mode: 'HTML',
    text: msg,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: lang === 'uz' ? "🔄 Joyni o'zgartirish" : lang === 'en' ? "🔄 Change Seat" : "🔄 Сменить место",
            web_app: { url: seatPickerUrl }
          }
        ]
      ]
    }
  });
}

async function sendBonusOfferOrPayment(chatId, user, priceAfterPromo) {
  const currentBonus = typeof user.bonus_balance === 'number' ? user.bonus_balance : 0;
  const maxBonusCoverage = Math.floor(priceAfterPromo * (MAX_BONUS_COVERAGE_PERCENT / 100));
  const applicableBonus = Math.min(currentBonus, maxBonusCoverage);

  if (currentBonus > 0 && applicableBonus > 0) {
    user.step = 'BONUS_OFFER';
    user.pending_bonus_discount = applicableBonus;
    user.price_after_promo = priceAfterPromo;
    await kv.set(`user:${chatId}`, user);

    const lang = user.lang || 'ru';
    let text = '';
    let btnUseText = '';
    let btnSkipText = '';

    if (lang === 'uz') {
      text = `💰 <b>Sizda jamg'arilgan bonuslar bor!</b>\n\n` +
        `Sizning keshbek balansingiz: <b>${currentBonus.toLocaleString()} UZS</b>\n` +
        `Chipta narxining ${MAX_BONUS_COVERAGE_PERCENT}% gacha qismini bonus bilan to'lashingiz mumkin: <b>-${applicableBonus.toLocaleString()} UZS</b>\n\n` +
        `Chipta narxi: <s>${priceAfterPromo.toLocaleString()} UZS</s> ➡️ <b>${(priceAfterPromo - applicableBonus).toLocaleString()} UZS</b>\n\n` +
        `Chegirma uchun bonuslarni ishlatasizmi?`;
      btnUseText = `🎁 Bonuslarni ishlatish (-${applicableBonus.toLocaleString()} UZS)`;
      btnSkipText = `❌ Bonussiz davom etish`;
    } else if (lang === 'en') {
      text = `💰 <b>You have accumulated cashback bonuses!</b>\n\n` +
        `Your balance: <b>${currentBonus.toLocaleString()} UZS</b>\n` +
        `You can cover up to ${MAX_BONUS_COVERAGE_PERCENT}% of ticket price: <b>-${applicableBonus.toLocaleString()} UZS</b>\n\n` +
        `Ticket price: <s>${priceAfterPromo.toLocaleString()} UZS</s> ➡️ <b>${(priceAfterPromo - applicableBonus).toLocaleString()} UZS</b>\n\n` +
        `Apply bonuses for discount?`;
      btnUseText = `🎁 Apply bonuses (-${applicableBonus.toLocaleString()} UZS)`;
      btnSkipText = `❌ Continue without bonuses`;
    } else {
      text = `💰 <b>У вас есть накопительные бонусы!</b>\n\n` +
        `Ваш баланс кешбэка: <b>${currentBonus.toLocaleString()} UZS</b>\n` +
        `Вы можете списать до ${MAX_BONUS_COVERAGE_PERCENT}% от стоимости билета: <b>-${applicableBonus.toLocaleString()} UZS</b>\n\n` +
        `Стоимость билета: <s>${priceAfterPromo.toLocaleString()} UZS</s> ➡️ <b>${(priceAfterPromo - applicableBonus).toLocaleString()} UZS</b>\n\n` +
        `Применить бонусы для скидки?`;
      btnUseText = `🎁 Использовать бонусы (-${applicableBonus.toLocaleString()} сум)`;
      btnSkipText = `❌ Без бонусов`;
    }

    return await callTelegram('sendMessage', {
      chat_id: chatId,
      parse_mode: 'HTML',
      text,
      reply_markup: {
        inline_keyboard: [
          [{ text: btnUseText, callback_data: 'use_bonus' }],
          [{ text: btnSkipText, callback_data: 'skip_bonus' }]
        ]
      }
    });
  }

  user.step = 'PAYMENT';
  user.payment_status = 'pending_payment';
  user.finalPrice = priceAfterPromo;
  user.used_bonus_amount = 0;
  await kv.set(`user:${chatId}`, user);

  return await sendPaymentInstructions(chatId, user);
}

// This project talks to the Telegram Bot API directly, so conversational state
// is persisted in KV instead of being managed by a framework-level FSM.
const PROMO_CREATION_STATES = Object.freeze({
  CODE: 'PROMO_CREATE_CODE',
  DISCOUNT: 'PROMO_CREATE_DISCOUNT',
  LIMIT: 'PROMO_CREATE_LIMIT'
});

const PROMO_WIZARD_TTL_MS = 30 * 60 * 1000;
const PROMO_WIZARD_CANCEL_CALLBACK_PREFIX = 'promo_create_cancel';
const TELEGRAM_FORMAT_CHARS_RE = /[\p{Cf}\uFE00-\uFE0F]/gu;

const PROMO_WIZARD_CODE_PROMPT = `➕ <b>СОЗДАНИЕ ПРОМОКОДА — ШАГ 1/4</b>\n\n` +
  `Введите название промокода.\n\n` +
  `Пробелы будут удалены, а код автоматически переведён в верхний регистр.\n` +
  `Допустимы латинские буквы, цифры, дефис и подчёркивание.\n\n` +
  `Пример: <code>SALE20</code>`;

function createPromoWizardSessionId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function promoWizardCancelKeyboard(sessionId) {
  const callbackData = sessionId
    ? `${PROMO_WIZARD_CANCEL_CALLBACK_PREFIX}:${sessionId}`
    : PROMO_WIZARD_CANCEL_CALLBACK_PREFIX;

  return {
    inline_keyboard: [
      [{ text: "❌ Отмена", callback_data: callbackData }]
    ]
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeActionText(value) {
  return String(value || '')
    // NFC preserves the ℹ symbol; NFKC compatibility-normalizes it to "i".
    .normalize('NFC')
    .replace(TELEGRAM_FORMAT_CHARS_RE, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function isInstructionRequest(value) {
  const normalized = normalizeActionText(value);
  return /^(?:(?:ℹ|📖)\s*)?(?:инструкция(?:\s+контрол[её]ра)?|справка)$/iu.test(normalized) ||
    /^\/(?:help|instruction|help_admin)(?:@[A-Za-z0-9_]+)?$/iu.test(normalized);
}

function isAdminMenuButton(value) {
  const norm = normalizeActionText(value);
  return /^(?:📊\s*)?(?:статистика|live_stats|stats)$/iu.test(norm) ||
    /^(?:🏷\s*)?(?:промокоды|promos)$/iu.test(norm) ||
    /^(?:📋\s*)?(?:контролеры|scanners)$/iu.test(norm) ||
    /^(?:👑\s*)?(?:админы|admins)$/iu.test(norm) ||
    /^(?:🔍\s*)?(?:поиск пользователя|find_user)$/iu.test(norm) ||
    /^(?:🎟\s*)?(?:выдать билет|issue_ticket)$/iu.test(norm) ||
    /^(?:❌\s*)?скрыть меню$/iu.test(norm);
}

function normalizePromoCode(value) {
  return normalizeActionText(value).replace(/\s+/gu, '').toUpperCase();
}

function parseDiscountPercent(value) {
  const match = normalizeActionText(value).match(/^(\d+)\s*%?$/u);
  if (!match) return null;

  const discount = Number(match[1]);
  return Number.isSafeInteger(discount) && discount >= 1 && discount <= 100
    ? discount
    : null;
}

function parsePromoLimit(value) {
  const normalized = normalizeActionText(value);
  if (!/^\d+$/.test(normalized)) return null;

  const limit = Number(normalized);
  return Number.isSafeInteger(limit) && limit >= 0 ? limit : null;
}

function promoWizardKey(chatId, userId) {
  return `promo_wizard:${chatId}:${userId}`;
}

function promoCodeExists(promos, code) {
  return Object.entries(promos || {}).some(([key, promo]) =>
    normalizePromoCode((promo && promo.code) || key) === code
  );
}

function isPromoManagementCallback(data) {
  if (typeof data !== 'string') return false;

  return data === 'refresh_promos' ||
    data === 'promo_create_wizard' ||
    data === PROMO_WIZARD_CANCEL_CALLBACK_PREFIX ||
    data.startsWith(`${PROMO_WIZARD_CANCEL_CALLBACK_PREFIX}:`) ||
    data.startsWith('gen_promo_') ||
    data.startsWith('edit_promo_') ||
    data.startsWith('set_disc_') ||
    data.startsWith('set_limit_') ||
    data.startsWith('del_promo_') ||
    data.startsWith('confirm_del_');
}

const ADMIN_KEYBOARD = {
  keyboard: [
    [{ text: "🔍 Поиск пользователя" }, { text: "🎟 Выдать билет" }],
    [{ text: "📊 Статистика" }, { text: "🏷 Промокоды" }],
    [{ text: "📋 Контролеры" }, { text: "👑 Админы" }],
    [{ text: "ℹ️ Инструкция" }, { text: "❌ Скрыть меню" }]
  ],
  resize_keyboard: true,
  persistent: true
};

// Controller / Ticket Scanner Persistent Bottom Keyboard Menu
const SCANNER_KEYBOARD = {
  keyboard: [
    [
      {
        text: "📱 Входной QR-Сканер",
        web_app: { url: `${PUBLIC_DOMAIN}/scanner` }
      }
    ],
    [{ text: "🔍 Проверить билет по ID" }, { text: "📖 Инструкция контролера" }]
  ],
  resize_keyboard: true,
  persistent: true
};

// Helper to check if a user is Super Admin (Founder, ADMIN_IDS env, or added Co-Admin)
async function isSuperAdmin(from, chatId) {
  try {
    const userIdStr = String((from && from.id) ? from.id : (chatId || '')).trim();
    const adminChatStr = String(ADMIN_CHAT_ID || '').trim();
    const envAdminIds = (process.env.ADMIN_IDS || '').split(',').map(s => s.trim().toLowerCase().replace(/^@/, '')).filter(Boolean);
    const userUsername = from && from.username ? from.username.toLowerCase().replace(/^@/, '').trim() : '';

    if (userIdStr && userIdStr === SUPER_ADMIN_ID) return true;
    if (adminChatStr && (userIdStr === adminChatStr || String(chatId) === adminChatStr)) return true;

    if (envAdminIds.length > 0) {
      if (userIdStr && envAdminIds.includes(userIdStr.toLowerCase())) return true;
      if (userUsername && envAdminIds.includes(userUsername)) return true;
    }

    let extraAdmins = await kv.get('super_admins');
    if (!extraAdmins) return false;

    if (typeof extraAdmins === 'string') {
      try {
        extraAdmins = JSON.parse(extraAdmins);
      } catch (_e) {
        extraAdmins = [extraAdmins];
      }
    }

    if (!Array.isArray(extraAdmins)) return false;

    return extraAdmins.some((a) => {
      if (!a) return false;
      let aStr = typeof a === 'object'
        ? String(a.id || a.username || a.userId || '').toLowerCase().replace(/^@/, '').trim()
        : String(a).toLowerCase().replace(/^@/, '').trim();

      if (!aStr) return false;
      return aStr === userIdStr.toLowerCase() || (userUsername && aStr === userUsername);
    });
  } catch (err) {
    console.error('Error in isSuperAdmin:', err);
    return false;
  }
}

// Helper to check if a user is authorized as a ticket scanner/checker
async function isAuthorizedScanner(from, chatId) {
  try {
    if (await isSuperAdmin(from, chatId)) return true;

    const userIdStr = String((from && from.id) ? from.id : (chatId || '')).trim();
    const userUsername = from && from.username ? from.username.toLowerCase().replace(/^@/, '').trim() : '';

    let scanners = await kv.get('allowed_scanners');
    if (!scanners) return false;

    if (typeof scanners === 'string') {
      try {
        scanners = JSON.parse(scanners);
      } catch (_e) {
        scanners = [scanners];
      }
    }

    if (!Array.isArray(scanners)) return false;

    return scanners.some((s) => {
      if (!s) return false;
      let sStr = typeof s === 'object'
        ? String(s.id || s.username || s.userId || '').toLowerCase().replace(/^@/, '').trim()
        : String(s).toLowerCase().replace(/^@/, '').trim();

      if (!sStr) return false;
      return sStr === userIdStr.toLowerCase() || (userUsername && sStr === userUsername);
    });
  } catch (err) {
    console.error('Error in isAuthorizedScanner:', err);
    return false;
  }
}

// Admin Audit Logging
async function logAdminAuditAction({ adminId, recipientId, action, details }) {
  try {
    let logs = (await kv.get('admin_audit_logs')) || [];
    if (!Array.isArray(logs)) logs = [];

    const newLog = {
      timestamp: new Date().toISOString(),
      adminId: String(adminId),
      recipientId: recipientId ? String(recipientId) : null,
      action,
      details: details || {}
    };

    logs.unshift(newLog);
    if (logs.length > 500) logs = logs.slice(0, 500);

    await kv.set('admin_audit_logs', logs);
  } catch (err) {
    console.error('Failed to log admin audit action:', err);
  }
}

// Search user by telegram_id, @username, phone number, or full name
async function searchUserByQuery(query) {
  if (!query || typeof query !== 'string') return null;

  const rawQuery = query.trim();
  const cleanQuery = rawQuery.toLowerCase().replace(/^@/, '');
  const digitsOnly = rawQuery.replace(/\D/g, '');

  const allUserIds = (await kv.get('all_user_ids')) || [];
  if (!Array.isArray(allUserIds) || allUserIds.length === 0) return null;

  const userPromises = allUserIds.map(async (id) => {
    try {
      const u = await kv.get(`user:${id}`);
      return { id: String(id), user: u };
    } catch (_e) {
      return { id: String(id), user: null };
    }
  });

  const rawUsers = await Promise.all(userPromises);

  for (const { id, user } of rawUsers) {
    if (!user) continue;

    const userIdStr = String(id);
    const username = (user.username || '').toLowerCase().replace(/^@/, '');
    const phoneDigits = (user.phone || '').replace(/\D/g, '');
    const nameStr = (user.name || '').toLowerCase();

    // Direct ID match
    if (userIdStr === cleanQuery || (digitsOnly && userIdStr === digitsOnly)) {
      return { id: userIdStr, user };
    }

    // Username match
    if (cleanQuery && username === cleanQuery) {
      return { id: userIdStr, user };
    }

    // Phone number match
    if (digitsOnly && digitsOnly.length >= 7 && phoneDigits.includes(digitsOnly)) {
      return { id: userIdStr, user };
    }

    // Full name match
    if (cleanQuery && cleanQuery.length >= 3 && nameStr.includes(cleanQuery)) {
      return { id: userIdStr, user };
    }
  }

  return null;
}

// Render formatted user profile card with action inline buttons
function renderUserProfileCard(targetUserId, targetUser) {
  const name = targetUser.name || 'Mehmon';
  const username = targetUser.username ? `@${targetUser.username.replace(/^@/, '')}` : 'не указан';
  const phone = targetUser.phone || 'не указан';
  const bonusBalance = typeof targetUser.bonus_balance === 'number' ? targetUser.bonus_balance : 0;
  const invitedCount = typeof targetUser.invited_count === 'number' ? targetUser.invited_count : 0;

  let ticketStatusStr = '❌ Нет билета';
  if (targetUser.payment_status === 'confirmed' && targetUser.ticketId) {
    if (targetUser.is_manual_issue) {
      ticketStatusStr = `🎟 <b>Выдан вручную</b> (<code>${targetUser.ticketId}</code> - ${targetUser.ticket_type || 'Standard'})`;
    } else {
      ticketStatusStr = `✅ <b>Куплен</b> (<code>${targetUser.ticketId}</code>)`;
    }
  }

  const cardText = `👤 <b>Пользователь:</b> ${escapeHtml(name)} (${escapeHtml(username)})\n` +
    `🆔 <b>ID:</b> <code>${targetUserId}</code>\n` +
    `📱 <b>Телефон:</b> <code>${escapeHtml(phone)}</code>\n` +
    `💰 <b>Бонусный баланс:</b> ${bonusBalance.toLocaleString()} сум\n` +
    `👥 <b>Пригласил:</b> ${invitedCount} чел.\n` +
    `🎟 <b>Статус билета:</b> ${ticketStatusStr}`;

  const inlineKeyboard = [];

  const row1 = [{ text: "🎟 Выдать билет", callback_data: `admin_select_type_${targetUserId}` }];
  if (targetUser.payment_status === 'confirmed' && targetUser.ticketId) {
    row1.push({ text: "🚫 Отозвать билет", callback_data: `admin_revoke_ticket_${targetUserId}` });
  }
  inlineKeyboard.push(row1);

  inlineKeyboard.push([
    { text: "💰 Изменить баланс", callback_data: `admin_ask_balance_${targetUserId}` }
  ]);

  inlineKeyboard.push([
    { text: "🔍 Новый поиск", callback_data: "admin_search_prompt" }
  ]);

  return { text: cardText, reply_markup: { inline_keyboard: inlineKeyboard } };
}

// Promo Code Helper Functions
async function getPromos() {
  const promos = await kv.get('promos');
  return (promos && typeof promos === 'object') ? promos : {};
}

async function savePromos(promos) {
  const saved = await kv.set('promos', promos);
  if (!saved) {
    throw new Error('Failed to persist promo codes in KV');
  }
}

async function setPromoWizard(chatId, userId, wizard) {
  const now = Date.now();
  const saved = await kv.set(promoWizardKey(chatId, userId), {
    ...wizard,
    startedAt: wizard.startedAt || now,
    expiresAt: now + PROMO_WIZARD_TTL_MS
  });
  if (!saved) {
    throw new Error('Failed to persist promo creation state in KV');
  }
}

async function getPromoWizard(chatId, userId) {
  const wizard = await kv.get(promoWizardKey(chatId, userId));
  if (!wizard || typeof wizard !== 'object' || !wizard.step) return null;

  if (wizard.expiresAt && wizard.expiresAt <= Date.now()) {
    await clearPromoWizard(chatId, userId);
    return null;
  }

  return wizard;
}

async function clearPromoWizard(chatId, userId) {
  await kv.set(promoWizardKey(chatId, userId), null);
}

async function clearStoredUserStep(chatId) {
  const user = await kv.get(`user:${chatId}`);
  if (!user || typeof user !== 'object' || !Object.prototype.hasOwnProperty.call(user, 'step')) {
    return;
  }

  const updatedUser = { ...user };
  delete updatedUser.step;
  await kv.set(`user:${chatId}`, updatedUser);
}

async function clearConversationState(chatId, userId) {
  await clearPromoWizard(chatId, userId);

  // Legacy ticket state is keyed only by chat id. Touch it only in a private
  // chat, otherwise one admin could reset another member's flow in a group.
  if (String(chatId) === String(userId)) {
    await clearStoredUserStep(chatId);
  }
}

async function sendPromoWizardPrompt(chatId, text, sessionId) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    parse_mode: 'HTML',
    text,
    reply_markup: promoWizardCancelKeyboard(sessionId)
  });
}

async function handlePromoWizardMessage({ chatId, from, text, wizard }) {
  const actorId = from ? from.id : chatId;
  const normalizedText = normalizeActionText(text);

  if (/^\/cancel(?:@[A-Za-z0-9_]+)?$/iu.test(normalizedText)) {
    await clearPromoWizard(chatId, actorId);
    await callTelegram('sendMessage', {
      chat_id: chatId,
      parse_mode: 'HTML',
      text: `❌ <b>Создание промокода отменено.</b>`,
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 Назад к промокодам", callback_data: "refresh_promos" }]
        ]
      }
    });
    return;
  }

  if (wizard.step === PROMO_CREATION_STATES.CODE) {
    const code = normalizePromoCode(text);

    if (!/^[A-Z0-9_-]{1,32}$/.test(code)) {
      await sendPromoWizardPrompt(
        chatId,
        `⚠️ <b>Некорректный код.</b>\n\n` +
        `Используйте от 1 до 32 латинских букв, цифр, дефисов или подчёркиваний.\n` +
        `Например: <code>SALE20</code>`,
        wizard.sessionId
      );
      return;
    }

    const promos = await getPromos();
    if (promoCodeExists(promos, code)) {
      await sendPromoWizardPrompt(
        chatId,
        `⚠️ Промокод <code>${escapeHtml(code)}</code> уже существует.\n\n` +
        `Введите другой код:`,
        wizard.sessionId
      );
      return;
    }

    await setPromoWizard(chatId, actorId, {
      ...wizard,
      step: PROMO_CREATION_STATES.DISCOUNT,
      code
    });
    await sendPromoWizardPrompt(
      chatId,
      `➕ <b>СОЗДАНИЕ ПРОМОКОДА — ШАГ 2/4</b>\n\n` +
      `🔑 Код: <code>${escapeHtml(code)}</code>\n\n` +
      `Введите процент скидки от <b>1</b> до <b>100</b>.\n` +
      `Можно указать со знаком процента, например: <code>20%</code>`,
      wizard.sessionId
    );
    return;
  }

  if (wizard.step === PROMO_CREATION_STATES.DISCOUNT) {
    const discountValue = parseDiscountPercent(text);

    if (discountValue === null) {
      await sendPromoWizardPrompt(
        chatId,
        `⚠️ <b>Введите целое число от 1 до 100.</b>\n\n` +
        `Например: <code>20</code> или <code>20%</code>`,
        wizard.sessionId
      );
      return;
    }

    await setPromoWizard(chatId, actorId, {
      ...wizard,
      step: PROMO_CREATION_STATES.LIMIT,
      discountValue
    });
    await sendPromoWizardPrompt(
      chatId,
      `➕ <b>СОЗДАНИЕ ПРОМОКОДА — ШАГ 3/4</b>\n\n` +
      `🔑 Код: <code>${escapeHtml(wizard.code)}</code>\n` +
      `🏷 Скидка: <b>${discountValue}%</b>\n\n` +
      `Введите максимальное количество активаций.\n` +
      `Укажите целое число от <b>1</b> или <b>0</b> для безлимитного промокода.`,
      wizard.sessionId
    );
    return;
  }

  if (wizard.step === PROMO_CREATION_STATES.LIMIT) {
    const maxUses = parsePromoLimit(text);

    if (maxUses === null) {
      await sendPromoWizardPrompt(
        chatId,
        `⚠️ <b>Введите целое неотрицательное число.</b>\n\n` +
        `Например: <code>50</code> или <code>0</code> для безлимита.`,
        wizard.sessionId
      );
      return;
    }

    // Re-read immediately before saving: another admin may have created the
    // same code while this wizard was in progress.
    const promos = await getPromos();
    if (promoCodeExists(promos, wizard.code)) {
      await setPromoWizard(chatId, actorId, {
        step: PROMO_CREATION_STATES.CODE,
        sessionId: wizard.sessionId,
        sourceMessageId: wizard.sourceMessageId,
        startedAt: wizard.startedAt
      });
      await sendPromoWizardPrompt(
        chatId,
        `⚠️ Промокод <code>${escapeHtml(wizard.code)}</code> уже был создан другим администратором.\n\n` +
        `Введите другой код:`,
        wizard.sessionId
      );
      return;
    }

    const creator = from && from.username
      ? `@${from.username}`
      : ((from && from.first_name) || String(actorId));
    const createdPromo = {
      code: wizard.code,
      discountType: 'percent',
      discountValue: wizard.discountValue,
      maxUses,
      usedCount: 0,
      createdBy: creator,
      createdAt: new Date().toISOString()
    };

    promos[wizard.code] = createdPromo;
    try {
      await savePromos(promos);
    } catch (saveError) {
      console.error('Promo wizard save error:', saveError);
      await sendPromoWizardPrompt(
        chatId,
        `⚠️ <b>Не удалось сохранить промокод в базе.</b>\n\n` +
        `Сценарий не сброшен. Проверьте подключение к KV и отправьте лимит ещё раз.`,
        wizard.sessionId
      );
      return;
    }
    await clearPromoWizard(chatId, actorId);

    const limitLabel = maxUses === 0 ? 'Безлимит' : `${maxUses}`;
    await callTelegram('sendMessage', {
      chat_id: chatId,
      parse_mode: 'HTML',
      text: `✅ <b>ШАГ 4/4 — ПРОМОКОД СОЗДАН</b>\n\n` +
        `🔑 <b>Код:</b> <code>${escapeHtml(createdPromo.code)}</code>\n` +
        `🏷 <b>Скидка:</b> ${createdPromo.discountValue}%\n` +
        `🔢 <b>Лимит активаций:</b> ${limitLabel}\n` +
        `📊 <b>Использовано:</b> 0\n` +
        `👤 <b>Создал:</b> ${escapeHtml(createdPromo.createdBy)}`,
      reply_markup: {
        inline_keyboard: [
          [{ text: "🔙 Назад к промокодам", callback_data: "refresh_promos" }]
        ]
      }
    });
    return;
  }

  await clearPromoWizard(chatId, actorId);
  await callTelegram('sendMessage', {
    chat_id: chatId,
    parse_mode: 'HTML',
    text: `⚠️ Сценарий создания промокода устарел. Откройте список и начните заново.`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔙 Назад к промокодам", callback_data: "refresh_promos" }]
      ]
    }
  });
}

function calculateDiscount(basePrice, promo) {
  if (!promo) return { finalPrice: basePrice, discountAmount: 0, isValid: false, reason: 'not_found' };

  if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
    return { finalPrice: basePrice, discountAmount: 0, isValid: false, reason: 'limit_exceeded' };
  }

  let discountAmount = 0;
  if (promo.discountType === 'percent') {
    discountAmount = Math.round((basePrice * promo.discountValue) / 100);
  } else {
    discountAmount = promo.discountValue;
  }

  let finalPrice = Math.max(0, basePrice - discountAmount);
  return { finalPrice, discountAmount, isValid: true, reason: 'ok' };
}

// Render Interactive Promo Code List with Inline Keyboards (Edit, Delete, Create)
async function renderPromoList(chatId, messageId = null) {
  const promos = await getPromos();
  const promoList = Object.values(promos);
  let text = `🏷 <b>УПРАВЛЕНИЕ ПРОМОКОДАМИ TEDxSergeli</b>\n\n`;
  const inline_keyboard = [];

  if (promoList.length === 0) {
    text += `<i>Промокоды пока не созданы.</i>\n\n` +
      `Нажмите <b>«➕ Создать промокод»</b> и пройдите пошаговый диалог.`;
  } else {
    text += `📊 <b>Активные промокоды (${promoList.length}):</b>\n\n`;
    promoList.forEach((p, idx) => {
      const code = String(p.code || 'UNKNOWN');
      const discStr = p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString()} UZS`;
      const limitStr = p.maxUses > 0 ? `${p.usedCount || 0}/${p.maxUses}` : `${p.usedCount || 0} (безлимит)`;
      const deepLink = `https://t.me/${BOT_USERNAME}?start=promo_${encodeURIComponent(code)}`;

      text += `${idx + 1}. 🔑 <b><code>${escapeHtml(code)}</code></b> — Скидка: <b>${escapeHtml(discStr)}</b>\n` +
        `   📊 Использовано: ${escapeHtml(limitStr)} | Создал: ${escapeHtml(p.createdBy || 'Admin')}\n` +
        `   🔗 <code>${escapeHtml(deepLink)}</code>\n\n`;

      inline_keyboard.push([
        { text: `✏️ Изменить ${code}`, callback_data: `edit_promo_${code}` },
        { text: `🗑 Удалить`, callback_data: `del_promo_${code}` }
      ]);
    });
  }

  const refreshedAt = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Asia/Tashkent',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date());
  text += `\n\n🕒 <i>Обновлено: ${refreshedAt}</i>`;

  inline_keyboard.push([
    { text: "➕ Создать промокод", callback_data: "promo_create_wizard" },
    { text: "🔄 Обновить список", callback_data: "refresh_promos" }
  ]);

  if (messageId) {
    return await callTelegram('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'HTML',
      text,
      reply_markup: { inline_keyboard }
    });
  } else {
    return await callTelegram('sendMessage', {
      chat_id: chatId,
      parse_mode: 'HTML',
      text,
      reply_markup: { inline_keyboard }
    });
  }
}


// Helper to issue ticket for user (used by Admin Confirm, 100% Free Promo codes, and Manual Admin Issuance)
async function issueTicketForUser({ userId, user, seatNumber, confirmedBy, promoCode, isManualIssue = false, issuedBy = null, ticketType = 'Standard' }) {
  const ticketId = `TEDX-${Math.floor(100000 + Math.random() * 900000)}`;

  let allocatedSeats = (await kv.get('allocated_seats')) || [];
  if (!Array.isArray(allocatedSeats)) allocatedSeats = [];

  let finalSeatNum = seatNumber || user.seatNumber;

  if (!finalSeatNum || finalSeatNum < 1 || finalSeatNum > 100) {
    const activeOccupied = await getActiveOccupiedSeats();
    const occupiedSeats = activeOccupied.map(i => i.seat);
    const taken = new Set([...allocatedSeats, ...occupiedSeats]);
    let next = 1;
    while (taken.has(next) && next <= 100) next++;
    finalSeatNum = Math.min(100, next);
  }

  if (!allocatedSeats.includes(finalSeatNum)) {
    allocatedSeats.push(finalSeatNum);
    await kv.set('allocated_seats', allocatedSeats);
  }

  const totalSold = allocatedSeats.length;
  await kv.set('total_tickets_sold', totalSold);

  let activeOccupied = await getActiveOccupiedSeats();
  const initialLen = activeOccupied.length;
  activeOccupied = activeOccupied.filter(i => i.seat !== finalSeatNum);
  if (activeOccupied.length !== initialLen) {
    await kv.set('occupied_seats', activeOccupied);
  }

  const seatInfo = getSeatDetails(finalSeatNum);

  const ticketData = {
    id: ticketId,
    userId: userId,
    name: user.name || 'Mehmon',
    phone: user.phone || 'Noma\'lum',
    seatNumber: seatInfo.seatNumber,
    seatId: seatInfo.seatId,
    sector: seatInfo.sector,
    sectorName: seatInfo.sectorName,
    row: seatInfo.row,
    seat: seatInfo.seat,
    status: 'valid',
    ticket_status: 'ACTIVE',
    promoCode: promoCode || null,
    is_manual_issue: isManualIssue,
    issued_by: issuedBy ? String(issuedBy) : null,
    ticket_type: ticketType,
    confirmed_at: new Date().toISOString()
  };
  await kv.set(`ticket:${ticketId}`, ticketData);
  await trackTicket(ticketId);

  // Deduct applied cashback bonuses upon ticket confirmation
  if (user.used_bonus_amount && user.used_bonus_amount > 0) {
    const freshUser = (await kv.get(`user:${userId}`)) || user;
    const currentBonus = typeof freshUser.bonus_balance === 'number' ? freshUser.bonus_balance : 0;
    const bonusToDeduct = Math.min(currentBonus, user.used_bonus_amount);
    user.bonus_balance = Math.max(0, currentBonus - bonusToDeduct);
    user.used_bonus_amount = 0;
  }

  // Process referral reward for referrer on buyer's first purchase (+10 000 UZS)
  if (user.referrer_id && !user.has_purchased) {
    const referrerId = String(user.referrer_id);
    if (referrerId !== String(userId)) {
      try {
        let referrer = (await kv.get(`user:${referrerId}`)) || {};
        const currentRefBonus = typeof referrer.bonus_balance === 'number' ? referrer.bonus_balance : 0;
        referrer.bonus_balance = currentRefBonus + REFERRAL_PURCHASE_BONUS;
        await kv.set(`user:${referrerId}`, referrer);

        const refLang = referrer.lang || 'ru';
        let refMsg = '';
        if (refLang === 'uz') {
          refMsg = `🚀 <b>Sizning do'stingiz chipta sotib oldi!</b> Sizga <b>+10 000 UZS</b> keshbek berildi.`;
        } else if (refLang === 'en') {
          refMsg = `🚀 <b>Your friend bought a ticket!</b> You earned <b>+10,000 UZS</b> cashback.`;
        } else {
          refMsg = `🚀 <b>Ваш друг купил билет! Вам начислено +10 000 сум кешбэка.</b>`;
        }
        await callTelegram('sendMessage', {
          chat_id: referrerId,
          parse_mode: 'HTML',
          text: refMsg
        });
      } catch (refErr) {
        console.error('Failed to process purchase bonus for referrer:', refErr);
      }
    }
  }

  user.has_purchased = true;
  user.ticketId = ticketId;
  user.seatNumber = seatInfo.seatNumber;
  user.seatId = seatInfo.seatId;
  user.payment_status = 'confirmed';
  user.ticket_status = 'ACTIVE';
  user.is_manual_issue = isManualIssue;
  user.issued_by = issuedBy ? String(issuedBy) : null;
  user.ticket_type = ticketType;
  user.confirmed_at = ticketData.confirmed_at;
  await kv.set(`user:${userId}`, user);

  if (!isManualIssue) {
    await sendIssuedTicket({
      userId,
      user,
      promoCode,
      confirmedBy,
      ticketId,
      seatInfo
    });
  }

  return { ticketId, seatInfo };
}

async function issueManualTicket({ adminId, recipientId, ticketType = 'Standard' }) {
  let user = (await kv.get(`user:${recipientId}`)) || {};
  user.name = user.name || 'Mehmon';

  const { ticketId, seatInfo } = await issueTicketForUser({
    userId: recipientId,
    user,
    confirmedBy: `Admin (${adminId})`,
    isManualIssue: true,
    issuedBy: adminId,
    ticketType
  });

  await logAdminAuditAction({
    adminId,
    recipientId,
    action: 'ISSUE_TICKET_MANUAL',
    details: { ticketId, ticketType, seatNumber: seatInfo.seatNumber }
  });

  const uLang = user.lang || 'ru';
  let userMsg = '';
  if (uLang === 'uz') {
    userMsg = `🎉 <b>Sizga TEDxSergeli uchun shaxsiy chipta taqdim etildi!</b>\n\n` +
      `🎟 <b>Kategoriya:</b> ${ticketType}\n` +
      `📍 <b>O'rin:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin (№${seatInfo.seatNumber})\n` +
      `🔑 <b>Chipta ID:</b> <code>${ticketId}</code>\n` +
      `📅 <b>Sana:</b> 4-sentabr, 2026, 14:00\n` +
      `📍 <b>Manzil:</b> Sergeli Ixtisoslashtirilgan Maktabi\n\n` +
      `📱 <i>Pastroqda sizning QR-kodli elektron chiptangiz biriktirildi:</i>`;
  } else if (uLang === 'en') {
    userMsg = `🎉 <b>You have been granted a personal ticket to TEDxSergeli!</b>\n\n` +
      `🎟 <b>Category:</b> ${ticketType}\n` +
      `📍 <b>Seat:</b> ${seatInfo.sectorName}, Row ${seatInfo.row} / Seat ${seatInfo.seat} (№${seatInfo.seatNumber})\n` +
      `🔑 <b>Ticket ID:</b> <code>${ticketId}</code>\n` +
      `📅 <b>Date:</b> September 4, 2026, 14:00\n` +
      `📍 <b>Location:</b> Sergeli Specialized School\n\n` +
      `📱 <i>Your QR code ticket is attached below:</i>`;
  } else {
    userMsg = `🎉 <b>Вам предоставлен персональный билет на TEDxSergeli!</b>\n\n` +
      `🎟 <b>Категория:</b> ${ticketType}\n` +
      `📍 <b>Место:</b> ${seatInfo.sectorName}, ${seatInfo.row}-ряд / ${seatInfo.seat}-место (№${seatInfo.seatNumber})\n` +
      `🔑 <b>ID Билета:</b> <code>${ticketId}</code>\n` +
      `📅 <b>Дата:</b> 4 сентября, 2026, 14:00\n` +
      `📍 <b>Локация:</b> Sergeli Specialized School\n\n` +
      `📱 <i>Ваш электронный билет с QR-кодом прикреплен ниже:</i>`;
  }

  const qrUrl = `https://t.me/${BOT_USERNAME}?start=scan_${ticketId}`;
  let photoBuffer = null;
  try {
    photoBuffer = await generateTicketQrImage(qrUrl);
  } catch (err) {
    console.error('Failed to generate QR for manual ticket:', err);
  }

  if (photoBuffer) {
    try {
      const formData = new FormData();
      formData.append('chat_id', recipientId);
      formData.append('caption', userMsg);
      formData.append('parse_mode', 'HTML');
      formData.append('photo', new Blob([photoBuffer], { type: 'image/png' }), `ticket_${ticketId}.png`);
      formData.append('reply_markup', JSON.stringify(getUserKeyboard(uLang)));

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        body: formData
      });
    } catch (sendErr) {
      console.error('Failed to send photo for manual ticket:', sendErr);
      await callTelegram('sendMessage', {
        chat_id: recipientId,
        parse_mode: 'HTML',
        text: userMsg,
        reply_markup: getUserKeyboard(uLang)
      });
    }
  } else {
    await callTelegram('sendMessage', {
      chat_id: recipientId,
      parse_mode: 'HTML',
      text: userMsg,
      reply_markup: getUserKeyboard(uLang)
    });
  }

  return { ticketId, seatInfo };
}

async function sendIssuedTicket({ userId, user, promoCode, confirmedBy, ticketId, seatInfo }) {
const qrUrl = `https://t.me/${BOT_USERNAME}?start=scan_${ticketId}`;

let photoBuffer = null;
try {
  photoBuffer = await generateTicketQrImage(qrUrl);
} catch (genErr) {
  console.error('Ticket QR generation error:', genErr);
}

const userLang = user.lang || 'ru';
let ticketCaption = '';

if (userLang === 'uz') {
  ticketCaption =
    `🎉 <b>${promoCode ? 'Promo-kod orqali tasdiqlandi!' : "To'lov tasdiqlandi!"}</b>\n\n` +
    `🎟️ <b>TEDxSergeli Specialized School — Rasmiy Elektron Chipta</b>\n\n` +
    `👤 <b>Mehmon:</b> ${user.name || 'Mehmon'}\n` +
    `📍 <b>Sektor:</b> ${seatInfo.sectorName}\n` +
    `📐 <b>O'rin:</b> ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin (Umumiy №${seatInfo.seatNumber})\n` +
    `🔑 <b>Chipta ID:</b> <code>${ticketId}</code>\n\n` +
    `📅 <b>Sana:</b> 4-sentabr, 2026\n` +
    `📍 <b>Manzil:</b> <a href="https://maps.google.com/?q=Sergeli+Ixtisoslashtirilgan+Maktabi">📍 Sergeli Ixtisoslashtirilgan Maktabi (Google Maps)</a>\n\n` +
    `📌 <b>Kirish qoidalari (TEDx Rules):</b>\n` +
    `• 1️⃣ Tadbir kunida ushbu QR-kodni nazoratchiga ko'rsating.\n` +
    `• 2️⃣ Eshiklar soat 14:30 da yopiladi. Kechikmang!\n` +
    `• 3️⃣ Har bir QR-kod faqat 1 marotaba kirish uchun amal qiladi.\n\n` +
    `ℹ️ <i>TEDxSergeli is an independently organized TED event operated under license from TED.</i>`;
} else if (userLang === 'en') {
  ticketCaption =
    `🎉 <b>${promoCode ? 'Confirmed via Promo Code!' : 'Payment confirmed!'}</b>\n\n` +
    `🎟️ <b>TEDxSergeli Specialized School — Official Ticket</b>\n\n` +
    `👤 <b>Guest:</b> ${user.name || 'Guest'}\n` +
    `📍 <b>Sector:</b> ${seatInfo.sector === 5 ? '2nd Floor (Balcony)' : `Sector ${seatInfo.sector}`}\n` +
    `📐 <b>Seat:</b> Row ${seatInfo.row} / Seat ${seatInfo.seat} (Total №${seatInfo.seatNumber})\n` +
    `🔑 <b>Ticket ID:</b> <code>${ticketId}</code>\n\n` +
    `📅 <b>Date:</b> September 4, 2026\n` +
    `📍 <b>Location:</b> <a href="https://maps.google.com/?q=Sergeli+Ixtisoslashtirilgan+Maktabi">📍 Sergeli Specialized School (Google Maps)</a>\n\n` +
    `📌 <b>Entrance Rules (TEDx Rules):</b>\n` +
    `• 1️⃣ Show this QR code to the scanner on the day of the event.\n` +
    `• 2️⃣ Doors close at 14:30. Please arrive on time!\n` +
    `• 3️⃣ Each QR code is valid for 1 entry only.\n\n` +
    `ℹ️ <i>TEDxSergeli is an independently organized TED event operated under license from TED.</i>`;
} else {
  ticketCaption =
    `🎉 <b>${promoCode ? 'Подтверждено по промокоду!' : 'Оплата подтверждена!'}</b>\n\n` +
    `🎟️ <b>TEDxSergeli Specialized School — Официальный электронный билет</b>\n\n` +
    `👤 <b>Гость:</b> ${user.name || 'Гость'}\n` +
    `📍 <b>Сектор:</b> ${seatInfo.sector === 5 ? '2-Этаж (Балкон)' : `Сектор ${seatInfo.sector}`}\n` +
    `📐 <b>Место:</b> ${seatInfo.row}-ряд / ${seatInfo.seat}-место (Общий №${seatInfo.seatNumber})\n` +
    `🔑 <b>ID Билета:</b> <code>${ticketId}</code>\n\n` +
    `📅 <b>Дата:</b> 4 сентября 2026\n` +
    `📍 <b>Адрес:</b> <a href="https://maps.google.com/?q=Sergeli+Ixtisoslashtirilgan+Maktabi">📍 Специализированная школа Сергели (Google Maps)</a>\n\n` +
    `📌 <b>Правила входа (Правила TEDx):</b>\n` +
    `• 1️⃣ Покажите этот QR-код контролеру на входе в день мероприятия.\n` +
    `• 2️⃣ Двери закрываются в 14:30. Пожалуйста, не опаздывайте!\n` +
    `• 3️⃣ Каждый QR-код действителен только для 1 входа.\n\n` +
    `ℹ️ <i>TEDxSergeli — независимое мероприятие, проводимое по лицензии TED.</i>`;
}

if (photoBuffer) {
  await callTelegramPhoto(userId, photoBuffer, ticketCaption);
} else {
  await callTelegram('sendMessage', {
    chat_id: userId,
    parse_mode: 'HTML',
    text: ticketCaption
  });
}

if (ADMIN_CHAT_ID) {
  const groupTicketCaption =
    `🎟️ <b>YANGI CHIPTA ${promoCode ? `(PROMO-KOD: ${promoCode})` : 'BERILDI'}!</b>\n\n` +
    `👤 <b>Ism:</b> ${user.name || 'Mehmon'}\n` +
    `📍 <b>Joy:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin (№${seatInfo.seatNumber})\n` +
    `📱 <b>Tel / Telegram:</b> <code>${user.phone || 'Noma\'lum'}</code>\n` +
    `🔑 <b>Chipta ID:</b> <code>${ticketId}</code>\n` +
    `💳 <b>Summa:</b> ${promoCode ? (user.finalPrice ? `${user.finalPrice.toLocaleString()} UZS` : '0 UZS (BEPUL)') : '49,999 UZS'}\n` +
    `✅ <b>Tasdiqladi:</b> ${confirmedBy || (promoCode ? `Promo-kod (${promoCode})` : 'System')}`;

  try {
    if (photoBuffer) {
      await callTelegramPhoto(ADMIN_CHAT_ID, photoBuffer, groupTicketCaption);
    } else {
      await callTelegram('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        parse_mode: 'HTML',
        text: groupTicketCaption
      });
    }
  } catch (dupErr) {
    console.error('Failed to duplicate ticket to admin chat:', dupErr);
  }
}

return { ticketId, seatInfo };
}

// Helper to track user IDs for broadcasting
async function trackUser(chatId) {
  let users = (await kv.get('all_user_ids')) || [];
  if (!users.includes(chatId)) {
    users.push(chatId);
    await kv.set('all_user_ids', users);
  }
}

// Helper to track ticket IDs for stats
async function trackTicket(ticketId) {
  let tickets = (await kv.get('all_ticket_ids')) || [];
  if (!tickets.includes(ticketId)) {
    tickets.push(ticketId);
    await kv.set('all_ticket_ids', tickets);
  }
}

// Seat Reservation Helper
async function getActiveOccupiedSeats() {
  let occupied = (await kv.get('occupied_seats')) || [];
  if (!Array.isArray(occupied)) occupied = [];
  const now = Date.now();
  let changed = false;
  const active = [];
  for (let item of occupied) {
    if (typeof item === 'object' && item.seat && item.expiresAt) {
      if (item.expiresAt > now) {
        active.push(item);
      } else {
        changed = true;
      }
    } else {
      // old format (just numbers) -> remove them
      changed = true;
    }
  }
  if (changed) {
    await kv.set('occupied_seats', active);
  }
  return active;
}

// Telegram API Helper
async function callTelegram(method, body) {
  try {
    const response = await fetch(`${API_URL}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      const description = result && result.description ? result.description : `HTTP ${response.status}`;
      const isUnchangedMessage = method === 'editMessageText' && /message is not modified/i.test(description);
      if (!isUnchangedMessage) {
        console.error(`Telegram API Error (${method}): ${description}`);
      }
    }

    return result;
  } catch (err) {
    console.error(`Telegram API Call Error (${method}):`, err);
    return null;
  }
}

// Send Photo via FormData for Buffer upload
async function callTelegramPhoto(chatId, buffer, caption, extra = {}) {
  try {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', caption || '');
    formData.append('parse_mode', 'HTML');

    if (extra.message_thread_id) {
      formData.append('message_thread_id', extra.message_thread_id);
    }
    if (extra.reply_markup) {
      formData.append('reply_markup', typeof extra.reply_markup === 'string' ? extra.reply_markup : JSON.stringify(extra.reply_markup));
    }

    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('photo', blob, 'ticket_qr.png');

    const response = await fetch(`${API_URL}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  } catch (err) {
    console.error('sendPhoto error:', err);
    return null;
  }
}

// Generate pure high-resolution QR code PNG image
async function generateTicketQrImage(qrUrl) {
  return await QRCode.toBuffer(qrUrl, {
    margin: 2,
    width: 800,
    color: {
      dark: '#0E0E11',
      light: '#FFFFFF'
    }
  });
}

// Seat Allocation helper for 100 total seats
function getSeatDetails(seatNum) {
  const n = Math.max(1, Math.min(100, parseInt(seatNum, 10) || 1));
  let sector = 1;
  let sectorName = "Sektor 1";
  let seatInSector = n;
  let row = 1;
  let seat = 1;
  let floor = 1;

  if (n <= 24) {
    sector = 1;
    sectorName = "Sektor 1";
    seatInSector = n;
    row = Math.floor((n - 1) / 8) + 1;
    seat = ((n - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 48) {
    sector = 2;
    sectorName = "Sektor 2";
    seatInSector = n - 24;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 72) {
    sector = 3;
    sectorName = "Sektor 3";
    seatInSector = n - 48;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else if (n <= 96) {
    sector = 4;
    sectorName = "Sektor 4";
    seatInSector = n - 72;
    row = Math.floor((seatInSector - 1) / 8) + 1;
    seat = ((seatInSector - 1) % 8) + 1;
    floor = 1;
  } else {
    sector = 5;
    sectorName = "2-Etaj (Balkon)";
    seatInSector = n - 96;
    row = 1;
    seat = seatInSector;
    floor = 2;
  }

  return {
    seatNumber: n,
    sector,
    sectorName,
    seatInSector,
    row,
    seat,
    floor,
    seatId: `SEAT-${n}`,
    seatLabel: sector === 5 ? `2-Etaj (Balkon) — 1-qator / ${seat}-o'rin` : `Sektor ${sector} — ${row}-qator / ${seat}-o'rin`
  };
}

const texts = {
  welcome: `👋 <b>Привет! Вы в официальном боте TEDxSergeli Specialized School.</b>\nДо вашего билета остался всего 1 шаг.\n\n🌐 <b>Tilni tanlang / Выберите язык / Choose language:</b>`,
  askName: {
    uz: `👤 Iltimos, ism va familiyangizni kiriting (mehmonlar ro'yxati uchun):`,
    ru: `👤 Введите ваше Имя и Фамилию для внесения в списки гостей:`,
    en: `👤 Please enter your Full Name for the guest list:`,
  },
  askPhone: {
    uz: `📱 Endi telefon raqamingizni yuboring:\n(Quyidagi "Raqamni ulashish" tugmasini bosing yoki raqamni yozing)`,
    ru: `📱 Теперь отправьте ваш номер телефона:\n(Нажмите кнопку "Поделиться контактом" ниже или напишите номер)`,
    en: `📱 Now send your phone number:\n(Press "Share Contact" below or type your number)`,
  },
  btnShareContact: {
    uz: `📱 Raqamni ulashish`,
    ru: `📱 Поделиться контактом`,
    en: `📱 Share Contact`
  },
  payment: {
    uz: `🎫 <b>Ajoyib!</b>\n\nChipta narxi: <b>49 999 UZS</b>.\nTo'lovni quyidagi kartaga o'tkazing:\n\n💳 <code>5614 6822 1091 3879</code>\n👤 Abidjanov Baxtiyor\n\n📸 <i>To'lov amalga oshirilgach, chek rasmini shu yerga yuboring.</i>`,
    ru: `🎫 <b>Отлично!</b>\n\nСтоимость билета: <b>49 999 UZS</b>.\nПереведите деньги на карту:\n\n💳 <code>5614 6822 1091 3879</code>\n👤 Abidjanov Baxtiyor\n\n📸 <i>После оплаты отправьте фотографию чека прямо сюда.</i>`,
    en: `🎫 <b>Great!</b>\n\nTicket price: <b>49 999 UZS</b>.\nTransfer the money to the card:\n\n💳 <code>5614 6822 1091 3879</code>\n👤 Abidjanov Baxtiyor\n\n📸 <i>After payment, send the receipt photo here.</i>`
  },
  photoReply: {
    uz: `✅ <b>Chek tekshirishga yuborildi.</b>\nKuting...`,
    ru: `✅ <b>Чек отправлен на проверку.</b>\nОжидайте...`,
    en: `✅ <b>Receipt sent for review.</b>\nPlease wait...`
  },
  reject: `❌ <b>To'lov tasdiqlanmadi. / Оплата не подтверждена. / Payment not confirmed.</b>\nIltimos, chekni tekshiring. / Пожалуйста, проверьте чек. / Please check your receipt.`
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Webhook is running');
  }

  try {
    const update = req.body;
    if (!update) return res.status(200).json({ ok: true });

    // Handle Telegram Message
    if (update.message) {
      const { text, from, chat, photo, contact } = update.message;
      const chatId = chat.id;

      // Track user for analytics and broadcasts
      await trackUser(chatId);

      // === REFERRAL CONTEST & LEADERBOARD HANDLER ===
      if (text && (
        /^\/(?:contest|leaderboard|top|contest_info)(?:@[A-Za-z0-9_]+)?$/iu.test(normalizeActionText(text)) ||
        /^(?:🏆\s*)?(?:конкурс рефералов|referallar tanlovi|referral contest)/iu.test(normalizeActionText(text))
      )) {
        let user = (await kv.get(`user:${chatId}`)) || {};
        await sendReferralContestMessage(chatId, user);
        return res.status(200).json({ ok: true });
      }

      // === REFERRAL & CASHBACK INFO HANDLER ===
      if (text && (
        /^\/(?:referral|bonus|cashback|ref)(?:@[A-Za-z0-9_]+)?$/iu.test(normalizeActionText(text)) ||
        /^(?:🎁\s*)?(?:реферальная программа|кешбэк|referal|referral)/iu.test(normalizeActionText(text))
      )) {
        let user = (await kv.get(`user:${chatId}`)) || {};
        await sendReferralInfo(chatId, user);
        return res.status(200).json({ ok: true });
      }

      // === MY TICKET BUTTON HANDLER ===
      if (text && /^(?:🎟\s*)?(?:мой билет|mening chiptam|my ticket)$/iu.test(normalizeActionText(text))) {
        let user = (await kv.get(`user:${chatId}`)) || {};
        if (user.payment_status === 'confirmed' && user.ticketId) {
          const userLang = user.lang || 'ru';
          const ticket = await kv.get(`ticket:${user.ticketId}`);
          const seatInfo = getSeatDetails(user.seatNumber || (ticket ? ticket.seatNumber : 1));
          let msg = userLang === 'uz'
            ? `🎉 <b>Sizda faol TEDxSergeli elektron chiptangiz bor.</b>\n\n🎟 <b>Chipta ID:</b> <code>${user.ticketId}</code>\n📍 <b>O'rin:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin\n👤 <b>Ism:</b> ${user.name || 'Mehmon'}`
            : `🎉 <b>У вас есть активный электронный билет TEDxSergeli.</b>\n\n🎟 <b>ID Билета:</b> <code>${user.ticketId}</code>\n📍 <b>Место:</b> ${seatInfo.sectorName}, ${seatInfo.row}-ряд / ${seatInfo.seat}-место\n👤 <b>Имя:</b> ${user.name || 'Гость'}`;
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: msg,
            reply_markup: getUserKeyboard(userLang)
          });
          return res.status(200).json({ ok: true });
        }
      }

      // === ADMIN COMMAND: /contest_results ===
      if (text && /^\/(?:contest_results|finish_contest)(?:@[A-Za-z0-9_]+)?$/iu.test(normalizeActionText(text))) {
        if (!(await isSuperAdmin(from, chatId))) {
          await callTelegram('sendMessage', { chat_id: chatId, text: '🛑 Отказано в доступе.' });
          return res.status(200).json({ ok: true });
        }

        const { topList } = await getReferralLeaderboard();
        const winners = topList.slice(0, 3);

        if (winners.length === 0) {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: '⚠️ <b>Конкурс рефералов:</b> Участников с приглашениями пока нет.'
          });
          return res.status(200).json({ ok: true });
        }

        let reportLines = [];
        const medals = ['🥇 1-е место', '🥈 2-е место', '🥉 3-е место'];

        for (let i = 0; i < winners.length; i++) {
          const winner = winners[i];
          const rank = i + 1;
          const winnerId = winner.userId;
          let winnerUser = (await kv.get(`user:${winnerId}`)) || {};

          if (!winnerUser.ticketId || winnerUser.payment_status !== 'confirmed') {
            try {
              const { ticketId, seatInfo } = await issueTicketForUser({
                userId: winnerId,
                user: winnerUser,
                confirmedBy: 'Referral Contest Winner'
              });
              winnerUser.ticketId = ticketId;
              winnerUser.seatNumber = seatInfo.seatNumber;
            } catch (issueErr) {
              console.error(`Failed to issue ticket for contest winner ${winnerId}:`, issueErr);
            }
          }

          const wLang = winnerUser.lang || 'ru';
          let winMsg = '';
          if (wLang === 'uz') {
            winMsg = `🎉 <b>TABRIKLAYMIZ!</b>\n\n` +
              `Siz TEDxSergeli referallar tanlovida <b>${rank}-o'rinni</b> egalladingiz va <b>bepul chipta</b> yutib oldingiz! 🎟\n\n` +
              `QR-kodli elektron chiptangiz rasmiylashtirildi. Uni <b>«🎟 Mening chiptam»</b> tugmasi orqali ko'rishingiz mumkin!`;
          } else if (wLang === 'en') {
            winMsg = `🎉 <b>CONGRATULATIONS!</b>\n\n` +
              `You placed <b>#${rank}</b> in the TEDxSergeli referral contest and won a <b>free ticket</b>! 🎟\n\n` +
              `Your digital ticket has been issued. Check it anytime via the <b>«🎟 My Ticket»</b> button!`;
          } else {
            winMsg = `🎉 <b>ПОЗДРАВЛЯЕМ!</b>\n\n` +
              `Вы заняли <b>${rank}-е место</b> в конкурсе рефералов TEDxSergeli и выиграли <b>бесплатный билет</b>! 🎟\n\n` +
              `Ваш электронный билет с QR-кодом уже выписан! Нажмите <b>«🎟 Мой билет»</b>, чтобы просмотреть его.`;
          }

          try {
            await callTelegram('sendMessage', {
              chat_id: winnerId,
              parse_mode: 'HTML',
              text: winMsg,
              reply_markup: getUserKeyboard(wLang)
            });
          } catch (notifyErr) {
            console.error(`Failed to notify winner ${winnerId}:`, notifyErr);
          }

          reportLines.push(
            `${medals[i]}: <b>${escapeHtml(winner.displayName)}</b> (ID: <code>${winnerId}</code>)\n` +
            `   👥 Приглашено: <b>${winner.invitedCount}</b> чел. | 🎟 Билет: <code>${winnerUser.ticketId || 'Выписан'}</code>`
          );
        }

        const reportText = `🏆 <b>ИТОГИ КОНКУРСА РЕФЕРАЛОВ TEDxSergeli</b>\n\n` +
          `Победители официально зафиксированы и уведомлены!\n\n` +
          reportLines.join('\n\n');

        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: reportText,
          reply_markup: ADMIN_KEYBOARD
        });

        return res.status(200).json({ ok: true });
      }

      // === GLOBAL INSTRUCTION & HELP COMMAND (Universal for all roles) ===
      // This branch intentionally precedes every command/state branch: it is
      // the raw-webhook equivalent of an FSM handler registered with state="*".
      if (text && isInstructionRequest(text)) {
        await clearConversationState(chatId, from ? from.id : chatId);

        if (await isSuperAdmin(from, chatId)) {
          const scannerAppUrl = `${PUBLIC_DOMAIN}/scanner`;
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `⚡️ <b>TEDxSergeli SUPER ADMIN DASHBOARD &amp; ИНСТРУКЦИЯ</b>\n\n` +
              `📱 <b>Входной контроль по QR-кодам:</b>\n` +
              `Нажмите кнопку ниже, чтобы открыть веб-сканер билетов прямо в Telegram!\n\n` +
              `👑 <b>Управление Администраторами:</b>\n` +
              `• <code>/add_admin @username</code> — Назначить Со-Администратора\n` +
              `• <code>/del_admin @username</code> — Снять Со-Администратора\n` +
              `• <code>/admins</code> — Список всех Администраторов (кнопка <b>👑 Админы</b>)\n\n` +
              `🏷 <b>Система Промокодов:</b>\n` +
              `• Нажмите кнопку <b>🏷 Промокоды</b> или <code>/promos</code> — Интерактивное меню с пошаговым созданием\n` +
              `• <code>/add_promo</code> — Начать пошаговое создание\n` +
              `• <code>/edit_promo &lt;КОД&gt; &lt;СКИДКА&gt; [&lt;ЛИМИТ&gt;]</code> — Редактирование промокода\n` +
              `• <code>/del_promo &lt;КОД&gt;</code> — Удаление промокода\n\n` +
              `🎫 <b>Управление Контролерами Билетов:</b>\n` +
              `• <code>/add_scanner @username</code> — Назначить волонтера-контролера\n` +
              `• <code>/del_scanner @username</code> — Удалить контролера\n` +
              `• <code>/scanners</code> — Список контролеров (кнопка <b>📋 Контролеры</b>)\n\n` +
              `📊 <b>Мониторинг и База Данных:</b>\n` +
              `• <code>/stats</code> — Живая статистика билетов (кнопка <b>📊 Статистика</b>)\n` +
              `• <code>/export</code> — Выгрузка реестра билетов в Excel / CSV\n` +
              `• <code>/find TEDX-849201</code> — Найти информацию о билете\n` +
              `• <code>/reset_ticket TEDX-849201</code> — Сбросить статус билета\n` +
              `• <code>/reset_db</code> — Очистить базу данных\n\n` +
              `📢 <b>Массовые Рассылки:</b>\n` +
              `• <code>/broadcast Ваш текст</code> — Отправить анонс всем пользователям`,
            reply_markup: {
              inline_keyboard: [
                [{ text: "📷 QR-Сканерни очиш / Открыть QR-Сканер", web_app: { url: scannerAppUrl } }],
                [{ text: "🏷 Промокоды (Меню управления)", callback_data: "refresh_promos" }]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        } else if (await isAuthorizedScanner(from, chatId)) {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `📖 <b>ИНСТРУКЦИЯ ДЛЯ КОНТРОЛЁРОВ TEDxSergeli:</b>\n\n` +
              `1️⃣ <b>Проверка через QR-сканер:</b>\n` +
              `• Нажмите кнопку <b>📱 Входной QR-Сканер</b> внизу.\n` +
              `• Наведите камеру на QR-код на билете гостя.\n` +
              `• Зелёный экран = ГОСТЬ ПРОПУЩЕН ✅\n` +
              `• Красный экран = БИЛЕТ УЖЕ ИСПОЛЬЗОВАН 🛑\n\n` +
              `2️⃣ <b>Проверка вручную (без QR):</b>\n` +
              `• Отправьте боту <code>/find ID</code> (например, <code>/find TEDX-947695</code>).\n` +
              `• Или нажмите <b>🔍 Проверить билет по ID</b>.\n` +
              `• Бот покажет статус билета, ФИО гостя и место.`,
            reply_markup: SCANNER_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        } else {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `ℹ️ <b>ИНСТРУКЦИЯ И СПРАВКА TEDxSergeli</b>\n\n` +
              `🎟 <b>Как приобрести билет:</b>\n` +
              `1. Введите <code>/start</code> или нажмите <b>«Перезапустить»</b>.\n` +
              `2. Выберите удобный язык (O'zbekcha / Русский / English).\n` +
              `3. Введите ваше ФИО и номер телефона.\n` +
              `4. Выберите желаемое место в зале.\n` +
              `5. Введите промокод (при наличии) и загрузите скриншот чека об оплате.\n\n` +
              `📌 <b>Правила входа:</b>\n` +
              `• После подтверждения вы получите электронный билет с QR-кодом.\n` +
              `• Предъявите QR-код контролеру на входе в день мероприятия.`
          });
          return res.status(200).json({ ok: true });
        }
      }

      // Promo creation messages take precedence over regular admin commands
      // and the legacy ticket form, while the global instruction handler above
      // can still interrupt and clear this state from any step.
      const actorId = from ? from.id : chatId;
      const promoWizard = await getPromoWizard(chatId, actorId);
      if (promoWizard) {
        if (!(await isSuperAdmin(from, chatId))) {
          await clearPromoWizard(chatId, actorId);
          await callTelegram('sendMessage', {
            chat_id: chatId,
            text: '⛔️ Создавать промокоды могут только администраторы.'
          });
          return res.status(200).json({ ok: true });
        }

        if (!text) {
          await sendPromoWizardPrompt(
            chatId,
            `⚠️ На этом шаге нужно отправить значение <b>текстовым сообщением</b>.`,
            promoWizard.sessionId
          );
          return res.status(200).json({ ok: true });
        }

        await handlePromoWizardMessage({ chatId, from, text, wizard: promoWizard });
        return res.status(200).json({ ok: true });
      }

      // === SUPER ADMIN COMMAND ENGINE ===
      if (text && (await isSuperAdmin(from, chatId))) {

        // Handle Active Admin Prompt Steps
        let currentAdminUser = (await kv.get(`user:${chatId}`)) || {};
        if (currentAdminUser.admin_step) {
          const activeStep = currentAdminUser.admin_step;

          if (activeStep === 'ADMIN_SEARCH_USER') {
            currentAdminUser.admin_step = null;
            await kv.set(`user:${chatId}`, currentAdminUser);

            const result = await searchUserByQuery(text);
            if (result) {
              const card = renderUserProfileCard(result.id, result.user);
              await callTelegram('sendMessage', {
                chat_id: chatId,
                parse_mode: 'HTML',
                text: card.text,
                reply_markup: card.reply_markup
              });
            } else {
              await callTelegram('sendMessage', {
                chat_id: chatId,
                parse_mode: 'HTML',
                text: `❌ <b>Пользователь "${escapeHtml(text)}" не найден в базе данных.</b>`,
                reply_markup: ADMIN_KEYBOARD
              });
            }
            return res.status(200).json({ ok: true });
          }

          if (activeStep === 'ADMIN_ISSUE_TICKET_PROMPT') {
            currentAdminUser.admin_step = null;
            await kv.set(`user:${chatId}`, currentAdminUser);

            const result = await searchUserByQuery(text);
            if (result) {
              await callTelegram('sendMessage', {
                chat_id: chatId,
                parse_mode: 'HTML',
                text: `🎟 <b>ВЫБОР КАТЕГОРИИ БИЛЕТА</b>\n\n` +
                  `Получатель: <b>${escapeHtml(result.user.name || 'Mehmon')}</b> (<code>${result.id}</code>)\n` +
                  `Выберите тип выписываемого билета:`,
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "🎫 Standard", callback_data: `admin_issue_Standard_${result.id}` }],
                    [{ text: "⭐ VIP", callback_data: `admin_issue_VIP_${result.id}` }],
                    [{ text: "🏆 Winner (Конкурс)", callback_data: `admin_issue_Winner_${result.id}` }],
                    [{ text: "❌ Отмена", callback_data: "admin_cancel_step" }]
                  ]
                }
              });
            } else {
              await callTelegram('sendMessage', {
                chat_id: chatId,
                parse_mode: 'HTML',
                text: `❌ <b>Пользователь "${escapeHtml(text)}" не найден.</b>`,
                reply_markup: ADMIN_KEYBOARD
              });
            }
            return res.status(200).json({ ok: true });
          }

          if (activeStep.startsWith('ADMIN_SET_BALANCE_')) {
            const targetUserId = activeStep.replace('ADMIN_SET_BALANCE_', '');
            currentAdminUser.admin_step = null;
            await kv.set(`user:${chatId}`, currentAdminUser);

            const newBalance = parseInt(text.replace(/\D/g, ''), 10);
            if (isNaN(newBalance) || newBalance < 0) {
              await callTelegram('sendMessage', {
                chat_id: chatId,
                parse_mode: 'HTML',
                text: `⚠️ <b>Некорректная сумма баланса.</b> Пожалуйста, введите положительное число.`,
                reply_markup: ADMIN_KEYBOARD
              });
              return res.status(200).json({ ok: true });
            }

            let targetUser = (await kv.get(`user:${targetUserId}`)) || {};
            const oldBalance = typeof targetUser.bonus_balance === 'number' ? targetUser.bonus_balance : 0;
            targetUser.bonus_balance = newBalance;
            await kv.set(`user:${targetUserId}`, targetUser);

            await logAdminAuditAction({
              adminId: chatId,
              recipientId: targetUserId,
              action: 'SET_BALANCE',
              details: { oldBalance, newBalance }
            });

            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `✅ <b>Бонусный баланс пользователя <code>${targetUserId}</code> успешно изменён!</b>\n\nСтарый баланс: ${oldBalance.toLocaleString()} сум\nНовый баланс: <b>${newBalance.toLocaleString()} сум</b>`,
              reply_markup: ADMIN_KEYBOARD
            });

            const card = renderUserProfileCard(targetUserId, targetUser);
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: card.text,
              reply_markup: card.reply_markup
            });
            return res.status(200).json({ ok: true });
          }
        }

        // 1. Search User Command & Button Handler
        if (text === '🔍 Поиск пользователя' || text.startsWith('/find_user')) {
          const query = text.replace('/find_user', '').replace('🔍 Поиск пользователя', '').trim();
          if (query) {
            const result = await searchUserByQuery(query);
            if (result) {
              const card = renderUserProfileCard(result.id, result.user);
              await callTelegram('sendMessage', {
                chat_id: chatId,
                parse_mode: 'HTML',
                text: card.text,
                reply_markup: card.reply_markup
              });
            } else {
              await callTelegram('sendMessage', {
                chat_id: chatId,
                parse_mode: 'HTML',
                text: `❌ <b>Пользователь по запросу <code>${escapeHtml(query)}</code> не найден.</b>\nУбедитесь в правильности Telegram ID, @username или номера телефона.`,
                reply_markup: ADMIN_KEYBOARD
              });
            }
          } else {
            let adminUser = (await kv.get(`user:${chatId}`)) || {};
            adminUser.admin_step = 'ADMIN_SEARCH_USER';
            await kv.set(`user:${chatId}`, adminUser);

            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `🔍 <b>ПОИСК ПОЛЬЗОВАТЕЛЯ В БАЗЕ</b>\n\nВведите Telegram ID, @username, номер телефона или имя пользователя:`,
              reply_markup: {
                inline_keyboard: [
                  [{ text: "❌ Отмена", callback_data: "admin_cancel_step" }]
                ]
              }
            });
          }
          return res.status(200).json({ ok: true });
        }

        // 2. Issue Ticket Command & Button Handler
        if (text === '🎟 Выдать билет' || text.startsWith('/issue_ticket')) {
          const query = text.replace('/issue_ticket', '').replace('🎟 Выдать билет', '').trim();
          if (query) {
            const result = await searchUserByQuery(query);
            if (result) {
              await callTelegram('sendMessage', {
                chat_id: chatId,
                parse_mode: 'HTML',
                text: `🎟 <b>ВЫБОР КАТЕГОРИИ БИЛЕТА</b>\n\n` +
                  `Получатель: <b>${escapeHtml(result.user.name || 'Mehmon')}</b> (<code>${result.id}</code>)\n` +
                  `Выберите тип выписываемого билета:`,
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "🎫 Standard", callback_data: `admin_issue_Standard_${result.id}` }],
                    [{ text: "⭐ VIP", callback_data: `admin_issue_VIP_${result.id}` }],
                    [{ text: "🏆 Winner (Конкурс)", callback_data: `admin_issue_Winner_${result.id}` }],
                    [{ text: "❌ Отмена", callback_data: "admin_cancel_step" }]
                  ]
                }
              });
            } else {
              await callTelegram('sendMessage', {
                chat_id: chatId,
                parse_mode: 'HTML',
                text: `❌ <b>Пользователь по запросу <code>${escapeHtml(query)}</code> не найден.</b>`,
                reply_markup: ADMIN_KEYBOARD
              });
            }
          } else {
            let adminUser = (await kv.get(`user:${chatId}`)) || {};
            adminUser.admin_step = 'ADMIN_ISSUE_TICKET_PROMPT';
            await kv.set(`user:${chatId}`, adminUser);

            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `🎟 <b>РУЧНАЯ ВЫДАЧА БИЛЕТА</b>\n\nВведите ID или @username пользователя, которому нужно выдать билет:`,
              reply_markup: {
                inline_keyboard: [
                  [{ text: "❌ Отмена", callback_data: "admin_cancel_step" }]
                ]
              }
            });
          }
          return res.status(200).json({ ok: true });
        }

        // Hide Keyboard Command
        if (text === '❌ Скрыть меню') {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🙈 <b>Клавиатура супер-администратора скрыта.</b>\n\nЧтобы снова открыть меню управления, введите команду <code>/admin</code>`,
            reply_markup: { remove_keyboard: true }
          });
          return res.status(200).json({ ok: true });
        }

        // Database Reset Command (/reset_db or /clear_db)
        if (text.startsWith('/reset_db') || text.startsWith('/clear_db')) {
          if (text.includes('force')) {
            const allTicketIds = (await kv.get('all_ticket_ids')) || [];
            if (Array.isArray(allTicketIds)) {
              for (const tid of allTicketIds) {
                await kv.set(`ticket:${tid}`, null);
              }
            }

            const allUserIds = (await kv.get('all_user_ids')) || [];
            if (Array.isArray(allUserIds)) {
              for (const uid of allUserIds) {
                await kv.set(`user:${uid}`, null);
              }
            }

            await kv.set('occupied_seats', []);
            await kv.set('allocated_seats', []);
            await kv.set('total_tickets_sold', 0);
            await kv.set('all_ticket_ids', []);
            await kv.set('all_user_ids', []);

            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `✅ <b>BAZA TO'LIQ TOZALANDI! / БАЗА ОЧИЩЕНА!</b>\nBarcha chiptalar, band qilingan joylar va foydalanuvchilar nollashtirildi (0/100).`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          // Ask for confirmation
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `⚠️ <b>DIQQAT! Baza ma'lumotlarini nolga tushirmoqchimisiz?</b>\n\nUshbu amal barcha sotilgan chiptalarni, band qilingan joylarni va foydalanuvchi ma'lumotlarini butunlay o'chirib tashlaydi (0/100).`,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🔥 Ha, bazani tozalash", callback_data: "confirm_reset_db" },
                  { text: "❌ Bekor qilish", callback_data: "cancel_reset_db" }
                ]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }

        // Admin Dashboard / Help
        if (text === '/admin' || text === '/help_admin' || text === '/scanner' || text === '/checkin' || text === '/scan') {
          const scannerAppUrl = `${PUBLIC_DOMAIN}/scanner`;

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `⚡️ <b>TEDxSergeli SUPER ADMIN DASHBOARD &amp; QR-СКАНЕР</b>\n\n` +
              `📱 <b>Входной контроль по QR-кодам:</b>\n` +
              `Нажмите кнопку ниже, чтобы открыть веб-сканер билетов прямо в Telegram!\n\n` +
              `👑 <b>Управление Администраторами:</b>\n` +
              `• <code>/add_admin @username</code> — Назначить Со-Администратора\n` +
              `• <code>/del_admin @username</code> — Снять Со-Администратора\n` +
              `• <code>/admins</code> — Список всех Администраторов (кнопка <b>👑 Админы</b>)\n\n` +
              `🏷 <b>Система Промокодов:</b>\n` +
              `• Нажмите кнопку <b>🏷 Промокоды</b> или <code>/promos</code> — Интерактивное меню управления\n` +
              `• <code>/add_promo</code> — Начать пошаговое создание\n` +
              `• <code>/edit_promo &lt;КОД&gt; &lt;СКИДКА&gt; [&lt;ЛИМИТ&gt;]</code> — Редактировать промокод\n` +
              `• <code>/del_promo &lt;КОД&gt;</code> — Удалить промокод\n\n` +
              `🎫 <b>Управление Контролерами Билетов:</b>\n` +
              `• <code>/add_scanner @username</code> — Назначить волонтера-контролера\n` +
              `• <code>/del_scanner @username</code> — Удалить контролера\n` +
              `• <code>/scanners</code> — Список контролеров (кнопка <b>📋 Контролеры</b>)\n\n` +
              `📊 <b>Мониторинг и База Данных:</b>\n` +
              `• <code>/stats</code> — Живая статистика билетов (кнопка <b>📊 Статистика</b>)\n` +
              `• <code>/reset_db</code> — Очистить все места и сбросить билеты\n` +
              `• <code>/find TEDX-849201</code> — Найти инфо о билете\n` +
              `• <code>/reset_ticket TEDX-849201</code> — Сбросить статус билета в VALID\n\n` +
              `📢 <b>Массовые Рассылки:</b>\n` +
              `• <code>/broadcast Ваш текст</code> — Отправить анонс всем пользователям бота`,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📷 QR-Сканерни очиш / Открыть QR-Сканер",
                    web_app: { url: scannerAppUrl }
                  }
                ]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }

        // /add_promo is now an entry point into the same step-by-step wizard.
        if (/^\/add_promo(?:@[A-Za-z0-9_]+)?(?:\s|$)/iu.test(normalizeActionText(text))) {
          if (String(chatId) === String(actorId)) {
            await clearStoredUserStep(chatId);
          }
          const sessionId = createPromoWizardSessionId();
          await setPromoWizard(chatId, actorId, {
            step: PROMO_CREATION_STATES.CODE,
            sessionId,
            sourceMessageId: null
          });
          await sendPromoWizardPrompt(chatId, PROMO_WIZARD_CODE_PROMPT, sessionId);
          return res.status(200).json({ ok: true });
        }

        // Edit Promo Code Command (/edit_promo <КОД> <СКИДКА> [ЛИМИТ])
        if (text.startsWith('/edit_promo')) {
          const parts = text.trim().split(/\s+/);
          const code = (parts[1] || '').toUpperCase().trim();
          const discountRaw = (parts[2] || '').trim();
          const limitRaw = parts[3] !== undefined ? parseInt(parts[3], 10) : undefined;

          const promos = await getPromos();
          if (!code || !promos[code]) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Использование:</b> <code>/edit_promo &lt;КОД&gt; &lt;СКИДКА&gt; [&lt;ЛИМИТ&gt;]</code>\n\nПример: <code>/edit_promo VIP 100% 20</code>`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          if (discountRaw) {
            if (discountRaw.endsWith('%')) {
              promos[code].discountType = 'percent';
              promos[code].discountValue = Math.min(100, Math.max(1, parseInt(discountRaw.replace('%', ''), 10) || 0));
            } else {
              promos[code].discountType = 'fixed';
              promos[code].discountValue = Math.max(1, parseInt(discountRaw.replace(/\D/g, ''), 10) || 0);
            }
          }

          if (limitRaw !== undefined && !isNaN(limitRaw)) {
            promos[code].maxUses = Math.max(0, limitRaw);
          }

          promos[code].updatedAt = new Date().toISOString();
          await savePromos(promos);
          await renderPromoList(chatId);
          return res.status(200).json({ ok: true });
        }

        // Delete Promo Code
        if (text.startsWith('/del_promo')) {
          const code = text.replace('/del_promo', '').trim().toUpperCase();
          if (!code) {
            await renderPromoList(chatId);
            return res.status(200).json({ ok: true });
          }

          const promos = await getPromos();
          if (promos[code]) {
            delete promos[code];
            await savePromos(promos);
          }
          await renderPromoList(chatId);
          return res.status(200).json({ ok: true });
        }

        // List Promo Codes (/promos or 🏷 Промокоды)
        if (text === '/promos' || text.includes('Промокоды')) {
          await renderPromoList(chatId);
          return res.status(200).json({ ok: true });
        }


        // Add Super Admin
        if (text.startsWith('/add_admin')) {
          const target = text.replace('/add_admin', '').trim().replace('@', '');
          if (!target) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Использование:</b> <code>/add_admin @username</code>`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          let extraAdmins = (await kv.get('super_admins')) || [];
          if (typeof extraAdmins === 'string') {
            try { extraAdmins = JSON.parse(extraAdmins); } catch (_e) { extraAdmins = [extraAdmins]; }
          }
          if (!Array.isArray(extraAdmins)) extraAdmins = [];

          if (!extraAdmins.includes(target)) {
            extraAdmins.push(target);
            await kv.set('super_admins', extraAdmins);
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `👑 <b>Новый Со-Администратор назначен!</b>\n\n👤 <b>Админ:</b> <code>${target}</code>`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Delete Super Admin
        if (text.startsWith('/del_admin')) {
          const target = text.replace('/del_admin', '').trim().replace('@', '');
          let extraAdmins = (await kv.get('super_admins')) || [];
          if (typeof extraAdmins === 'string') {
            try { extraAdmins = JSON.parse(extraAdmins); } catch (_e) { extraAdmins = [extraAdmins]; }
          }
          if (!Array.isArray(extraAdmins)) extraAdmins = [];

          extraAdmins = extraAdmins.filter((a) => String(a).toLowerCase() !== target.toLowerCase());
          await kv.set('super_admins', extraAdmins);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🗑 <b>Со-Администратор удален:</b> <code>${target}</code>`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // List Admins
        if (text === '/admins' || text.includes('Админы')) {
          let extraAdmins = (await kv.get('super_admins')) || [];
          if (typeof extraAdmins === 'string') {
            try { extraAdmins = JSON.parse(extraAdmins); } catch (_e) { extraAdmins = [extraAdmins]; }
          }
          if (!Array.isArray(extraAdmins)) extraAdmins = [];

          const listStr = extraAdmins.length > 0
            ? extraAdmins.map((a, i) => `${i + 1}. <code>${typeof a === 'object' ? (a.username || a.id) : a}</code>`).join('\n')
            : '<i>Дополнительные админы не назначены.</i>';

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `👑 <b>СПИСОК АДМИНИСТРАТОРОВ TEDxSergeli:</b>\n\n` +
              `🥇 <b>Главный Админ:</b> <code>${SUPER_ADMIN_ID}</code>\n\n` +
              `👥 <b>Со-Администраторы:</b>\n${listStr}`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Add Scanner
        if (text.startsWith('/add_scanner')) {
          const target = text.replace('/add_scanner', '').trim().replace('@', '');
          if (!target) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Использование:</b> <code>/add_scanner @username</code>`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          let scanners = (await kv.get('allowed_scanners')) || [];
          if (typeof scanners === 'string') {
            try { scanners = JSON.parse(scanners); } catch (_e) { scanners = [scanners]; }
          }
          if (!Array.isArray(scanners)) scanners = [];

          if (!scanners.includes(target)) {
            scanners.push(target);
            await kv.set('allowed_scanners', scanners);
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🎫 <b>Новый контролер билетов добавлен!</b>\n\n👤 <b>Контролер:</b> <code>${target}</code>`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Remove Scanner
        if (text.startsWith('/del_scanner')) {
          const target = text.replace('/del_scanner', '').trim().replace('@', '');
          let scanners = (await kv.get('allowed_scanners')) || [];
          if (typeof scanners === 'string') {
            try { scanners = JSON.parse(scanners); } catch (_e) { scanners = [scanners]; }
          }
          if (!Array.isArray(scanners)) scanners = [];

          scanners = scanners.filter((s) => String(s).toLowerCase() !== target.toLowerCase());
          await kv.set('allowed_scanners', scanners);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🗑 <b>Контролер удален:</b> <code>${target}</code>`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // List Scanners
        if (text === '/scanners' || text.includes('Контролеры')) {
          let scanners = (await kv.get('allowed_scanners')) || [];
          if (typeof scanners === 'string') {
            try { scanners = JSON.parse(scanners); } catch (_e) { scanners = [scanners]; }
          }
          if (!Array.isArray(scanners)) scanners = [];
          const listStr = scanners.length > 0
            ? scanners.map((s, i) => `${i + 1}. <code>${s}</code>`).join('\n')
            : '<i>Контролеры пока не добавлены.</i>';

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `📋 <b>СПИСОК АВТОРИЗОВАННЫХ КОНТРОЛЕРОВ ВХОДА:</b>\n\n${listStr}`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Statistics & Live Monitoring (Idea 4)
        if (text === '/stats' || text.includes('Статистика') || text === '/live_stats') {
          const totalSold = parseInt((await kv.get('total_tickets_sold')) || 0, 10);
          const allocatedSeats = (await kv.get('allocated_seats')) || [];
          const allTicketIds = (await kv.get('all_ticket_ids')) || [];
          const allUserIds = (await kv.get('all_user_ids')) || [];
          const occupiedSeats = await getActiveOccupiedSeats();

          const displaySold = Math.max(
            totalSold,
            Array.isArray(allocatedSeats) ? allocatedSeats.length : 0,
            Array.isArray(allTicketIds) ? allTicketIds.length : 0
          );

          let scannedCount = 0;
          for (const tid of allTicketIds) {
            const t = await kv.get(`ticket:${tid}`);
            if (t && (t.status === 'used' || t.is_checked_in)) scannedCount++;
          }

          const currentTashkentTime = new Intl.DateTimeFormat('uz-UZ', {
            timeZone: 'Asia/Tashkent',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }).format(new Date());

          const entryPercent = displaySold > 0 ? Math.round((scannedCount / displaySold) * 100) : 0;

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `📊 <b>TEDxSergeli LIVE MONITORING &amp; STATISTIKA:</b>\n\n` +
              `👥 <b>Botdagi foydalanuvchilar:</b> ${allUserIds.length} ta\n` +
              `🎟 <b>Sotilgan chiptalar:</b> ${displaySold} / 100\n` +
              `⏳ <b>Vaqtincha band qilingan joylar:</b> ${occupiedSeats.length}\n\n` +
              `🟢 <b>Tadbirga kirganlar (Checked In):</b> <b>${scannedCount} ta (${entryPercent}%)</b>\n` +
              `⏳ <b>Kirishi kutilayotganlar:</b> <b>${displaySold - scannedCount} ta</b>\n\n` +
              `🕒 <b>Vaqt (Toshkent vaqti UTC+5):</b> <code>${currentTashkentTime}</code>`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Export CSV Command (Idea 1)
        if (text === '/export' || text === '/export_csv') {
          const allTicketIds = (await kv.get('all_ticket_ids')) || [];
          let csvRows = ['Chipta_ID,Ism,Telefon,Sektor,Qator,Orin,Holati,Berilgan_Vaqti_UTC5,Kirgan_Vaqti_UTC5'];

          for (const tid of allTicketIds) {
            const t = await kv.get(`ticket:${tid}`);
            if (t) {
              const name = `"${(t.name || 'Mehmon').replace(/"/g, '""')}"`;
              const phone = `"${(t.phone || 'Noma\'lum').replace(/"/g, '""')}"`;
              const sector = `"${t.sectorName || 'Sektor 1'}"`;
              const status = (t.status === 'used' || t.is_checked_in) ? 'ISHLATILGAN (Kirdi)' : 'FAOL (Kirmadi)';
              const confirmedAt = t.confirmed_at
                ? new Intl.DateTimeFormat('uz-UZ', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(t.confirmed_at))
                : '-';
              const checkedInAt = t.tashkentTime || (t.used_at
                ? new Intl.DateTimeFormat('uz-UZ', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(t.used_at))
                : '-');

              csvRows.push(`${t.id || tid},${name},${phone},${sector},${t.row || 1},${t.seat || 1},${status},${confirmedAt},${checkedInAt}`);
            }
          }

          const csvBuffer = Buffer.from(csvRows.join('\n'), 'utf-8');

          try {
            const formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('caption', `📊 <b>TEDxSergeli Chiptalar Ro'yxati (CSV / Excel)</b>\n\nJami chiptalar: <b>${allTicketIds.length} ta</b>\nVaqt mintaqasi: <b>UTC+5 (Toshkent vaqti)</b>`);
            formData.append('parse_mode', 'HTML');
            formData.append('document', new Blob([csvBuffer], { type: 'text/csv' }), 'tedx_sergeli_tickets.csv');

            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
              method: 'POST',
              body: formData
            });
          } catch (expErr) {
            console.error('Failed to send CSV document:', expErr);
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `📄 <b>CSV MA'LUMOTLAR:</b>\n\n<pre>${csvRows.slice(0, 15).join('\n')}</pre>`,
              reply_markup: ADMIN_KEYBOARD
            });
          }

          return res.status(200).json({ ok: true });
        }

        // Find Ticket
        if (text.startsWith('/find')) {
          const tid = text.replace('/find', '').trim();
          let ticket = await kv.get(`ticket:${tid}`);
          if (!ticket) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `❌ Билет <code>${tid}</code> не найден.`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          const formattedCreated = ticket.confirmed_at ? new Intl.DateTimeFormat('uz-UZ', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ticket.confirmed_at)) : 'Noma\'lum';
          const formattedUsed = ticket.tashkentTime || (ticket.used_at ? new Intl.DateTimeFormat('uz-UZ', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ticket.used_at)) : null);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🔍 <b>CHIPTA HAQIDA MA'LUMOT:</b>\n\n` +
              `🎟 <b>ID:</b> <code>${ticket.id}</code>\n` +
              `👤 <b>Mehmon:</b> ${ticket.name}\n` +
              `📱 <b>Tel:</b> <code>${ticket.phone}</code>\n` +
              `📍 <b>Sektor:</b> ${ticket.sectorName || 'Sektor 1'} | <b>Qator:</b> ${ticket.row} | <b>O'rin:</b> ${ticket.seat}\n` +
              `🔴 <b>Holati:</b> <b>${(ticket.status || 'valid').toUpperCase()}</b>\n` +
              `🕒 <b>Berilgan vaqti (UTC+5):</b> ${formattedCreated}\n` +
              (formattedUsed ? `🟢 <b>Skanerlangan vaqti (UTC+5):</b> ${formattedUsed} (${ticket.checkedInBy || 'scanned'})` : ''),
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Reset Ticket Status back to VALID (e.g. after an accidental scan)
        if (text.startsWith('/reset_ticket')) {
          const tid = text.replace('/reset_ticket', '').trim().toUpperCase();
          if (!tid) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Использование:</b> <code>/reset_ticket TEDX-849201</code>`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          let resetTicket = await kv.get(`ticket:${tid}`);
          if (!resetTicket) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `❌ Билет <code>${tid}</code> не найден.`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          resetTicket.status = 'valid';
          resetTicket.is_checked_in = false;
          delete resetTicket.used_at;
          delete resetTicket.checkedInAt;
          delete resetTicket.tashkentTime;
          delete resetTicket.checkedInBy;
          delete resetTicket.scanned_by;
          await kv.set(`ticket:${tid}`, resetTicket);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `✅ <b>Статус билета сброшен на VALID!</b>\n\n` +
              `🎟 <b>ID:</b> <code>${tid}</code>\n` +
              `👤 <b>Гость:</b> ${resetTicket.name || 'Mehmon'}`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Broadcast (Idea 2)
        if (text.startsWith('/broadcast')) {
          // Already gated by isSuperAdmin() at the top of this command engine —
          // no separate ADMIN_IDS check here, otherwise co-admins added via
          // /add_admin (tracked in KV) would be wrongly denied broadcast rights.
          const broadcastMsg = text.replace('/broadcast', '').trim();
          const isReply = !!update.message.reply_to_message;

          if (!broadcastMsg && !isReply) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>Foydalanish:</b> <code>/broadcast E'lon matni</code>\nИли ответьте на сообщение (Reply) командой <code>/broadcast</code>`,
              reply_markup: ADMIN_KEYBOARD
            });
            return res.status(200).json({ ok: true });
          }

          const allUserIds = (await kv.get('all_user_ids')) || [];
          let successCount = 0;
          let failCount = 0;

          await callTelegram('sendMessage', {
            chat_id: chatId,
            text: `⏳ Рассылка начата для ${allUserIds.length} пользователей. Пожалуйста, подождите...`
          });

          for (const uid of allUserIds) {
            try {
              let r;
              if (isReply) {
                r = await callTelegram('copyMessage', {
                  chat_id: uid,
                  from_chat_id: chatId,
                  message_id: update.message.reply_to_message.message_id
                });
              } else {
                r = await callTelegram('sendMessage', {
                  chat_id: uid,
                  parse_mode: 'HTML',
                  text: `📢 <b>TEDxSergeli Rasmiy E'lon:</b>\n\n${broadcastMsg}`
                });
              }
              if (r && r.ok) {
                successCount++;
              } else {
                failCount++;
              }
            } catch (_bErr) {
              failCount++;
            }
            // Sleep for 40ms to avoid 429 Too Many Requests
            await new Promise(resolve => setTimeout(resolve, 40));
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `✅ <b>Рассылка завершена!</b>\n• Успешно доставлено: ${successCount}\n• Заблокировали бота / Ошибки: ${failCount}`,
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }
      }

      // === FALLBACK FOR UNAUTHORIZED USERS CLICKING ADMIN MENU BUTTONS ===
      if (text && isAdminMenuButton(text) && !(await isSuperAdmin(from, chatId))) {
        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: `🛑 <b>Отказано в доступе / Ruxsat berilmadi</b>\n\nВы не являетесь авторизованным администратором бота.\nДля продолжения работы переключитесь на обычное меню с помощью команды /start.`,
          reply_markup: { remove_keyboard: true }
        });
        return res.status(200).json({ ok: true });
      }

      // === CONTROLLER / SCANNER VOLUNTEER COMMAND ENGINE ===
      if (text && (await isAuthorizedScanner(from, chatId))) {
        if (text === '📖 Инструкция контролера' || text === '/scanner_help') {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `📖 <b>ИНСТРУКЦИЯ ДЛЯ КОНТРОЛЁРОВ TEDxSergeli:</b>\n\n` +
              `1️⃣ <b>Проверка через QR-сканер:</b>\n` +
              `• Нажмите кнопку <b>📱 Входной QR-Сканер</b> внизу.\n` +
              `• Наведите камеру на QR-код на билете гостя.\n` +
              `• Зелёный экран = ГОСТЬ ПРОПУЩЕН ✅\n` +
              `• Красный экран = БИЛЕТ УЖЕ ИСПОЛЬЗОВАН 🛑\n\n` +
              `2️⃣ <b>Проверка вручную (без QR):</b>\n` +
              `• Отправьте боту <code>/find ID</code> (например, <code>/find 947695</code>).\n` +
              `• Или нажмите <b>🔍 Проверить билет по ID</b>.\n` +
              `• Бот покажет статус билета, ФИО гостя и место.`,
            reply_markup: SCANNER_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        if (text === '🔍 Проверить билет по ID' || text === '/control') {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🔍 <b>Проверка билета по ID:</b>\n\nОтправьте команду в формате:\n<code>/find ID_БИЛЕТА</code>\n\nПример: <code>/find TEDX-947695</code> или <code>/find 947695</code>`,
            reply_markup: SCANNER_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Find Ticket command for controllers & admins
        if (text.startsWith('/find')) {
          const rawId = text.replace('/find', '').trim();
          let cleanTid = rawId.replace(/^.*start=scan_/, '').replace(/^scan_/, '').trim().toUpperCase();
          if (/^\d{6}$/.test(cleanTid)) {
            cleanTid = `TEDX-${cleanTid}`;
          }

          let ticket = await kv.get(`ticket:${cleanTid}`);
          if (!ticket && rawId) {
            ticket = await kv.get(`ticket:${rawId}`);
          }

          if (!ticket) {
            const targetId = cleanTid || rawId;
            const allUserIds = (await kv.get('all_user_ids')) || [];
            for (const uid of allUserIds) {
              const u = await kv.get(`user:${uid}`);
              if (u && u.ticketId === targetId) {
                const seatInfo = getSeatDetails(u.seatNumber || 1);
                ticket = {
                  id: u.ticketId,
                  userId: uid,
                  name: u.name || 'Mehmon',
                  phone: u.phone || 'Noma\'lum',
                  seat: seatInfo.seat,
                  row: seatInfo.row,
                  seatNumber: u.seatNumber || 1,
                  status: u.ticket_status || (u.payment_status === 'confirmed' ? 'paid' : 'valid'),
                  created_at: u.updated_at || Date.now(),
                  confirmed_at: u.confirmed_at || Date.now()
                };
                await kv.set(`ticket:${targetId}`, ticket);
                break;
              }
            }
          }

          const activeKeyboard = (await isSuperAdmin(from, chatId)) ? ADMIN_KEYBOARD : SCANNER_KEYBOARD;

          if (!ticket) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `❌ Билет <code>${cleanTid || rawId}</code> не найден в системе.`,
              reply_markup: activeKeyboard
            });
            return res.status(200).json({ ok: true });
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🔍 <b>ИНФОРМАЦИЯ О БИЛЕТЕ:</b>\n\n` +
              `🎟 <b>ID:</b> <code>${ticket.id}</code>\n` +
              `👤 <b>Гость:</b> ${ticket.name || 'Mehmon'}\n` +
              `📱 <b>Тел:</b> <code>${ticket.phone || 'Noma\'lum'}</code>\n` +
              `📍 <b>Ряд:</b> ${ticket.row} | <b>Место:</b> ${ticket.seat} (№${ticket.seatNumber})\n` +
              `🔴 <b>Статус:</b> <b>${(ticket.status || 'valid').toUpperCase()}</b>\n` +
              `🕒 <b>Выдан:</b> ${ticket.confirmed_at ? new Date(ticket.confirmed_at).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' }) : 'Ранее'}\n` +
              (ticket.used_at ? `🟢 <b>Отсканирован:</b> ${new Date(ticket.used_at).toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' })} (@${ticket.scanned_by})` : ''),
            reply_markup: activeKeyboard
          });
          return res.status(200).json({ ok: true });
        }
      }

      // Handle /start command (Normal registration or QR scanner deep link)
      if (text && text.startsWith('/start')) {
        const payload = text.split(' ')[1] || 'direct';

        // Check if QR Code Scan
        if (payload.startsWith('scan_') || payload.startsWith('TEDX-')) {
          const ticketId = payload.replace('scan_', '').trim();
          const authorized = await isAuthorizedScanner(from, chatId);

          if (!authorized) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⛔️ <b>RUXSAT YO'Q / ДОСТУП ОГРАНИЧЕН</b>\n\n` +
                `Вы не являетесь авторизованным контролёром TEDxSergeli.\n` +
                `Сканировать билеты на входе могут только зарегистрированные волонтеры и организаторы.`
            });
            return res.status(200).json({ ok: true });
          }

          let ticket = await kv.get(`ticket:${ticketId}`);

          if (!ticket) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `❌ <b>НЕ ДЕЙСТВИТЕЛЬНЫЙ БИЛЕТ! / CHIPTA TOPILMADI!</b>\n\nБилет с кодом <code>${ticketId}</code> не найден в системе.`
            });
            return res.status(200).json({ ok: true });
          }

          const scannerUsername = from ? (from.username || from.first_name || 'Volunteer') : 'Volunteer';

          if (ticket.status === 'valid') {
            ticket.status = 'used';
            ticket.used_at = new Date().toISOString();
            ticket.scanned_by = scannerUsername;
            await kv.set(`ticket:${ticketId}`, ticket);

            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `🟢 <b>БИЛЕТ УСПЕШНО ПРОВЕРЕН! / CHIPTA TASDIQLANDI!</b>\n\n` +
                `👤 <b>Гость / Mehmon:</b> ${ticket.name || 'Noma\'lum'}\n` +
                `📱 <b>Тел:</b> <code>${ticket.phone || 'Noma\'lum'}</code>\n` +
                `📍 <b>Ряд / Qator:</b> ${ticket.row} | <b>Место / Joy:</b> ${ticket.seat}\n` +
                `🎟 <b>ID билета:</b> <code>${ticket.id}</code>\n\n` +
                `✅ <i>Статус билета изменен на: ИСПОЛЬЗОВАН (Вход разрешен).</i>`
            });
          } else {
            const timeStr = ticket.used_at
              ? new Date(ticket.used_at).toLocaleTimeString('ru-RU', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit' })
              : 'Ранее';

            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ <b>ВНИМАНИЕ! БИЛЕТ УЖЕ ИСПОЛЬЗОВАН! / CHIPTA ALLAQACHON ISHLATILGAN!</b>\n\n` +
                `👤 <b>Гость / Mehmon:</b> ${ticket.name || 'Noma\'lum'}\n` +
                `📍 <b>Ряд / Qator:</b> ${ticket.row} | <b>Место / Joy:</b> ${ticket.seat}\n` +
                `🎟 <b>ID билета:</b> <code>${ticket.id}</code>\n` +
                `🕒 <b>Время первого входа:</b> ${timeStr}\n` +
                `👤 <b>Проверил:</b> @${ticket.scanned_by || 'Admin'}\n\n` +
                `🛑 <i>Повторный вход по данному билету запрещен.</i>`
            });
          }

          return res.status(200).json({ ok: true });
        }

        // Check existing user state
        let existingUser = (await kv.get(`user:${chatId}`)) || {};

        // If user already has a confirmed ticket, show their active ticket info
        if (existingUser.payment_status === 'confirmed' && existingUser.ticketId) {
          const userLang = existingUser.lang || 'ru';
          const ticket = await kv.get(`ticket:${existingUser.ticketId}`);
          const seatInfo = getSeatDetails(existingUser.seatNumber || (ticket ? ticket.seatNumber : 1));

          let msg = '';
          if (userLang === 'uz') {
            msg = `🎉 <b>Hush kelibsiz! Sizda faol TEDxSergeli elektron chiptangiz bor.</b>\n\n` +
              `🎟 <b>Chipta ID:</b> <code>${existingUser.ticketId}</code>\n` +
              `📍 <b>O'rin:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin\n` +
              `👤 <b>Ism:</b> ${existingUser.name || 'Mehmon'}\n\n` +
              `📱 <i>Kirish joyida chiptangizdagi QR-kodni ko'rsatishingiz kifoya.</i>`;
          } else if (userLang === 'en') {
            msg = `🎉 <b>Welcome back! You have an active TEDxSergeli ticket.</b>\n\n` +
              `🎟 <b>Ticket ID:</b> <code>${existingUser.ticketId}</code>\n` +
              `📍 <b>Seat:</b> ${seatInfo.sectorName}, Row ${seatInfo.row} / Seat ${seatInfo.seat}\n` +
              `👤 <b>Name:</b> ${existingUser.name || 'Guest'}\n\n` +
              `📱 <i>Just show your QR code ticket at the entrance.</i>`;
          } else {
            msg = `🎉 <b>С возвращением! У вас есть активный электронный билет TEDxSergeli.</b>\n\n` +
              `🎟 <b>ID Билета:</b> <code>${existingUser.ticketId}</code>\n` +
              `📍 <b>Место:</b> ${seatInfo.sectorName}, ${seatInfo.row}-ряд / ${seatInfo.seat}-место\n` +
              `👤 <b>Имя:</b> ${existingUser.name || 'Гость'}\n\n` +
              `📱 <i>На входе достаточно показать ваш QR-код билет.</i>`;
          }

          if (await isSuperAdmin(from, chatId)) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `👑 <b>Вы авторизованы как Super Admin TEDxSergeli!</b>\n\n${msg}`,
              reply_markup: ADMIN_KEYBOARD
            });
          } else {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: msg
            });
          }
          return res.status(200).json({ ok: true });
        }

        // Check if user is an authorized ticket controller/scanner
        if (await isAuthorizedScanner(from, chatId) && !(await isSuperAdmin(from, chatId))) {
          const volunteerName = from ? (from.first_name || from.username || 'Kontroler') : 'Kontroler';
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🎫 <b>Hush kelibsiz, ${volunteerName}! / Здравствуйте!</b>\n\n` +
              `✅ <b>Siz TEDxSergeli rasmiy chipta nazoratchisisiz (Контролёр).</b>\n` +
              `Вам открыт доступ к входному контролю билетов на мероприятии.\n\n` +
              `📌 <b>Как проверять билеты:</b>\n` +
              `1️⃣ Нажмите кнопку <b>📱 Входной QR-Сканер</b> внизу, чтобы открыть сканер прямо в Telegram.\n` +
              `2️⃣ Наведите камеру на QR-код участника.\n` +
              `3️⃣ Если QR-код не сканируется, используйте кнопку <b>🔍 Проверить по ID</b> или команду <code>/find ID</code>.\n\n` +
              `<i>Успешной работы на мероприятии!</i>`,
            reply_markup: SCANNER_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        // Standard registration start for new users
        let promoCodeFromPayload = null;
        let referrerIdFromPayload = null;

        if (payload.startsWith('ref_')) {
          referrerIdFromPayload = payload.replace('ref_', '').trim();
        } else if (payload.startsWith('promo_')) {
          promoCodeFromPayload = payload.replace('promo_', '').trim().toUpperCase();
        } else if (payload && payload !== 'direct') {
          const allPromos = await getPromos();
          if (allPromos[payload.toUpperCase()]) {
            promoCodeFromPayload = payload.toUpperCase();
          }
        }

        const isNewRegistration = !existingUser.chatId || !existingUser.first_started;
        let referrerIdToSet = existingUser.referrer_id || null;

        if (isNewRegistration && referrerIdFromPayload && referrerIdFromPayload !== String(chatId)) {
          referrerIdToSet = referrerIdFromPayload;
          try {
            let referrer = (await kv.get(`user:${referrerIdFromPayload}`)) || {};
            const currentRefBonus = typeof referrer.bonus_balance === 'number' ? referrer.bonus_balance : 0;
            const currentInvited = typeof referrer.invited_count === 'number' ? referrer.invited_count : 0;
            referrer.bonus_balance = currentRefBonus + REFERRAL_REGISTER_BONUS;
            referrer.invited_count = currentInvited + 1;
            await kv.set(`user:${referrerIdFromPayload}`, referrer);

            const refLang = referrer.lang || 'ru';
            let refMsg = '';
            if (refLang === 'uz') {
              refMsg = `🎉 <b>Do'stingiz taklif havolangiz orqali qo'shildi!</b> Sizga <b>+5 000 UZS</b> keshbek berildi.`;
            } else if (refLang === 'en') {
              refMsg = `🎉 <b>A friend joined via your link!</b> You earned <b>+5,000 UZS</b> cashback.`;
            } else {
              refMsg = `🎉 <b>Друг присоединился по вашей ссылке! Вам начислено +5 000 сум кешбэка.</b>`;
            }
            await callTelegram('sendMessage', {
              chat_id: referrerIdFromPayload,
              parse_mode: 'HTML',
              text: refMsg
            });
          } catch (refRegErr) {
            console.error('Failed to credit referrer on registration:', refRegErr);
          }
        }

        let user = {
          ...existingUser,
          chatId,
          step: existingUser.step || 'LANG',
          source: payload,
          referrer_id: referrerIdToSet,
          first_started: existingUser.first_started || new Date().toISOString(),
          bonus_balance: typeof existingUser.bonus_balance === 'number' ? existingUser.bonus_balance : 0,
          invited_count: typeof existingUser.invited_count === 'number' ? existingUser.invited_count : 0,
          has_purchased: existingUser.has_purchased || false,
          promoCode: promoCodeFromPayload || existingUser.promoCode || null,
          payment_status: existingUser.payment_status || 'none'
        };
        await kv.set(`user:${chatId}`, user);

        if (await isSuperAdmin(from, chatId)) {
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `👑 <b>Вы авторизованы как Super Admin TEDxSergeli!</b>\n\nИспользуйте меню снизу для управления или команду <code>/admin</code> для вызова справки.`,
            reply_markup: ADMIN_KEYBOARD
          });
        }

        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: texts.welcome,
          reply_markup: {
            inline_keyboard: [
              [{ text: "🇺🇿 O'zbekcha", callback_data: `lang_uz` }],
              [{ text: "🇷🇺 Русский", callback_data: `lang_ru` }],
              [{ text: "🇬🇧 English", callback_data: `lang_en` }]
            ]
          }
        });
        return res.status(200).json({ ok: true });
      }

      // Handle Telegram WebApp Data (Seat Selection from Mini App)
      if (update.message && update.message.web_app_data) {
        const { data } = update.message.web_app_data;
        let user = (await kv.get(`user:${chatId}`)) || {};
        try {
          const parsed = JSON.parse(data);
          const { seatNumber, sector, row, seat, bookingExpiresAt } = parsed || {};

          if (seatNumber) {
            const allocatedSeats = (await kv.get('allocated_seats')) || [];
            let activeOccupied = await getActiveOccupiedSeats();
            const isOwnSeat = user.seatNumber === seatNumber;
            const isTaken = !isOwnSeat && (
              (Array.isArray(allocatedSeats) && allocatedSeats.includes(seatNumber)) ||
              activeOccupied.some(i => i.seat === seatNumber)
            );

            if (isTaken) {
              const userLang = user.lang || 'ru';
              const takenMsg = userLang === 'uz'
                ? `⚠️ <b>Kechirasiz, #${seatNumber} joyi band qilib bo'lingan.</b>\nIltimos, boshqa joy tanlang.`
                : userLang === 'en'
                  ? `⚠️ <b>Sorry, seat #${seatNumber} was just taken.</b>\nPlease pick another seat.`
                  : `⚠️ <b>Извините, место №${seatNumber} уже занято.</b>\nПожалуйста, выберите другое место.`;

              await callTelegram('sendMessage', {
                chat_id: chatId,
                parse_mode: 'HTML',
                text: takenMsg,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: userLang === 'uz' ? "🔄 Joy tanlash" : userLang === 'en' ? "🔄 Pick a seat" : "🔄 Выбрать место",
                        web_app: { url: `${PUBLIC_DOMAIN}/seat-picker` }
                      }
                    ]
                  ]
                }
              });
              return res.status(200).json({ ok: true });
            }

            // Release this user's previous hold (if any) and take the new seat
            activeOccupied = activeOccupied.filter(i => i.seat !== seatNumber && i.seat !== user.seatNumber);
            activeOccupied.push({ seat: seatNumber, expiresAt: Date.now() + 15 * 60 * 1000 });
            await kv.set('occupied_seats', activeOccupied);

            user.seatNumber = seatNumber;
            user.seatId = `SEAT-${seatNumber}`;
            user.sector = sector || 1;
            user.row = row || 1;
            user.seat = seat || 1;
            user.step = 'PAYMENT';
            user.payment_status = 'pending_payment';
            user.bookingExpiresAt = bookingExpiresAt || (Date.now() + 15 * 60 * 1000);
            await kv.set(`user:${chatId}`, user);

            const userLang = user.lang || 'ru';
            let msg = '';
            if (userLang === 'uz') {
              msg = `✅ <b>Joy tanlandi: #${seatNumber} (Sektor ${sector || 1}, ${row || 1}-qator / ${seat || 1}-o'rin)</b>\n\n` +
                `⏳ <b>Diqqat! Ushbu joy siz uchun 15 daqiqa davomida band qilinadi.</b>\n` +
                `Shu vaqt ichida to'lov chekini (скриншот) yuborishingiz kerak.\n\n` +
                `💳 <b>To'lov miqdori:</b> 49 999 UZS\n` +
                `💳 <b>Karta raqami:</b> <code>5614 6822 1091 3879</code>\n` +
                `👤 <b>Qabul qiluvchi:</b> Abidjanov Baxtiyor\n\n` +
                `📸 To'lovni amalga oshirgach, <b>chek (скриншот)</b>ni shu yerga yuboring.`;
            } else if (userLang === 'en') {
              msg = `✅ <b>Seat selected: #${seatNumber} (Sector ${sector || 1}, Row ${row || 1} / Seat ${seat || 1})</b>\n\n` +
                `⏳ <b>Attention! This seat is reserved for 15 minutes.</b>\n` +
                `Please send the payment receipt screenshot within this time.\n\n` +
                `💳 <b>Amount:</b> 49,999 UZS\n` +
                `💳 <b>Card Number:</b> <code>5614 6822 1091 3879</code>\n` +
                `👤 <b>Recipient:</b> Abidjanov Baxtiyor\n\n` +
                `📸 After payment, please send the receipt screenshot here.`;
            } else {
              msg = `✅ <b>Место выбрано: №${seatNumber} (Сектор ${sector || 1}, ${row || 1}-ряд / ${seat || 1}-место)</b>\n\n` +
                `⏳ <b>Внимание! Это место забронировано за вами на 15 минут.</b>\n` +
                `Пожалуйста, отправьте чек об оплате в течение этого времени.\n\n` +
                `💳 <b>Сумма к оплате:</b> 49 999 UZS\n` +
                `💳 <b>Номер карты:</b> <code>5614 6822 1091 3879</code>\n` +
                `👤 <b>Получатель:</b> Abidjanov Baxtiyor\n\n` +
                `📸 После оплаты отправьте <b>скриншот чека</b> в этот чат.`;
            }

            const seatPickerUrl = `${PUBLIC_DOMAIN}/seat-picker`;
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: msg,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: userLang === 'uz' ? "🔄 Joyni o'zgartirish" : userLang === 'en' ? "🔄 Change Seat" : "🔄 Сменить место",
                      web_app: { url: seatPickerUrl }
                    }
                  ]
                ]
              }
            });
            return res.status(200).json({ ok: true });
          }
        } catch (e) {
          console.error('Error handling web_app_data:', e);
        }
      }

      // Fetch user state from Vercel KV
      let user = (await kv.get(`user:${chatId}`)) || {};

      // 2. User sends Name
      if (user.step === 'NAME' && text) {
        user.name = text;
        user.step = 'PHONE';
        await kv.set(`user:${chatId}`, user);

        const lang = user.lang || 'ru';
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: texts.askPhone[lang],
          reply_markup: {
            keyboard: [
              [{ text: texts.btnShareContact[lang], request_contact: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
        return res.status(200).json({ ok: true });
      }

      // 3. User sends Phone -> Auto-assign next sequential seat and check Promo Code / Payment
      if (user.step === 'PHONE') {
        if (contact) {
          user.phone = contact.phone_number;
        } else if (text) {
          user.phone = text;
        }

        if (user.phone) {
          let allocatedSeats = (await kv.get('allocated_seats')) || [];
          let activeOccupied = await getActiveOccupiedSeats();

          if (!Array.isArray(allocatedSeats)) allocatedSeats = [];

          const occupiedSeatNumbers = activeOccupied.map(i => i.seat);
          const allTaken = new Set([...occupiedSeatNumbers, ...allocatedSeats]);

          let nextSeatNumber = 1;
          while (allTaken.has(nextSeatNumber) && nextSeatNumber <= 100) {
            nextSeatNumber++;
          }
          if (nextSeatNumber > 100) nextSeatNumber = 100;

          activeOccupied = activeOccupied.filter(i => i.seat !== nextSeatNumber);
          activeOccupied.push({ seat: nextSeatNumber, expiresAt: Date.now() + 15 * 60 * 1000 });
          await kv.set('occupied_seats', activeOccupied);

          user.seatNumber = nextSeatNumber;
          user.seatId = `SEAT-${nextSeatNumber}`;
          user.bookingExpiresAt = Date.now() + 15 * 60 * 1000;

          // Check if user came via Promo Code deep link
          if (user.promoCode) {
            const promos = await getPromos();
            const promo = promos[user.promoCode.toUpperCase()];
            const discountInfo = calculateDiscount(49999, promo);

            if (discountInfo.isValid) {
              user.appliedDiscount = discountInfo.discountAmount;
              user.finalPrice = discountInfo.finalPrice;

              if (discountInfo.finalPrice === 0) {
                // 100% Free Ticket
                promo.usedCount = (promo.usedCount || 0) + 1;
                await savePromos(promos);

                await issueTicketForUser({
                  userId: chatId,
                  user,
                  confirmedBy: `Promo-kod (${user.promoCode})`,
                  promoCode: user.promoCode
                });
                return res.status(200).json({ ok: true });
              }
            }
          }

          // Move to PROMO step to ask for promo code or skip
          user.step = 'PROMO';
          await kv.set(`user:${chatId}`, user);

          const lang = user.lang || 'ru';
          let promoPrompt = '';
          let skipBtnText = '';

          if (lang === 'uz') {
            promoPrompt = `🏷 <b>Sizda promo-kod bormi?</b>\n\nAgar chegirma yoki bepul chipta uchun promo-kodingiz bo'lsa, uni hozir yozib yuboring.\nAks holda <b>«➡️ O'tkazib yuborish»</b> tugmasini bosing.`;
            skipBtnText = "➡️ O'tkazib yuborish";
          } else if (lang === 'en') {
            promoPrompt = `🏷 <b>Do you have a promo code?</b>\n\nIf you have a promo code for a discount or free ticket, enter it now.\nOtherwise, tap <b>«➡️ Skip»</b>.`;
            skipBtnText = "➡️ Skip";
          } else {
            promoPrompt = `🏷 <b>У вас есть промокод?</b>\n\nЕсли у вас есть промокод на скидку или бесплатный билет, введите его прямо сейчас.\nЕсли нет, нажмите кнопку <b>«➡️ Пропустить»</b>.`;
            skipBtnText = "➡️ Пропустить";
          }

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: promoPrompt,
            reply_markup: {
              inline_keyboard: [
                [{ text: skipBtnText, callback_data: 'skip_promo' }]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }
      }

      // Handle user entering Promo Code (Step: PROMO)
      if (user.step === 'PROMO' && text) {
        const inputCode = text.trim().toUpperCase();
        const promos = await getPromos();
        const promo = promos[inputCode];

        if (!promo) {
          const lang = user.lang || 'ru';
          let errText = lang === 'uz'
            ? `❌ <b>Promo-kod topilmadi.</b> Qaytadan kiriting yoki <b>«➡️ O'tkazib yuborish»</b> tugmasini bosing.`
            : lang === 'en'
              ? `❌ <b>Promo code not found.</b> Try again or tap <b>«➡️ Skip»</b>.`
              : `❌ <b>Промокод не найден.</b> Попробуйте еще раз или нажмите <b>«➡️ Пропустить»</b>.`;

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: errText,
            reply_markup: {
              inline_keyboard: [
                [{ text: lang === 'uz' ? "➡️ O'tkazib yuborish" : lang === 'en' ? "➡️ Skip" : "➡️ Пропустить", callback_data: 'skip_promo' }]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }

        const discountInfo = calculateDiscount(49999, promo);
        if (!discountInfo.isValid) {
          const lang = user.lang || 'ru';
          let errText = discountInfo.reason === 'limit_exceeded'
            ? (lang === 'uz' ? `❌ <b>Ushbu promo-kodning foydalanish soni tugagan.</b>` : `❌ <b>Лимит использования этого промокода исчерпан.</b>`)
            : (lang === 'uz' ? `❌ <b>Promo-kod yaroqsiz.</b>` : `❌ <b>Промокод недействителен.</b>`);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: errText,
            reply_markup: {
              inline_keyboard: [
                [{ text: lang === 'uz' ? "➡️ O'tkazib yuborish" : lang === 'en' ? "➡️ Skip" : "➡️ Пропустить", callback_data: 'skip_promo' }]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }

        // Promo code is VALID!
        user.promoCode = inputCode;
        user.appliedDiscount = discountInfo.discountAmount;
        user.finalPrice = discountInfo.finalPrice;

        if (discountInfo.finalPrice === 0) {
          // 100% Free Ticket!
          promo.usedCount = (promo.usedCount || 0) + 1;
          await savePromos(promos);

          await issueTicketForUser({
            userId: chatId,
            user,
            confirmedBy: `Promo-kod (${inputCode})`,
            promoCode: inputCode
          });
          return res.status(200).json({ ok: true });
        }

        // Partial discount - proceed to PAYMENT
        user.step = 'PAYMENT';
        user.payment_status = 'pending_payment';
        await kv.set(`user:${chatId}`, user);

        const lang = user.lang || 'ru';
        const discStr = promo.discountType === 'percent' ? `${promo.discountValue}%` : `${promo.discountValue.toLocaleString()} UZS`;
        const seatInfo = getSeatDetails(user.seatNumber || 1);
        let msg = '';

        if (lang === 'uz') {
          msg = `✅ <b>Promo-kod <code>${inputCode}</code> qabul qilindi!</b> (${discStr} chegirma)\n\n` +
            `📍 <b>O'rin:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin\n\n` +
            `💳 <b>To'lov miqdori:</b> <s>49 999 UZS</s> ➡️ <b>${discountInfo.finalPrice.toLocaleString()} UZS</b>\n` +
            `💳 <b>Karta raqami:</b> <code>5614 6822 1091 3879</code>\n` +
            `👤 <b>Qabul qiluvchi:</b> Abidjanov Baxtiyor\n\n` +
            `📸 To'lovni amalga oshirgach, <b>chek (скриншот)</b>ni shu yerga yuboring.`;
        } else if (lang === 'en') {
          msg = `✅ <b>Promo code <code>${inputCode}</code> applied!</b> (${discStr} discount)\n\n` +
            `📍 <b>Seat:</b> ${seatInfo.sectorName}, Row ${seatInfo.row} / Seat ${seatInfo.seat}\n\n` +
            `💳 <b>Amount:</b> <s>49,999 UZS</s> ➡️ <b>${discountInfo.finalPrice.toLocaleString()} UZS</b>\n` +
            `💳 <b>Card Number:</b> <code>5614 6822 1091 3879</code>\n` +
            `👤 <b>Recipient:</b> Abidjanov Baxtiyor\n\n` +
            `📸 After payment, please send the receipt screenshot here.`;
        } else {
          msg = `✅ <b>Промокод <code>${inputCode}</code> применен!</b> (Скидка ${discStr})\n\n` +
            `📍 <b>Место:</b> ${seatInfo.sectorName}, ${seatInfo.row}-ряд / ${seatInfo.seat}-место\n\n` +
            `💳 <b>Сумма к оплате:</b> <s>49 999 UZS</s> ➡️ <b>${discountInfo.finalPrice.toLocaleString()} UZS</b>\n` +
            `💳 <b>Номер карты:</b> <code>5614 6822 1091 3879</code>\n` +
            `👤 <b>Получатель:</b> Abidjanov Baxtiyor\n\n` +
            `📸 После оплаты отправьте <b>скриншот чека</b> в этот чат.`;
        }

        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: msg,
          reply_markup: { remove_keyboard: true }
        });
        return res.status(200).json({ ok: true });
      }

      // 4. User sends Payment Receipt Photo
      if (photo && photo.length > 0) {
        user.step = 'AWAITING_VERIFICATION';
        user.payment_status = 'pending';
        await kv.set(`user:${chatId}`, user);

        const photoFileId = photo[photo.length - 1].file_id;
        const lang = user.lang || 'ru';

        // Notify User
        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: texts.photoReply[lang]
        });

        // Notify Admin Group for approval
        const targetAdminGroup = ADMIN_CHAT_ID || SUPER_ADMIN_ID;

        if (targetAdminGroup) {
          const seatInfo = getSeatDetails(user.seatNumber || 1);
          const receiptPayload = {
            chat_id: targetAdminGroup,
            photo: photoFileId,
            caption: `📥 <b>YANGI TO'LOV CHEKI!</b>\n\n` +
              `👤 <b>Ism:</b> ${user.name || 'Noma\'lum'}\n` +
              `📱 <b>Tel:</b> <code>${user.phone || 'Noma\'lum'}</code>\n` +
              `📍 <b>Mavjud joy:</b> ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin (№${seatInfo.seatNumber})\n` +
              `🌐 <b>Til:</b> ${(user.lang || 'uz').toUpperCase()}\n` +
              `🆔 <b>User ID:</b> <code>${chatId}</code>`,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "✅ Tasdiqlash", callback_data: `confirm_${chatId}` },
                  { text: "❌ Rad etish", callback_data: `reject_${chatId}` }
                ]
              ]
            }
          };

          const targetTicketThread = TICKET_THREAD_ID || '4';
          if (targetTicketThread) {
            receiptPayload.message_thread_id = parseInt(targetTicketThread, 10);
          }

          await callTelegram('sendPhoto', receiptPayload);
        }
        return res.status(200).json({ ok: true });
      }
    }

    // Handle Inline Button Clicks (Callback Queries)
    if (update.callback_query) {
      const { id, data = '', message, from } = update.callback_query;
      const adminUsername = from.username || from.first_name || 'Admin';
      const chatId = (message && message.chat) ? message.chat.id : from.id;

      // Handle Language Selection
      if (data.startsWith('lang_')) {
        const selectedLang = data.split('_')[1];

        let user = {
          chatId,
          lang: selectedLang,
          step: 'NAME'
        };
        await kv.set(`user:${chatId}`, user);

        await callTelegram('editMessageText', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'HTML',
          text: "✅ " + (selectedLang === 'uz' ? "Til tanlandi" : selectedLang === 'en' ? "Language selected" : "Язык выбран")
        });

        await callTelegram('sendMessage', {
          chat_id: chatId,
          parse_mode: 'HTML',
          text: texts.askName[selectedLang]
        });

        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      if (data === 'confirm_reset_db') {
        const allTicketIds = (await kv.get('all_ticket_ids')) || [];
        if (Array.isArray(allTicketIds)) {
          for (const tid of allTicketIds) {
            await kv.set(`ticket:${tid}`, null);
          }
        }

        const allUserIds = (await kv.get('all_user_ids')) || [];
        if (Array.isArray(allUserIds)) {
          for (const uid of allUserIds) {
            await kv.set(`user:${uid}`, null);
          }
        }

        await kv.set('occupied_seats', []);
        await kv.set('allocated_seats', []);
        await kv.set('total_tickets_sold', 0);
        await kv.set('all_ticket_ids', []);
        await kv.set('all_user_ids', []);

        await callTelegram('editMessageText', {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: 'HTML',
          text: `✅ <b>BAZA TO'LIQ TOZALANDI! / БАЗА ОЧИЩЕНА!</b>\nBarcha chiptalar, band qilingan joylar va foydalanuvchilar nollashtirildi (0/100).`
        });
        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      if (data === 'cancel_reset_db') {
        await callTelegram('editMessageText', {
          chat_id: message.chat.id,
          message_id: message.message_id,
          parse_mode: 'HTML',
          text: `❌ <b>Bazani tozalash bekor qilindi. / Очистка отменена.</b>`
        });
        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      // Handle Promo Code Management Callbacks
      if (isPromoManagementCallback(data) && !(await isSuperAdmin(from, chatId))) {
        await callTelegram('answerCallbackQuery', {
          callback_query_id: id,
          text: '⛔️ Управление промокодами доступно только администраторам.',
          show_alert: true
        });
        return res.status(200).json({ ok: true });
      }

      if (data === 'refresh_promos') {
        await callTelegram('answerCallbackQuery', {
          callback_query_id: id,
          text: '🔄 Обновляю список…'
        });
        await clearPromoWizard(chatId, from.id);
        await renderPromoList(chatId, message ? message.message_id : null);
        return res.status(200).json({ ok: true });
      }

      if (data === PROMO_WIZARD_CANCEL_CALLBACK_PREFIX || data.startsWith(`${PROMO_WIZARD_CANCEL_CALLBACK_PREFIX}:`)) {
        const callbackSessionId = data.startsWith(`${PROMO_WIZARD_CANCEL_CALLBACK_PREFIX}:`)
          ? data.slice(PROMO_WIZARD_CANCEL_CALLBACK_PREFIX.length + 1)
          : null;
        const activeWizard = await getPromoWizard(chatId, from.id);
        const isCurrentSession = activeWizard && (
          callbackSessionId
            ? activeWizard.sessionId === callbackSessionId
            : !activeWizard.sessionId
        );

        if (!isCurrentSession) {
          await callTelegram('answerCallbackQuery', {
            callback_query_id: id,
            text: 'ℹ️ Эта форма уже неактуальна.'
          });
          return res.status(200).json({ ok: true });
        }

        await callTelegram('answerCallbackQuery', {
          callback_query_id: id,
          text: '❌ Создание отменено'
        });
        await clearPromoWizard(chatId, from.id);
        await renderPromoList(chatId, message ? message.message_id : null);
        return res.status(200).json({ ok: true });
      }

      // Legacy template callbacks are also routed into the wizard so every
      // promo creation path now follows the same validated conversation.
      if (data === 'promo_create_wizard' || data.startsWith('gen_promo_')) {
        await callTelegram('answerCallbackQuery', {
          callback_query_id: id,
          text: '➕ Начинаем создание промокода'
        });

        if (String(chatId) === String(from.id)) {
          await clearStoredUserStep(chatId);
        }
        const sessionId = createPromoWizardSessionId();
        await setPromoWizard(chatId, from.id, {
          step: PROMO_CREATION_STATES.CODE,
          sessionId,
          sourceMessageId: message ? message.message_id : null
        });

        if (message && message.message_id) {
          await callTelegram('editMessageText', {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'HTML',
            text: PROMO_WIZARD_CODE_PROMPT,
            reply_markup: promoWizardCancelKeyboard(sessionId)
          });
        } else {
          await sendPromoWizardPrompt(chatId, PROMO_WIZARD_CODE_PROMPT, sessionId);
        }
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('edit_promo_')) {
        const code = data.replace('edit_promo_', '');
        const promos = await getPromos();
        const p = promos[code];

        if (!p) {
          await callTelegram('answerCallbackQuery', { callback_query_id: id, text: "❌ Промокод не найден!" });
          await renderPromoList(chatId, message.message_id);
          return res.status(200).json({ ok: true });
        }

        const discStr = p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString()} UZS`;
        const limitStr = p.maxUses > 0 ? `${p.maxUses} чел.` : 'Безлимитный';

        const text = `✏️ <b>РЕДАКТИРОВАНИЕ ПРОМОКОДА: <code>${escapeHtml(p.code)}</code></b>\n\n` +
          `🏷 <b>Текущая скидка:</b> <b>${escapeHtml(discStr)}</b>\n` +
          `🔢 <b>Лимит использования:</b> <b>${escapeHtml(limitStr)}</b>\n` +
          `📊 <b>Использовано:</b> <b>${p.usedCount || 0}</b>\n` +
          `👤 <b>Создатель:</b> ${escapeHtml(p.createdBy || 'Admin')}\n\n` +
          `Выберите новое значение скидки или лимита в 1 клик:`;

        await callTelegram('editMessageText', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'HTML',
          text,
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🎟 100% (Бесплатно)", callback_data: `set_disc_${p.code}_100p` },
                { text: "🏷 50% Скидка", callback_data: `set_disc_${p.code}_50p` },
                { text: "🏷 20% Скидка", callback_data: `set_disc_${p.code}_20p` }
              ],
              [
                { text: "💰 10,000 UZS", callback_data: `set_disc_${p.code}_10k` },
                { text: "💰 20,000 UZS", callback_data: `set_disc_${p.code}_20k` }
              ],
              [
                { text: "🔢 Лимит: 10", callback_data: `set_limit_${p.code}_10` },
                { text: "🔢 Лимит: 50", callback_data: `set_limit_${p.code}_50` },
                { text: "♾ Безлимит", callback_data: `set_limit_${p.code}_0` }
              ],
              [
                { text: "🗑 Удалить промокод", callback_data: `del_promo_${p.code}` },
                { text: "🔙 Назад в список", callback_data: "refresh_promos" }
              ]
            ]
          }
        });
        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('set_disc_')) {
        const payload = data.replace('set_disc_', '');
        const separatorIndex = payload.lastIndexOf('_');
        const code = payload.slice(0, separatorIndex);
        const valType = payload.slice(separatorIndex + 1);

        const promos = await getPromos();
        if (promos[code]) {
          if (valType.endsWith('p')) {
            promos[code].discountType = 'percent';
            promos[code].discountValue = parseInt(valType.replace('p', ''), 10) || 100;
          } else if (valType.endsWith('k')) {
            promos[code].discountType = 'fixed';
            promos[code].discountValue = (parseInt(valType.replace('k', ''), 10) || 10) * 1000;
          }
          await savePromos(promos);
          await callTelegram('answerCallbackQuery', { callback_query_id: id, text: `✅ Скидка для ${code} изменена!` });
        } else {
          await callTelegram('answerCallbackQuery', {
            callback_query_id: id,
            text: '❌ Промокод больше не существует.',
            show_alert: true
          });
          await renderPromoList(chatId, message ? message.message_id : null);
          return res.status(200).json({ ok: true });
        }

        const p = promos[code];
        if (p) {
          const discStr = p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString()} UZS`;
          const limitStr = p.maxUses > 0 ? `${p.maxUses} чел.` : 'Безлимитный';

          await callTelegram('editMessageText', {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'HTML',
            text: `✏️ <b>РЕДАКТИРОВАНИЕ ПРОМОКОДА: <code>${escapeHtml(p.code)}</code></b>\n\n` +
              `🏷 <b>Текущая скидка:</b> <b>${escapeHtml(discStr)}</b>\n` +
              `🔢 <b>Лимит использования:</b> <b>${escapeHtml(limitStr)}</b>\n` +
              `📊 <b>Использовано:</b> <b>${p.usedCount || 0}</b>\n` +
              `👤 <b>Создатель:</b> ${escapeHtml(p.createdBy || 'Admin')}\n\n` +
              `✅ <i>Скидка успешно обновлена!</i>`,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🎟 100% (Бесплатно)", callback_data: `set_disc_${p.code}_100p` },
                  { text: "🏷 50% Скидка", callback_data: `set_disc_${p.code}_50p` },
                  { text: "🏷 20% Скидка", callback_data: `set_disc_${p.code}_20p` }
                ],
                [
                  { text: "💰 10,000 UZS", callback_data: `set_disc_${p.code}_10k` },
                  { text: "💰 20,000 UZS", callback_data: `set_disc_${p.code}_20k` }
                ],
                [
                  { text: "🔢 Лимит: 10", callback_data: `set_limit_${p.code}_10` },
                  { text: "🔢 Лимит: 50", callback_data: `set_limit_${p.code}_50` },
                  { text: "♾ Безлимит", callback_data: `set_limit_${p.code}_0` }
                ],
                [
                  { text: "🗑 Удалить промокод", callback_data: `del_promo_${p.code}` },
                  { text: "🔙 Назад в список", callback_data: "refresh_promos" }
                ]
              ]
            }
          });
        }
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('set_limit_')) {
        const payload = data.replace('set_limit_', '');
        const separatorIndex = payload.lastIndexOf('_');
        const code = payload.slice(0, separatorIndex);
        const limitVal = parseInt(payload.slice(separatorIndex + 1), 10) || 0;

        const promos = await getPromos();
        if (promos[code]) {
          promos[code].maxUses = limitVal;
          await savePromos(promos);
          await callTelegram('answerCallbackQuery', { callback_query_id: id, text: `✅ Лимит для ${code} изменен!` });
        } else {
          await callTelegram('answerCallbackQuery', {
            callback_query_id: id,
            text: '❌ Промокод больше не существует.',
            show_alert: true
          });
          await renderPromoList(chatId, message ? message.message_id : null);
          return res.status(200).json({ ok: true });
        }

        const p = promos[code];
        if (p) {
          const discStr = p.discountType === 'percent' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString()} UZS`;
          const limitStr = p.maxUses > 0 ? `${p.maxUses} чел.` : 'Безлимитный';

          await callTelegram('editMessageText', {
            chat_id: chatId,
            message_id: message.message_id,
            parse_mode: 'HTML',
            text: `✏️ <b>РЕДАКТИРОВАНИЕ ПРОМОКОДА: <code>${escapeHtml(p.code)}</code></b>\n\n` +
              `🏷 <b>Текущая скидка:</b> <b>${escapeHtml(discStr)}</b>\n` +
              `🔢 <b>Лимит использования:</b> <b>${escapeHtml(limitStr)}</b>\n` +
              `📊 <b>Использовано:</b> <b>${p.usedCount || 0}</b>\n` +
              `👤 <b>Создатель:</b> ${escapeHtml(p.createdBy || 'Admin')}\n\n` +
              `✅ <i>Лимит успешно обновлен!</i>`,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🎟 100% (Бесплатно)", callback_data: `set_disc_${p.code}_100p` },
                  { text: "🏷 50% Скидка", callback_data: `set_disc_${p.code}_50p` },
                  { text: "🏷 20% Скидка", callback_data: `set_disc_${p.code}_20p` }
                ],
                [
                  { text: "💰 10,000 UZS", callback_data: `set_disc_${p.code}_10k` },
                  { text: "💰 20,000 UZS", callback_data: `set_disc_${p.code}_20k` }
                ],
                [
                  { text: "🔢 Лимит: 10", callback_data: `set_limit_${p.code}_10` },
                  { text: "🔢 Лимит: 50", callback_data: `set_limit_${p.code}_50` },
                  { text: "♾ Безлимит", callback_data: `set_limit_${p.code}_0` }
                ],
                [
                  { text: "🗑 Удалить промокод", callback_data: `del_promo_${p.code}` },
                  { text: "🔙 Назад в список", callback_data: "refresh_promos" }
                ]
              ]
            }
          });
        }
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('del_promo_')) {
        const code = data.replace('del_promo_', '');
        await callTelegram('editMessageText', {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'HTML',
          text: `⚠️ <b>ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ</b>\n\nВы действительно хотите удалить промокод <code>${escapeHtml(code)}</code>?`,
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🔥 Да, удалить", callback_data: `confirm_del_${code}` },
                { text: "❌ Отмена", callback_data: "refresh_promos" }
              ]
            ]
          }
        });
        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }

      if (data.startsWith('confirm_del_')) {
        const code = data.replace('confirm_del_', '');
        const promos = await getPromos();
        if (promos[code]) {
          delete promos[code];
          await savePromos(promos);
          await callTelegram('answerCallbackQuery', { callback_query_id: id, text: `🗑 Промокод ${code} удален` });
        } else {
          await callTelegram('answerCallbackQuery', {
            callback_query_id: id,
            text: '❌ Промокод уже удалён.',
            show_alert: true
          });
        }
        await renderPromoList(chatId, message ? message.message_id : null);
        return res.status(200).json({ ok: true });
      }


      // Handle Admin Dynamic Action Callbacks (Search, Manual Issuance, Balance Edit, Revocation)
      if (data.startsWith('admin_')) {
        if (!(await isSuperAdmin(from, chatId))) {
          await callTelegram('answerCallbackQuery', {
            callback_query_id: id,
            text: '🛑 Отказано в доступе. Действие доступно только администраторам.',
            show_alert: true
          });
          return res.status(200).json({ ok: true });
        }

        await callTelegram('answerCallbackQuery', { callback_query_id: id });

        if (data === 'admin_cancel_step') {
          let u = (await kv.get(`user:${chatId}`)) || {};
          u.admin_step = null;
          await kv.set(`user:${chatId}`, u);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: '❌ Действие отменено.',
            reply_markup: ADMIN_KEYBOARD
          });
          return res.status(200).json({ ok: true });
        }

        if (data === 'admin_search_prompt') {
          let u = (await kv.get(`user:${chatId}`)) || {};
          u.admin_step = 'ADMIN_SEARCH_USER';
          await kv.set(`user:${chatId}`, u);

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🔍 <b>ПОИСК ПОЛЬЗОВАТЕЛЯ В БАЗЕ</b>\n\nВведите Telegram ID, @username, номер телефона или имя пользователя:`,
            reply_markup: {
              inline_keyboard: [
                [{ text: "❌ Отмена", callback_data: "admin_cancel_step" }]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }

        if (data.startsWith('admin_select_type_')) {
          const targetId = data.replace('admin_select_type_', '');
          let targetUser = (await kv.get(`user:${targetId}`)) || {};

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🎟 <b>ВЫБОР КАТЕГОРИИ БИЛЕТА</b>\n\n` +
              `Получатель: <b>${escapeHtml(targetUser.name || 'Mehmon')}</b> (<code>${targetId}</code>)\n` +
              `Выберите тип выписываемого билета:`,
            reply_markup: {
              inline_keyboard: [
                [{ text: "🎫 Standard", callback_data: `admin_issue_Standard_${targetId}` }],
                [{ text: "⭐ VIP", callback_data: `admin_issue_VIP_${targetId}` }],
                [{ text: "🏆 Winner (Конкурс)", callback_data: `admin_issue_Winner_${targetId}` }],
                [{ text: "❌ Отмена", callback_data: "admin_cancel_step" }]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }

        if (data.startsWith('admin_issue_')) {
          const parts = data.replace('admin_issue_', '').split('_');
          const ticketType = parts[0];
          const targetId = parts[1];

          try {
            const { ticketId, seatInfo } = await issueManualTicket({
              adminId: chatId,
              recipientId: targetId,
              ticketType
            });

            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `✅ <b>Билет (${escapeHtml(ticketType)}) успешно сгенерирован и отправлен пользователю <code>${targetId}</code>!</b>\n\n` +
                `🎟 <b>ID Билета:</b> <code>${ticketId}</code>\n` +
                `📍 <b>Место:</b> ${seatInfo.sectorName}, ${seatInfo.row}-ряд / ${seatInfo.seat}-место`,
              reply_markup: ADMIN_KEYBOARD
            });

            let freshTargetUser = (await kv.get(`user:${targetId}`)) || {};
            const card = renderUserProfileCard(targetId, freshTargetUser);
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: card.text,
              reply_markup: card.reply_markup
            });
          } catch (issueErr) {
            console.error('Failed manual ticket issuance:', issueErr);
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `❌ <b>Ошибка при выдаче билета:</b> ${escapeHtml(issueErr.message)}`,
              reply_markup: ADMIN_KEYBOARD
            });
          }
          return res.status(200).json({ ok: true });
        }

        if (data.startsWith('admin_ask_balance_')) {
          const targetId = data.replace('admin_ask_balance_', '');
          let u = (await kv.get(`user:${chatId}`)) || {};
          u.admin_step = `ADMIN_SET_BALANCE_${targetId}`;
          await kv.set(`user:${chatId}`, u);

          let targetUser = (await kv.get(`user:${targetId}`)) || {};
          const currentBal = typeof targetUser.bonus_balance === 'number' ? targetUser.bonus_balance : 0;

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `💰 <b>ИЗМЕНЕНИЕ БОНУСНОГО БАЛАНСА</b>\n\n` +
              `Пользователь: <b>${escapeHtml(targetUser.name || 'Mehmon')}</b> (<code>${targetId}</code>)\n` +
              `Текущий баланс: <b>${currentBal.toLocaleString()} сум</b>\n\n` +
              `Введите новую сумму бонусного баланса (число в UZS):`,
            reply_markup: {
              inline_keyboard: [
                [{ text: "❌ Отмена", callback_data: "admin_cancel_step" }]
              ]
            }
          });
          return res.status(200).json({ ok: true });
        }

        if (data.startsWith('admin_revoke_ticket_')) {
          const targetId = data.replace('admin_revoke_ticket_', '');
          let targetUser = (await kv.get(`user:${targetId}`)) || {};

          if (!targetUser.ticketId) {
            await callTelegram('sendMessage', {
              chat_id: chatId,
              parse_mode: 'HTML',
              text: `⚠️ У пользователя <code>${targetId}</code> нет активного билета.`
            });
            return res.status(200).json({ ok: true });
          }

          const revokedTicketId = targetUser.ticketId;
          const seatNum = targetUser.seatNumber;

          targetUser.payment_status = 'cancelled';
          targetUser.ticket_status = 'CANCELLED';
          targetUser.ticketId = null;
          await kv.set(`user:${targetId}`, targetUser);

          let ticketObj = (await kv.get(`ticket:${revokedTicketId}`)) || {};
          ticketObj.status = 'cancelled';
          ticketObj.ticket_status = 'CANCELLED';
          ticketObj.cancelled_at = new Date().toISOString();
          ticketObj.cancelled_by = String(chatId);
          await kv.set(`ticket:${revokedTicketId}`, ticketObj);

          if (seatNum) {
            let allocatedSeats = (await kv.get('allocated_seats')) || [];
            allocatedSeats = allocatedSeats.filter(s => s !== seatNum);
            await kv.set('allocated_seats', allocatedSeats);
          }

          await logAdminAuditAction({
            adminId: chatId,
            recipientId: targetId,
            action: 'REVOKE_TICKET',
            details: { ticketId: revokedTicketId, seatNumber: seatNum }
          });

          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: `🚫 <b>Билет <code>${revokedTicketId}</code> успешно отозван!</b>\nМесто №${seatNum || '?'} освобождено.`,
            reply_markup: ADMIN_KEYBOARD
          });

          const card = renderUserProfileCard(targetId, targetUser);
          await callTelegram('sendMessage', {
            chat_id: chatId,
            parse_mode: 'HTML',
            text: card.text,
            reply_markup: card.reply_markup
          });
          return res.status(200).json({ ok: true });
        }
      }

      // Handle Skip Promo Callback
      if (data === 'skip_promo') {
        let user = (await kv.get(`user:${chatId}`)) || {};
        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        await sendBonusOfferOrPayment(chatId, user, BASE_TICKET_PRICE);
        return res.status(200).json({ ok: true });
      }

      // Handle Use Bonus Cashback Callback
      if (data === 'use_bonus') {
        let user = (await kv.get(`user:${chatId}`)) || {};
        const bonusDiscount = user.pending_bonus_discount || 0;
        const priceAfterPromo = user.price_after_promo || BASE_TICKET_PRICE;
        const finalPrice = Math.max(0, priceAfterPromo - bonusDiscount);

        user.step = 'PAYMENT';
        user.payment_status = 'pending_payment';
        user.used_bonus_amount = bonusDiscount;
        user.finalPrice = finalPrice;
        await kv.set(`user:${chatId}`, user);

        await callTelegram('answerCallbackQuery', {
          callback_query_id: id,
          text: `🎁 Бонус -${bonusDiscount.toLocaleString()} UZS применён!`
        });

        await sendPaymentInstructions(chatId, user);
        return res.status(200).json({ ok: true });
      }

      // Handle Skip Bonus Callback
      if (data === 'skip_bonus') {
        let user = (await kv.get(`user:${chatId}`)) || {};
        const priceAfterPromo = user.price_after_promo || BASE_TICKET_PRICE;

        user.step = 'PAYMENT';
        user.payment_status = 'pending_payment';
        user.used_bonus_amount = 0;
        user.finalPrice = priceAfterPromo;
        await kv.set(`user:${chatId}`, user);

        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        await sendPaymentInstructions(chatId, user);
        return res.status(200).json({ ok: true });
      }

      // Handle Admin Actions (Confirm / Reject)
      if (data.startsWith('confirm_') || data.startsWith('reject_')) {
        const [action, userIdStr] = data.split('_');
        const userId = parseInt(userIdStr, 10);
        let user = (await kv.get(`user:${userId}`)) || {};

        if (user.payment_status === 'confirmed' || user.payment_status === 'rejected') {
          await callTelegram('answerCallbackQuery', {
            callback_query_id: id,
            text: "⚠️ Bu to'lov allaqachon ko'rib chiqilgan / Заявка уже обработана!",
            show_alert: true
          });
          return res.status(200).json({ ok: true });
        }

        if (action === 'confirm') {
          const { ticketId, seatInfo } = await issueTicketForUser({
            userId,
            user,
            seatNumber: user.seatNumber,
            confirmedBy: `@${adminUsername}`,
            promoCode: user.promoCode || null
          });

          await callTelegram('editMessageCaption', {
            chat_id: message.chat.id,
            message_id: message.message_id,
            parse_mode: 'HTML',
            caption: `${message.caption || ''}\n\n✅ <b>TASDIQLANDI (CHIPTA YUBORILDI)</b>\nID: <code>${ticketId}</code> | ${seatInfo.sectorName}, ${seatInfo.row}-qator / ${seatInfo.seat}-o'rin (№${seatInfo.seatNumber})\nTasdiqladi: @${adminUsername}`,
            reply_markup: { inline_keyboard: [] }
          });
        } else if (action === 'reject') {
          user.payment_status = 'rejected';
          await kv.set(`user:${userId}`, user);

          await callTelegram('sendMessage', {
            chat_id: userId,
            parse_mode: 'HTML',
            text: texts.reject
          });

          await callTelegram('editMessageCaption', {
            chat_id: message.chat.id,
            message_id: message.message_id,
            parse_mode: 'HTML',
            caption: `${message.caption || ''}\n\n❌ <b>RAD ETILDI</b>\nRad etdi: @${adminUsername}`,
            reply_markup: { inline_keyboard: [] }
          });
        }

        await callTelegram('answerCallbackQuery', { callback_query_id: id });
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
