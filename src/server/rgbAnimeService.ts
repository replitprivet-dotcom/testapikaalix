import fs from 'fs';
import path from 'path';

export interface AnimeRecord {
  message_id: number;
  series: string;
  character_name: string;
  file_id?: string;
  storage_id?: string; // OnlyFiles id e.g. "wZwjw6laBb9a"
  image_url?: string;
}

const BOT_TOKEN = '8244913271:AAGXeOqTUe3C8EoC1MmOPZOMrrJ_b_2Rj90';
const CHAT_ID = '-1003957595956';
const DB_FILE = path.resolve(process.cwd(), 'anime_db.json');
const SERVED_FILE = path.resolve(process.cwd(), 'anime_served.json');

// Built-in seed of verified message IDs and characters from the channel
const DEFAULT_SEED: AnimeRecord[] = [
  { message_id: 13410, series: 'Girls Und Panzer', character_name: 'Darjeeling', storage_id: 'wZwjw6laBb9a', file_id: 'AgACAgEAAyEFAATr5B80AAI0Ymq3tSaDzKuqn7-z48iRA_x9LAerAAKwDGsbG9uJRcJy5Ev9-DRbAQADAgADeQADPQQ' },
  { message_id: 13409, series: 'Attack On Titan', character_name: 'Mikasa Ackerman', file_id: 'AgACAgUAAyEFAATr5B80AAI0YWq3tdYOOv22AVEP2JS7wOFBp5b9AAL7E2sb6BmIVeoVjZ1PASXXAQADAgADeQADPQQ' },
  { message_id: 13408, series: "Frieren: Beyond Journey'S End", character_name: 'Frieren', file_id: 'AgACAgUAAyEFAATr5B80AAI0YGq3tdSTuue7J9ZMlBIxlCrWIjT_AALdE2sb6BmIVWGYdfVQIWiUAQADAgADeQADPQQ' },
  { message_id: 13405, series: 'The Angel Next Door Spoils Me Rotten', character_name: 'Mahiru Shiina', file_id: 'AgACAgUAAyEFAATr5B80AAI0XWq3uIa4PChCjDT_AAGCSLsfwaqihAACRRdrG-gZgFWzhFHEI_U59gEAAwIAA3kAAz0E' },
  { message_id: 13404, series: 'Date A Live', character_name: 'Tokisaki Kurumi', file_id: 'AgACAgUAAyEFAATr5B80AAI0XGq3uISar_ftmadMsPFIkKTnVdtIAALkFmsb6BmAVcXEGdIy2ap1AQADAgADeQADPQQ' },
  { message_id: 13401, series: 'My Hero Academia', character_name: 'Shoto Todoroki', file_id: 'AgACAgUAAyEFAATr5B80AAI0WWq3uH0t-JUXFkpoZCW6F-BUYB-yAAJEEmsbJFZ4VbtTmnfnPDOFAQADAgADeQADPQQ' },
  { message_id: 13400, series: 'My Hero Academia', character_name: 'Shoto Todoroki', file_id: 'AgACAgUAAyEFAATr5B80AAI0WGq3tdKEt0z6jvmACvReaVohXvWzAAI9EmsbJFZ4VQtG7iO10ObXAQADAgADeQADPQQ' },
  { message_id: 13390, series: 'The Quintessential Quintuplets', character_name: 'Nakano Itsuki', file_id: 'AgACAgEAAyEFAATr5B80AAI0Tmq5gurgosvAoO7zqBFhmu41aDYCAAKhDWsbLJh5RcX6Ystv4G03AQADAgADdwADPQQ' },
  { message_id: 13380, series: 'Darling In The Franxx', character_name: 'Zero Two', file_id: 'AgACAgUAAyEFAATr5B80AAI0RGq5gumlhWCBqY4LUD8-ZCK2MSJOAAKiEWsbzu3ZVMeAcWRGb9oLAQADAgADeQADPQQ' },
  { message_id: 2723, series: 'Rent A Girlfriend', character_name: 'Chizuru Mizuhara', file_id: 'AgACAgQAAyEFAATr5B80AAIKo2q3tdAzxF3alO2fL4JbSWaYZqcCAAIRtTEbKyeEU-d3IfETtZn7AQADAgADeQADPQQ' },
  { message_id: 2457, series: 'Demon Slayer', character_name: 'Mitsuri Kanroji', file_id: 'AgACAgQAAyEFAATr5B80AAIJmWq3tc05PwF9qkmVcTefqJ_Kf5B_AAKDuDEbxshEUo6sWje1XR_PAQADAgADeQADPQQ' },
  { message_id: 1000, series: 'Code Geass', character_name: 'Kallen Stadtfeld', file_id: 'AgACAgQAAyEFAATr5B80AAID6Gq3tcthIZtQ4Nv3LA3BbXjwJ4n9AAIBtTEbNSWEU9rpd_SZT0QNAQADAgADdwADPQQ' },
];

