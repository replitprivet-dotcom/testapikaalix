import { useState, useEffect } from "react";
import {
  Send, CheckCircle2, ShieldCheck, ExternalLink,
  Loader2, ArrowRight, Check, Sparkles, RefreshCw, LogOut, Sun
} from "lucide-react";

export interface TelegramUser {
  id: string | number;
  first_name: string;
  last_name?: string;
  name: string;
  username: string;
  photo_url: string;
  verified: boolean;
  verifiedAt: number;
  joinedChannels?: string[];
}

interface TelegramAuthGateProps {
  onSuccess: (user: TelegramUser) => void;
}

export function TelegramAuthGate({ onSuccess }: TelegramAuthGateProps) {
  const [token, setToken] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [botUrl, setBotUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [botStarted, setBotStarted] = useState<boolean>(false);
  const [capturedUser, setCapturedUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successUser, setSuccessUser] = useState<TelegramUser | null>(null);

  // 1. Initialize session on mount
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        setLoading(true);
        const res = await fetch("/api/telegram-auth/init");
        const data = await res.json();
        if (mounted && data?.ok && data.session) {
          setToken(data.session.token);
          setCode(data.session.code);
          setBotUrl(data.session.botUrl);
        }
      } catch {
        if (mounted) setErrorMsg("Failed to connect to authentication server.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  // 2. Poll session status every 2 seconds
  useEffect(() => {
    if (!token || successUser) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/telegram-auth/status?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (data?.ok && data.session) {
          if (data.session.user) {
            setCapturedUser(data.session.user);
            setBotStarted(true);
          }
          if (data.session.status === "verified" && data.session.user) {
            handleComplete(data.session.user);
          }
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [token, successUser]);

  const handleComplete = (user: TelegramUser) => {
    setSuccessUser(user);
    try {
      localStorage.setItem("kaalix_tg_session_v3", JSON.stringify(user));
    } catch {}
    setTimeout(() => {
      onSuccess(user);
    }, 1500);
  };

  const handleCheckVerification = async () => {
    setVerifying(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/telegram-auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          code,
        }),
      });
      const data = await res.json();
      if (data?.ok && data.user) {
        handleComplete(data.user);
      } else {
        setErrorMsg(data?.error || "Pehle bot ko start karein aur channels join karke verification dabayein.");
      }
    } catch {
      setErrorMsg("Verification check failed. Please make sure you started the bot in Telegram.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto bg-slate-900/40 backdrop-blur-md">
      {/* Day Mode Card */}
      <div className="w-full max-w-md my-auto rounded-3xl bg-white border border-slate-200/90 shadow-[0_25px_60px_rgba(15,23,42,0.16)] overflow-hidden text-slate-800 relative">
        
        {/* Soft Day Mode Gradient Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-gradient-to-b from-sky-100/80 via-blue-50/50 to-transparent blur-xl pointer-events-none" />

        {successUser ? (
          /* Day Mode Success Screen */
          <div className="p-8 sm:p-10 flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-400 relative z-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-emerald-500 p-0.5 bg-emerald-50 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                <img
                  src={successUser.photo_url || "/profile.jpg"}
                  onError={(e) => { e.currentTarget.src = "/profile.jpg"; }}
                  alt={successUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full shadow-md">
                <Check size={14} strokeWidth={3} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold tracking-wide uppercase">
                <ShieldCheck size={13} className="text-emerald-600" /> Account Verified
              </div>
              <h2 className="text-xl font-black text-slate-900">Welcome, {successUser.name}!</h2>
              <p className="text-xs text-slate-500">
                {successUser.username ? successUser.username : `ID: ${successUser.id}`} • Full Access Unlocked
              </p>
            </div>

            <button
              onClick={() => onSuccess(successUser)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm shadow-[0_10px_25px_rgba(37,99,235,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Enter Workspace</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* Day Mode Login Gate */
          <div className="p-6 sm:p-8 space-y-6 relative z-10">
            
            {/* Brand & Title */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-[0_10px_25px_rgba(14,165,233,0.3)]">
                  <Send size={28} className="text-white -rotate-12 translate-x-0.5" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500" />
                </span>
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Connect with Telegram
                </h1>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Website access karne ke liye pehle bot ko start karein. Bot aapke channels verify karke account activate karega.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 size={26} className="animate-spin text-sky-500" />
                <span className="text-xs font-medium">Preparing connection session...</span>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Main Action Button */}
                <a
                  href={botUrl || "https://t.me/kaalix_own_bot"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-[0_10px_25px_rgba(37,99,235,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Send size={17} />
                  <span>Start Bot on Telegram</span>
                  <ExternalLink size={14} className="opacity-80" />
                </a>

                {/* Status Box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    {botStarted ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                      </span>
                    )}
                    <span className="text-slate-700 font-medium">
                      {botStarted ? (
                        capturedUser?.name ? `Bot started by ${capturedUser.name}` : "Bot connected! Tap verify in Telegram."
                      ) : (
                        "Waiting for bot authorization..."
                      )}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-bold shadow-2xs">
                    {code}
                  </span>
                </div>

                {/* Secondary Check Button */}
                <button
                  onClick={handleCheckVerification}
                  disabled={verifying}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {verifying ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-sky-600" />
                      <span>Checking verification status...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={13} className="text-sky-600" />
                      <span>I Have Verified on Bot</span>
                    </>
                  )}
                </button>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-center animate-in fade-in font-medium">
                    {errorMsg}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
              Kᴀᴀʟɪx Free APIs • Bot: <b>@kaalix_own_bot</b>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// User Profile Details Modal (Day Mode)
export function TelegramAccountModal({
  user,
  onClose,
  onLogout,
}: {
  user: TelegramUser;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-200/90 p-6 space-y-5 text-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.18)] relative animate-in fade-in zoom-in-95">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Telegram Account</h3>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <img
            src={user.photo_url || "/profile.jpg"}
            onError={(e) => { e.currentTarget.src = "/profile.jpg"; }}
            alt={user.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
          />
          <div className="min-w-0 flex-1 leading-tight">
            <h4 className="font-bold text-sm text-slate-900 truncate flex items-center gap-1">
              <span>{user.name}</span>
            </h4>
            <div className="text-[11px] text-sky-600 font-mono mt-0.5">
              {user.username || `ID: ${user.id}`}
            </div>
            <div className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Channels Verified (Active)</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
          <div className="flex justify-between">
            <span>Membership Status:</span>
            <span className="text-emerald-600 font-bold">Verified Member</span>
          </div>
          <div className="flex justify-between">
            <span>Telegram ID:</span>
            <span className="text-slate-900 font-mono font-bold">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Auto-Logout Protection:</span>
            <span className="text-sky-600 font-mono font-medium">ACTIVE (3 Channels)</span>
          </div>
        </div>

        <div className="pt-1 flex gap-2">
          <button
            onClick={onLogout}
            className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut size={13} />
            <span>Disconnect</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
