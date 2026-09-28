export type Endpoint = {
  name: string;
  path: string;
  description: string;
  method: string;
  params: Record<string, string>;
  nsfw?: boolean;
};

export type Category = {
  key: string;
  label: string;
  iconName: string;
  endpoints: Endpoint[];
};

export const categories: Category[] = [
  {
    key: "ai",
    label: "AI",
    iconName: "Bot",
    endpoints: [
      {"name": "Claude-Haiku", "path": "/api/claude-haiku", "description": "Claude Haiku 4.5 - Fast and efficient AI for everyday tasks", "method": "GET", "params": {"q": "hii"}},
      {"name": "Claude-Session", "path": "/api/claude-session", "description": "Claude Haiku with persistent session support for multi-turn conversations", "method": "GET", "params": {"q": "hii", "sessionId": "optional-session-id"}},
      {"name": "Gptlogic", "path": "/api/gptlogic", "description": "AI-powered logic processing", "method": "GET", "params": {"q": "hii", "prompt": "be friendly"}},
      {"name": "Gemini", "path": "/api/gemini", "description": "Google Gemini AI", "method": "GET", "params": {"q": "hello"}},
    ],
  },
  {
    key: "downloader",
    label: "Downloaders",
    iconName: "Download",
    endpoints: [
      {"name": "SpotifyDl", "path": "/api/spotifydl", "description": "Download Spotify track audio with metadata and direct MP3 stream", "method": "GET", "params": {"url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"}},
      {"name": "TikTokDl", "path": "/api/ttdl", "description": "Download TikTok videos (no-watermark, HD) and photo slideshows via TikWM", "method": "GET", "params": {"url": "https://vm.tiktok.com/ZSq3dLMgC/"}},
      {"name": "Twitter", "path": "/api/xdl", "description": "Download Tweets and media from Twitter / X", "method": "GET", "params": {"url": "https://x.com/i/status/2047556140410482874"}},
      {"name": "Facebookdl", "path": "/api/facebook", "description": "Download Facebook videos and reels", "method": "GET", "params": {"url": "https://www.facebook.com/share/r/12Jhv1vQ85G/"}},
      {"name": "YoutubeInfo", "path": "/api/ytsearch", "description": "Get detailed title, channel, thumbnail, duration, views & description for YouTube video", "method": "GET", "params": {"url": "https://youtu.be/3ca64kJjhEU"}},
      {"name": "Youtubedl", "path": "/api/ytdl", "description": "Download YouTube videos with quality options (mp3 / 360 / 720 / 1080)", "method": "GET", "params": {"format": "mp3", "url": "https://youtu.be/3ca64kJjhEU"}},
      {"name": "YoutubeMp3", "path": "/api/yta", "description": "Download YouTube audio directly", "method": "GET", "params": {"url": "https://youtu.be/3ca64kJjhEU"}},
      {"name": "YoutubeMp4", "path": "/api/ytv", "description": "Download YouTube video", "method": "GET", "params": {"url": "https://youtu.be/3ca64kJjhEU"}},
      {"name": "YoutubePlay", "path": "/api/ytplay", "description": "Search and stream YouTube audio", "method": "GET", "params": {"q": "Limitless"}},
      {"name": "YtAudio", "path": "/api/ytau", "description": "Download YouTube audio via yt1s", "method": "GET", "params": {"url": "https://youtu.be/3ca64kJjhEU"}},
      {"name": "YtVideo", "path": "/api/ytvi", "description": "Download YouTube video with multiple qualities", "method": "GET", "params": {"url": "https://youtu.be/3ca64kJjhEU"}},
      {"name": "GitClone", "path": "/api/gitclone", "description": "Download and clone GitHub repositories", "method": "GET", "params": {"url": "https://github.com/octocat/Hello-World"}},
      {"name": "Applemusic", "path": "/api/applemusic", "description": "Download Apple Music tracks", "method": "GET", "params": {"q": "sacrifice"}},
    ],
  },
  {
    key: "movies",
    label: "Movies & Series",
    iconName: "Film",
    endpoints: [
      {"name": "Movie-Search", "path": "/api/movie/search", "description": "Search movies & TV series with episode lists and streaming download links", "method": "GET", "params": {"q": "naruto", "page": "1", "perPage": "20"}},
      {"name": "Movie-QuickSearch", "path": "/api/movie/search", "description": "Quick movie and TV series search by title name", "method": "GET", "params": {"q": "Naruto"}},
    ],
  },
  {
    key: "freefire",
    label: "Free Fire",
    iconName: "Flame",
    endpoints: [
      {
        "name": "FF-Profile",
        "path": "/api/ff/profile",
        "description": "Fetch Free Fire player profile info, level, rank, guild, pet, clothes & statistics by UID",
        "method": "GET",
        "params": {
          "uid": "1231557272"
        }
      },
      {
        "name": "FF-Like",
        "path": "/api/ff/like",
        "description": "Send 50 likes to Free Fire player profile by UID (Active server token proxy)",
        "method": "GET",
        "params": {
          "uid": "2093756996",
          "region": "IND"
        }
      }
    ],
  },
  {
    key: "search",
    label: "Search",
    iconName: "Search",
    endpoints: [
      {"name": "SoundCloudSearch", "path": "/api/soundcloudsearch", "description": "Search SoundCloud tracks via mobile API", "method": "GET", "params": {"q": "lofi", "limit": "10"}},
      {"name": "SoundCloud", "path": "/api/soundcloud", "description": "Resolve a SoundCloud track URL to metadata and direct CDN stream URL", "method": "GET", "params": {"url": "https://soundcloud.com/she-and-him/i-thought-i-saw-your-face"}},
      {"name": "YoutubeSearch", "path": "/api/yts", "description": "Search YouTube for videos, channels, and playlists", "method": "GET", "params": {"q": "Tamako edit"}},
      {"name": "Pinterest", "path": "/api/pinterest", "description": "Search Pinterest images", "method": "GET", "params": {"q": "anime"}},
      {"name": "NpmSearch", "path": "/api/npmsearch", "description": "Search NPM packages", "method": "GET", "params": {"q": "baileys"}},
      {"name": "Lyrics", "path": "/api/lyrics", "description": "Search song lyrics", "method": "GET", "params": {"q": "ozeba"}},
      {"name": "Lyrics2", "path": "/api/lyrics2", "description": "Alternative lyrics search", "method": "GET", "params": {"q": "ozeba"}},
    ],
  },
  {
    key: "anime",
    label: "Anime",
    iconName: "Tv2",
    endpoints: [
      {"name": "RGB-Anime", "path": "/rgb/anime", "description": "Random anime character", "method": "GET", "params": {}},
      {"name": "BstationSearch", "path": "/api/anisearch", "description": "Search anime titles from Bstation (Bilibili)", "method": "GET", "params": {"q": "naruto"}},
      {"name": "AnimeSearch2", "path": "/api/animesearch", "description": "Alternative anime search engine", "method": "GET", "params": {"q": "naruto"}},
    ],
  },
  {
    key: "tools",
    label: "Tools",
    iconName: "Wrench",
    endpoints: [
      {"name": "NumberLookup", "path": "/api/numberlookup", "description": "Look up carrier, line type, country, timezone & formatted numbers worldwide", "method": "GET", "params": {"q": "+12128148373"}},
      {"name": "ApkSearch", "path": "/api/apksearch", "description": "Search Android APKs on APKCombo", "method": "GET", "params": {"q": "whatsapp"}},
      {"name": "Tinyurl", "path": "/api/tinyurl", "description": "Shorten URLs quickly", "method": "GET", "params": {"url": "https://google.com"}},
      {"name": "Translate", "path": "/api/translate", "description": "Translate text across languages", "method": "GET", "params": {"text": "I love you", "to": "id"}},
      {"name": "OCR", "path": "/api/ocr", "description": "Extract text from images using OCR", "method": "GET", "params": {"url": "https://files.catbox.moe/dv8r14.jpg"}},
    ],
  },
  {
    key: "tools-extra",
    label: "Extra Tools",
    iconName: "Settings2",
    endpoints: [
      {"name": "Ssweb", "path": "/api/ssweb", "description": "Take website screenshots (supports desktop, phone, tablet, and full page)", "method": "GET", "params": {"url": "https://google.com", "device": "full"}},
      {"name": "RemoveBg", "path": "/api/removebg", "description": "Remove image backgrounds automatically", "method": "GET", "params": {"url": "https://files.catbox.moe/dv8r14.jpg"}},
      {"name": "Enhance", "path": "/api/enhance", "description": "Upscale & enhance blurry images", "method": "GET", "params": {"url": "https://i.pinimg.com/736x/f9/0f/85/f90f8504271cedf0681a297a7d69c593.jpg"}},
    ],
  },
  {
    key: "storage",
    label: "Cloud Storage & Uploads",
    iconName: "HardDrive",
    endpoints: [
      {"name": "Cloud-File-Upload", "path": "/api/file/upload", "description": "High-speed anonymous cloud file upload up to 100MB with retention: Permanent (0), 60m, 6h, 24h, 48h", "method": "POST", "params": {"expire": "0"}},
      {"name": "Quick-Upload", "path": "/api/upload", "description": "Fast direct upload endpoint for all file formats (images, documents, zips, media)", "method": "POST", "params": {"expire": "0"}},
      {"name": "TmpFiles-Upload", "path": "/api/upload/tmpfiles", "description": "TmpFiles anonymous multi-format temporary cloud host (instant direct link)", "method": "POST", "params": {}},
      {"name": "File-Download", "path": "/api/file/download", "description": "Stream & download proxied file directly by file ID (Direct reverse proxy)", "method": "GET", "params": {"id": "wZwjw6laBb9a"}},
      {"name": "File-Info", "path": "/api/file/info", "description": "Retrieve file metadata, size, upload timestamp, and retention details", "method": "GET", "params": {"id": "wZwjw6laBb9a"}},
    ],
  },
  {
    key: "random",
    label: "Random",
    iconName: "Shuffle",
    endpoints: [
      {"name": "Random-Quotes", "path": "/api/randomquotes", "description": "Get random inspirational quotes", "method": "GET", "params": {}},
      {"name": "Random-Facts", "path": "/api/facts", "description": "Get random interesting facts", "method": "GET", "params": {}},
      {"name": "Random-img", "path": "/api/randomimage", "description": "Get random aesthetic images", "method": "GET", "params": {}},
    ],
  },
  {
    key: "images",
    label: "Images & Wallpapers",
    iconName: "ImageIcon",
    endpoints: [
      {"name": "Waifu", "path": "/api/waifu", "description": "Get random anime waifu pictures", "method": "GET", "params": {}},
      {"name": "Cosplay", "path": "/api/cosplay", "description": "Get anime cosplay pictures", "method": "GET", "params": {}},
      {"name": "Couplepp", "path": "/api/couplepp", "description": "Matching couple profile pictures", "method": "GET", "params": {}},
      {"name": "BlueArchive", "path": "/api/bluearchive", "description": "Get Blue Archive game images", "method": "GET", "params": {}},
      {"name": "Wallpaper-Main", "path": "/api/wallpaper", "description": "Browse wallpaper endpoints list", "method": "GET", "params": {}},
      {"name": "Technology", "path": "/api/wallpaper/technology", "description": "Get high-tech & sci-fi wallpapers", "method": "GET", "params": {}},
      {"name": "Programming", "path": "/api/wallpaper/programming", "description": "Get programming & developer wallpapers", "method": "GET", "params": {}},
    ],
  },
  {
    key: "nsfw",
    label: "NSFW",
    iconName: "ShieldAlert",
    endpoints: [
      {"name": "PomPom-Search", "path": "/api/pompom/search", "description": "Search 18+ adult anime media & videos with streaming & direct download links", "method": "GET", "params": {"q": "anime"}, "nsfw": true},
      {"name": "Pussy", "path": "/api/nsfw/pussy", "description": "NSFW content - Pussy category (18+ only)", "method": "GET", "params": {}, "nsfw": true},
      {"name": "Cuckold", "path": "/api/nsfw/cuckold", "description": "NSFW content - Cuckold category (18+ only)", "method": "GET", "params": {}, "nsfw": true},
    ],
  },
];

export const totalEndpoints = categories.reduce((sum, c) => sum + c.endpoints.length, 0);