function loadDatabase(): Map<number, AnimeRecord> {
  const map = new Map<number, AnimeRecord>();
  for (const item of DEFAULT_SEED) {
    map.set(item.message_id, { ...item });
  }

  // Load from anime_seed.json if exists
  try {
    const seedPath = path.resolve(process.cwd(), 'anime_seed.json');
    if (fs.existsSync(seedPath)) {
      const items: AnimeRecord[] = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
      for (const item of items) {
        if (!map.has(item.message_id)) {
          map.set(item.message_id, item);
        } else {
          const current = map.get(item.message_id)!;
          map.set(item.message_id, { ...item, ...current });
        }
      }
    }
  } catch {}

  // Load persisted cache if exists
  try {
    if (fs.existsSync(DB_FILE)) {
      const saved: AnimeRecord[] = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      for (const item of saved) {
        map.set(item.message_id, item);
      }
    }
  } catch {}

  return map;
}

function saveDatabase(map: Map<number, AnimeRecord>) {
  try {
    const arr = Array.from(map.values());
    fs.writeFileSync(DB_FILE, JSON.stringify(arr, null, 2));
  } catch {}
}

function loadServedSet(): Set<number> {
  try {
    if (fs.existsSync(SERVED_FILE)) {
      const ids: number[] = JSON.parse(fs.readFileSync(SERVED_FILE, 'utf8'));
      return new Set(ids);
    }
  } catch {}
  return new Set();
}

function saveServedSet(served: Set<number>) {
  try {
    fs.writeFileSync(SERVED_FILE, JSON.stringify(Array.from(served)));
  } catch {}
}

let db = loadDatabase();
let served = loadServedSet();

export function parseAnimeCaption(caption: string): { series: string; character_name: string } {
  const lines = caption.split('\n').map((l) => l.trim()).filter(Boolean);
  let series = '';
  let character_name = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes('owo!') || line.toLowerCase().includes('check out')) {
      continue;
    }
    if (!series) {
      series = line;
      continue;
    }
    if (!character_name) {
      let name = line.replace(/^\d+[:\s.-]+/, '');
      name = name.replace(/\[[^\]]*\]/g, '').trim();
      name = name.replace(/\([^)]*\)/g, '').trim();
      character_name = name;
      break;
    }
  }

  return {
    series: series || 'Anime Series',
    character_name: character_name || 'Anime Character',
  };
}

async function uploadToStorage(imageBuffer: ArrayBuffer, filename: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), filename);

    const res = await fetch('https://api.onlyfiles.com/v1/upload?expire=0', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KaalixAnimeStorage/1.0)',
        Referer: 'https://onlyfiles.com/',
      },
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.file?.metadata?.id || null;
  } catch {
    return null;
  }
}

async function fetchFromTelegram(messageId: number): Promise<{ file_id: string; series: string; character_name: string } | null> {
  try {
    const fwdRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/forwardMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        from_chat_id: CHAT_ID,
        message_id: messageId,
        disable_notification: true,
      }),
    }).then((r) => r.json());

    if (!fwdRes.ok || !fwdRes.result?.photo) return null;

    const newId = fwdRes.result.message_id;
    // Delete the forwarded copy asynchronously
    fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, message_id: newId }),
    }).catch(() => {});

    const photoArr = fwdRes.result.photo;
    const bestPhoto = photoArr[photoArr.length - 1];
    const caption = fwdRes.result.caption || '';
    const { series, character_name } = parseAnimeCaption(caption);

    return {
      file_id: bestPhoto.file_id,
      series,
      character_name,
    };
  } catch {
    return null;
  }
}

