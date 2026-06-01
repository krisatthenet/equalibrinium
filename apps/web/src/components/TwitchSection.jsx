import React, { useEffect, useState } from 'react';
import { ExternalLink, Tv2, Users, Gamepad2, Mic } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient.js';

const CHANNEL = 'W0RKBEE';
const TWITCH_URL = `https://twitch.tv/${CHANNEL}`;
const POLL_INTERVAL_MS = 60_000;

const TwitchSection = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await apiServerClient.fetch('/twitch/status');
        if (res.ok) setStatus(await res.json());
      } catch (_) {}
    };
    check();
    const id = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const parent = typeof window !== 'undefined'
    ? window.location.hostname
    : 'workbee.space';

  const embedSrc =
    `https://player.twitch.tv/?channel=${CHANNEL}&parent=${parent}&autoplay=false&muted=false`;

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9146ff] flex items-center justify-center shrink-0">
              <Tv2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-foreground">twitch.tv/W0RKBEE</h2>
                {status?.live && (
                  <span className="flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
                    Live
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">WorkBee Community Stream</p>
            </div>
          </div>
          <a
            href={TWITCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-2 bg-[#9146ff] hover:bg-[#7d2ff7] text-white font-bold text-sm px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {status?.live ? 'Watch Live' : 'Follow on Twitch'}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Embed */}
          <div className="lg:col-span-2">
            {status?.live && status.title && (
              <div className="flex items-start justify-between gap-4 mb-3">
                <p className="text-sm font-semibold text-foreground line-clamp-1">{status.title}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Users className="h-3.5 w-3.5" />
                  {status.viewerCount?.toLocaleString()} watching
                </div>
              </div>
            )}
            <div className="rounded-2xl overflow-hidden border border-border bg-muted aspect-video">
              <iframe
                src={embedSrc}
                height="100%"
                width="100%"
                allowFullScreen
                title="WorkBee Twitch Stream"
                style={{ display: 'block', border: 'none' }}
              />
            </div>
          </div>

          {/* About */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-card p-5 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">What we stream</p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#9146ff]/10 flex items-center justify-center shrink-0">
                    <Mic className="h-4 w-4 text-[#9146ff]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">WorkBee Podcast</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Industry stories, contractor interviews, and tips for home improvement professionals.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#9146ff]/10 flex items-center justify-center shrink-0">
                    <Gamepad2 className="h-4 w-4 text-[#9146ff]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Live Gaming Sessions</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Community gaming nights — join the crew, hang out, and have fun after work.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <a
              href={TWITCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-[#9146ff]/30 bg-[#9146ff]/5 hover:bg-[#9146ff]/10 p-5 transition-colors group"
            >
              <p className="text-sm font-semibold text-foreground mb-1 group-hover:text-[#9146ff] transition-colors">
                Join the community →
              </p>
              <p className="text-xs text-muted-foreground">
                Follow the channel to get notified when we go live.
              </p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TwitchSection;
