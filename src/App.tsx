import { useState, useMemo, useEffect, useRef, Component, ErrorInfo, ReactNode } from "react";
import {
  Bot, Download, Search, Tv2, Eye, Wrench, Settings2, Shuffle,
  ImageIcon, ShieldAlert, Zap, Copy, Check, X, Play, ChevronRight,
  ExternalLink, Sun, Moon, Loader2, Send, Users, CalendarDays, Volume2, VolumeX,
  Sparkles, Activity, AlertTriangle, RotateCcw, Star, Plus, Trash2,
  LayoutGrid, List, Terminal, Globe, Code2, Clock, Bookmark,
  Layers, HardDrive, Film, UploadCloud, FileText, Flame,
  BarChart3, Database, TrendingUp, UsersRound
} from "lucide-react";
import { categories as defaultCategories, type Endpoint, type Category } from "./data/endpoints";
import CommunityChat from "./CommunityChat";
import { TelegramAuthGate, TelegramAccountModal, type TelegramUser } from "./TelegramAuthGate";

function VerifiedBadge() {
  return (
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vbg1" x1="0" y1="0" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8"/>
          <stop offset="100%" stopColor="#6d28d9"/>
        </linearGradient>
        <filter id="vbg-glow">
          <feGaussianBlur stdDeviation="1.2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="10.5" cy="10.5" r="10.5" fill="url(#vbg1)" filter="url(#vbg-glow)"/>
      <circle cx="10.5" cy="10.5" r="10.5" fill="url(#vbg1)" opacity="0.6"/>
      <path d="M6 10.8l3.2 3.2 5.8-6.2" stroke="white" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

const PROFILE_VIDEOS = [
  "https://files.catbox.moe/x3knsd.mp4",
  "https://files.catbox.moe/x43x2x.mp4",
  "https://files.catbox.moe/15gcpt.mp4",
];

function openLink(url: string) {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    // ignore
  }
}

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2600);
    const t2 = setTimeout(() => onDone(), 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`sp-wrap fixed inset-0 z-[100] overflow-hidden flex flex-col${leaving ? " sp-out" : ""}`}
      style={{ background: "#06010a" }}>

      <div className="relative flex-1 min-h-0">
        <img
          src="/splash.jpg"
          alt=""
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
          className="sp-logo absolute inset-0 w-full h-full object-cover object-top select-none"
          style={{ objectPosition: "center 15%", WebkitTouchCallout: "none" } as React.CSSProperties}
        />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(6,1,10,0.05) 0%, rgba(6,1,10,0.3) 55%, rgba(6,1,10,1) 100%)"
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(220,38,38,0.12) 0%, transparent 65%)"
        }} />

        {[
          { cls: "sp-p1", left: "15%",  size: 5, color: "#dc2626" },
          { cls: "sp-p2", left: "80%",  size: 4, color: "#d97706" },
          { cls: "sp-p3", left: "60%",  size: 6, color: "#ef4444" },
          { cls: "sp-p4", left: "35%",  size: 4, color: "#f59e0b" },
        ].map((p, i) => (
          <div key={i} className={`${p.cls} absolute bottom-0 rounded-full`}
            style={{ left: p.left, width: p.size, height: p.size, background: p.color, filter: `blur(1px) drop-shadow(0 0 4px ${p.color})` }} />
        ))}
      </div>

      <div className="relative flex flex-col items-center gap-4 px-6 pt-6 pb-10"
        style={{ background: "linear-gradient(180deg, rgba(6,1,10,0) 0%, #06010a 18%)" }}>

        <div className="flex items-center gap-3 w-full max-w-[220px]">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(220,38,38,0.5))" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" style={{ boxShadow: "0 0 8px #dc2626" }} />
          <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(220,38,38,0.5))" }} />
        </div>

        <div className="sp-name flex flex-col items-center gap-1">
          <p className="text-[11px] font-black tracking-[0.35em] uppercase"
            style={{ color: "rgba(255,255,255,0.28)" }}>Kᴀᴀʟɪx</p>
          <h1 className="text-[26px] font-black tracking-tight text-white leading-none"
            style={{ textShadow: "0 0 30px rgba(220,38,38,0.6)" }}>
            FREE <span style={{ color: "#ef4444" }}>APIS</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {[
            { cls: "sp-dot-1", color: "#ef4444" },
            { cls: "sp-dot-2", color: "#f59e0b" },
            { cls: "sp-dot-3", color: "#dc2626" },
          ].map((d, i) => (
            <span key={i} className={`${d.cls} block w-2 h-2 rounded-full`}
              style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
          ))}
        </div>

        <div className="w-[140px] h-[2px] rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.07)" }}>
          <div className="sp-bar-fill h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #dc2626, #ef4444, #f59e0b, #d97706)" }} />
        </div>
      </div>
    </div>
  );
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>> = {
  Bot, Download, Search, Tv2, Eye, Wrench, Settings2, Shuffle, ImageIcon, ShieldAlert, Globe, Layers, Star, Plus, HardDrive, Film, Flame
};

// Live community rating resolver
export function getEndpointRatingData(
  nameOrPath: string,
  realRatingsMap: Record<string, { score: number; count: number }> = {},
  userRating?: number
) {
  const clean = nameOrPath.split("?")[0].trim();
  const dbData = realRatingsMap[clean] || realRatingsMap[nameOrPath];

  if (dbData && dbData.count > 0) {
    return {
      score: dbData.score,
      count: dbData.count,
      userRating,
      hasRealData: true,
    };
  }

  return {
    score: 0,
    count: 0,
    userRating: undefined,
    hasRealData: false,
  };
}

function StarRatingWidget({
  path,
  ratingData,
  onRate,
  compact = false,
  showCount = true,
}: {
  path: string;
  ratingData: { score: number; count: number; userRating?: number; hasRealData?: boolean };
  onRate: (path: string, stars: number) => void;
  compact?: boolean;
  showCount?: boolean;
}) {
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const displayStars = hoveredStar !== null ? hoveredStar : (ratingData.userRating || Math.round(ratingData.score));

  return (
    <div
      className="star-rating-widget inline-flex items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="star-rating-stars inline-flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= displayStars;
          return (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(null)}
              onClick={(e) => {
                e.stopPropagation();
                onRate(path, star);
              }}
              title={`Rate ${star} star${star > 1 ? "s" : ""} (Saved live)`}
              className="star-btn cursor-pointer p-0.5 hover:scale-115 transition-transform"
            >
              <Star
                size={compact ? 12 : 14}
                fill={filled ? "#f59e0b" : "none"}
                color={filled ? "#f59e0b" : "#94a3b8"}
                className={filled ? "drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" : ""}
              />
            </button>
          );
        })}
      </div>

      {ratingData.hasRealData ? (
        <span className="text-[11px] font-mono font-black text-amber-600 flex items-center gap-1">
          {ratingData.score.toFixed(1)}
          {showCount && (
            <span className="text-[10px] text-slate-500 font-semibold">
              ({ratingData.count})
            </span>
          )}
        </span>
      ) : (
        <span className="text-[10px] font-semibold text-slate-400">
          Unrated
        </span>
      )}

      {ratingData.userRating && (
        <span className="px-1.5 py-0.2 text-[9.5px] font-black rounded-md bg-amber-500/10 text-amber-700 border border-amber-300">
          {ratingData.userRating}★
        </span>
      )}
    </div>
  );
}

function CategoryIcon({ name, size = 15, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  const Icon = ICON_MAP[name] ?? Zap;
  return <Icon size={size} style={style} />;
}

function buildUrl(path: string, params: Record<string, string>) {
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ""));
  const isPollinationsPrompt = path === "/api/pollinations/prompt";
  const isAbsolute = /^https?:\/\//i.test(path);
  const base = isAbsolute ? "" : BASE;

  if (isPollinationsPrompt) {
    const prompt = filtered.prompt || "abstract futuristic art";
    const { prompt: _prompt, ...queryParams } = filtered;
    const qs = new URLSearchParams(queryParams).toString();
    return `${base}${path}/${encodeURIComponent(prompt)}${qs ? "?" + qs : ""}`;
  }

  const qs = new URLSearchParams(filtered).toString();
  if (!qs) return `${base}${path}`;
  const separator = path.includes("?") ? "&" : "?";
  return `${base}${path}${separator}${qs}`;
}

function buildLegacyProxyUrl(path: string, params: Record<string, string>) {
  if (/^https?:\/\//i.test(path)) return path;
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ""));
  const qs = new URLSearchParams(filtered).toString();
  const legacyPath = path.startsWith("/api/") ? `/api/v1${path}` : path;
  return `${BASE}${legacyPath}${qs ? "?" + qs : ""}`;
}

function canUseProxyFallback(path: string) {
  if (/^https?:\/\//i.test(path)) return false;
  return (
    path.startsWith("/api/") &&
    !path.startsWith("/api/pollinations") &&
    !path.startsWith("/api/file") &&
    !path.startsWith("/api/storage") &&
    !path.startsWith("/api/onlyfiles") &&
    !path.startsWith("/api/movie") &&
    !path.startsWith("/api/ff") &&
    !path.startsWith("/api/pompom") &&
    !path.startsWith("/api/rgb") &&
    !path.startsWith("/rgb") &&
    path !== "/api/youtube"
  );
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal, headers: { accept: "application/json, image/*, video/*, text/plain, */*", ...(init?.headers ?? {}) } });
  } finally {
    window.clearTimeout(timer);
  }
}

