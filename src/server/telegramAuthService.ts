import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { TELEGRAM_BOT_TOKEN } from './telegramProfileService';

export const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'kaalix_own_bot';

export interface RequiredChannel {
  id: string;
  name: string;
  url: string;
  type: 'channel' | 'group' | 'supergroup';
  chatId: number;
}

export const REQUIRED_CHANNELS: RequiredChannel[] = [
  {
    id: '@TheFelixModz',
    name: 'Channel 1 (Felix Modz)',
    url: 'https://t.me/TheFelixModz',
    type: 'channel',
    chatId: -1003972374681,
  },
  {
    id: '@autolikegc',
    name: 'Channel 2 (Kaalix Gang)',
    url: 'https://t.me/autolikegc',
    type: 'supergroup',
    chatId: -1003715566556,
  },
  {
    id: '@FelixOfcGroup',
    name: 'Channel 3 (Felix Kingdom)',
    url: 'https://t.me/FelixOfcGroup',
    type: 'supergroup',
    chatId: -1004361616088,
  },
];

export interface TelegramAuthUser {
  id: string | number;
  first_name: string;
  last_name?: string;
  name: string;
  username: string;
  photo_url: string;
  verified: boolean;
  verifiedAt: number;
  joinedChannels: string[];
}

export interface AuthSession {
  token: string;
  code: string;
  status: 'pending' | 'bot_started' | 'verified';
  user?: TelegramAuthUser;
  channelsJoined: Record<string, boolean>;
  createdAt: number;
  updatedAt: number;
}

const SESSIONS_FILE = path.resolve(process.cwd(), 'local_telegram_sessions.json');
let sessions: Record<string, AuthSession> = {};

function loadSessions(): Record<string, AuthSession> {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      sessions = JSON.parse(data);
    }
  } catch {}
  return sessions;
}

function saveSessions() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch {}
}

loadSessions();

function generateCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
  }
  return res;
}

export function initAuthSession(): AuthSession & { botUrl: string; channels: RequiredChannel[] } {
  const token = randomUUID().replace(/-/g, '').slice(0, 16);
  const code = generateCode();
  const session: AuthSession = {
    token,
    code,
    status: 'pending',
    channelsJoined: {
      '@TheFelixModz': false,
      '@autolikegc': false,
      '@FelixOfcGroup': false,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  sessions[token] = session;
  saveSessions();

  return {
    ...session,
    botUrl: `https://t.me/${BOT_USERNAME}?start=auth_${token}`,
    channels: REQUIRED_CHANNELS,
  };
}

export function getAuthSession(identifier: string): AuthSession | null {
  if (!identifier) return null;
  if (sessions[identifier]) return sessions[identifier];
  const upper = identifier.toUpperCase().trim();
  for (const s of Object.values(sessions)) {
    if (s.code === upper) return s;
  }
  return null;
}

export async function checkChannelMembership(chatId: string | number, userId: string | number): Promise<{ isMember: boolean; status: string; canVerify: boolean }> {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(chatId)}&user_id=${encodeURIComponent(userId)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const data: any = await res.json();

    if (data.ok && data.result) {
      const status = data.result.status;
      const isMember = ['creator', 'administrator', 'member', 'restricted'].includes(status);
      return { isMember, status, canVerify: true };
    }

    if (data.description?.includes('CHAT_ADMIN_REQUIRED') || data.description?.includes('member list is inaccessible')) {
      return { isMember: true, status: 'admin_required_bypass', canVerify: false };
    }

    return { isMember: false, status: data.description || 'unknown', canVerify: false };
  } catch {
    return { isMember: true, status: 'network_bypass', canVerify: false };
  }
}

export async function checkAllChannels(userId: string | number): Promise<{ allJoined: boolean; details: Record<string, boolean>; leftChannels: string[] }> {
  const details: Record<string, boolean> = {};
  const leftChannels: string[] = [];
  let allJoined = true;

  for (const ch of REQUIRED_CHANNELS) {
    const check = await checkChannelMembership(ch.id, userId);
    details[ch.id] = check.isMember;
    if (!check.isMember) {
      allJoined = false;
      leftChannels.push(ch.id);
    }
  }

  return { allJoined, details, leftChannels };
}

// Check membership for active users (Auto-Logout detector)
export async function validateUserMembership(userId: string | number): Promise<{ valid: boolean; leftChannels: string[] }> {
  if (!userId) return { valid: true, leftChannels: [] };
  try {
    const { allJoined, leftChannels } = await checkAllChannels(userId);
    return { valid: allJoined, leftChannels };
  } catch {
    return { valid: true, leftChannels: [] };
  }
}

export function completeAuthSession(
  session: AuthSession,
  telegramUser: { id: string | number; first_name: string; last_name?: string; username?: string; photo_url?: string }
): AuthSession {
  const fullName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || `Telegram ${telegramUser.id}`;
  const username = telegramUser.username ? `@${telegramUser.username.replace(/^@/, '')}` : '';

  const user: TelegramAuthUser = {
    id: telegramUser.id,
    first_name: telegramUser.first_name,
    last_name: telegramUser.last_name || '',
    name: fullName,
    username,
    photo_url: telegramUser.photo_url || `/api/telegram/verified-avatar?user_id=${telegramUser.id}`,
    verified: true,
    verifiedAt: Date.now(),
    joinedChannels: REQUIRED_CHANNELS.map((c) => c.id),
  };

  session.status = 'verified';
  session.user = user;
  session.channelsJoined = {
    '@TheFelixModz': true,
    '@autolikegc': true,
    '@FelixOfcGroup': true,
  };
  session.updatedAt = Date.now();
  saveSessions();

  return session;
}

export async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: any) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {}
}

