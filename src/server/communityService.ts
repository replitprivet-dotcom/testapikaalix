import fs from 'fs';
import path from 'path';
import { createHash, randomUUID } from 'crypto';
import { Db, MongoClient } from 'mongodb';
import { TELEGRAM_BOT_TOKEN } from './telegramProfileService';

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const DB_NAME = process.env.MONGODB_DB || 'kaalix_db';
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || '';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let mongoFailed = false;

async function getDb(): Promise<Db | null> {
  if (!MONGO_URI || mongoFailed) return null;
  if (cachedDb && cachedClient) return cachedDb;
  try {
    const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 3000, connectTimeoutMS: 5000, maxPoolSize: 10 });
    await client.connect();
    cachedClient = client;
    cachedDb = client.db(DB_NAME);
    return cachedDb;
  } catch {
    mongoFailed = true;
    return null;
  }
}

function cleanText(value: unknown, max: number): string {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

export function hashIp(ip: string): string {
  return createHash('sha256').update(`${process.env.MONGODB_IP_SALT || 'kaalix-community'}:${ip}`).digest('hex').slice(0, 24);
}

export const AI_BOT_PROFILE_ID = 'kaalix_ai_bot';
export const AI_BOT_AUTHOR = {
  name: 'Kᴀᴀʟɪx AI ✦',
  avatar: '/favicon-dp.jpg',
  username: '@kaalix_ai',
  telegramId: 'BOT',
  isBot: true,
};

async function queryGptLogic(question: string): Promise<string> {
  try {
    const prompt = 'You are Kaalix AI Assistant in the Kaalix Free APIs community chat. Reply helpfully, smartly, and concisely (2-4 sentences max) in friendly Hinglish or English based on the user language.';
    const url = `https://api-rebix.vercel.app/api/gptlogic?q=${encodeURIComponent(question)}&prompt=${encodeURIComponent(prompt)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(12000),
    });
    const data: any = await res.json();
    return data?.response || data?.result || data?.message || 'Hello! I am Kaalix AI Assistant. How can I help you today?';
  } catch {
    return 'Main Kᴀᴀʟɪx AI Assistant hoon! Mujhe koi sawal puchein ya Kaalix Free APIs ke baare me jankari lein.';
  }
}

export interface CommunityProfile {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  telegramId?: string;
  username?: string;
  createdAt: number;
  updatedAt: number;
}

function defaultProfile(id: string): CommunityProfile {
  return {
    id,
    name: `Guest ${id.slice(-4).toUpperCase()}`,
    avatar: '/favicon-dp.jpg',
    verified: true, // auto-verified in local fallback mode
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function publicProfile(profile: any): CommunityProfile {
  return {
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    verified: Boolean(profile.verified),
    telegramId: profile.telegramId,
    username: profile.username,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

// Local storage fallback for community
const LOCAL_COMMUNITY_FILE = path.resolve(process.cwd(), 'local_community.json');

interface LocalCommunityStore {
  profiles: Record<string, any>;
  verifications: Record<string, any>;
  messages: any[];
}

function getDefaultCommunityStore(): LocalCommunityStore {
  return {
    profiles: {},
    verifications: {},
    messages: [
      {
        id: 'msg-welcome',
        profileId: 'admin',
        author: { name: 'Kᴀᴀʟɪx Admin', avatar: '/favicon-dp.jpg', username: '@kaalix', telegramId: 'ADMIN' },
        text: 'Welcome to Kᴀᴀʟɪx Free APIs Community! Explore endpoints, share feedback, and connect with developers.',
        image: '',
        replyToId: null,
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'msg-ai-welcome',
        profileId: AI_BOT_PROFILE_ID,
        author: AI_BOT_AUTHOR,
        text: '👋 Main Kᴀᴀʟɪx AI Assistant hoon! Agar mujhse koi baat karni ho ya help chahiye, to mere message par "Reply" karein.',
        image: '',
        replyToId: null,
        createdAt: Date.now() - 60000,
      },
    ],
  };
}

let communityStore: LocalCommunityStore | null = null;
let communitySaveTimeout: NodeJS.Timeout | null = null;

function loadCommunityStore(): LocalCommunityStore {
  if (communityStore) return communityStore;
  try {
    if (fs.existsSync(LOCAL_COMMUNITY_FILE)) {
      const data = fs.readFileSync(LOCAL_COMMUNITY_FILE, 'utf-8');
      communityStore = { ...getDefaultCommunityStore(), ...JSON.parse(data) };
      return communityStore!;
    }
  } catch {}
  communityStore = getDefaultCommunityStore();
  persistCommunitySoon();
  return communityStore;
}

function persistCommunitySoon() {
  if (communitySaveTimeout) return;
  communitySaveTimeout = setTimeout(() => {
    communitySaveTimeout = null;
    if (!communityStore) return;
    try {
      fs.writeFileSync(LOCAL_COMMUNITY_FILE, JSON.stringify(communityStore, null, 2), 'utf-8');
    } catch {}
  }, 1000);
}

export async function getOrCreateProfile(profileId: string | undefined, ip: string, userAgent = ''): Promise<CommunityProfile> {
  const cleanId = cleanText(profileId, 80) || randomUUID();
  const ipHash = hashIp(ip);

  try {
    const db = await getDb();
    if (db) {
      const profiles = db.collection<any>('community_profiles');
      const existing = await profiles.findOne({ id: cleanId });
      if (existing) {
        await profiles.updateOne({ id: cleanId }, { $set: { ipHash, userAgent: cleanText(userAgent, 240), lastSeenAt: Date.now() } });
        return publicProfile(existing);
      }
      const profile = defaultProfile(cleanId);
      await profiles.insertOne({ ...profile, ipHash, userAgent: cleanText(userAgent, 240), lastSeenAt: Date.now() });
      return profile;
    }
  } catch {}

  // Local storage fallback
  const store = loadCommunityStore();
  if (store.profiles[cleanId]) {
    store.profiles[cleanId].lastSeenAt = Date.now();
    persistCommunitySoon();
    return publicProfile(store.profiles[cleanId]);
  }
  const newProf = defaultProfile(cleanId);
  store.profiles[cleanId] = { ...newProf, ipHash, userAgent: cleanText(userAgent, 240), lastSeenAt: Date.now() };
  persistCommunitySoon();
  return newProf;
}

export async function updateProfile(profileId: string, ip: string, patch: { name?: string; avatar?: string; telegramSync?: boolean }): Promise<CommunityProfile> {
  const cleanId = cleanText(profileId, 80);
  const current = await getOrCreateProfile(profileId, ip);

  // Profile Lock: Only internal Telegram sync can update name/avatar, website users cannot manually change it
  if (!patch.telegramSync) {
    return current;
  }

  const name = cleanText(patch.name, 32) || current.name;
  const avatar = typeof patch.avatar === 'string' && (patch.avatar.startsWith('/') || patch.avatar.startsWith('data:image/')) ? patch.avatar.slice(0, 2_000_000) : current.avatar;

  try {
    const db = await getDb();
    if (db) {
      const profiles = db.collection<any>('community_profiles');
      await profiles.updateOne({ id: current.id }, { $set: { name, avatar, updatedAt: Date.now(), ipHash: hashIp(ip) } });
      return publicProfile({ ...current, name, avatar, updatedAt: Date.now() });
    }
  } catch {}

  const store = loadCommunityStore();
  store.profiles[cleanId] = { ...current, name, avatar, updatedAt: Date.now() };
  persistCommunitySoon();
  return publicProfile(store.profiles[cleanId]);
}

export async function startCommunityVerification(profileId: string, ip: string, origin: string) {
  const profile = await getOrCreateProfile(profileId, ip);
  const token = randomUUID().replace(/-/g, '');

  if (!TELEGRAM_BOT_TOKEN) {
    // If Telegram bot is not configured, automatically verify the profile
    profile.verified = true;
    await updateProfile(profile.id, ip, { name: profile.name, avatar: profile.avatar });
    return { token, link: '', verified: true, expiresAt: Date.now() + 600000 };
  }

  try {
    const db = await getDb();
    const botRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`, { signal: AbortSignal.timeout(8000) });
    const botData: any = await botRes.json();
    const username = TELEGRAM_BOT_USERNAME || botData?.result?.username;
    if (!username) throw new Error('Telegram bot username is not available');

    if (db) {
      await db.collection('community_verifications').insertOne({ token, profileId: profile.id, ipHash: hashIp(ip), status: 'pending', createdAt: Date.now(), expiresAt: Date.now() + 10 * 60 * 1000 });
    }
    if (origin) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(`${origin}/api/telegram/webhook`)}`, { signal: AbortSignal.timeout(8000) }).catch(() => {});
    }
    return { token, link: `https://t.me/${username}?start=kaalix_${token}`, expiresAt: Date.now() + 10 * 60 * 1000 };
  } catch (err: any) {
    return { token, link: '', verified: true, expiresAt: Date.now() + 600000 };
  }
}