async function getTelegramPhotoBytes(fileId: string): Promise<ArrayBuffer | null> {
  try {
    const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`).then((r) => r.json());
    if (!infoRes.ok || !infoRes.result?.file_path) return null;

    const imgRes = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${infoRes.result.file_path}`);
    if (!imgRes.ok) return null;
    return await imgRes.arrayBuffer();
  } catch {
    return null;
  }
}

export async function getRandomRgbAnime(origin: string = ''): Promise<{
  status: boolean;
  message_id: number;
  image_url: string;
  series: string;
  character_name: string;
}> {
  // Reload db in case new entries were added
  db = loadDatabase();
  const allIds = Array.from(db.keys());

  // Filter unserved IDs in current cycle
  let unserved = allIds.filter((id) => !served.has(id));

  // If all exhausted, reset cycle ("aagar khatam ho gya tho fir same aaya chalega lekin rendom aana chahiye")
  if (unserved.length === 0) {
    served.clear();
    saveServedSet(served);
    unserved = [...allIds];
  }

  // Shuffle and pick
  const randomIndex = Math.floor(Math.random() * unserved.length);
  const pickedId = unserved[randomIndex];
  served.add(pickedId);
  saveServedSet(served);

  let record = db.get(pickedId)!;

  // If already uploaded and has storage_id, return permanent URL immediately!
  if (record.storage_id) {
    const baseUrl = origin ? origin.replace(/\/$/, '') : '';
    const imageUrl = `${baseUrl}/file/${record.storage_id}.png`;
    return {
      status: true,
      message_id: record.message_id,
      image_url: imageUrl,
      series: record.series,
      character_name: record.character_name,
    };
  }

  // If file_id is available but not yet uploaded to OnlyFiles
  if (record.file_id) {
    const bytes = await getTelegramPhotoBytes(record.file_id);
    if (bytes) {
      const storageId = await uploadToStorage(bytes, `anime_${record.message_id}.jpg`);
      if (storageId) {
        record.storage_id = storageId;
        db.set(record.message_id, record);
        saveDatabase(db);

        const baseUrl = origin ? origin.replace(/\/$/, '') : '';
        return {
          status: true,
          message_id: record.message_id,
          image_url: `${baseUrl}/file/${storageId}.png`,
          series: record.series,
          character_name: record.character_name,
        };
      }
    }
  }

  // Fallback: fetch directly from Telegram live
  const live = await fetchFromTelegram(record.message_id);
  if (live) {
    record.series = live.series;
    record.character_name = live.character_name;
    record.file_id = live.file_id;

    const bytes = await getTelegramPhotoBytes(live.file_id);
    if (bytes) {
      const storageId = await uploadToStorage(bytes, `anime_${record.message_id}.jpg`);
      if (storageId) {
        record.storage_id = storageId;
      }
    }
    db.set(record.message_id, record);
    saveDatabase(db);

    const baseUrl = origin ? origin.replace(/\/$/, '') : '';
    const finalUrl = record.storage_id ? `${baseUrl}/file/${record.storage_id}.png` : `${baseUrl}/api/file/download?id=wZwjw6laBb9a`;

    return {
      status: true,
      message_id: record.message_id,
      image_url: finalUrl,
      series: record.series,
      character_name: record.character_name,
    };
  }

  // In case of unexpected edge case, return seeded item 13410
  const fallback = db.get(13410) || DEFAULT_SEED[0];
  const baseUrl = origin ? origin.replace(/\/$/, '') : '';
  return {
    status: true,
    message_id: fallback.message_id,
    image_url: `${baseUrl}/file/${fallback.storage_id || 'wZwjw6laBb9a'}.png`,
    series: fallback.series,
    character_name: fallback.character_name,
  };
}
