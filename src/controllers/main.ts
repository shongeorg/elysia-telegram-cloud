export const mainController = {
  home() {
    return new Response(
      `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
    <meta name="robots" content="noindex, nofollow, noarchive" />
    <title>Cloud Player — Telegram Storage</title>
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%238b5cf6'/%3E%3Cstop offset='1' stop-color='%2322d3ee'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Cpath d='M27 41V23l14-4v16' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='23' cy='42' r='5' fill='white'/%3E%3Ccircle cx='37' cy='38' r='5' fill='white'/%3E%3C/svg%3E" />
    <style>
      :root {
        --bg: #08080c;
        --panel: #101017;
        --panel-2: #15151f;
        --line: #232333;
        --txt: #ececf4;
        --dim: #8b8ba3;
        --accent: #8b5cf6;
        --accent-2: #22d3ee;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; overflow-x: hidden; }
      body {
        background:
          radial-gradient(1100px 560px at 12% -12%, rgba(139, 92, 246, 0.20), transparent 62%),
          radial-gradient(900px 480px at 100% -5%, rgba(34, 211, 238, 0.10), transparent 58%),
          var(--bg);
        color: var(--txt);
        font: 15px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        padding: 34px 20px 150px;
        -webkit-font-smoothing: antialiased;
      }
      .wrap { max-width: 940px; margin: 0 auto; }
      .top { display: flex; align-items: center; gap: 14px; margin-bottom: 26px; flex-wrap: wrap; }
      .logo {
        width: 46px; height: 46px; border-radius: 15px; flex: 0 0 auto;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        display: grid; place-items: center;
        box-shadow: 0 14px 34px rgba(139, 92, 246, 0.35);
      }
      .logo svg { width: 26px; height: 26px; }
      .titles { flex: 1 1 200px; min-width: 0; }
      .titles h1 { margin: 0; font-size: 21px; letter-spacing: -0.02em; }
      .titles p { margin: 2px 0 0; color: var(--dim); font-size: 12.5px; }
      .badge {
        font-size: 11.5px; letter-spacing: 0.04em; text-transform: uppercase;
        color: #c4b5fd; background: rgba(139, 92, 246, 0.14);
        border: 1px solid rgba(139, 92, 246, 0.32);
        padding: 6px 11px; border-radius: 999px; white-space: nowrap;
      }
      .bar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; }
      .search {
        flex: 1; position: relative;
      }
      .search input {
        width: 100%; padding: 12px 14px 12px 40px;
        background: var(--panel); border: 1px solid var(--line); border-radius: 13px;
        color: var(--txt); font-size: 14px; outline: none; transition: border-color 0.15s, box-shadow 0.15s;
      }
      .search input:focus { border-color: rgba(139, 92, 246, 0.6); box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.12); }
      .search svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 17px; height: 17px; color: var(--dim); }
      .count { color: var(--dim); font-size: 12.5px; white-space: nowrap; }

      .list { background: var(--panel); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; }
      .row {
        display: grid; grid-template-columns: 34px 1fr auto auto; gap: 14px;
        align-items: center; padding: 12px 16px; cursor: pointer;
        border-bottom: 1px solid rgba(35, 35, 51, 0.7);
        transition: background 0.14s;
      }
      .row:last-child { border-bottom: 0; }
      .row:hover { background: var(--panel-2); }
      .row.active { background: linear-gradient(90deg, rgba(139, 92, 246, 0.16), rgba(34, 211, 238, 0.04)); }
      .row.dead { opacity: 0.42; cursor: not-allowed; }
      .num { color: var(--dim); font-variant-numeric: tabular-nums; font-size: 13px; text-align: center; }
      .row.active .num { color: transparent; position: relative; }
      .eq { display: flex; gap: 2px; align-items: flex-end; height: 14px; justify-content: center; }
      .eq i { width: 3px; border-radius: 2px; background: linear-gradient(180deg, var(--accent-2), var(--accent)); height: 4px; }
      .eq.on i:nth-child(1) { animation: b 0.9s ease-in-out infinite; }
      .eq.on i:nth-child(2) { animation: b 0.9s ease-in-out 0.18s infinite; }
      .eq.on i:nth-child(3) { animation: b 0.9s ease-in-out 0.36s infinite; }
      @keyframes b { 0%, 100% { height: 4px; } 50% { height: 14px; } }
      .name { min-width: 0; }
      .name b { display: block; font-weight: 500; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .name span { display: block; color: var(--dim); font-size: 12px; margin-top: 2px; }
      .size { color: var(--dim); font-size: 12px; font-variant-numeric: tabular-nums; }
      .play {
        width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--line);
        background: var(--panel-2); color: var(--txt); display: grid; place-items: center;
        cursor: pointer; transition: all 0.15s;
      }
      .row:hover .play, .row.active .play { background: linear-gradient(135deg, var(--accent), var(--accent-2)); border-color: transparent; color: #08080c; }
      .play svg { width: 13px; height: 13px; }

      .empty { padding: 46px 20px; text-align: center; color: var(--dim); }
      .empty b { display: block; color: var(--txt); font-size: 15px; margin-bottom: 6px; }
      .skeleton { height: 58px; border-bottom: 1px solid var(--line); background: linear-gradient(90deg, #12121b, #1a1a26, #12121b); background-size: 200% 100%; animation: sh 1.2s linear infinite; }
      @keyframes sh { to { background-position: -200% 0; } }

      .player {
        position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
        background: rgba(12, 12, 18, 0.86); backdrop-filter: blur(18px);
        border-top: 1px solid var(--line);
        padding: 12px 20px 14px;
      }
      .player-in { max-width: 940px; margin: 0 auto; display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: center; min-width: 0; }
      .now { display: flex; align-items: center; gap: 13px; min-width: 0; }
      .cover {
        width: 48px; height: 48px; border-radius: 12px; flex: 0 0 auto;
        background: linear-gradient(135deg, #2a2140, #14202a);
        display: grid; place-items: center; font-weight: 600; color: #c4b5fd; font-size: 17px;
        border: 1px solid var(--line);
      }
      .now .meta { min-width: 0; flex: 1; }
      .now .meta b { display: block; font-size: 13.5px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .now .meta span { color: var(--dim); font-size: 11.5px; }
      .seekwrap { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
      .time { font-size: 11px; color: var(--dim); font-variant-numeric: tabular-nums; width: 36px; }
      .time.right { text-align: right; }
      input[type="range"] { -webkit-appearance: none; appearance: none; background: transparent; height: 16px; }
      input[type="range"]::-webkit-slider-runnable-track { height: 4px; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--accent-2)) 0/var(--p, 0%) 100% no-repeat, #2a2a3a; }
      input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 11px; height: 11px; border-radius: 50%; background: #fff; margin-top: -3.5px; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.22); }
      input[type="range"]::-moz-range-track { height: 4px; border-radius: 999px; background: #2a2a3a; }
      input[type="range"]::-moz-range-progress { height: 4px; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--accent-2)); }
      input[type="range"]::-moz-range-thumb { width: 11px; height: 11px; border: 0; border-radius: 50%; background: #fff; }
      .seek { flex: 1; cursor: pointer; min-width: 0; }
      .controls { display: flex; align-items: center; gap: 8px; }
      .ctl {
        width: 36px; height: 36px; border-radius: 10px; border: 1px solid transparent;
        background: transparent; color: var(--dim); display: grid; place-items: center; cursor: pointer;
        transition: all 0.15s;
      }
      .ctl:hover { color: var(--txt); background: var(--panel-2); }
      .ctl.on { color: var(--accent-2); }
      .ctl svg { width: 17px; height: 17px; }
      .main-ctl {
        width: 44px; height: 44px; border-radius: 50%; border: 0; color: #08080c;
        background: linear-gradient(135deg, var(--accent), var(--accent-2));
        display: grid; place-items: center; cursor: pointer;
        box-shadow: 0 8px 26px rgba(139, 92, 246, 0.4);
      }
      .main-ctl svg { width: 18px; height: 18px; }
      .main-ctl:disabled { opacity: 0.35; cursor: default; box-shadow: none; }
      .vol { display: flex; align-items: center; gap: 8px; }
      .vol svg { width: 16px; height: 16px; color: var(--dim); }
      .vol input { width: 78px; cursor: pointer; }
      .toast {
        position: fixed; bottom: 96px; left: 50%; transform: translateX(-50%);
        background: #2a1420; border: 1px solid #5b2334; color: #fecdd3;
        padding: 10px 16px; border-radius: 12px; font-size: 13px; z-index: 30;
        box-shadow: 0 12px 34px rgba(0, 0, 0, 0.45);
      }
      @media (max-width: 640px) {
        body { padding: 22px 12px 170px; }
        .row { grid-template-columns: 28px 1fr auto; padding: 10px 12px; }
        .size { display: none; }
        .player-in { grid-template-columns: 1fr; gap: 10px; }
        .controls { justify-content: center; }
        .vol { display: none; }
        .badge { display: none; }
      }
    </style>
  </head>
  <body>
    <div id="app">
      <div class="wrap">
      <div class="top">
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div class="titles">
          <h1>Cloud Player</h1>
          <p>Telegram Storage · Neon DB</p>
        </div>
        <div class="badge">{{ tracks.length }} tracks</div>
      </div>

      <div class="bar">
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input v-model="query" type="search" placeholder="Пошук треку..." />
        </div>
        <div class="count" v-if="!loading">{{ filtered.length }} / {{ tracks.length }}</div>
      </div>

      <div class="list">
        <template v-if="loading">
          <div class="skeleton" v-for="n in 5" :key="n"></div>
        </template>

        <div
          v-else
          v-for="item in filtered"
          :key="item.track.id"
          class="row"
          :class="{ active: item.i === index, dead: !item.track.download_url }"
          @click="playAt(item.i)"
        >
          <div class="num">
            <div class="eq" :class="{ on: item.i === index && playing }" v-if="item.i === index">
              <i></i><i></i><i></i>
            </div>
            <template v-else>{{ item.i + 1 }}</template>
          </div>
          <div class="name">
            <b>{{ cleanName(item.track.file_name) }}</b>
            <span>{{ item.track.mime_type }}</span>
          </div>
          <div class="size">{{ item.track.download_url ? size(item.track.file_size) : 'недоступно' }}</div>
          <button class="play" @click.stop="playAt(item.i)" :disabled="!item.track.download_url">
            <svg v-if="item.i === index && playing" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>

        <div class="empty" v-if="!loading && !filtered.length">
          <b>Нічого не знайдено</b>
          <span v-if="!tracks.length">Закинь аудіо у канал — треки з'являться тут.</span>
          <span v-else>Спробуй інший запит.</span>
        </div>
      </div>

    <div class="toast" v-if="error">{{ error }}</div>

    <div class="player">
      <div class="player-in">
        <div class="now">
          <div class="cover">{{ current ? cleanName(current.file_name).charAt(0).toUpperCase() : '♪' }}</div>
          <div class="meta">
            <b>{{ current ? cleanName(current.file_name) : 'Нічого не грає' }}</b>
            <span>{{ current ? (current.mime_type || 'audio') : 'обери трек зі списку' }}</span>
            <div class="seekwrap">
              <span class="time">{{ fmt(currentTime) }}</span>
              <input class="seek" type="range" min="0" :max="duration || 1" step="0.1" :value="currentTime" :style="{ '--p': pct + '%' }" @input="seekTo" />
              <span class="time right">{{ fmt(duration) }}</span>
            </div>
          </div>
        </div>

        <div class="controls">
          <button class="ctl" :class="{ on: shuffle }" @click="shuffle = !shuffle" title="Перемішати">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></svg>
          </button>
          <button class="ctl" @click="prev" title="Попередній">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h3v14H6z"/><path d="M20 5v14L9 12z"/></svg>
          </button>
          <button class="main-ctl" @click="toggle" :disabled="!current" title="Відтворити / пауза">
            <svg v-if="playing" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <button class="ctl" @click="next" title="Наступний">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 5h-3v14h3z"/><path d="M4 5v14l11-7z"/></svg>
          </button>
          <button class="ctl" :class="{ on: repeat }" @click="repeat = !repeat" title="Повтор">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
          </button>
          <div class="vol">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>
            <input type="range" min="0" max="1" step="0.01" v-model.number="volume" :style="{ '--p': (volume * 100) + '%' }" />
          </div>
        </div>
      </div>
    </div>
    </div>

    <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
    <script>
      const { createApp, ref, computed, watch, onMounted, onUnmounted } = Vue;

      createApp({
        setup() {
          const tracks = ref([]);
          const loading = ref(true);
          const error = ref("");
          const query = ref("");
          const index = ref(-1);
          const playing = ref(false);
          const currentTime = ref(0);
          const duration = ref(0);
          const volume = ref(0.8);
          const repeat = ref(false);
          const shuffle = ref(false);

          const audio = new Audio();
          audio.preload = "metadata";

          const current = computed(() => (index.value >= 0 ? tracks.value[index.value] : null));
          const filtered = computed(() => {
            const q = query.value.trim().toLowerCase();
            return tracks.value
              .map((track, i) => ({ track, i }))
              .filter(({ track }) => !q || (track.file_name || "").toLowerCase().includes(q));
          });
          const pct = computed(() => (duration.value ? (currentTime.value / duration.value) * 100 : 0));

          const cleanName = (name) =>
            (name || "Без назви")
              .replace(/\\.(mp3|m4a|ogg|wav|flac|aac|opus)$/i, "")
              .replace(/^\\s*\\d{1,3}[\\s._\\-]+/, "");
          const size = (bytes) => {
            if (!bytes) return "—";
            const mb = bytes / 1024 / 1024;
            return mb >= 1 ? mb.toFixed(1) + " MB" : Math.round(bytes / 1024) + " KB";
          };
          const fmt = (s) => {
            if (!isFinite(s) || s <= 0) return "0:00";
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return m + ":" + String(sec).padStart(2, "0");
          };

          // --- Web Media Session (Android notification / lock screen) ---
          const hasMediaSession = "mediaSession" in navigator;
          const msActions = [
            "play", "pause", "previoustrack", "nexttrack",
            "seekbackward", "seekforward", "seekto",
          ];
          // Статичний fallback-арт: логотип застосунку (у треків немає поля обкладинки)
          const artUrl =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%238b5cf6'/%3E%3Cstop offset='1' stop-color='%2322d3ee'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='16' fill='url(%23g)'/%3E%3Cpath d='M27 41V23l14-4v16' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ccircle cx='23' cy='42' r='5' fill='white'/%3E%3Ccircle cx='37' cy='38' r='5' fill='white'/%3E%3C/svg%3E";

          const syncMetadata = (track) => {
            if (!hasMediaSession || !("MediaMetadata" in window) || !track) return;
            try {
              navigator.mediaSession.metadata = new MediaMetadata({
                // у даних треку є лише file_name, тому title — очищена назва файлу
                title: cleanName(track.file_name),
                artist: "Cloud Player",
                album: "Telegram Storage",
                artwork: [{ src: artUrl, sizes: "64x64", type: "image/svg+xml" }],
              });
            } catch {}
          };

          const setPlaybackState = (state) => {
            if (!hasMediaSession) return;
            try { navigator.mediaSession.playbackState = state; } catch {}
          };

          const updatePositionState = () => {
            if (!hasMediaSession || typeof navigator.mediaSession.setPositionState !== "function") return;
            const d = audio.duration;
            if (!isFinite(d) || d <= 0) return;
            let pos = audio.currentTime;
            if (!isFinite(pos) || pos < 0) pos = 0;
            if (pos > d) pos = d;
            const rate = isFinite(audio.playbackRate) && audio.playbackRate > 0 ? audio.playbackRate : 1;
            try {
              navigator.mediaSession.setPositionState({ duration: d, playbackRate: rate, position: pos });
            } catch {}
          };

          const seekBy = (offset) => {
            const d = audio.duration;
            if (!isFinite(d) || d <= 0) return;
            audio.currentTime = Math.min(Math.max(audio.currentTime + offset, 0), d);
            currentTime.value = audio.currentTime;
            updatePositionState();
          };

          const registerMediaHandlers = () => {
            if (!hasMediaSession || typeof navigator.mediaSession.setActionHandler !== "function") return;
            // використовують ті самі функції плеєра, що й кнопки інтерфейсу
            const handlers = {
              play: () => { if (audio.src && audio.paused) audio.play().catch(() => {}); },
              pause: () => { if (!audio.paused) audio.pause(); },
              previoustrack: () => prev(),
              nexttrack: () => next(),
              seekbackward: (d) => seekBy(-((d && d.seekOffset) || 10)),
              seekforward: (d) => seekBy((d && d.seekOffset) || 10),
              seekto: (d) => {
                if (!d || typeof d.seekTime !== "number" || !isFinite(d.seekTime)) return;
                const dur = audio.duration;
                let t = d.seekTime;
                if (isFinite(dur) && dur > 0) t = Math.min(Math.max(t, 0), dur);
                if (t < 0) t = 0;
                audio.currentTime = t;
                currentTime.value = t;
                updatePositionState();
              },
            };
            msActions.forEach((action) => {
              try { navigator.mediaSession.setActionHandler(action, handlers[action]); } catch {}
            });
          };

          const playAt = (i) => {
            const track = tracks.value[i];
            if (!track || !track.download_url) return;
            if (i === index.value) return toggle();
            index.value = i;
            audio.src = track.download_url;
            syncMetadata(track);
            audio.play().catch(() => {
              playing.value = false;
              error.value = "Не вдалося відтворити. Перевір посилання на файл.";
              setTimeout(() => (error.value = ""), 4000);
            });
          };

          const toggle = () => {
            if (!current.value) return;
            if (audio.paused) audio.play().catch(() => {});
            else audio.pause();
          };

          const step = (dir) => {
            const total = tracks.value.length;
            if (!total) return;
            if (shuffle.value) {
              let r = index.value;
              while (r === index.value && total > 1) r = Math.floor(Math.random() * total);
              return playAt(r);
            }
            let nextIndex = index.value + dir;
            if (nextIndex >= total) nextIndex = 0;
            if (nextIndex < 0) nextIndex = total - 1;
            playAt(nextIndex);
          };
          const next = () => step(1);
          const prev = () => {
            if (audio.currentTime > 4) {
              audio.currentTime = 0;
              return;
            }
            step(-1);
          };

          const seekTo = (e) => {
            const t = Number(e.target.value);
            currentTime.value = t;
            if (isFinite(audio.duration)) audio.currentTime = t;
          };

          const onAudioPlay = () => {
            playing.value = true;
            setPlaybackState("playing");
            updatePositionState();
          };
          const onAudioPlaying = () => setPlaybackState("playing");
          const onAudioPause = () => {
            playing.value = false;
            setPlaybackState("paused");
            updatePositionState();
          };
          const onAudioTimeUpdate = () => {
            currentTime.value = audio.currentTime;
            updatePositionState();
          };
          const onAudioDuration = () => {
            duration.value = audio.duration || 0;
            updatePositionState();
          };
          const onAudioSeeked = () => {
            currentTime.value = audio.currentTime;
            updatePositionState();
          };
          const onAudioEnded = () => {
            setPlaybackState("paused");
            if (repeat.value) {
              audio.currentTime = 0;
              audio.play().catch(() => {});
            } else next();
          };
          const onAudioError = () => {
            playing.value = false;
            setPlaybackState("none");
            if (current.value) {
              error.value = "Помилка файлу: Telegram не віддав аудіо.";
              setTimeout(() => (error.value = ""), 4000);
            }
          };

          audio.addEventListener("play", onAudioPlay);
          audio.addEventListener("playing", onAudioPlaying);
          audio.addEventListener("pause", onAudioPause);
          audio.addEventListener("timeupdate", onAudioTimeUpdate);
          audio.addEventListener("loadedmetadata", onAudioDuration);
          audio.addEventListener("durationchange", onAudioDuration);
          audio.addEventListener("seeked", onAudioSeeked);
          audio.addEventListener("ended", onAudioEnded);
          audio.addEventListener("error", onAudioError);

          watch(volume, (v) => {
            audio.volume = v;
            localStorage.setItem("player-volume", String(v));
          });

          const onKey = (e) => {
            const tag = (e.target.tagName || "").toLowerCase();
            if (tag === "input" || tag === "textarea") return;
            if (e.code === "Space") { e.preventDefault(); toggle(); }
            if (e.code === "ArrowRight") seekBy(5);
            if (e.code === "ArrowLeft") seekBy(-5);
            if (e.code === "KeyN") next();
            if (e.code === "KeyP") prev();
          };

          onMounted(async () => {
            const saved = Number(localStorage.getItem("player-volume"));
            if (isFinite(saved) && saved >= 0 && saved <= 1) volume.value = saved;
            audio.volume = volume.value;
            window.addEventListener("keydown", onKey);
            registerMediaHandlers();

            try {
              const res = await fetch("/api/music");
              if (!res.ok) throw new Error("HTTP " + res.status);
              const data = await res.json();
              tracks.value = Array.isArray(data) ? data : [];
            } catch (err) {
              error.value = "Не вдалося завантажити список треків.";
              setTimeout(() => (error.value = ""), 5000);
            } finally {
              loading.value = false;
            }
          });

          onUnmounted(() => {
            window.removeEventListener("keydown", onKey);
            audio.pause();
            audio.removeEventListener("play", onAudioPlay);
            audio.removeEventListener("playing", onAudioPlaying);
            audio.removeEventListener("pause", onAudioPause);
            audio.removeEventListener("timeupdate", onAudioTimeUpdate);
            audio.removeEventListener("loadedmetadata", onAudioDuration);
            audio.removeEventListener("durationchange", onAudioDuration);
            audio.removeEventListener("seeked", onAudioSeeked);
            audio.removeEventListener("ended", onAudioEnded);
            audio.removeEventListener("error", onAudioError);
            if (hasMediaSession && typeof navigator.mediaSession.setActionHandler === "function") {
              msActions.forEach((action) => {
                try { navigator.mediaSession.setActionHandler(action, null); } catch {}
              });
              try { navigator.mediaSession.metadata = null; } catch {}
            }
          });

          return {
            tracks, loading, error, query, index, playing,
            currentTime, duration, volume, repeat, shuffle,
            current, filtered, pct,
            cleanName, size, fmt, playAt, toggle, next, prev, seekTo,
          };
        },
      }).mount("#app");
    </script>
  </body>
</html>`,
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      },
    );
  },
};