export async function getCommunityVerification(profileId: string, token: string, ip: string) {
  try {
    const db = await getDb();
    if (db) {
      const record = await db.collection<any>('community_verifications').findOne({ token: cleanText(token, 80), profileId: cleanText(profileId, 80), ipHash: hashIp(ip), expiresAt: { $gt: Date.now() } });
      const profile = await getOrCreateProfile(profileId, ip);
      return { verified: Boolean(record?.status === 'verified' && profile.verified), profile };
    }
  } catch {}

  const profile = await getOrCreateProfile(profileId, ip);
  return { verified: profile.verified, profile };
}

export async function processTelegramVerificationUpdate(update: any) {
  const message = update?.message;
  const raw = typeof message?.text === 'string' ? message.text : '';
  const match = raw.match(/^\/start(?:\s+kaalix_([a-zA-Z0-9]+))?/);
  if (!match?.[1] || !message?.from?.id || !TELEGRAM_BOT_TOKEN) return { ok: true, handled: false };

  try {
    const db = await getDb();
    if (db) {
      const verification = await db.collection<any>('community_verifications').findOne({ token: match[1], status: 'pending', expiresAt: { $gt: Date.now() } });
      if (!verification) return { ok: true, handled: false };
      const user = message.from;
      const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || `Telegram ${user.id}`;
      const username = user.username ? `@${user.username}` : '';
      await db.collection('community_profiles').updateOne({ id: verification.profileId }, { $set: { name, username, telegramId: String(user.id), verified: true, avatar: `/api/telegram/verified-avatar?user_id=${encodeURIComponent(user.id)}`, updatedAt: Date.now() } });
      await db.collection('community_verifications').updateOne({ token: match[1] }, { $set: { status: 'verified', telegramId: String(user.id), verifiedAt: Date.now() } });
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${encodeURIComponent(user.id)}&text=${encodeURIComponent('Verified. You can return to Kaalix Community Chat now.')}`, { signal: AbortSignal.timeout(8000) }).catch(() => {});
      return { ok: true, handled: true };
    }
  } catch {}

  return { ok: true, handled: false };
}

export async function listMessages(limit = 80): Promise<any[]> {
  try {
    const db = await getDb();
    if (db) {
      // Ensure AI Bot welcome message exists in DB
      const aiExists = await db.collection('community_messages').findOne({ profileId: AI_BOT_PROFILE_ID });
      if (!aiExists) {
        await db.collection('community_messages').insertOne({
          id: 'msg-ai-bot-intro',
          profileId: AI_BOT_PROFILE_ID,
          author: AI_BOT_AUTHOR,
          text: '👋 Main Kᴀᴀʟɪx AI Assistant hoon! Agar mujhse koi baat karni ho ya help chahiye, to mere message par "Reply" karein.',
          image: '',
          replyToId: null,
          createdAt: Date.now() - 300000,
        });
      }

      const docs = await db.collection('community_messages').find({ deleted: { $ne: true } }).sort({ createdAt: -1 }).limit(Math.min(limit, 100)).toArray();
      return docs.reverse().map(({ _id, ...message }) => message);
    }
  } catch {}

  const store = loadCommunityStore();
  return store.messages.slice(-Math.min(limit, 100));
}

export async function createMessage(profileId: string, ip: string, text: string, image?: string, replyToId?: string): Promise<any> {
  const profile = await getOrCreateProfile(profileId, ip);
  const cleanMessage = cleanText(text, 1200);
  const safeImage = typeof image === 'string' && image.startsWith('data:image/') ? image.slice(0, 2_000_000) : '';
  if (!cleanMessage && !safeImage) throw new Error('Message cannot be empty');

  const tgId = profile.telegramId || (profile.id.startsWith('tg_') ? profile.id.replace('tg_', '') : '');

  const message = {
    id: randomUUID(),
    profileId: profile.id,
    author: {
      name: profile.name,
      avatar: profile.avatar,
      username: profile.username,
      telegramId: tgId || undefined,
    },
    text: cleanMessage,
    image: safeImage,
    replyToId: cleanText(replyToId, 80) || null,
    createdAt: Date.now(),
  };

  const store = loadCommunityStore();

  // AI BOT REPLY LOGIC:
  // Only reply if user specifically replies to the AI Bot's message or mentions @ai
  let shouldAiRespond = false;
  if (message.replyToId) {
    if (message.replyToId === 'msg-ai-welcome' || message.replyToId === 'msg-ai-bot-intro') {
      shouldAiRespond = true;
    } else {
      try {
        const db = await getDb();
        if (db) {
          const quoted = await db.collection('community_messages').findOne({ id: message.replyToId });
          if (quoted && (quoted.profileId === AI_BOT_PROFILE_ID || quoted.author?.isBot)) {
            shouldAiRespond = true;
          }
        }
      } catch {}

      if (!shouldAiRespond) {
        const quoted = store.messages.find((m) => m.id === message.replyToId);
        if (quoted && (quoted.profileId === AI_BOT_PROFILE_ID || quoted.author?.isBot)) {
          shouldAiRespond = true;
        }
      }
    }
  }

  if (!shouldAiRespond && (cleanMessage.toLowerCase().includes('@ai') || cleanMessage.toLowerCase().includes('@kaalix_ai'))) {
    shouldAiRespond = true;
  }

  try {
    const db = await getDb();
    if (db) {
      await db.collection('community_messages').insertOne(message);
    }
  } catch {}

  store.messages.push(message);
  if (store.messages.length > 200) store.messages.shift();
  persistCommunitySoon();

  if (shouldAiRespond) {
    setTimeout(async () => {
      try {
        const queryText = cleanMessage.replace(/@(ai|kaalix_ai)/gi, '').trim() || 'Hii';
        const aiAnswer = await queryGptLogic(queryText);
        const aiMessage = {
          id: randomUUID(),
          profileId: AI_BOT_PROFILE_ID,
          author: AI_BOT_AUTHOR,
          text: aiAnswer,
          image: '',
          replyToId: message.id,
          createdAt: Date.now(),
        };

        const db = await getDb();
        if (db) {
          await db.collection('community_messages').insertOne(aiMessage);
        }
        const s = loadCommunityStore();
        s.messages.push(aiMessage);
        if (s.messages.length > 200) s.messages.shift();
        persistCommunitySoon();
      } catch {}
    }, 600);
  }

  return message;
}

export async function reactToMessage(messageId: string, profileId: string, emoji: string): Promise<any> {
  const allowed = ['👍', '❤️', '😂', '🔥', '😮'];
  if (!allowed.includes(emoji)) throw new Error('Unsupported reaction');

  try {
    const db = await getDb();
    if (db) {
      const messages = db.collection<any>('community_messages');
      const message = await messages.findOne({ id: cleanText(messageId, 80) });
      if (!message) throw new Error('Message not found');
      const current = Array.isArray(message.reactionUsers?.[emoji]) ? message.reactionUsers[emoji] : [];
      const next = current.includes(profileId) ? current.filter((id: string) => id !== profileId) : [...current, profileId].slice(-500);
      const reactionUsers = { ...(message.reactionUsers || {}), [emoji]: next };
      const reactions = Object.fromEntries(Object.entries(reactionUsers).map(([key, users]) => [key, (users as string[]).length]));
      await messages.updateOne({ id: message.id }, { $set: { reactionUsers, reactions } });
      return { id: message.id, reactions };
    }
  } catch {}

  const store = loadCommunityStore();
  const msg = store.messages.find((m) => m.id === messageId);
  if (!msg) throw new Error('Message not found');
  if (!msg.reactionUsers) msg.reactionUsers = {};
  const current = Array.isArray(msg.reactionUsers[emoji]) ? msg.reactionUsers[emoji] : [];
  const next = current.includes(profileId) ? current.filter((id: string) => id !== profileId) : [...current, profileId].slice(-500);
  msg.reactionUsers[emoji] = next;
  msg.reactions = Object.fromEntries(Object.entries(msg.reactionUsers).map(([key, users]) => [key, (users as string[]).length]));
  persistCommunitySoon();
  return { id: msg.id, reactions: msg.reactions };
}