async function readWithTimeout<T>(promise: Promise<T>, timeoutMs = 60000): Promise<T> {
  let timer: number | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error(`Response body timed out after ${Math.round(timeoutMs / 1000)} seconds`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

function stripCreatorMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripCreatorMetadata);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => {
          const lk = key.toLowerCase();
          return lk !== "creator" && lk !== "author" && lk !== "credit" && lk !== "credits" && lk !== "by" && lk !== "made_by";
        })
        .map(([key, child]) => {
          if (key.toLowerCase() === "source" && typeof child === "string") {
            return [key, "/api/movie"];
          }
          return [key, stripCreatorMetadata(child)];
        })
    );
  }
  if (typeof value === "string") {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    let s = value;
    if (origin) {
      if (s.startsWith("/api/movie/")) {
        s = `${origin}${s}`;
      } else if (s.startsWith("/api/file/")) {
        s = `${origin}${s}`;
      } else if (s.startsWith("/file/")) {
        s = `${origin}${s}`;
      } else if (s.startsWith("/api/pompom/")) {
        s = `${origin}${s}`;
      }
    }
    const movieBase = origin ? `${origin}/api/movie` : "/api/movie";
    const fileBase = origin ? `${origin}/api/file` : "/api/file";
    const pompomBase = origin ? `${origin}/api/pompom/stream` : "/api/pompom/stream";
    return s
      .replace(/https:\/\/fulux-downloader-api\.vercel\.app\/api\/search/gi, origin ? `${origin}/api/pompom/search` : "/api/pompom/search")
      .replace(/https:\/\/fulux-downloader-api\.vercel\.app\/api/gi, origin ? `${origin}/api/pompom` : "/api/pompom")
      .replace(/https:\/\/fulux-downloader-api\.vercel\.app/gi, pompomBase)
      .replace(/fulux-downloader-api\.vercel\.app/gi, "kaalix-apis")
      .replace(/Samuel-Rebix/gi, "Kaalix")
      .replace(/Samuel\s*[-_]?\s*Rebix/gi, "Kaalix")
      .replace(/Lord[-_]?Samuel/gi, "kaalix-dev")
      .replace(/Samuel/gi, "Kaalix")
      .replace(/Rebix/gi, "Kaalix")
      .replace(/https:\/\/movie-downloader-api\.vercel\.app\/api/gi, movieBase)
      .replace(/https:\/\/movie-downloader-api\.vercel\.app/gi, movieBase)
      .replace(/movie-downloader-api\.vercel\.app/gi, "kaalix-apis")
      .replace(/https:\/\/api\.onlyfiles\.com\/v1/gi, fileBase)
      .replace(/https:\/\/onlyfiles\.com/gi, fileBase)
      .replace(/api\.onlyfiles\.com/gi, "kaalix-apis")
      .replace(/onlyfiles\.com/gi, "kaalix-apis")
      .replace(/onlyfiles/gi, "kaalix-storage")
      .replace(/OnlyFiles/gi, "Kaalix Storage")
      .replace(/tmpfiles\.org/gi, "kaalix-apis")
      .replace(/tmpfiles/gi, "kaalix-storage")
      .replace(/https:\/\/s\.xysushi\.in/gi, "kaalix-apis")
      .replace(/s\.xysushi\.in/gi, "kaalix-apis")
      .replace(/https:\/\/isha-50-like-api-new\.vercel\.app/gi, "kaalix-apis")
      .replace(/isha-50-like-api-new\.vercel\.app/gi, "kaalix-apis")
      .replace(/key=ISHA/gi, "")
      .replace(/&key=[^&\s"]+/gi, "")
      .replace(/\?key=[^&\s"]+/gi, "")
      .replace(/"key":\s*"[^"]*"/gi, "");
  }
  return value;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?|$)/i;
const IMAGE_HOST = /^https?:\/\/.+/i;

function extractImageUrls(val: unknown, found: string[] = [], maxImages = 4): string[] {
  if (found.length >= maxImages) return found;
  if (typeof val === "string") {
    if (IMAGE_EXT.test(val) && IMAGE_HOST.test(val) && !found.includes(val)) {
      found.push(val);
    }
  } else if (Array.isArray(val)) {
    for (const v of val) {
      if (found.length >= maxImages) break;
      extractImageUrls(v, found, maxImages);
    }
  } else if (val && typeof val === "object") {
    for (const v of Object.values(val as object)) {
      if (found.length >= maxImages) break;
      extractImageUrls(v, found, maxImages);
    }
  }
  return found;
}

class SafeBoundary extends Component<{ children: ReactNode; onReset?: () => void }, { hasError: boolean; error: Error | null }> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("SafeBoundary error caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center my-4">
          <AlertTriangle className="text-red-400 mx-auto mb-2" size={28} />
          <h4 className="font-bold text-red-400 text-sm">Safe error recovery</h4>
          <p className="text-xs text-[var(--fg4)] mt-1 mb-3">A rendering issue was intercepted safely to protect your browser session.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
            }}
            className="px-4 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold transition-colors"
          >
            Dismiss & Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type ResponseState =
  | { kind: "none" }
  | { kind: "loading" }
  | { kind: "image"; src: string; status: number; latencyMs: number }
  | { kind: "video"; src: string; status: number; latencyMs: number }
  | { kind: "json"; text: string; images: string[]; fileMeta?: { id?: string; name?: string; size?: string; downloadUrl?: string }; status: number; latencyMs: number }
  | { kind: "text"; text: string; status: number; latencyMs: number }
  | { kind: "error"; message: string; status: number; latencyMs: number };

function StatusBadge({ code, latency }: { code: number; latency?: number }) {
  const ok = code >= 200 && code < 300;
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border tracking-wide ${
        ok ? "bg-[var(--emerald-bg)] border-[var(--emerald-brd)] text-[var(--emerald)]" 
           : "bg-red-500/10 border-red-500/20 text-red-500"
      }`}>
        {code} {ok ? "OK" : "ERR"}
      </span>
      {typeof latency === "number" && latency > 0 && (
        <span className="text-[11px] font-mono text-[var(--fg4)] flex items-center gap-1">
          <Clock size={11} /> {latency}ms
        </span>
      )}
    </div>
  );
}

function ImagePreview({ src }: { src: string }) {
  const [err, setErr] = useState(false);
  if (err) return null;
  const noMenu = (e: React.MouseEvent | React.TouchEvent) => e.preventDefault();
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      onContextMenu={noMenu}
      className="block rounded-xl overflow-hidden bg-[var(--card2)] border border-[var(--brd)] relative group"
    >
      <img
        src={src}
        alt="response"
        onError={() => setErr(true)}
        onContextMenu={noMenu}
        draggable={false}
        className="w-full h-auto max-h-[50vh] object-contain block select-none"
        style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
      />
      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <ExternalLink size={14} color="#fff" />
      </div>
    </a>
  );
}

function MethodBadge({ method }: { method: string }) {
  const isGet = method.toUpperCase() === "GET";
  const isPost = method.toUpperCase() === "POST";
  return (
    <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded uppercase border shrink-0 ${
      isGet ? "bg-[var(--emerald-bg)] border-[var(--emerald-brd)] text-[var(--emerald)]"
      : isPost ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
      : "bg-blue-500/10 border-blue-500/20 text-blue-400"
    }`}>
      {method || "GET"}
    </span>
  );
}

