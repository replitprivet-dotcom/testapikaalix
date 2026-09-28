import fs from 'fs';
import path from 'path';

export interface TelegramProfileData {
  ok: boolean;
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  username: string;
  bio: string;
  has_photo: boolean;
  photo_url: string;
  channel_url: string;
  chat_url: string;
  web_chat_url: string;
  updated_at: number;
}

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8726971732:AAGGTWRLS4zfSeX8No4jAFmql2miDB11z78';
const USER_ID = '8440279273';
const CHANNEL_URL = 'https://t.me/TheFelixModz';
let cachedProfile: TelegramProfileData | null = null;
let lastProfileFetch = 0;
const PROFILE_CACHE_TTL = 60 * 1000;
let cachedAvatar: { buffer: Buffer; contentType: string } | null = null;
let lastAvatarFetch = 0;
const AVATAR_CACHE_TTL = 120 * 1000;

async function fetchUserAvatar(userId: string): Promise<{ buffer: Buffer; contentType: string }> {
  const photosRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUserProfilePhotos?user_id=${encodeURIComponent(userId)}&limit=1`, { headers: { 'User-Agent': 'KaalixProfileSync/1.0' }, signal: AbortSignal.timeout(8000) });
  const photosData: any = await photosRes.json(); const photoVariants = photosData?.result?.photos?.[0]; const largestPhoto = photoVariants?.[photoVariants.length - 1];
  if (largestPhoto?.file_id) { const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${largestPhoto.file_id}`, { signal: AbortSignal.timeout(8000) }); const fileData: any = await fileRes.json(); if (fileData?.result?.file_path) { const imgRes = await fetch(`https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`, { signal: AbortSignal.timeout(10000) }); if (imgRes.ok) return { buffer: Buffer.from(await imgRes.arrayBuffer()), contentType: imgRes.headers.get('content-type') || 'image/jpeg' }; } }
  throw new Error('Telegram avatar unavailable');
}
export async function fetchTelegramUserAvatar(userId: string) { return fetchUserAvatar(userId); }
export async function fetchTelegramProfile(force = false): Promise<TelegramProfileData> { const now = Date.now(); if (!force && cachedProfile && now - lastProfileFetch < PROFILE_CACHE_TTL) return cachedProfile; try { const chatRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=${USER_ID}`, { headers: { 'User-Agent': 'KaalixProfileSync/1.0' }, signal: AbortSignal.timeout(8000) }); const chatData: any = await chatRes.json(); const result = chatData?.result || {}; const firstName = (result.first_name || '').trim(); const lastName = (result.last_name || '').trim(); const fullName = [firstName, lastName].filter(Boolean).join(' ') || '˹Yᴜᴋɪ !!'; const username = result.username || ''; cachedProfile = { ok: true, id: USER_ID, first_name: firstName || '˹Yᴜᴋɪ !!', last_name: lastName, name: fullName, username: username ? `@${username.replace(/^@/, '')}` : '', bio: (result.bio || '').trim(), has_photo: Boolean(result.photo), photo_url: '/api/telegram/avatar', channel_url: CHANNEL_URL, chat_url: `tg://openmessage?user_id=${USER_ID}`, web_chat_url: username ? `https://t.me/${username}` : CHANNEL_URL, updated_at: now }; lastProfileFetch = now; return cachedProfile; } catch { if (cachedProfile) return cachedProfile; return { ok: true, id: USER_ID, first_name: '˹Yᴜᴋɪ !!', last_name: '', name: '˹Yᴜᴋɪ !!', username: '', bio: '', has_photo: true, photo_url: '/api/telegram/avatar', channel_url: CHANNEL_URL, chat_url: `tg://openmessage?user_id=${USER_ID}`, web_chat_url: CHANNEL_URL, updated_at: now }; } }
export async function fetchTelegramAvatar(force = false): Promise<{ buffer: Buffer; contentType: string }> { const now = Date.now(); if (!force && cachedAvatar && now - lastAvatarFetch < AVATAR_CACHE_TTL) return cachedAvatar; try { cachedAvatar = await fetchUserAvatar(USER_ID); lastAvatarFetch = now; try { fs.writeFileSync(path.resolve(process.cwd(), 'public', 'profile.jpg'), cachedAvatar.buffer); } catch {} return cachedAvatar; } catch {} if (cachedAvatar) return cachedAvatar; try { const localPath = path.resolve(process.cwd(), 'public', 'profile.jpg'); if (fs.existsSync(localPath)) { cachedAvatar = { buffer: fs.readFileSync(localPath), contentType: 'image/jpeg' }; lastAvatarFetch = now; return cachedAvatar; } } catch {} return { buffer: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'), contentType: 'image/gif' }; }