export async function answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {}
}

// Background Telegram Poller
let isPolling = false;
let lastUpdateId = 0;

export function startTelegramPoller() {
  if (isPolling) return;
  isPolling = true;

  async function poll() {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&limit=20&timeout=5&allowed_updates=${encodeURIComponent(JSON.stringify(['message', 'callback_query']))}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      const data: any = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);

          // 1. Handle Callback Query (When user taps [Verification] button)
          if (update.callback_query) {
            const cb = update.callback_query;
            const cbData = String(cb.data || '');
            const from = cb.from;
            if (!from) continue;

            const token = cbData.replace(/^verify_/i, '').trim();
            const session = getAuthSession(token);

            if (session) {
              const { allJoined } = await checkAllChannels(from.id);
              if (allJoined) {
                completeAuthSession(session, from);
                await answerCallbackQuery(cb.id, '✅ Verification pura ho gaya! Account ban chuka hai.', true);
                await sendTelegramMessage(
                  cb.message?.chat?.id || from.id,
                  `🎉 <b>Verification Pura Ho Gaya!</b>\n\n` +
                  `Badhai ho <b>${from.first_name}</b>, aapka account successfully verify ho chuka hai! 🚀\n\n` +
                  `Aap ab website par return karein, poora access unlock ho gaya hai.`
                );
              } else {
                await answerCallbackQuery(
                  cb.id,
                  '❌ Aapne abhi tak sabhi channels join nahi kiye hain! Kripya teeno channels join karein phir Verification dabayein.',
                  true
                );
              }
            } else {
              await answerCallbackQuery(cb.id, '⚠️ Session expire ho chuka hai. Website se naya link open karein.', true);
            }
            continue;
          }

          // 2. Handle /start Message
          const msg = update.message;
          if (!msg || !msg.from) continue;

          const text = (msg.text || '').trim();
          const from = msg.from;

          const tokenMatch = text.match(/(?:auth_|kaalix_)?([a-zA-Z0-9]{6,32})/i);
          let matchedSession: AuthSession | null = null;

          if (text.startsWith('/start') || text.startsWith('/verify')) {
            const rawParam = text.split(/\s+/)[1] || '';
            const cleanToken = rawParam.replace(/^(auth_|kaalix_)/i, '');
            if (cleanToken) {
              matchedSession = getAuthSession(cleanToken);
            }
          }

          if (!matchedSession && tokenMatch) {
            matchedSession = getAuthSession(tokenMatch[1]);
          }

          if (matchedSession) {
            // Check channel memberships
            const { allJoined, details } = await checkAllChannels(from.id);
            matchedSession.channelsJoined = details;

            if (allJoined) {
              // User already joined in all channels -> Show only 1 button: [Verification]
              const singleButtonMarkup = {
                inline_keyboard: [
                  [
                    { text: '✅ Verification', callback_data: `verify_${matchedSession.token}` }
                  ]
                ]
              };

              await sendTelegramMessage(
                msg.chat.id,
                `👋 <b>Welcome ${from.first_name}!</b>\n\n` +
                `Aap pehle se hamare sabhi channels me joined hain! 🎉\n\n` +
                `Niche <b>Verification</b> ka button dabayein apna account activate karne ke liye:`,
                singleButtonMarkup
              );
            } else {
              // User has NOT joined all channels -> Show exactly 4 buttons:
              // [Chanel 1] [Chanel 2]
              // [    Chanel 3    ]
              // [  Verification  ]
              matchedSession.status = 'bot_started';
              matchedSession.user = {
                id: from.id,
                first_name: from.first_name,
                last_name: from.last_name || '',
                name: [from.first_name, from.last_name].filter(Boolean).join(' '),
                username: from.username ? `@${from.username}` : '',
                photo_url: `/api/telegram/verified-avatar?user_id=${from.id}`,
                verified: false,
                verifiedAt: 0,
                joinedChannels: Object.keys(details).filter((k) => details[k]),
              };
              saveSessions();

              const fourButtonsMarkup = {
                inline_keyboard: [
                  [
                    { text: '📢 Chanel 1', url: 'https://t.me/TheFelixModz' },
                    { text: '🌿 Chanel 2', url: 'https://t.me/autolikegc' },
                  ],
                  [
                    { text: '👑 Chanel 3', url: 'https://t.me/FelixOfcGroup' },
                  ],
                  [
                    { text: '🔄 Verification', callback_data: `verify_${matchedSession.token}` },
                  ],
                ],
              };

              await sendTelegramMessage(
                msg.chat.id,
                `⚠️ <b>Channel Join Required!</b>\n\n` +
                `Website open karne ke liye aapko niche diye gaye 3 channels join karna zaroori hai:\n\n` +
                `1. <b>The Felix Modz</b>\n` +
                `2. <b>Autolike GC</b>\n` +
                `3. <b>Felix Official Group</b>\n\n` +
                `Teeno channels join karne ke baad niche <b>Verification</b> button dabayein!`,
                fourButtonsMarkup
              );
            }
          } else if (text.startsWith('/start')) {
            await sendTelegramMessage(
              msg.chat.id,
              `👋 <b>Welcome to Kᴀᴀʟɪx Free APIs Bot!</b>\n\n` +
              `Website account verify karne ke liye website par jakar <b>Connect with Telegram</b> button dabayein!`
            );
          }
        }
      }
    } catch {}

    const t = setTimeout(poll, 2500);
    if (typeof t.unref === 'function') {
      t.unref();
    }
  }

  poll();
}