// ── Code Snippet Generator Modal Section ──
function CodeSnippets({ url, method }: { url: string; method: string }) {
  const [lang, setLang] = useState<"curl" | "js" | "python" | "node">("curl");
  const [copied, setCopied] = useState(false);

  const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;

  const snippets = {
    curl: `curl -X ${method.toUpperCase()} "${fullUrl}"`,
    js: `// Fetch request in browser / JavaScript
const response = await fetch("${fullUrl}");
const data = await response.json();
console.log(data);`,
    python: `# Python requests
import requests

response = requests.get("${fullUrl}")
data = response.json()
print(data)`,
    node: `// Node.js (axios)
import axios from "axios";

const { data } = await axios.get("${fullUrl}");
console.log(data);`
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-xl border border-[var(--brd)] bg-[var(--card2)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--brd2)] bg-[var(--inp)]">
        <div className="flex items-center gap-1">
          {(["curl", "js", "python", "node"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-colors ${
                lang === l ? "bg-[var(--accent)] text-white" : "text-[var(--fg4)] hover:text-[var(--fg)]"
              }`}
            >
              {l === "curl" ? "cURL" : l === "js" ? "JavaScript" : l === "python" ? "Python" : "Node.js"}
            </button>
          ))}
        </div>
        <button
          onClick={copySnippet}
          className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--fg3)] hover:text-[var(--accent)] transition-colors"
        >
          {copied ? <Check size={13} className="text-[var(--emerald)]" /> : <Copy size={13} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-3 text-[12px] font-mono text-[var(--fg2)] overflow-x-auto whitespace-pre leading-relaxed no-scrollbar">
        {snippets[lang]}
      </pre>
    </div>
  );
}

function ApiTesterModal({ endpoint, onClose, onToast, userRating, onRate, realRatings = {} }: {
  endpoint: Endpoint;
  onClose: () => void;
  onToast: (msg: string) => void;
  userRating?: number;
  onRate?: (path: string, stars: number) => void;
  realRatings?: Record<string, { score: number; count: number }>;
}) {
  const [params, setParams] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(endpoint.params).map(([k, v]) => [k, String(v)]))
  );
  const [resp, setResp] = useState<ResponseState>({ kind: "none" });
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const isUploadEndpoint = endpoint.path.includes("upload") || (endpoint.method === "POST" && (endpoint.path.includes("file") || endpoint.path.includes("storage") || endpoint.path.includes("onlyfiles")));
  const url = buildUrl(endpoint.path, params);
  const isImageGenerator = endpoint.path === "/api/pollinations/prompt";

  async function run() {
    setResp({ kind: "loading" });
    const startTime = performance.now();
    let res: Response | null = null;
    let contentType = "";
    let lastError: Error | null = null;

    if (isUploadEndpoint) {
      try {
        const formData = new FormData();
        if (uploadFile) {
          formData.append("file", uploadFile);
        } else {
          const sampleBlob = new Blob(
            [`Kaalix Free APIs - File Upload Verification\nTime: ${new Date().toISOString()}\nSize: 76 bytes`],
            { type: "text/plain" }
          );
          formData.append("file", sampleBlob, "kaalix-sample.txt");
        }
        if (params.expire !== undefined && params.expire !== "") {
          formData.append("expire", params.expire);
        }

        const uploadTimeoutMs = 600000; // 10 minutes timeout for uploads up to 100MB
        const candidateRes = await fetchWithTimeout(url, {
          method: "POST",
          body: formData,
        }, uploadTimeoutMs);
        res = candidateRes;
        contentType = candidateRes.headers.get("content-type") ?? "";
      } catch (e) {
        lastError = e as Error;
      }
    } else if (endpoint.method === "POST") {
      try {
        const candidateRes = await fetchWithTimeout(endpoint.path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        res = candidateRes;
        contentType = candidateRes.headers.get("content-type") ?? "";
      } catch (e) {
        lastError = e as Error;
      }
    } else {
      const candidates = [url];
      if (canUseProxyFallback(endpoint.path)) candidates.push(buildLegacyProxyUrl(endpoint.path, params));

      for (const candidate of candidates) {
        try {
          const candidateRes = await fetchWithTimeout(candidate);
          const candidateType = candidateRes.headers.get("content-type") ?? "";
          const looksLikeAppShell = candidateType.includes("text/html");
          if (candidateRes.ok && !looksLikeAppShell) {
            res = candidateRes;
            contentType = candidateType;
            break;
          }
          res = candidateRes;
          contentType = candidateType;
        } catch (e) {
          lastError = e as Error;
        }
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);

    if (!res || !res.ok || (contentType.includes("text/html") && !endpoint.path.includes("download"))) {
      let detail = lastError?.message || "The API proxy did not return a usable response";
      if (res) {
        try {
          const raw = await readWithTimeout(res.text(), isUploadEndpoint ? 600000 : 60000);
          const cleanedRaw = String(stripCreatorMetadata(raw));
          try {
            const parsed = JSON.parse(cleanedRaw) as any;
            const stripped = stripCreatorMetadata(parsed) as any;
            detail = stripped?.message || stripped?.msg || stripped?.error || JSON.stringify(stripped);
          } catch {
            detail = cleanedRaw.slice(0, 180) || detail;
          }
        } catch {
          // Keep message
        }
      }
      detail = String(stripCreatorMetadata(detail));
      const status = res?.status ?? 0;
      setResp({ kind: "error", message: status ? `${status} ${res?.statusText || "Error"} — ${detail}` : `Network error — ${detail}`, status, latencyMs });
      return;
    }

    try {
      if (contentType.startsWith("image/")) {
        const blob = await readWithTimeout(res.blob());
        setResp({ kind: "image", src: URL.createObjectURL(blob), status: res.status, latencyMs });
      } else if (contentType.startsWith("video/")) {
        const blob = await readWithTimeout(res.blob());
        setResp({ kind: "video", src: URL.createObjectURL(blob), status: res.status, latencyMs });
      } else {
        const raw = await readWithTimeout(res.text(), isUploadEndpoint ? 600000 : 60000);
        if (contentType.includes("application/json")) {
          let cleanedJson: any;
          try {
            const json = JSON.parse(raw);
            cleanedJson = stripCreatorMetadata(json);
          } catch {
            cleanedJson = raw;
          }
          const formatted = typeof cleanedJson === "object" ? JSON.stringify(cleanedJson, null, 2) : String(cleanedJson);
          const images = extractImageUrls(cleanedJson, [], 4);
          let fileMeta: { id?: string; name?: string; size?: string; downloadUrl?: string } | undefined = undefined;
          if (cleanedJson && typeof cleanedJson === "object") {
            const f = (cleanedJson as any)?.data?.file;
            if (f) {
              const fileId = f.metadata?.id || f.id || "";
              const fileName = f.metadata?.name || f.name || "uploaded-file";
              const readableSize = f.metadata?.size?.readable || (f.metadata?.size?.bytes ? `${f.metadata.size.bytes} B` : "");
              const downloadUrl = f.url?.download || f.url?.full || f.url?.direct || (fileId ? `/api/file/download?id=${fileId}` : "");
              fileMeta = { id: fileId, name: fileName, size: readableSize, downloadUrl };
            }
          }
          setResp({
            kind: "json",
            text: formatted,
            images,
            fileMeta,
            status: res.status,
            latencyMs,
          });
        } else {
          setResp({ kind: "text", text: raw, status: res.status, latencyMs });
        }
      }
    } catch (e) {
      const error = e as Error;
      setResp({ kind: "error", message: error.message || "The response could not be read", status: res.status, latencyMs });
    }
  }

  function copyUrl() {
    const full = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    onToast("Endpoint URL copied to clipboard!");
    setTimeout(() => setCopied(false), 1500);
  }

  function copyResponse() {
    if (resp.kind === "json" || resp.kind === "text") {
      navigator.clipboard.writeText(resp.text);
      onToast("Response copied to clipboard!");
    }
  }

  const preStyle: React.CSSProperties = {
    background: "var(--card2)", border: "1px solid var(--brd)", borderRadius: 12,
    padding: "16px", color: "var(--fg3)", fontSize: 13,
    fontFamily: '"JetBrains Mono", monospace', overflowX: "auto",
    maxHeight: 280, overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.6,
  };

  return (
    <div className="api-tester-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="api-tester-modal">
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="w-10 h-1 rounded-full bg-[var(--brd)]" />
        </div>
        
        <div className="flex items-start justify-between p-5 lg:p-6 border-b border-[var(--brd2)] bg-[var(--card2)] lg:rounded-t-[24px]">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <MethodBadge method={endpoint.method} />
              {endpoint.nsfw && (
                <span className="text-[10px] font-extrabold bg-red-500/10 border border-red-500/20 text-red-500 px-1.5 py-0.5 rounded-md">18+</span>
              )}
              {onRate && (
                <div className="flex items-center gap-1.5 bg-[var(--inp)] border border-[var(--brd2)] px-2.5 py-1 rounded-xl">
                  <StarRatingWidget
                    path={endpoint.name}
                    ratingData={getEndpointRatingData(endpoint.name, realRatings, userRating)}
                    onRate={onRate}
                  />
                </div>
              )}
            </div>
            <div className="font-bold text-xl text-[var(--fg)] leading-snug">{endpoint.name}</div>
            <div className="text-[14px] text-[var(--fg3)] mt-1.5 leading-relaxed font-medium">{endpoint.description}</div>
          </div>
          <button onClick={onClose} className="btn-icon w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 lg:p-6 flex flex-col gap-5 overflow-y-auto no-scrollbar">
          {isImageGenerator && (
            <div className="generator-callout rounded-2xl p-4 flex items-start gap-3">
              <div className="generator-callout-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="text-[13px] font-extrabold text-[var(--fg)]">Describe your scene</div>
                <div className="text-[12px] text-[var(--fg3)] mt-1 leading-relaxed">Use a detailed prompt for richer results. Your prompt is sent to Pollinations as an image URL.</div>
              </div>
            </div>
          )}

          {isUploadEndpoint && (
            <div className="p-4 rounded-2xl border-2 border-dashed border-[var(--accent)]/40 bg-[var(--accent)]/5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UploadCloud size={20} className="text-[var(--accent)]" />
                  <span className="text-[13px] font-bold text-[var(--fg)]">Upload File</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const sample = new File([`Kaalix Free APIs Test File — ${new Date().toISOString()}`], "demo-note.txt", { type: "text/plain" });
                    setUploadFile(sample);
                    onToast("Sample demo file selected!");
                  }}
                  className="text-[11px] font-semibold text-[var(--accent)] hover:underline"
                >
                  Use Sample File
                </button>
              </div>

              <input
                type="file"
                id="modal-file-upload-input"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
                }}
              />

              <label
                htmlFor="modal-file-upload-input"
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--inp)] border border-[var(--brd)] hover:border-[var(--accent)] cursor-pointer transition-all text-center"
              >
                {uploadFile ? (
                  <div className="flex items-center gap-2 text-[13px] font-mono text-[var(--emerald)]">
                    <FileText size={18} />
                    <span className="font-bold">{uploadFile.name}</span>
                    <span className="text-[11px] text-[var(--fg4)]">({(uploadFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[13px] font-semibold text-[var(--fg2)]">Click to choose file or drop here</span>
                    <span className="text-[11px] text-[var(--fg4)]">Supports documents, images, audio, zip (Max 100MB)</span>
                  </div>
                )}
              </label>
              {isUploadEndpoint && (
                <div className="flex items-center justify-between text-[13px] pt-1">
                  <span className="text-[var(--fg3)] font-medium">All files are deleted after</span>
                  <select
                    value={params.expire ?? "0"}
                    onChange={(e) => setParams((p) => ({ ...p, expire: e.target.value }))}
                    className="glass-input rounded-xl py-1.5 px-3 text-[13px] font-semibold bg-[var(--card2)] text-[var(--accent)] cursor-pointer border border-[var(--brd)] hover:border-[var(--accent)] transition-colors outline-none"
                  >
                    <option value="0">Permanent</option>
                    <option value="3600">60 minutes</option>
                    <option value="21600">6 hours</option>
                    <option value="86400">24 hours</option>
                    <option value="172800">48 hours</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {(() => {
            const visibleParams = Object.entries(params).filter(([key]) => !(isUploadEndpoint && key === "expire"));
            if (visibleParams.length === 0) return null;
            return (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-bold text-[var(--fg4)] uppercase tracking-widest">Parameters</div>
                  <button
                    onClick={() => setParams(Object.fromEntries(Object.entries(endpoint.params).map(([k, v]) => [k, String(v)])))}
                    className="text-[11px] text-[var(--fg4)] hover:text-[var(--accent)] font-medium transition-colors"
                  >
                    Reset defaults
                  </button>
                </div>
                <div className="flex flex-col gap-3">
                  {visibleParams.map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-[13px] font-mono font-semibold text-[var(--fg3)] w-24 text-right shrink-0">{key}</span>
                      <input
                        value={val}
                        onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
                        className="glass-input w-full rounded-xl py-2 px-3.5 text-[14px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="flex items-center gap-3 bg-[var(--card2)] border border-[var(--brd)] rounded-xl p-2.5 pl-4">
            <code className="flex-1 min-w-0 text-[13px] font-mono text-[var(--accent)] break-all leading-relaxed">{url}</code>
            <button onClick={copyUrl} className="btn-icon w-9 h-9 rounded-lg shrink-0 flex items-center justify-center" title="Copy endpoint URL">
              {copied ? <Check size={16} className="text-[var(--emerald)]" /> : <Copy size={16} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={run} disabled={resp.kind === "loading"} className="btn-violet rounded-xl py-3 px-5 flex-1 flex items-center justify-center gap-2 font-bold text-[15px] disabled:opacity-80">
              {resp.kind === "loading" ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>{isUploadEndpoint ? "Uploading file... Please wait" : "Executing..."}</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  <span>{isUploadEndpoint ? "Upload File & Test" : "Run API Request"}</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowCode(!showCode)}
              className={`p-3 rounded-xl border flex items-center justify-center gap-1.5 text-[13px] font-bold transition-colors ${
                showCode ? "bg-[var(--accent-muted)] border-[var(--accent)] text-[var(--accent)]" : "bg-[var(--inp)] border-[var(--brd)] text-[var(--fg3)] hover:text-[var(--fg)]"
              }`}
              title="Show code snippets"
            >
              <Code2 size={16} />
              <span className="hidden sm:inline">Code</span>
            </button>
          </div>

          {showCode && <CodeSnippets url={url} method={endpoint.method} />}

          {resp.kind !== "none" && resp.kind !== "loading" && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--fg4)]">Response</span>
                  <StatusBadge code={resp.status} latency={resp.latencyMs} />
                </div>
                {(resp.kind === "json" || resp.kind === "text") && (
                  <button onClick={copyResponse} className="flex items-center gap-1 text-[12px] font-medium text-[var(--fg3)] hover:text-[var(--accent)]">
                    <Copy size={12} /> Copy JSON
                  </button>
                )}
              </div>
              
              {resp.kind === "image" && <ImagePreview src={resp.src} />}
              {resp.kind === "video" && (
                <div className="flex flex-col gap-3">
                  <video src={resp.src} controls playsInline className="w-full rounded-xl border border-[var(--brd)] bg-black" />
                  <a href={resp.src} download="kaalix-media.mp4" className="btn-violet rounded-xl py-3 px-4 text-center font-bold text-[14px]">Download Video</a>
                </div>
              )}
              {resp.kind === "json" && (
                <div className="flex flex-col gap-2">
                  {resp.fileMeta && resp.fileMeta.downloadUrl && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2 shadow-sm">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                          <Download size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-emerald-300 truncate">{resp.fileMeta.name}</div>
                          <div className="text-[11px] text-emerald-400/80 font-mono">
                            {resp.fileMeta.size ? `${resp.fileMeta.size} • ` : ""}Proxied & Ready to Stream
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <a
                          href={resp.fileMeta.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={resp.fileMeta.name}
                          className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[12px] flex items-center justify-center gap-1.5 shadow-md transition-colors"
                        >
                          <Download size={14} /> Download File
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const full = resp.fileMeta!.downloadUrl!.startsWith("http")
                              ? resp.fileMeta!.downloadUrl!
                              : `${window.location.origin}${resp.fileMeta!.downloadUrl!}`;
                            navigator.clipboard.writeText(full);
                            onToast("Direct download link copied!");
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-semibold text-[12px] flex items-center gap-1 hover:bg-emerald-500/30 transition-colors"
                        >
                          <Copy size={13} /> Copy Link
                        </button>
                      </div>
                    </div>
                  )}
                  {resp.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                      {resp.images.slice(0, 4).map((src, i) => (
                        <div key={i} className="rounded-xl overflow-hidden border border-[var(--brd)] bg-[var(--card2)] aspect-video relative group shadow-sm">
                          <img src={src} alt="Preview" className="w-full h-full object-cover" loading="lazy" />
                          <a href={src} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity">
                            View Image
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                  <pre style={preStyle}>{resp.text}</pre>
                </div>
              )}
              {resp.kind === "text" && (
                <pre style={preStyle}>{resp.text}</pre>
              )}
              {resp.kind === "error" && (
                <div className="api-error-card rounded-2xl p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="api-error-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                      <AlertTriangle size={19} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-red-400 text-[11px] font-black uppercase tracking-[0.16em] mb-1.5">
                        Request failed
                      </div>
                      <div className="text-[var(--fg)] font-semibold text-[14px] leading-relaxed break-words">
                        {resp.message}
                      </div>
                    </div>
                  </div>
                  <button onClick={run} className="api-retry-button mt-4 w-full rounded-xl py-2.5 flex items-center justify-center gap-2 text-[13px] font-extrabold">
                    <RotateCcw size={14} /> Try again
                  </button>
                </div>
              )}

              {onRate && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Star size={17} className="text-amber-400 shrink-0" fill="currentColor" />
                    <div>
                      <div className="text-[12px] font-bold text-[var(--fg)]">Rate this API experience</div>
                      <div className="text-[11px] text-[var(--fg4)]">Help developers find the most reliable free endpoints</div>
                    </div>
                  </div>
                  <StarRatingWidget
                    path={endpoint.name}
                    ratingData={getEndpointRatingData(endpoint.name, realRatings, userRating)}
                    onRate={onRate}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card Component for Grid View ──
function EndpointCard({
  ep,
  isFavorite,
  userRating,
  realRatings = {},
  onToggleFavorite,
  onTry,
  onCopyUrl,
  onRate,
}: {
  ep: Endpoint;
  isFavorite: boolean;
  userRating?: number;
  realRatings?: Record<string, { score: number; count: number }>;
  onToggleFavorite: () => void;
  onTry: () => void;
  onCopyUrl: () => void;
  onRate: (path: string, stars: number) => void;
}) {
  const paramKeys = Object.keys(ep.params);
  const ratingData = getEndpointRatingData(ep.name, realRatings, userRating);

  return (
    <div className="glass-card rounded-2xl p-4 flex flex-col justify-between group hover:border-[var(--accent)] transition-all duration-200">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <MethodBadge method={ep.method} />
            {ep.nsfw && (
              <span className="text-[9px] font-extrabold bg-red-500/10 border border-red-500/20 text-red-500 px-1.5 py-0.5 rounded">
                18+
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                isFavorite ? "text-amber-400 bg-amber-400/10" : "text-[var(--fg4)] hover:text-amber-400"
              }`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <h4 className="font-bold text-[15px] text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors leading-tight mb-1.5">
          {ep.name}
        </h4>

        {/* 5-Star Interactive Rating Widget */}
        <div className="mb-2.5">
          <StarRatingWidget
            path={ep.name}
            ratingData={ratingData}
            onRate={onRate}
          />
        </div>

        <p className="text-[12px] text-[var(--fg3)] line-clamp-2 leading-relaxed mb-3">
          {ep.description}
        </p>

        {paramKeys.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-4">
            {paramKeys.slice(0, 3).map((k) => (
              <span key={k} className="text-[10px] font-mono text-[var(--fg4)] bg-[var(--inp)] px-1.5 py-0.5 rounded border border-[var(--brd2)]">
                ?{k}
              </span>
            ))}
            {paramKeys.length > 3 && (
              <span className="text-[10px] text-[var(--fg4)]">+{paramKeys.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-[var(--brd2)]">
        <button
          onClick={onCopyUrl}
          className="btn-icon p-2 rounded-xl text-[var(--fg3)] hover:text-[var(--accent)] flex items-center justify-center transition-colors"
          title="Copy URL"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={onTry}
          className="btn-violet flex-1 py-1.5 px-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-1.5"
        >
          <Play size={12} fill="currentColor" />
          <span>Test API</span>
        </button>
      </div>
    </div>
  );
}

// ── Row Component for List View ──
function EndpointRow({
  ep,
  isFavorite,
  userRating,
  realRatings = {},
  onToggleFavorite,
  onTry,
  onCopyUrl,
  onRate,
}: {
  ep: Endpoint;
  isFavorite: boolean;
  userRating?: number;
  realRatings?: Record<string, { score: number; count: number }>;
  onToggleFavorite: () => void;
  onTry: () => void;
  onCopyUrl: () => void;
  onRate: (path: string, stars: number) => void;
}) {
  const ratingData = getEndpointRatingData(ep.name, realRatings, userRating);

  return (
    <div className="endpoint-row w-full flex items-center gap-3 py-3 px-4 lg:px-5 group">
      <button
        onClick={onToggleFavorite}
        className={`p-1.5 rounded-lg shrink-0 transition-colors ${
          isFavorite ? "text-amber-400 bg-amber-400/10" : "text-[var(--fg4)] hover:text-amber-400"
        }`}
        title="Favorite"
      >
        <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
      </button>

      <MethodBadge method={ep.method} />

      <div className="flex-1 min-w-0 cursor-pointer" onClick={onTry}>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[14px] font-semibold text-[var(--fg)] group-hover:text-[var(--accent)] transition-colors">
            {ep.name}
          </span>
          {ep.nsfw && (
            <span className="text-[9px] font-extrabold bg-red-500/10 border border-red-500/20 text-red-500 px-1.5 py-0.5 rounded-md">
              18+
            </span>
          )}
          <StarRatingWidget
            path={ep.name}
            ratingData={ratingData}
            onRate={onRate}
            compact={true}
          />
        </div>
        <div className="text-[12px] text-[var(--fg4)] truncate mt-0.5 font-medium">
          {ep.description}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onCopyUrl}
          className="btn-icon p-1.5 rounded-lg text-[var(--fg4)] hover:text-[var(--accent)] transition-colors"
          title="Copy URL"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={onTry}
          className="btn-violet py-1.5 px-3 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0"
        >
          <span>Test</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

function CategorySection({
  cat,
  viewMode,
  favorites,
  ratings,
  realRatings = {},
  onToggleFavorite,
  onTry,
  onCopyUrl,
  onRate,
  isActive,
}: {
  cat: Category;
  viewMode: "grid" | "list";
  favorites: string[];
  ratings: Record<string, number>;
  realRatings?: Record<string, { score: number; count: number }>;
  onToggleFavorite: (path: string) => void;
  onTry: (ep: Endpoint) => void;
  onCopyUrl: (ep: Endpoint) => void;
  onRate: (path: string, stars: number) => void;
  isActive: boolean;
}) {
  return (
    <section
      id={`cat-${cat.key}`}
      className={`glass-card rounded-[24px] mb-6 overflow-hidden transition-all duration-300 ${
        isActive ? "!border-[var(--accent)] ring-4 ring-[var(--accent-muted)]" : ""
      }`}
    >
      <div className={`flex items-center gap-4 p-4 lg:p-5 border-b border-[var(--brd2)] transition-colors ${
        isActive ? "bg-[var(--accent-muted)]" : "bg-[var(--card2)]"
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors ${
          isActive ? "bg-[var(--accent)] shadow-[0_4px_16px_rgba(0,200,255,0.3)] text-white" : "bg-[var(--inp)] border border-[var(--brd)] text-[var(--fg3)]"
        }`}>
          <CategoryIcon name={cat.iconName} size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-[17px] ${isActive ? "text-[var(--accent)]" : "text-[var(--fg)]"}`}>
            {cat.label}
          </h3>
          <p className="text-[12px] text-[var(--fg4)] truncate">
            {cat.endpoints.length} active route{cat.endpoints.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {cat.endpoints.map((ep) => (
            <EndpointCard
              key={`${cat.key}-${ep.name}`}
              ep={ep}
              isFavorite={favorites.includes(ep.name) || favorites.includes(ep.path)}
              userRating={ratings[ep.name] ?? ratings[ep.path]}
              realRatings={realRatings}
              onToggleFavorite={() => onToggleFavorite(ep.name)}
              onTry={() => onTry(ep)}
              onCopyUrl={() => onCopyUrl(ep)}
              onRate={onRate}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {cat.endpoints.map((ep) => (
            <EndpointRow
              key={`${cat.key}-${ep.name}`}
              ep={ep}
              isFavorite={favorites.includes(ep.name) || favorites.includes(ep.path)}
              userRating={ratings[ep.name] ?? ratings[ep.path]}
              realRatings={realRatings}
              onToggleFavorite={() => onToggleFavorite(ep.name)}
              onTry={() => onTry(ep)}
              onCopyUrl={() => onCopyUrl(ep)}
              onRate={onRate}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryTabs({
  categories,
  active,
  onSelect,
}: {
  categories: Category[];
  active: string | null;
  onSelect: (k: string) => void;
}) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5 border-t border-[var(--brd2)]">
      {categories.map((cat) => {
        const sel = active === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[13px] font-bold whitespace-nowrap shrink-0 transition-all duration-200 border ${
              sel
                ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-[0_4px_14px_rgba(0,200,255,0.35)]"
                : "bg-[var(--card)] border-[var(--brd)] text-[var(--fg3)] hover:bg-[var(--inp)]"
            }`}
          >
            <CategoryIcon name={cat.iconName} size={14} style={{ color: sel ? "#fff" : "var(--fg4)" }} />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

function BackgroundEffects() {
  const [images, setImages] = useState<{ src: string; id: number }[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let isMounted = true;
    let count = 0;
    let timerId: ReturnType<typeof setTimeout>;

    const fetchImage = async () => {
      try {
        const urlPath = count % 2 === 0 ? "/api/waifu" : "/api/cosplay";
        const res = await fetch(`${BASE}${urlPath}`);
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        const urls = extractImageUrls(data);
        if (urls.length > 0 && isMounted) {
          const newSrc = urls[0];
          setImages((prev) => {
            const next = [...prev, { src: newSrc, id: count }];
            if (next.length > 2) return next.slice(-2);
            return next;
          });
          setActiveIndex(count);
          const favicon = document.getElementById("dyn-favicon") as HTMLLinkElement | null;
          if (favicon) favicon.href = newSrc;
          count++;
          timerId = setTimeout(fetchImage, 60000);
        } else {
          throw new Error("no images");
        }
      } catch {
        if (isMounted) {
          timerId = setTimeout(fetchImage, 15000);
        }
      }
    };

    fetchImage();
    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-br from-[var(--pg)] to-[#0f091a]">
      {images.map((img) => (
        <img
          key={img.id}
          src={img.src}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out"
          style={{
            opacity: activeIndex === img.id ? 1 : 0,
            filter: "blur(18px)",
            transform: "scale(1.08)",
          }}
          alt=""
        />
      ))}
      <div className="absolute inset-0" style={{ background: "var(--overlay)" }} />
    </div>
  );
}

function ProfileModal({ onClose, onOpenCommunity }: { onClose: () => void; onOpenCommunity: () => void }) {
  const [muted, setMuted] = useState(true);
  const userToggledMute = useRef(false);
  const stallRetries = useRef(0);
  const [videoIdx, setVideoIdx] = useState(() => Math.floor(Date.now() / (1000 * 60 * 60)) % PROFILE_VIDEOS.length);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [avatarTimestamp] = useState(() => Date.now());

  const [tgProfile, setTgProfile] = useState<{
    name: string;
    bio: string;
    username: string;
    id: string;
    channel_url: string;
    chat_url: string;
    updated_at: number;
  }>({
    name: "˹Yᴜᴋɪ !!",
    bio: "",
    username: "",
    id: "8440279273",
    channel_url: "https://t.me/TheFelixModz",
    chat_url: "tg://openmessage?user_id=8440279273",
    updated_at: Date.now(),
  });

  useEffect(() => {
    fetch("/api/telegram/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok) {
          setTgProfile({
            name: data.name || "˹Yᴜᴋɪ !!",
            bio: data.bio || "",
            username: data.username || "",
            id: data.id || "8440279273",
            channel_url: data.channel_url || "https://t.me/TheFelixModz",
            chat_url: data.chat_url || "tg://openmessage?user_id=8440279273",
            updated_at: data.updated_at || Date.now(),
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const msInHour = 1000 * 60 * 60;
    const msUntilNext = msInHour - (Date.now() % msInHour);
    const t = setTimeout(() => setVideoIdx((p) => (p + 1) % PROFILE_VIDEOS.length), msUntilNext);
    return () => clearTimeout(t);
  }, [videoIdx]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted, videoIdx]);

  const handlePlay = () => {
    const v = videoRef.current;
    if (v) v.muted = muted;
  };

  const handleStall = () => {
    const v = videoRef.current;
    if (!v) return;
    stallRetries.current += 1;
    if (stallRetries.current <= 2) {
      window.setTimeout(() => v.play().catch(() => {}), 180);
    } else {
      stallRetries.current = 0;
      const t = Number.isFinite(v.currentTime) ? v.currentTime : 0;
      v.load();
      try { v.currentTime = t; } catch {}
      v.play().catch(() => {});
    }
  };

  const handleVideoEnded = () => {
    const v = videoRef.current;
    if (!v || videoFailed) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  };

  const toggleSound = () => {
    userToggledMute.current = true;
    setMuted((prev) => !prev);
  };

  return (
    <div
      className="pm-backdrop fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(18px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="pm-card w-full max-w-[370px] rounded-[30px] overflow-hidden bg-white text-slate-800"
        style={{
          border: "1px solid rgba(0, 145, 212, 0.22)",
          boxShadow: "0 25px 65px -12px rgba(14, 116, 144, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)",
        }}
      >
        {/* Cover Header */}
        <div className="relative overflow-hidden" style={{ height: "180px" }}>
          <img
            src={`/api/telegram/avatar?t=${avatarTimestamp}`}
            onError={(e) => { e.currentTarget.src = "/profile.jpg"; }}
            alt=""
            aria-hidden="true"
            className={`pm-video-fallback absolute inset-0 w-full h-full object-cover select-none ${videoFailed ? "is-visible" : ""}`}
          />
          <video
            key={videoIdx}
            ref={videoRef}
            src={PROFILE_VIDEOS[videoIdx]}
            poster="/profile.jpg"
            autoPlay
            loop
            playsInline
            muted
            preload="auto"
            onPlay={handlePlay}
            onEnded={handleVideoEnded}
            onError={() => setVideoFailed(true)}
            onWaiting={handleStall}
            onStalled={handleStall}
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
            className={`pm-video absolute inset-0 w-full h-full object-cover select-none ${videoFailed ? "is-failed" : ""}`}
            style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(14,24,42,0.4) 60%, rgba(255,255,255,1) 100%)" }}
          />

          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
            <button
              onClick={toggleSound}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(0,0,0,0.08)",
                color: muted ? "#64748b" : "#059669",
              }}
            >
              {muted ? <><VolumeX size={12}/><span>Sound off</span></> : <><Volume2 size={12}/><span>Sound on</span></>}
            </button>

            <div className="flex items-center gap-1.5">
              {PROFILE_VIDEOS.map((_, i) => (
                <span
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === videoIdx ? "14px" : "5px",
                    height: "5px",
                    background: i === videoIdx ? "#0091d4" : "rgba(255,255,255,0.6)",
                  }}
                />
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm"
              style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <X size={14} color="#0f172a" />
            </button>
          </div>
        </div>

        {/* Profile Details (Day Mode / Light Theme) */}
        <div className="px-5 pt-0 pb-5 bg-white">
          {/* Avatar Section */}
          <div className="flex justify-center" style={{ marginTop: "-48px" }}>
            <div className="relative group">
              <div
                className="absolute -inset-1 rounded-full animate-pulse"
                style={{
                  background: "conic-gradient(from 0deg, #0091d4, #00e5a0, #38bdf8, #6366f1, #0091d4)",
                  filter: "blur(3px)",
                  opacity: 0.75,
                }}
              />
              <div
                className="relative w-[90px] h-[90px] rounded-full overflow-hidden shadow-lg"
                style={{ border: "4px solid #ffffff", background: "#f8fafc" }}
              >
                <img
                  src={`/api/telegram/avatar?t=${avatarTimestamp}`}
                  onError={(e) => { e.currentTarget.src = "/profile.jpg"; }}
                  alt="avatar"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                  className="w-full h-full object-cover select-none"
                  style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
                />
              </div>
              <span
                className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500"
                style={{ border: "2.5px solid #ffffff", boxShadow: "0 0 10px rgba(16, 185, 129, 0.6)" }}
                title="Online & Synchronized"
              />
            </div>
          </div>

          {/* User Name & Badges */}
          <div className="flex flex-col items-center pt-2.5 pb-2 gap-1.5 text-center">
            <div className="flex items-center gap-1.5 justify-center">
              <span className="text-slate-900 font-black text-[20px] tracking-tight leading-snug">
                {tgProfile.name}
              </span>
              <img
                src="/badge.png"
                alt="verified"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="w-[20px] h-[20px] object-contain select-none"
                style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
              />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-extrabold tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Owner &amp; Developer</span>
            </div>
          </div>

          {/* Primary Action: Direct Message on Telegram */}
          <div className="pt-2 pb-3">
            <button
              onClick={() => {
                const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                if (isMobile) {
                  window.location.href = "tg://openmessage?user_id=8440279273";
                } else {
                  window.open("https://t.me/TheFelixModz", "_blank", "noopener,noreferrer");
                }
              }}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
              className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-2xl font-black text-[14.5px] text-white transition-all hover:brightness-110 active:scale-[0.98] shadow-lg shadow-sky-500/25 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #0284c7 0%, #0088cc 50%, #0ea5e9 100%)" }}
            >
              <Send size={16} />
              <span>Send Message</span>
            </button>
          </div>

          {/* Social Channels Strip */}
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => openLink("https://t.me/TheFelixModz")}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
              className="flex-1 flex items-center gap-2.5 p-2 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-50 text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-600 shrink-0">
                <Send size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-extrabold text-slate-800 truncate">The Felix Modz</div>
                <div className="text-[10px] text-sky-600 font-bold">Official Channel</div>
              </div>
            </button>

            <button
              onClick={onOpenCommunity}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
              className="flex-1 flex items-center gap-2.5 p-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-50 text-left transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-2xs"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-600 shrink-0">
                <Users size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-extrabold text-slate-800 truncate">Community</div>
                <div className="text-[10px] text-indigo-600 font-bold">Open website chat</div>
              </div>
            </button>
          </div>

          {/* Age & Birthday */}
          <div className="flex items-center justify-center gap-1.5 pt-3 text-slate-400">
            <CalendarDays size={11} />
            <span className="text-[11px] font-medium">Dec 01, 2006 · 19 years old</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsDashboardModal({
  onClose,
  onToast,
}: {
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/analytics?live=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      const json = await res.json();
      if (json?.ok) setData(json);
    } catch {
      // Keep the last confirmed live snapshot visible during a transient request failure.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = window.setInterval(() => fetchStats(), 5000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(18px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[620px] rounded-[32px] overflow-hidden bg-white text-slate-800 shadow-2xl flex flex-col max-h-[90vh]"
        style={{
          border: "1px solid rgba(0, 145, 212, 0.22)",
          boxShadow: "0 25px 65px -12px rgba(14, 116, 144, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-sky-50/50 via-white to-sky-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shadow-xs">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[18px] font-black text-slate-900 tracking-tight">Kᴀᴀʟɪx Live Dashboard</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-black tracking-wider uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />LIVE</span>
              </div>
              <p className="text-[12px] text-slate-500 font-medium">Auto-updating live traffic and community ratings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-col gap-1 shadow-2xs">
              <div className="flex items-center justify-between text-sky-600">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Total Users</span>
                <UsersRound size={15} />
              </div>
              <div className="text-[24px] font-black text-slate-900 leading-tight">
                {loading ? "..." : (data?.total_visitors ?? 0).toLocaleString()}
              </div>
              <span className="text-[10px] font-bold text-emerald-600">
                ↑ Real unique users
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col gap-1 shadow-2xs">
              <div className="flex items-center justify-between text-indigo-600">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Page Views</span>
                <Eye size={15} />
              </div>
              <div className="text-[24px] font-black text-slate-900 leading-tight">
                {loading ? "..." : (data?.total_views ?? 0).toLocaleString()}
              </div>
              <span className="text-[10px] font-bold text-indigo-600">Total impressions</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col gap-1 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">API Calls</span>
                <Zap size={15} />
              </div>
              <div className="text-[24px] font-black text-slate-900 leading-tight">
                {loading ? "..." : (data?.total_api_requests ?? 0).toLocaleString()}
              </div>
              <span className="text-[10px] font-bold text-emerald-600">Executed live</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col gap-1 shadow-2xs">
              <div className="flex items-center justify-between text-amber-600">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Avg Rating</span>
                <Star size={15} fill="#f59e0b" color="#f59e0b" />
              </div>
              <div className="text-[24px] font-black text-slate-900 leading-tight">
                {loading ? "..." : `${(data?.overall_average_rating ?? 0).toFixed(1)}★`}
              </div>
              <span className="text-[10px] font-bold text-amber-600">
                {data?.total_ratings_count ?? 0} real reviews
              </span>
            </div>
          </div>

          {/* Leaderboards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Most Used Endpoints */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-[13px]">
                  <TrendingUp size={14} className="text-sky-600" />
                  <span>Most Used Endpoints</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Live Hits</span>
              </div>
              <div className="space-y-2 flex-1">
                {data?.top_endpoints && data.top_endpoints.length > 0 ? (
                  data.top_endpoints.slice(0, 5).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50">
                      <span className="font-mono text-slate-700 truncate max-w-[180px] font-semibold">{item.endpoint}</span>
                      <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full text-[10.5px]">
                        {item.calls} calls
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">Tracking API calls in real time...</div>
                )}
              </div>
            </div>

            {/* Highest Rated Endpoints */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-col">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-[13px]">
                  <Star size={14} className="text-amber-500" fill="#f59e0b" />
                  <span>Real Top Rated</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
              </div>
              <div className="space-y-2 flex-1">
                {data?.top_rated_endpoints && data.top_rated_endpoints.length > 0 ? (
                  data.top_rated_endpoints.slice(0, 5).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50">
                      <span className="font-mono text-slate-700 truncate max-w-[180px] font-semibold">{item.endpoint}</span>
                      <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-[10.5px] flex items-center gap-1">
                        ★ {item.average} ({item.count})
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400 font-medium">Submit ratings on any API to see them here!</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Updates automatically every 5 seconds</span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs transition-colors hover:bg-slate-800 cursor-pointer shadow-xs">Close Dashboard</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [splash, setSplash] = useState(true);
  const [topProfileName, setTopProfileName] = useState("˹Yᴜᴋɪ !!");
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(() => {
    try {
      // Clear previous local storage sessions so user always gets fresh login
      localStorage.removeItem("kaalix_telegram_user");
      localStorage.removeItem("kaalix_telegram_user_v2");
      const saved = localStorage.getItem("kaalix_tg_session_v3");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [upstreamOnline, setUpstreamOnline] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [quickFilter, setQuickFilter] = useState<"all" | "favorites" | "top-rated">("all");
  const [toast, setToast] = useState<string | null>(null);
  const [realRatings, setRealRatings] = useState<Record<string, { score: number; count: number }>>({});

  const searchInputRef = useRef<HTMLInputElement>(null);

  const refreshRatings = async () => {
    try {
      const res = await fetch("/api/ratings");
      const d = await res.json();
      if (d?.ok && d.ratings) setRealRatings(d.ratings);
    } catch {}
  };

  useEffect(() => {
    // Record page visit in MongoDB
    fetch("/api/analytics/visit", { method: "POST" }).catch(() => {});

    // Load initial real ratings from MongoDB
    refreshRatings();
    const ratingTimer = window.setInterval(refreshRatings, 15000);

    // Fetch Telegram live profile
    fetch("/api/telegram/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && data.name) setTopProfileName(data.name);
      })
      .catch(() => {});
    return () => window.clearInterval(ratingTimer);
  }, []);

  // Auto-Logout if user leaves any of the 3 channels
  useEffect(() => {
    if (!telegramUser?.id) return;

    const checkMembership = async () => {
      try {
        const res = await fetch(`/api/telegram-auth/check-membership?userId=${encodeURIComponent(telegramUser.id)}`);
        const data = await res.json();
        if (data?.ok && data.valid === false) {
          try {
            localStorage.removeItem("kaalix_tg_session_v3");
            localStorage.removeItem("kaalix_telegram_user");
          } catch {}
          setTelegramUser(null);
          showToast("⚠️ Aapne channel leave kar diya hai! Account automatic logout ho gaya.");
        }
      } catch {}
    };

    const timer = window.setInterval(checkMembership, 15000);
    window.addEventListener("focus", checkMembership);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", checkMembership);
    };
  }, [telegramUser?.id]);

  // User Ratings stored in localStorage
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("kaalix_ratings");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleRate = async (path: string, stars: number) => {
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: path, stars }),
      });
      const resJson = await res.json();
      if (!resJson?.success || !resJson?.data) throw new Error("Rating was not saved");
      setRatings((prev) => {
        const next = { ...prev, [path]: stars };
        localStorage.setItem("kaalix_ratings", JSON.stringify(next));
        return next;
      });
      setRealRatings((prev) => ({
        ...prev,
        [path]: { score: resJson.data.average, count: resJson.data.count },
      }));
      showToast(`Saved your real ${stars}★ rating! ⭐`);
    } catch {
      showToast("Rating could not be saved. Please try again.");
    }
  };

  // Favorites stored in localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("kaalix_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const toggleFavorite = (path: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(path);
      const next = exists ? prev.filter((p) => p !== path) : [...prev, path];
      localStorage.setItem("kaalix_favorites", JSON.stringify(next));
      showToast(exists ? "Removed from favorites" : "Added to favorites ⭐");
      return next;
    });
  };

  const handleCopyEndpointUrl = (ep: Endpoint) => {
    const url = buildUrl(ep.path, ep.params);
    const full = url.startsWith("http") ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(full);
    showToast(`Copied ${ep.name} URL!`);
  };

  // Keyboard shortcut listener for Ctrl+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setSelectedEndpoint(null);
        setShowProfile(false);
        setShowCommunity(false);
        setShowDashboard(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const allCategories = defaultCategories;

  const totalEndpointsCount = useMemo(() => {
    return allCategories.reduce((sum, c) => sum + c.endpoints.length, 0);
  }, [allCategories]);

  const liveAvgRating = useMemo(() => {
    const list = Object.values(realRatings);
    if (list.length === 0) return null;
    let sumScore = 0;
    let sumCount = 0;
    for (const r of list) {
      if (r && r.count > 0) {
        sumScore += r.score * r.count;
        sumCount += r.count;
      }
    }
    return sumCount > 0 ? (sumScore / sumCount).toFixed(1) : null;
  }, [realRatings]);

  useEffect(() => {
    let mounted = true;
    const checkUpstream = async () => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(`${BASE}/api`, { method: "GET", cache: "no-store", signal: controller.signal });
        if (mounted) setUpstreamOnline(response.ok || response.status < 500);
      } catch {
        if (mounted) setUpstreamOnline(false);
      } finally {
        window.clearTimeout(timer);
      }
    };
    checkUpstream();
    const interval = window.setInterval(checkUpstream, 10 * 60 * 60 * 1000);
    return () => { mounted = false; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("kaalix-theme", "light");
  }, []);

  const filteredCategories = useMemo(() => {
    let base = allCategories;

    // Apply quick filters
    if (quickFilter === "favorites") {
      base = base
        .map((cat) => ({
          ...cat,
          endpoints: cat.endpoints.filter((ep) => favorites.includes(ep.name) || favorites.includes(ep.path)),
        }))
        .filter((cat) => cat.endpoints.length > 0);
    } else if (quickFilter === "top-rated") {
      base = base
        .map((cat) => ({
          ...cat,
          endpoints: cat.endpoints
            .filter((ep) => {
              const r = getEndpointRatingData(ep.name, realRatings, ratings[ep.name] ?? ratings[ep.path]);
              return r.hasRealData && r.score >= 4.0;
            })
            .sort((a, b) => {
              const rA = getEndpointRatingData(a.name, realRatings, ratings[a.name] ?? ratings[a.path]);
              const rB = getEndpointRatingData(b.name, realRatings, ratings[b.name] ?? ratings[b.path]);
              return rB.score - rA.score;
            }),
        }))
        .filter((cat) => cat.endpoints.length > 0);
    }

    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base
      .map((cat) => ({
        ...cat,
        endpoints: cat.endpoints.filter(
          (ep) =>
            ep.name.toLowerCase().includes(q) ||
            ep.description.toLowerCase().includes(q) ||
            ep.path.toLowerCase().includes(q) ||
            cat.label.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.endpoints.length > 0);
  }, [allCategories, search, quickFilter, favorites, ratings, realRatings]);

  function scrollTo(key: string) {
    setActiveCategory(key);
    setTimeout(() => {
      document.getElementById(`cat-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }

  return (
    <>
      {splash && <SplashScreen onDone={() => setSplash(false)} />}
      <BackgroundEffects />

      {/* ── Compulsory Telegram Auth Gate: Required on first visit ── */}
      {!telegramUser && (
        <TelegramAuthGate
          onSuccess={(user) => {
            setTelegramUser(user);
            showToast(`Welcome, ${user.name}! Account connected & 3 channels verified 🎉`);
          }}
        />
      )}

      {/* ── User Telegram Account Modal ── */}
      {showAccountModal && telegramUser && (
        <TelegramAccountModal
          user={telegramUser}
          onClose={() => setShowAccountModal(false)}
          onLogout={() => {
            try {
              localStorage.removeItem("kaalix_tg_session_v3");
              localStorage.removeItem("kaalix_telegram_user");
            } catch {}
            setTelegramUser(null);
            setShowAccountModal(false);
            showToast("Account disconnected. Telegram connection required to continue.");
          }}
        />
      )}

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} onOpenCommunity={() => { setShowProfile(false); setShowCommunity(true); }} />}
      {showCommunity && <CommunityChat onClose={() => setShowCommunity(false)} currentUser={telegramUser} />}
      {showDashboard && <AnalyticsDashboardModal onClose={() => setShowDashboard(false)} onToast={showToast} />}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[120] bg-[var(--card)] border border-[var(--accent)] text-[var(--fg)] px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2.5 animate-bounce-short">
          <Sparkles size={16} className="text-[var(--accent)] shrink-0" />
          <span className="text-[13px] font-semibold">{toast}</span>
        </div>
      )}

      {!upstreamOnline && (
        <div className="upstream-maintenance" role="status">
          <div>
            <span className="upstream-maintenance-dot" />
            <strong>API maintenance mode</strong>
            <p>The upstream is temporarily unavailable. The workspace will automatically return when it comes back online.</p>
          </div>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <div className="nova-app">
        {selectedEndpoint && (
          <SafeBoundary onReset={() => setSelectedEndpoint(null)}>
            <ApiTesterModal
              endpoint={selectedEndpoint}
              onClose={() => setSelectedEndpoint(null)}
              onToast={showToast}
              userRating={ratings[selectedEndpoint.name] ?? ratings[selectedEndpoint.path]}
              onRate={handleRate}
              realRatings={realRatings}
            />
          </SafeBoundary>
        )}

        {/* ── Sidebar Navigation ── */}
        <aside className="nova-rail">
          <button className="nova-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <span className="nova-brand-mark"><img src="/logo-avatar.png" alt="Kᴀᴀʟɪx" /></span>
            <span><strong>Kᴀᴀʟɪx</strong><small>API WORKSPACE</small></span>
          </button>

          <div className="nova-rail-label mt-2">QUICK VIEWS</div>
          <nav className="flex flex-col gap-1 px-3 mb-2">
            <button
              onClick={() => setShowDashboard(true)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <BarChart3 size={15} className="text-sky-600" /> Live Dashboard
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-black animate-pulse">LIVE</span>
            </button>
            <button
              onClick={() => { setQuickFilter("all"); setActiveCategory(null); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                quickFilter === "all" ? "bg-[var(--accent-muted)] text-[var(--accent)] font-bold" : "text-[var(--fg3)] hover:bg-[var(--inp)] hover:text-[var(--fg)]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers size={15} /> All APIs
              </span>
              <span className="text-[11px] font-mono text-[var(--fg4)]">{totalEndpointsCount}</span>
            </button>
            <button
              onClick={() => { setQuickFilter("top-rated"); setActiveCategory(null); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                quickFilter === "top-rated" ? "bg-[var(--accent-muted)] text-[var(--accent)] font-bold" : "text-[var(--fg3)] hover:bg-[var(--inp)] hover:text-[var(--fg)]"
              }`}
            >
              <span className="flex items-center gap-2.5 text-amber-500 font-bold">
                <Sparkles size={15} /> Top Rated (★4.0+)
              </span>
              <span className="text-[11px] font-mono text-[var(--fg4)]">
                {allCategories.reduce((sum, c) => sum + c.endpoints.filter(e => {
                  const r = getEndpointRatingData(e.path, realRatings, ratings[e.path]);
                  return r.hasRealData && r.score >= 4.0;
                }).length, 0)}
              </span>
            </button>
            <button
              onClick={() => { setQuickFilter("favorites"); setActiveCategory(null); }}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                quickFilter === "favorites" ? "bg-[var(--accent-muted)] text-[var(--accent)] font-bold" : "text-[var(--fg3)] hover:bg-[var(--inp)] hover:text-[var(--fg)]"
              }`}
            >
              <span className="flex items-center gap-2.5 text-amber-400">
                <Star size={15} fill="currentColor" /> Favorites
              </span>
              <span className="text-[11px] font-mono text-[var(--fg4)]">{favorites.length}</span>
            </button>
          </nav>

          <div className="nova-rail-label">CATEGORIES</div>
          <nav className="nova-rail-nav">
            {allCategories.map((cat) => {
              const sel = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  className={`nova-rail-item${sel ? " is-active" : ""}`}
                  onClick={() => {
                    setQuickFilter("all");
                    scrollTo(cat.key);
                  }}
                >
                  <CategoryIcon name={cat.iconName} size={16} />
                  <span>{cat.label}</span>
                  <em>{cat.endpoints.length}</em>
                </button>
              );
            })}
          </nav>

          {telegramUser && (
            <div className="p-2 mb-2 rounded-2xl bg-white/[0.04] border border-emerald-500/30">
              <button
                onClick={() => setShowAccountModal(true)}
                className="w-full flex items-center gap-2.5 text-left cursor-pointer hover:opacity-90 transition-opacity"
              >
                <div className="relative shrink-0">
                  <img
                    src={telegramUser.photo_url || "/profile.jpg"}
                    onError={(e) => { e.currentTarget.src = "/profile.jpg"; }}
                    alt={telegramUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-emerald-400"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black" />
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="text-[12px] font-bold text-white truncate flex items-center gap-1">
                    <span>{telegramUser.name}</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono truncate">
                    {telegramUser.username || "TG VERIFIED"}
                  </div>
                </div>
              </button>
            </div>
          )}

          <button className="nova-rail-profile" onClick={() => setShowProfile(true)}>
            <img
              src="/api/telegram/avatar"
              onError={(e) => { e.currentTarget.src = "/profile.jpg"; }}
              alt="Profile"
            />
            <span><strong>{topProfileName}</strong><small>OWNER &amp; DEVELOPER</small></span>
            <ChevronRight size={15} />
          </button>
        </aside>

        {/* ── Main Area ── */}
        <main className="nova-main">
          <header className="nova-topbar">
            <div className="nova-mobile-brand">
              <img src="/logo-avatar.png" alt="Kᴀᴀʟɪx" />
              <strong>Kᴀᴀʟɪx</strong>
            </div>

            <label className="nova-search">
              <Search size={17} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search 67+ free APIs (name, path, params)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-[var(--fg4)] hover:text-[var(--fg)] p-1"
                >
                  <X size={14} />
                </button>
              ) : (
                <kbd>⌘ K</kbd>
              )}
            </label>

            <div className="nova-top-actions">
              {/* Live MongoDB Dashboard Button */}
              <button
                onClick={() => setShowDashboard(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 border border-sky-500/25 font-black text-[12px] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                title="Live analytics dashboard"
              >
                <BarChart3 size={15} className="text-sky-600" />
                <span className="hidden sm:inline">Live Stats</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              {/* View Switcher: Grid vs List */}
              <div className="flex items-center bg-[var(--inp)] border border-[var(--brd)] rounded-xl p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "grid" ? "bg-[var(--accent)] text-white" : "text-[var(--fg4)] hover:text-[var(--fg)]"
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "list" ? "bg-[var(--accent)] text-white" : "text-[var(--fg4)] hover:text-[var(--fg)]"
                  }`}
                  title="List view"
                >
                  <List size={15} />
                </button>
              </div>

              <span className="nova-live hidden md:flex">
                <i /> {totalEndpointsCount} ONLINE
              </span>

              <button
                className="nova-icon-btn text-sky-600"
                onClick={() => setShowCommunity(true)}
                title="Open Kaalix community chat"
              >
                <Send size={16} />
              </button>

              {/* Connected Telegram User Pill */}
              {telegramUser ? (
                <button
                  onClick={() => setShowAccountModal(true)}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-emerald-500/40 text-xs transition-all cursor-pointer shadow-xs"
                  title="Your Connected Telegram Account"
                >
                  <img
                    src={telegramUser.photo_url || "/profile.jpg"}
                    onError={(e) => { e.currentTarget.src = "/profile.jpg"; }}
                    alt={telegramUser.name}
                    className="w-5 h-5 rounded-full object-cover border border-emerald-400 shrink-0"
                  />
                  <span className="font-bold text-white text-[11px] truncate max-w-[90px] hidden sm:inline">
                    {telegramUser.name}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </button>
              ) : (
                <button
                  onClick={() => setTelegramUser(null)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                  title="Connect Telegram"
                >
                  <Send size={13} />
                  <span>Connect TG</span>
                </button>
              )}

              <button className="nova-avatar-btn" onClick={() => setShowProfile(true)} title="Developer profile">
                <img
                  src="/api/telegram/avatar"
                  onError={(e) => { e.currentTarget.src = "/profile.jpg"; }}
                  alt="Profile"
                />
              </button>
            </div>
          </header>

          <div className="nova-mobile-tabs">
            <CategoryTabs categories={allCategories} active={activeCategory} onSelect={scrollTo} />
          </div>

          <div className="nova-content">
            {!search && quickFilter === "all" && (
              <section className="nova-hero">
                <div className="nova-hero-copy">
                  <div className="nova-overline">
                    <span className="flex items-center gap-1.5"><Activity size={12} className="text-emerald-400 animate-pulse" /> 67+ LIVE FREE APIS</span>
                    <b>NO API KEY REQUIRED · 100% UNRESTRICTED</b>
                  </div>
                  <h1 className="kaalix-hero-title">
                    <span className="kaalix-word">Kᴀᴀʟɪx</span>
                    <span className="kaalix-word kaalix-word-accent">FREE APIS</span>
                  </h1>
                  <p className="kaalix-hero-subtitle">
                    The ultra-fast developer workspace for AI models, video &amp; music downloaders, web search, anonymous file storage, image generation, and utility tools.
                  </p>
                  <div className="nova-hero-actions kaalix-hero-actions">
                    <button onClick={() => scrollTo(allCategories[0]?.key ?? "")}>
                      <Zap size={15} /> Explore all APIs
                    </button>
                    <button className="is-quiet" onClick={() => setQuickFilter("top-rated")}>
                      <Sparkles size={15} className="text-amber-400" /> Top Rated APIs
                    </button>
                    <button className="is-quiet" onClick={() => setShowProfile(true)}>
                      <Users size={15} /> Developer
                    </button>
                  </div>
                </div>

                <div className="nova-hero-orbit">
                  <div className="nova-orbit-ring" />
                  <div className="nova-orbit-core">
                    <strong>{totalEndpointsCount}</strong>
                    <small>ENDPOINTS</small>
                  </div>
                  <span className="nova-orbit-dot dot-a" />
                  <span className="nova-orbit-dot dot-b" />
                </div>

                <div className="nova-hero-footer">
                  <span><b>{totalEndpointsCount}</b> endpoints</span>
                  <span><b>{allCategories.length}</b> categories</span>
                  <span><b>★ {liveAvgRating || "—"}</b> {liveAvgRating ? "real rating" : "community rating"}</span>
                  <span className="nova-hero-status"><i /> All systems active</span>
                </div>
              </section>
            )}

            {/* Catalog Filter Header */}
            <div className="nova-catalog-head">
              <div>
                <span className="nova-section-kicker">
                  {quickFilter === "favorites" ? "BOOKMARKED" : quickFilter === "top-rated" ? "HIGHEST RATED" : "DIRECTORY"}
                </span>
                <h2>
                  {search
                    ? `Results for "${search}"`
                    : quickFilter === "favorites"
                    ? "Starred Favorites"
                    : quickFilter === "top-rated"
                    ? "Top Rated APIs (★ 4.0+)"
                    : "API Directory"}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {quickFilter !== "all" && (
                  <button
                    onClick={() => setQuickFilter("all")}
                    className="text-[12px] font-bold text-[var(--accent)] hover:underline"
                  >
                    View All
                  </button>
                )}
                <div className="nova-view-meta">
                  <span>{filteredCategories.reduce((n, c) => n + c.endpoints.length, 0)} routes</span>
                  <span className="nova-filter-dot" />
                </div>
              </div>
            </div>

            {/* Catalog Sections */}
            {filteredCategories.length === 0 ? (
              <div className="nova-empty">
                <Search size={32} />
                <h3>No APIs found</h3>
                <p>
                  {quickFilter === "favorites"
                    ? "You haven't starred any APIs yet. Click the star icon on any API to bookmark it."
                    : quickFilter === "top-rated"
                    ? "No top-rated APIs matched your criteria."
                    : "Try a different search term or browse by category."}
                </p>
                {quickFilter !== "all" && (
                  <button
                    onClick={() => setQuickFilter("all")}
                    className="btn-violet px-4 py-2 rounded-xl text-[13px] font-bold mt-2"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="nova-catalog">
                {filteredCategories.map((cat) => (
                  <CategorySection
                    key={cat.key}
                    cat={cat}
                    viewMode={viewMode}
                    favorites={favorites}
                    ratings={ratings}
                    onToggleFavorite={toggleFavorite}
                    onTry={setSelectedEndpoint}
                    onCopyUrl={handleCopyEndpointUrl}
                    onRate={handleRate}
                    isActive={activeCategory === cat.key}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* ── Mobile Bottom Dock ── */}
        {!splash && (
          <nav className="nova-mobile-dock">
            <button
              className={quickFilter === "all" ? "is-current" : ""}
              onClick={() => {
                setQuickFilter("all");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Search size={18} />
              <span>Explore</span>
            </button>
            <button
              onClick={() => setShowDashboard(true)}
              className="text-sky-600"
            >
              <BarChart3 size={18} />
              <span>Stats</span>
            </button>
            <button
              className={quickFilter === "top-rated" ? "is-current" : ""}
              onClick={() => setQuickFilter("top-rated")}
            >
              <Sparkles size={18} />
              <span>Top Rated</span>
            </button>
            <button
              className={quickFilter === "favorites" ? "is-current" : ""}
              onClick={() => setQuickFilter("favorites")}
            >
              <Star size={18} />
              <span>Favorites</span>
            </button>
            <button onClick={() => setShowProfile(true)}>
              <Users size={18} />
              <span>Profile</span>
            </button>
          </nav>
        )}
      </div>
    </>
  );
}
