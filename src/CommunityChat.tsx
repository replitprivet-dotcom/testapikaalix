import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Check, ImagePlus, MessageCircle, Reply, Send, Smile, X } from 'lucide-react';

type Profile = {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
  username?: string;
  telegramId?: string;
  isBot?: boolean;
};

type Message = {
  id: string;
  profileId: string;
  author: Profile;
  text: string;
  image?: string;
  replyToId?: string | null;
  createdAt: number;
};

function getProfileId() {
  const key = 'kaalix_community_profile_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export default function CommunityChat({ onClose, currentUser }: { onClose: () => void; currentUser?: any }) {
  const [profileId] = useState(() => (currentUser?.id ? `tg_${currentUser.id}` : getProfileId()));
  const [profile, setProfile] = useState<Profile>(() => ({
    id: currentUser?.id ? `tg_${currentUser.id}` : getProfileId(),
    name: currentUser?.name || 'Guest',
    avatar: currentUser?.photo_url || '/favicon-dp.jpg',
    verified: Boolean(currentUser?.verified ?? true),
    username: currentUser?.username || '',
    telegramId: currentUser?.id ? String(currentUser.id) : undefined,
  }));

  // Auto-sync Telegram account to community profile (Locked to Telegram account)
  useEffect(() => {
    if (currentUser?.name) {
      fetch('/api/community/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: currentUser.id ? `tg_${currentUser.id}` : profileId,
          name: currentUser.name,
          avatar: currentUser.photo_url || '/profile.jpg',
          telegramSync: true,
        }),
      }).catch(() => {});
    }
  }, [currentUser, profileId]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [image, setImage] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const messageById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  const load = async (scroll = false) => {
    try {
      const response = await fetch(`/api/community?profileId=${encodeURIComponent(profileId)}`, { cache: 'no-store' });
      const data = await response.json();
      if (data?.ok) {
        if (data.profile) {
          setProfile((prev) => ({
            ...data.profile,
            telegramId: currentUser?.id ? String(currentUser.id) : data.profile.telegramId,
          }));
        }
        setMessages(data.messages || []);
        if (scroll) {
          setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);
        }
      }
    } catch {}
  };

  useEffect(() => {
    load(true);
    const timer = window.setInterval(() => load(false), 2200);
    return () => window.clearInterval(timer);
  }, []);

  const readImage = (file: File, setter: (value: string) => void) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setter(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if ((!text.trim() && !image) || sending) return;
    setSending(true);
    try {
      const response = await fetch('/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          text,
          image,
          replyToId: replyTo?.id,
        }),
      });
      const data = await response.json();
      if (data?.ok) {
        setMessages((current) => [...current, data.message]);
        setText('');
        setImage('');
        setReplyTo(null);
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="community-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="community-modal" aria-label="Kaalix community group chat">
        
        {/* Header */}
        <header className="community-header">
          <div className="community-title">
            <div className="community-icon">
              <MessageCircle size={20} />
            </div>
            <div>
              <h2>Community Chat</h2>
              <p>
                <span className="community-live-dot" /> Live Group · AI Bot Active
              </p>
            </div>
          </div>

          <div className="community-header-actions">
            {/* User profile photo locked to Telegram */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10" title="Your verified Telegram account">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-7 h-7 rounded-full object-cover border border-emerald-400"
              />
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-xs font-bold text-white truncate max-w-[100px]">{profile.name}</span>
                <span className="text-[10px] text-sky-400 font-mono">
                  {profile.telegramId ? `ID: ${profile.telegramId}` : (profile.username || 'TG Member')}
                </span>
              </div>
            </div>

            <button className="community-close" onClick={onClose} title="Close Chat">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Messages Feed */}
        <div className="community-messages">
          {messages.length === 0 && (
            <div className="community-empty">
              <MessageCircle size={30} />
              <strong>Start the conversation</strong>
              <span>Send a message or reply to the AI Bot for instant answers.</span>
            </div>
          )}

          {messages.map((message) => {
            const quoted = message.replyToId ? messageById.get(message.replyToId) : null;
            const own = message.profileId === profileId;
            const isAi = message.profileId === 'kaalix_ai_bot' || message.author?.isBot;
            const userTgId = message.author.telegramId || (message.profileId.startsWith('tg_') ? message.profileId.replace('tg_', '') : '');

            return (
              <article
                className={`community-message ${own ? 'is-own' : ''} ${isAi ? 'border border-indigo-500/30 bg-indigo-950/20' : ''}`}
                key={message.id}
              >
                <img
                  className={`community-message-avatar ${isAi ? 'border-2 border-indigo-400' : ''}`}
                  src={message.author.avatar || '/favicon-dp.jpg'}
                  alt={message.author.name}
                />

                <div className="community-message-body">
                  <div className="community-message-meta flex items-center flex-wrap gap-1.5">
                    <b className={isAi ? 'text-indigo-400 flex items-center gap-1' : 'text-white'}>
                      {message.author.name}
                      {isAi && <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono">AI BOT</span>}
                    </b>

                    {/* Show User Telegram ID */}
                    {!isAi && userTgId && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        TG ID: {userTgId}
                      </span>
                    )}

                    {!isAi && message.author.username && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        {message.author.username}
                      </span>
                    )}

                    <time>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                  </div>

                  {quoted && (
                    <div className="community-quoted">
                      <Reply size={12} /> {quoted.author.name}: {quoted.text || 'Photo'}
                    </div>
                  )}

                  {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
                  {message.image && <img className="community-message-image" src={message.image} alt="Shared attachment" />}

                  <div className="community-message-tools">
                    <button
                      onClick={() => setReplyTo(message)}
                      className={isAi ? 'text-indigo-400 hover:text-indigo-300' : ''}
                    >
                      <Reply size={13} />
                      <span>{isAi ? 'Reply to AI' : 'Reply'}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Reply Bar */}
        {replyTo && (
          <div className="community-reply-bar flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Reply size={14} className={replyTo.author?.isBot ? 'text-indigo-400' : 'text-sky-400'} />
              <span className="text-xs truncate">
                Replying to <b>{replyTo.author.name}</b>
                {replyTo.author?.isBot ? ' (AI will reply): ' : ': '}
                {replyTo.text || 'Attachment'}
              </span>
            </div>
            <button onClick={() => setReplyTo(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Attachment Preview */}
        {image && (
          <div className="community-attachment">
            <img src={image} alt="Attachment preview" />
            <button onClick={() => setImage('')}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Composer */}
        <footer className="community-composer">
          <button className="community-tool" onClick={() => fileRef.current?.click()} title="Send photo">
            <ImagePlus size={19} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => event.target.files?.[0] && readImage(event.target.files[0], setImage)}
          />

          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder={replyTo?.author?.isBot ? "Reply to Kaalix AI..." : "Write a message... (Reply to AI bot for AI help)"}
            maxLength={1200}
          />

          <button className="community-tool" title="Emoji" onClick={() => setText((value) => `${value} 🙂`)}>
            <Smile size={18} />
          </button>

          <button
            disabled={sending || (!text.trim() && !image)}
            className="community-send"
            onClick={sendMessage}
          >
            <Send size={17} />
          </button>
        </footer>

        <div className="community-footnote text-[11px] text-gray-500 text-center py-1">
          Profile is permanently synced with your Telegram account • To talk with AI, reply to AI Bot
        </div>

      </section>
    </div>
  );
}
