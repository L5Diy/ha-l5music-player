/* LaowuDIY L5Music — app.js v1
 * Single entry point. Boots desktop or mobile app based on window width.
 * IS_MOBILE is set by the inline script in index.html before this loads.
 */
'use strict';
const APP_VERSION = 'b1';
/* ── L5 MODAL SYSTEM (replaces window.prompt/confirm) ──────────────── */
function _l5modal(title, bodyHtml, buttons) {
  return new Promise(resolve => {
    const ov = document.getElementById('l5-modal-overlay');
    const titleEl = document.getElementById('l5-modal-title');
    const bodyEl = document.getElementById('l5-modal-body');
    const actEl = document.getElementById('l5-modal-actions');
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    actEl.innerHTML = '';
    const close = (val) => { ov.style.display = 'none'; resolve(val); };
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.textContent = b.label;
      btn.className = 'btn btn-chip';
      btn.style.cssText = b.style || '';
      btn.addEventListener('click', () => close(b.value()));
      actEl.appendChild(btn);
    });
    ov.style.display = 'flex';
    const firstInput = bodyEl.querySelector('input');
    if (firstInput) firstInput.focus();
  });
}
function l5confirm(msg) {
  return _l5modal('Confirm', '<p style="font-size:0.9rem;color:var(--text-1);margin:0">' + msg + '</p>', [
    { label: 'Cancel', value: () => false, style: 'color:var(--muted);border-color:var(--stroke)' },
    { label: 'Yes', value: () => true, style: 'color:var(--accent);border-color:var(--accent)' }
  ]);
}
function l5prompt(title, label, opts) {
  opts = opts || {};
  const inputHtml = '<label style="font-size:0.85rem;color:var(--text-1);display:block;margin-bottom:6px">' + (label||'') + '</label>' +
    '<input id="l5-modal-input" type="' + (opts.type||'text') + '" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--stroke);background:var(--bg-2);color:var(--text-0);font-size:0.9rem;outline:none;box-sizing:border-box" ' + (opts.placeholder ? 'placeholder="'+opts.placeholder+'"' : '') + ' />';
  return _l5modal(title, inputHtml, [
    { label: 'Cancel', value: () => null, style: 'color:var(--muted);border-color:var(--stroke)' },
    { label: opts.submitLabel || 'OK', value: () => document.getElementById('l5-modal-input').value, style: 'color:var(--accent);border-color:var(--accent)' }
  ]);
}
function l5promptTwo(title, label1, label2, opts) {
  opts = opts || {};
  const html = '<div style="display:flex;flex-direction:column;gap:10px">' +
    '<div><label style="font-size:0.85rem;color:var(--text-1);display:block;margin-bottom:4px">' + label1 + '</label><input id="l5-modal-in1" type="text" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--stroke);background:var(--bg-2);color:var(--text-0);font-size:0.9rem;outline:none;box-sizing:border-box" /></div>' +
    '<div><label style="font-size:0.85rem;color:var(--text-1);display:block;margin-bottom:4px">' + label2 + '</label><input id="l5-modal-in2" type="' + (opts.type2||'password') + '" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--stroke);background:var(--bg-2);color:var(--text-0);font-size:0.9rem;outline:none;box-sizing:border-box" /></div></div>';
  return _l5modal(title, html, [
    { label: 'Cancel', value: () => null, style: 'color:var(--muted);border-color:var(--stroke)' },
    { label: opts.submitLabel || 'OK', value: () => ({ v1: document.getElementById('l5-modal-in1').value, v2: document.getElementById('l5-modal-in2').value }), style: 'color:var(--accent);border-color:var(--accent)' }
  ]);
}
// Adapter-based API — configured in Settings
function l5streamUrl(id) { return MusicAdapter.getStreamUrl(id); }
function l5coverUrl(id) { return MusicAdapter.getCoverUrl(id); }
async function l5get(path) {
  // Legacy wrapper — routes through adapter
  if (path.startsWith('/random')) return { songs: await MusicAdapter.getRandomSongs(parseQuery(path)) };
  if (path.startsWith('/songs/')) { const id = path.split('/')[2]; return { song: await MusicAdapter.getSong(id) }; }
  if (path === '/songs' || path.startsWith('/songs?')) return { songs: await MusicAdapter.getSongs(parseQuery(path)) };
  if (path === '/artists') return { artists: await MusicAdapter.getArtists() };
  if (path === '/albums') return { albums: await MusicAdapter.getAlbums() };
  if (path === '/playlists' || path === '/playlists?') return { playlists: (await MusicAdapter.getPlaylists()).map(p => ({id:p.id,name:p.name,count:p.count})) };
  if (path.startsWith('/playlists/')) { const id = path.split('/')[2]; const pl = await MusicAdapter.getPlaylist(id); return { ok:true, playlist:pl }; }
  if (path.startsWith('/blocked')) return { blocked: await MusicAdapter.getBlocked() };
  if (path.startsWith('/shuffle-log')) return { log: await MusicAdapter.getShuffleLog() };
  if (path === '/rescan') return MusicAdapter.rescan();
  if (path === '/me') return await MusicAdapter.getMe();
  throw new Error('Unknown l5get path: ' + path);
}
function parseQuery(path) {
  const opts = {};
  const q = path.split('?')[1];
  if (q) q.split('&').forEach(p => { const [k,v] = p.split('='); opts[k] = decodeURIComponent(v); });
  if (opts.size) opts.size = parseInt(opts.size);
  return opts;
}
function l5token() { return ''; }
function l5headers() { return { 'Content-Type': 'application/json' }; }

/* ── Custom dialog helpers (replace native confirm/prompt/alert) ── */
function showConfirm(message, okLabel = 'Confirm') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    overlay.innerHTML = `
      <div class="custom-dialog">
        <div class="custom-dialog-msg">${message}</div>
        <div class="custom-dialog-actions">
          <button class="custom-dialog-ok">${okLabel}</button>
          <button class="custom-dialog-cancel">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    const cleanup = (result) => { overlay.classList.remove('open'); setTimeout(() => overlay.remove(), 180); resolve(result); };
    overlay.querySelector('.custom-dialog-ok').addEventListener('click', () => cleanup(true));
    overlay.querySelector('.custom-dialog-cancel').addEventListener('click', () => cleanup(false));
    overlay.addEventListener('click', e => { if (e.target === overlay) cleanup(false); });
  });
}

function showPrompt(message, defaultValue = '') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    overlay.innerHTML = `
      <div class="custom-dialog">
        <div class="custom-dialog-msg">${message}</div>
        <input class="custom-dialog-input" type="text" value="${defaultValue.replace(/"/g, '&quot;')}" />
        <div class="custom-dialog-actions">
          <button class="custom-dialog-cancel">Cancel</button>
          <button class="custom-dialog-ok">OK</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    const input = overlay.querySelector('.custom-dialog-input');
    setTimeout(() => { input.focus(); input.select(); }, 50);
    const cleanup = (result) => { overlay.classList.remove('open'); setTimeout(() => overlay.remove(), 180); resolve(result); };
    overlay.querySelector('.custom-dialog-ok').addEventListener('click', () => cleanup(input.value));
    overlay.querySelector('.custom-dialog-cancel').addEventListener('click', () => cleanup(null));
    overlay.addEventListener('click', e => { if (e.target === overlay) cleanup(null); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') cleanup(input.value); if (e.key === 'Escape') cleanup(null); });
  });
}

function showAlert(message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'custom-dialog-overlay';
    overlay.innerHTML = `
      <div class="custom-dialog">
        <div class="custom-dialog-msg">${message}</div>
        <div class="custom-dialog-actions">
          <button class="custom-dialog-ok">OK</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    const cleanup = () => { overlay.classList.remove('open'); setTimeout(() => overlay.remove(), 180); resolve(); };
    overlay.querySelector('.custom-dialog-ok').addEventListener('click', cleanup);
    overlay.addEventListener('click', e => { if (e.target === overlay) cleanup(); });
  });
}
/* ── End custom dialogs ── */

/* ── SHARED BLOCKED SONGS ─────────────────────────────────
 * Uses l5user from localStorage as user key.
 */
let blockedSongIds = new Set();
async function loadBlockedSongs() {
  const user = localStorage.getItem('l5user') || '';
  if (!user) return;
  try {
    const resp = { ok: true, json: async () => ({ blocked: await MusicAdapter.getBlocked() }) };
    if (!resp.ok) return;
    const data = await resp.json();
    if (data.ok && Array.isArray(data.blocked)) blockedSongIds = new Set(data.blocked.map(String));
  } catch(e) {}
}
async function blockSong(id) {
const user = localStorage.getItem('l5user') || '';
const sid = String(id);
  try { await MusicAdapter.blockSong(sid); blockedSongIds.add(sid); } catch(e) {}
}
async function unblockSong(id) {
const user = localStorage.getItem('l5user') || '';
  const sid = String(id);
  try { await MusicAdapter.unblockSong(sid); blockedSongIds.delete(sid); } catch(e) {}  
}
function isSongBlocked(id) { return blockedSongIds.has(String(id)); }
async function syncRole() {
  try {
    const r = { ok:true, json: async()=>({ok:true,...await MusicAdapter.getMe()}) };
    const d = await r.json();
    if (d.ok && d.role) localStorage.setItem('l5role', d.role);
    if (d.isOwner) localStorage.setItem('l5_isOwner', '1'); else localStorage.removeItem('l5_isOwner');
  } catch(e) {}
}

/* ── SHUFFLE LOG ──────────────────────────────────────────
 * Per-user fair shuffle: every song plays once per cycle.
 * played = Set of song IDs already played this cycle.
 */
let shufflePlayedIds = new Set();
async function loadShuffleLog() {
  const user = localStorage.getItem('l5user') || '';
  if (!user) return;
  try {
    const resp = { ok: true, json: async () => ({ log: await MusicAdapter.getShuffleLog() }) };
    if (!resp.ok) return;
    const data = await resp.json();
    if (data.ok && Array.isArray(data.played)) shufflePlayedIds = new Set(data.played);
  } catch(e) {}
}
async function logShuffleSong(id, totalSongs) {
  const user = localStorage.getItem('l5user') || '';
  if (!user) return;
  shufflePlayedIds.add(id);
  try {
    const resp = { ok: true, json: async () => await MusicAdapter.logShuffle(id, totalSongs) };
    const data = await resp.json();
    if (data.reset) shufflePlayedIds = new Set();
  } catch(e) {}
}
async function resetShuffleLog() {
  const user = localStorage.getItem('l5user') || '';
  if (!user) return;
  shufflePlayedIds = new Set();
  try { await MusicAdapter.clearShuffleLog(); } catch(e) {}
}
function pickUnplayedSong(songsList) {
  const eligible = [...songsList.keys()].filter(i => !isSongBlocked(songsList[i].id) && !shufflePlayedIds.has(songsList[i].id));
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}
async function buildShuffleQueue(songsList) {
  const eligible = [...songsList.keys()].filter(i => !isSongBlocked(songsList[i].id) && !shufflePlayedIds.has(songsList[i].id));
  for (let i = eligible.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [eligible[i], eligible[j]] = [eligible[j], eligible[i]]; }
  return eligible;
}


if (window.IS_MOBILE) {
  initMobile();
} else {
  initDesktop();
}

/* ═══════════════════════════════════════════════════════════════════
   MOBILE APP  (was pwa.js)
   ═══════════════════════════════════════════════════════════════════ */
function initMobile() {

  /* ── AUTH (disabled for cast frontend) ──────────────── */

  function showInputModal(title, defaultValue = '') {
    return new Promise(resolve => {
      const modal = document.createElement('div');
      modal.className = 'pwa-modal';
      modal.innerHTML = `
        <div class="pwa-modal-backdrop"></div>
        <div class="pwa-modal-sheet">
          <div class="pwa-modal-title">${title}</div>
          <input class="pwa-modal-input" type="text" value="${String(defaultValue).replace(/"/g, '&quot;')}" />
          <button class="pwa-modal-btn-primary" id="_modal-ok">OK</button>
          <button class="pwa-modal-btn-ghost" id="_modal-cancel">Cancel</button>
        </div>`;
      document.body.appendChild(modal);
      const input = modal.querySelector('input');
      input.focus(); input.select();
      modal.querySelector('#_modal-ok').addEventListener('click', () => {
        const val = input.value.trim();
        document.body.removeChild(modal);
        resolve(val || null);
      });
      modal.querySelector('#_modal-cancel').addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(null);
      });
      modal.querySelector('.pwa-modal-backdrop').addEventListener('click', () => {
        document.body.removeChild(modal);
        resolve(null);
      });
    });
  }

  function showConfirmModal(message, confirmLabel = 'Delete') {
    return new Promise(resolve => {
      const safe = String(message).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      const modal = document.createElement('div');
      modal.className = 'pwa-modal';
      modal.innerHTML = `
        <div class="pwa-modal-backdrop"></div>
        <div class="pwa-modal-sheet">
          <div class="pwa-modal-title" style="font-size:16px;font-weight:600">${safe}</div>
          <button class="pwa-modal-btn-primary pwa-modal-btn-danger" id="_modal-ok">${confirmLabel}</button>
          <button class="pwa-modal-btn-ghost" id="_modal-cancel">Cancel</button>
        </div>`;
      document.body.appendChild(modal);
      modal.querySelector('#_modal-ok').addEventListener('click', () => { document.body.removeChild(modal); resolve(true); });
      modal.querySelector('#_modal-cancel').addEventListener('click', () => { document.body.removeChild(modal); resolve(false); });
      modal.querySelector('.pwa-modal-backdrop').addEventListener('click', () => { document.body.removeChild(modal); resolve(false); });
    });
  }
  window.showConfirmModal = showConfirmModal;

  /* ── BLOCKED SONGS API ─────────────────────────────────── */
  // loadBlockedSongs, blockSong, unblockSong, isSongBlocked are module-level shared functions
  function updateBlockBtn() {
    const btn = document.getElementById('mini-block-btn');
    if (!btn) return;
    const song = currentQueue[currentIndex];
    const blocked = song && isSongBlocked(song.id);
    btn.classList.toggle('active', !!blocked);
    btn.title = blocked ? 'Unblock Song' : 'Block Song';
    btn.setAttribute('aria-pressed', String(!!blocked));
    btn.style.color = blocked ? '#ff5252' : '#e57373';
  }
  function updateLsBlockBtn() {
    const btn = document.getElementById('ls-block-btn');
    if (!btn) return;
    const song = currentQueue[currentIndex];
    const blocked = song && isSongBlocked(song.id);
    btn.classList.toggle('active', !!blocked);
    btn.title = blocked ? 'Unblock Song' : 'Block Song';
    btn.setAttribute('aria-pressed', String(!!blocked));
    btn.style.color = blocked ? '#ff5252' : '#e57373';
  }

  /* ── L5CORE API (mobile) ──────────────────────────────── */
  function streamUrl(id) { return l5streamUrl(id); }
  function coverUrl(id) { return l5coverUrl(id); }

  /* ── STATE ─────────────────────────────────────────────── */
  let songs = [], playlists = [];
  let currentQueue = [], currentIndex = -1;
  let currentView = 'now-playing';
  let isSeeking = false;
  let searchDebounce = null;
  let folderSubView = 'songs';
  let selectedTrackIds = new Set();
  let currentPlaylistIndex = -1;

  /* ── AUDIO ─────────────────────────────────────────────── */
  const audio = AudioProxy;
  audio.addEventListener('timeupdate', () => { if (!isSeeking) syncProgress(); });
  audio.addEventListener('loadedmetadata', () => { syncProgress(); updateNowPlayingMeta(); });
  audio.addEventListener('ended', () => playNext(true));
  audio.addEventListener('play', () => setPlayState(true));
  audio.addEventListener('pause', () => setPlayState(false));

  /* ── DOM REFS ──────────────────────────────────────────── */
  const mainContent    = document.getElementById('main-content');
  const topbarDefault  = document.getElementById('topbar-default');
  const topbarSearch   = document.getElementById('topbar-search');
  const btnSearch      = document.getElementById('btn-search');
  const btnSearchClose = document.getElementById('btn-search-close');
  const searchInput    = document.getElementById('pwa-search-input');

  const toast          = document.getElementById('toast');

  /* ── VOLUME OVERLAY ────────────────────────────────────── */
  let volDismissTimer = null;
  let _volLastToggle=0;
  function toggleVolSlider() {
    const now=Date.now(); if(now-_volLastToggle<150){return;} _volLastToggle=now;
    const isLs = window.innerWidth > window.innerHeight;
    if (isLs) {
      // Landscape: inline horizontal slider to the right of vol button
      const el = document.getElementById('ls-vol-overlay');
      if (!el) return;
      const btn = document.getElementById('ls-vol-btn');
      if (!el.classList.contains('hidden')) {
        el.classList.add('hidden'); clearTimeout(volDismissTimer); btn?.blur(); return;
      }
      if (btn) {
        const r = btn.getBoundingClientRect();
        el.style.right = '';
        el.style.left = (r.right + 8) + 'px';
        el.style.top = Math.round(r.top + r.height/2 - 2) + 'px';
      }
      el.classList.remove('hidden');
      const sl = document.getElementById('ls-vol-inline-slider');
      if (sl) { const v=Math.round(audio.volume*100); sl.value=v; sl.style.setProperty('--vol',v); }
      clearTimeout(volDismissTimer);
      volDismissTimer=setTimeout(()=>{ el.classList.add('hidden'); btn?.blur(); },3000);
    } else {
      // Portrait: vertical overlay
      const el = document.getElementById('vol-overlay');
      if (!el) return;
      const btn = document.getElementById('mini-vol-btn');
      if (!el.classList.contains('hidden')) {
        el.classList.add('hidden'); clearTimeout(volDismissTimer); btn?.blur(); return;
      }
      if (btn) {
        const r=btn.getBoundingClientRect();
        const ow=68; const rVal=Math.max(4, window.innerWidth - r.right + r.width/2 - ow/2);
        el.style.right=rVal+'px'; el.style.left=''; el.style.top=''; el.style.bottom=(window.innerHeight - r.top + 8)+'px';
      }
      el.classList.remove('hidden');
      const sl=document.getElementById('vol-slider');
      if (sl) { const v=Math.round(audio.volume*100); sl.value=v; sl.style.setProperty('--vol',v); }
      clearTimeout(volDismissTimer);
      volDismissTimer=setTimeout(()=>{ el.classList.add('hidden'); btn?.blur(); },3000);
    }
  }
  window.toggleVolSlider=toggleVolSlider;
  document.addEventListener('input', e => {
    if (e.target.id === 'vol-slider' || e.target.id === 'ls-vol-inline-slider') {
      const v = parseInt(e.target.value);
      audio.volume = v / 100;
      localStorage.setItem('pwa_volume', audio.volume);
      e.target.style.setProperty('--vol', v);
      const port = document.getElementById('vol-slider');
      if (port) { port.value = v; port.style.setProperty('--vol', v); }
      clearTimeout(volDismissTimer);
      volDismissTimer = setTimeout(() => document.getElementById('vol-overlay')?.classList.add('hidden'), 3000);
    }
  });

  /* ── TOAST ─────────────────────────────────────────────── */
  let toastTimer;
  function showToast(msg, ms = 2200) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
  }


  /* ── SEARCH ────────────────────────────────────────────── */
  btnSearch.addEventListener('click', () => {
    topbarDefault.classList.add('hidden');
    topbarSearch.classList.remove('hidden');
    searchInput.focus();
  });
  btnSearchClose.addEventListener('click', () => {
    topbarDefault.classList.remove('hidden');
    topbarSearch.classList.add('hidden');
    searchInput.value = '';
    if (currentView === 'search') navigateTo('now-playing');
  });
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      const q = searchInput.value.trim();
      if (q.length >= 2) navigateTo('search', { query: q });
    }, 250);
  });

  /* ── SHUFFLE ───────────────────────────────────────────── */
  document.getElementById('mini-block-btn')?.addEventListener('click', async () => {
    const song = currentQueue[currentIndex];
    if (!song) return;
    if (isSongBlocked(song.id)) { await unblockSong(song.id); showToast('Unblocked'); }
    else {
      const title = song.title || 'this song';
      if (!(await showConfirm(`Block "${title}"?`, 'Block'))) return;
      await blockSong(song.id); showToast('Blocked'); playNext();
    }
    updateBlockBtn();
    updateLsBlockBtn();
    updateDesktopBlockBtn();
  });
  document.getElementById('mini-shuffle-btn')?.addEventListener('click', async () => {
    if (!songs.length) { showToast('Library not ready'); return; }
    let queue = await buildShuffleQueue(songs);
    if (queue.length === 0) { await resetShuffleLog(); queue = await buildShuffleQueue(songs); }
    if (queue.length === 0) { showToast('No songs available'); return; }
    currentQueue = queue.map(i => songs[i]);
    currentIndex = 0;
    playSong(0, false);
    showToast('Shuffled ' + currentQueue.length + ' songs');
  });


  /* ── BOTTOM NAV ────────────────────────────────────────── */
  document.querySelectorAll('.bnav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });

  /* ── MINI PLAYER ───────────────────────────────────────── */
  document.getElementById('mini-play')?.addEventListener('click', togglePlay);
  document.getElementById('mini-prev')?.addEventListener('click', playPrev);
  document.getElementById('mini-next')?.addEventListener('click', () => playNext());
  document.getElementById('mini-thumb')?.addEventListener('click', () => navigateTo('now-playing'));
  document.getElementById('mini-title')?.addEventListener('click', () => navigateTo('now-playing'));
  const miniSlider = document.getElementById('mini-progress-slider');
  if (miniSlider) {
    miniSlider.addEventListener('pointerdown', () => { isSeeking = true; });
    miniSlider.addEventListener('pointerup', () => { isSeeking = false; audio.currentTime = parseFloat(miniSlider.value); });
    miniSlider.addEventListener('input', () => {
      const d = audio.duration;
      if (d && isFinite(d)) miniSlider.style.setProperty('--pct', ((parseFloat(miniSlider.value) / d) * 100) + '%');
    });
  }
  function setActiveNav(view) {
    const canonical = {
      'now-playing':'now-playing','playlists':'playlists','playlist-detail':'playlists',
      'folders':'folders','folder-songs':'folders','folder-artists':'folders',
      'folder-albums':'folders','folder-blocked':'folders','artist-songs':'folders','album-songs':'folders',
      'settings':'settings','search':'now-playing',
    }[view] || 'now-playing';
    document.querySelectorAll('.bnav-item').forEach(b => b.classList.toggle('active', b.dataset.view === canonical));
  }

  /* ── PLAYBACK ──────────────────────────────────────────── */
  function playSong(index, autoAdvance = false) {
    if (index < 0 || index >= currentQueue.length) return;
    currentIndex = index;
    const song = currentQueue[currentIndex];
    logShuffleSong(song.id, songs.length);
    localStorage.setItem('l5_last_song', String(song.id));
    // Media Session — set BEFORE play for iOS
    if ("mediaSession" in navigator) {
      const artUrl = location.origin + coverUrl(song.coverArt || song.id);
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title || "Unknown", artist: song.artist || "", album: song.album || "",
        artwork: artUrl ? [{ src: artUrl, sizes: "96x96", type: "image/jpeg" },{ src: artUrl, sizes: "256x256", type: "image/jpeg" },{ src: artUrl, sizes: "512x512", type: "image/jpeg" }] : []
      });
      navigator.mediaSession.setActionHandler("play", () => { const t = audio.currentTime; audio.play().catch(() => { audio.load(); audio.currentTime = t; audio.play(); }); });
      navigator.mediaSession.setActionHandler("pause", () => { audio.pause(); });
      navigator.mediaSession.setActionHandler("previoustrack", () => playPrev());
      navigator.mediaSession.setActionHandler("nexttrack", () => playNext());
    }
    audio.src = streamUrl(song.id);
    document.getElementById("mobile-app")?.classList.add("has-track");
    audio.load();
    audio.play().catch(e => console.error('Play error', e));
    if (!autoAdvance) navigateTo('now-playing');
    else { updateNowPlayingMeta(); renderQueueList(); }
  }
  function togglePlay() {
    if (!audio.src) { if (currentQueue.length) playSong(currentIndex >= 0 ? currentIndex : 0); return; }
    if (audio.paused) { const t = audio.currentTime; audio.play().catch(() => { audio.load(); audio.currentTime = t; audio.play(); }); } else { audio.pause(); }
  }
  function playNext(autoAdvance = false) {
    if (!currentQueue.length) return;
    let next = (currentIndex + 1) % currentQueue.length;
    let attempts = 0;
    while (isSongBlocked(currentQueue[next].id) && attempts < currentQueue.length) {
      next = (next + 1) % currentQueue.length;
      attempts++;
    }
    playSong(next, autoAdvance);
  }
  function playPrev() {
    if (!currentQueue.length) return;
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    playSong((currentIndex - 1 + currentQueue.length) % currentQueue.length, true);
  }
  function setPlayState(playing) {
    document.querySelectorAll('.play-icon').forEach(el => el.classList.toggle('hidden', playing));
    document.querySelectorAll('.pause-icon').forEach(el => el.classList.toggle('hidden', !playing));
  }

  /* ── PROGRESS ──────────────────────────────────────────── */
  function syncProgress() {
    const t = audio.currentTime;
    const d = audio.duration;
    const slider = document.getElementById('np-progress-slider');
    const curEl  = document.getElementById('np-current-time');
    const durEl  = document.getElementById('np-duration');
    if (slider && d && isFinite(d)) {
      slider.max = d; slider.value = t;
      slider.style.setProperty('--pct', ((t / d) * 100) + '%');
    }
    if (curEl) curEl.textContent = fmtTime(t);
    if (durEl) durEl.textContent = fmtTime(d);
    const lsSliderEl = document.getElementById('ls-progress-slider');
    const lsCurrentEl = document.getElementById('ls-current-time');
    const lsDurEl = document.getElementById('ls-duration');
    if (lsSliderEl && d && isFinite(d)) { lsSliderEl.max = d; lsSliderEl.value = t; lsSliderEl.style.setProperty('--pct', (t/d*100)+'%'); }
    if (lsCurrentEl) lsCurrentEl.textContent = fmtTime(t);
    if (lsDurEl) lsDurEl.textContent = fmtTime(d);
    // mini-player
    const ms = document.getElementById('mini-progress-slider');
    const mc = document.getElementById('mini-current-time');
    const md = document.getElementById('mini-duration');
    if (ms && d && isFinite(d)) { ms.max = d; ms.value = t; ms.style.setProperty('--pct', (t/d*100)+'%'); }
    if (mc) mc.textContent = fmtTime(t);
    if (md) md.textContent = fmtTime(d);
  }
  function fmtTime(s) {
    if (!s || !isFinite(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  /* ── NOW PLAYING META ──────────────────────────────────── */
  function updateNowPlayingMeta() {
    const song = currentQueue[currentIndex];
    if (!song) return;
    updateBlockBtn();
    updateLsBlockBtn();
    const art = document.getElementById('np-art');
    const title = document.getElementById('np-title');
    const artist = document.getElementById('np-artist');
    if (art)    art.src = coverUrl(song.coverArt || song.id, 400);
    if (title)  title.textContent = song.title || 'Unknown';
    if (artist) artist.textContent = song.artist || '';
    renderQueueList();
    // mini-player meta
    const mThumb = document.getElementById('mini-thumb');
    const mTitle = document.getElementById('mini-title');
    const mArtist = document.getElementById('mini-artist');
    if (mThumb)  mThumb.src = coverUrl(song.coverArt || song.id, 80);
    if (mTitle)  mTitle.textContent = song.title || 'Unknown';
    if (mArtist) mArtist.textContent = song.artist || '';
  }

  /* ── QUEUE LIST ─────────────────────────────────────────── */
  function renderQueueList() {
    const list = document.getElementById('up-next-list');
    if (!list) return;
    list.innerHTML = '';
    const start = Math.max(0, currentIndex);
    const end   = Math.min(currentQueue.length, start + 20);
    for (let i = start; i < end; i++) {
      const song = currentQueue[i];
      if (isSongBlocked(song.id)) continue;
      const row  = document.createElement('div');
      row.className = 'queue-row' + (i === currentIndex ? ' active' : '');
      row.innerHTML = `<span class="queue-num">${i === currentIndex ? '\u266b' : i - start + 1}</span>
        <span class="queue-title">${esc(song.title)}</span>
        <span class="queue-dur">${fmtTime(song.duration)}</span>`;
      row.addEventListener('click', () => playSong(i, true));
      list.appendChild(row);
    }
  }

  /* ── VIEW ROUTER ────────────────────────────────────────── */
  function navigateTo(view, params = {}) {
    currentView = view;
    setActiveNav(view);
    const app=document.getElementById("mobile-app");
    if(app) app.classList.toggle("now-playing-active", view==="now-playing");
    // show mini-player whenever a track is loaded
    const mp = document.getElementById('mini-player');
    if (mp) mp.classList.toggle('hidden', !currentQueue.length);
    switch (view) {
      case 'now-playing':     renderNowPlaying(); break;
      case 'playlists':       l5get('/playlists').then(d => { const old = playlists; playlists = (d.playlists||[]).map(p => { const ex = old.find(o => o.id === p.id); return {id:p.id,name:p.name,songCount:p.count,tracks:ex?.tracks||[]}; }); renderPlaylists(); }); break;
      case 'playlist-detail': renderPlaylistDetail(params.pl, params.pIndex); break;
      case 'folders':
      case 'folder-songs':
      case 'folder-artists':
      case 'folder-albums':
      case 'folder-blocked':  renderFolders(view); break;
      case 'artist-songs':    renderArtistSongs(params.artist); break;
      case 'album-songs':     renderAlbumSongs(params.albumIdx); break;
      case 'settings':        renderSettings(); break;
      case 'search':          renderSearch(params.query); break;
      default:                renderNowPlaying();
    }
  }

  function injectLandscapeNav(activeView) {
    if (window.innerWidth <= window.innerHeight) return;
    const nav = document.createElement('div');
    nav.className = 'ls-section-nav';
    nav.innerHTML = `
      <button class="ls-nav-item${activeView==='now-playing'?' active':''}" data-view="now-playing">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/></svg>
        <span>Now Playing</span>
      </button>
      <button class="ls-nav-item${activeView==='playlists'?' active':''}" data-view="playlists">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="3" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
        <span>Playlists</span>
      </button>
      <button class="ls-nav-item${activeView==='folders'?' active':''}" data-view="folders">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <span>Folders</span>
      </button>
      <button class="ls-nav-item${activeView==='settings'?' active':''}" data-view="settings">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span>Settings</span>
      </button>`;
    nav.querySelectorAll('.ls-nav-item').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.view));
    });
    mainContent.prepend(nav);
  }

  /* ── NOW PLAYING VIEW ────────────────────────────────────── */
  function renderNowPlaying() {
    const song    = currentQueue[currentIndex] || null;
    const artSrc  = song ? coverUrl(song.coverArt || song.id, 400) : '';
    const title   = song ? esc(song.title)  : 'Nothing playing';
    const artist  = song ? esc(song.artist) : '';
    const playing = !audio.paused && !!audio.src;

    mainContent.innerHTML = `
      <div class="now-playing-view">
        <div class="np-art-wrap">
          <img id="np-art" src="${artSrc}" alt="Album art" />
        </div>
        <div class="np-right-col">
          <div class="np-meta">
            <div class="np-title" id="np-title">${title}</div>
            <div class="np-artist" id="np-artist">${artist}</div>
          </div>
          <div class="up-next-section">
            <div class="up-next-label">UP NEXT</div>
            <div class="up-next-list" id="up-next-list"></div>
          </div>
        </div>
      </div>

      <!-- LANDSCAPE BOTTOM BAR (hidden in portrait via CSS) -->
      <div class="ls-bottom-bar">
        <div class="ls-bar-inner">
          <img class="ls-thumb" id="ls-thumb" src="${artSrc}" alt="" />
          <div class="ls-meta">
            <div class="ls-title" id="ls-title">${title}</div>
            <div class="ls-artist" id="ls-artist">${artist}</div>
          </div>
          <div class="ls-btn-group">
            <button id="ls-random-btn" class="icon-btn" aria-label="Random">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.48 8.83l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-2.98-2.71z"/></svg>
            </button>
            <button id="ls-prev" class="icon-btn" aria-label="Previous">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>
            <button id="ls-play-btn" class="icon-btn np-play-btn" aria-label="Play/Pause">
              <svg class="play-icon${playing ? ' hidden' : ''}" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              <svg class="pause-icon${playing ? '' : ' hidden'}" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            <button id="ls-next" class="icon-btn" aria-label="Next">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6v12z"/></svg>
            </button>
            <button id="ls-block-btn" class="icon-btn" aria-label="Block Song" aria-pressed="false" title="Block Song" style="color:#e57373">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.65 3.35L5.35 17.65C4.49 16.24 4 14.68 4 12c0-4.42 3.58-8 8-8 2.68 0 4.24.49 5.65 1.35zm1.3 1.3C19.51 7.76 20 9.32 20 12c0 4.42-3.58 8-8 8-2.68 0-4.24-.49-5.65-1.35L18.95 5.65z"/></svg>
            </button>
          </div>
          <button id="ls-vol-btn" class="icon-btn" onclick="toggleVolSlider()" aria-label="Volume" >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          </button>
        </div>
        <div class="ls-progress-row">
          <span class="ls-time" id="ls-current-time">0:00</span>
          <input id="ls-progress-slider" class="progress-slider ls-slider" type="range" min="0" max="100" value="0" step="0.1" style="--pct:0%" />
          <span class="ls-time" id="ls-duration">0:00</span>
        </div>
      </div>`;


    // landscape controls
    document.getElementById('ls-play-btn')?.addEventListener('click', (e) => { togglePlay(); e.currentTarget.blur(); });
    document.getElementById('ls-prev')?.addEventListener('click', (e) => { playPrev(); e.currentTarget.blur(); });
    document.getElementById('ls-next')?.addEventListener('click', (e) => { playNext(); e.currentTarget.blur(); });
    document.getElementById('ls-block-btn')?.addEventListener('click', async (e) => {
      const song = currentQueue[currentIndex];
      if (!song) return;
      if (isSongBlocked(song.id)) { await unblockSong(song.id); showToast('Unblocked'); }
      else {
        const title = song.title || 'this song';
        if (!(await showConfirm(`Block "${title}"?`, 'Block'))) return;
        await blockSong(song.id); showToast('Blocked'); playNext();
      }
      updateBlockBtn();
      updateLsBlockBtn();
      updateDesktopBlockBtn();
      e.currentTarget.blur();
    });
    document.getElementById('ls-random-btn')?.addEventListener('click', (e) => {
      if (!songs.length) { showToast('Library not ready'); return; }
      currentQueue = [...songs].sort(() => Math.random() - 0.5);
      currentIndex = 0;
      playSong(0, false);
      showToast('Shuffling…');
      e.currentTarget.blur();
    });

    const lsSlider = document.getElementById('ls-progress-slider');
    if (lsSlider) {
      lsSlider.addEventListener('pointerdown', () => { isSeeking = true; });
      lsSlider.addEventListener('pointerup', () => { isSeeking = false; audio.currentTime = parseFloat(lsSlider.value); });
      lsSlider.addEventListener('input', () => {
        const d = audio.duration;
        if (d && isFinite(d)) lsSlider.style.setProperty('--pct', ((parseFloat(lsSlider.value) / d) * 100) + '%');
      });
    }

    function buildLandscapeLayout() {
      if (window.innerWidth <= window.innerHeight) return;
      const view = mainContent.querySelector('.now-playing-view');
      if (!view) return;
      const artSrcLS = document.getElementById('np-art')?.src || artSrc;
      view.innerHTML = '';

      const sideNav = document.createElement('div');
      sideNav.className = 'ls-side-nav';
      sideNav.innerHTML = `
        <button class="ls-nav-item active" data-view="now-playing">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/></svg>
          <span>Now Playing</span>
        </button>
        <button class="ls-nav-item" data-view="playlists">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="3" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
          <span>Playlists</span>
        </button>
        <button class="ls-nav-item" data-view="folders">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          <span>Folders</span>
        </button>
        <button class="ls-nav-item" data-view="settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span>Settings</span>
        </button>`;
      sideNav.querySelectorAll('.ls-nav-item').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.view));
      });

      const centerCol = document.createElement('div');
      centerCol.className = 'ls-center-col';
      centerCol.innerHTML = `
        <img id="np-art" src="${artSrcLS}" alt="Album art" />
        <div class="ls-center-title" id="np-title">${title}</div>
        <div class="ls-center-artist" id="np-artist">${artist}</div>`;

      const upnextCol = document.createElement('div');
      upnextCol.className = 'ls-upnext-col';
      upnextCol.innerHTML = `
        <div class="ls-upnext-label">UP NEXT</div>
        <div class="up-next-list ls-upnext-list" id="up-next-list"></div>`;

      view.appendChild(sideNav);
      view.appendChild(centerCol);
      view.appendChild(upnextCol);
    }
    buildLandscapeLayout();

    const _orientHandler = () => { navigateTo(currentView); };
    window.removeEventListener('orientationchange', window._lwOrientHandler);
    window._lwOrientHandler = _orientHandler;
    window.addEventListener('orientationchange', _orientHandler);
    window.removeEventListener('resize', window._lwResizeHandler);
    let _lastOrient = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    window._lwResizeHandler = () => {
      const orient = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      if (orient !== _lastOrient) { _lastOrient = orient; navigateTo(currentView); }
    };
    window.addEventListener('resize', window._lwResizeHandler);
    renderQueueList();
    syncProgress();
  }

  /* ── PLAYLIST API HELPERS ──────────────────────────────── */
  async function apiLoadPlaylistTracks(pl) {
    if (!pl.id) return;
    try {
      const data = await l5get('/playlists/' + pl.id);
      pl.tracks = (data.playlist.songs || []).map(s => ({ id: s.id, title: s.title, artist: s.artist, album: s.album, duration: s.duration || 0, url: l5streamUrl(s.id) }));
      pl.songCount = pl.tracks.length;
    } catch(e) { pl.tracks = []; }
  }
  async function apiRenamePlaylist(id, name) {
    try { const r = await MusicAdapter.updatePlaylist(id, {name}); return r.ok !== false; }
    catch(e) { return false; }
  }
  async function apiDeletePlaylist(id) {
    try { const r = await MusicAdapter.deletePlaylist(id); return r.ok !== false; }
    catch(e) { return false; }
  }
  async function apiRemoveTracks(id, indices) {
    if (!id || !indices.length) return false;
    try {
      const data = await l5get('/playlists/' + id);
      const arr = (data.playlist.songs || []).slice();
      [...indices].sort((a,b)=>b-a).forEach(i => arr.splice(i,1));
      const r = { json: async()=>await MusicAdapter.updatePlaylist(id,{songs:arr.map(s=>s.id)}) };
      return (await r.json()).ok;
    } catch(e) { return false; }
  }
  async function apiAddSongs(id, songIds) {
    if (!id || !songIds.length) return false;
    try {
      const data = await l5get('/playlists/' + id);
      const existing = (data.playlist.songs || []).map(s => s.id);
      const r = { json: async()=>await MusicAdapter.updatePlaylist(id,{songs:[...existing,...songIds]}) };
      return (await r.json()).ok;
    } catch(e) { return false; }
  }
  async function apiSetOrder(pl, orderedIds) {
    if (!pl.id || !orderedIds.length) return false;
    try { const r = await MusicAdapter.updatePlaylist(pl.id, {songs:orderedIds}); return r.ok !== false; }
    catch(e) { return false; }
  }

  /* ── PLAYLISTS LIST ──────────────────────────────────────── */
  function renderPlaylists() {
    let html = `<div class="pl-list-header">
      <span class="section-header-text">PLAYLISTS</span>
      <div class="pl-list-actions">
        <button id="btn-create-pl" class="pl-action-btn accent">+ Create Playlist</button>
        <button id="btn-gen-random" class="pl-action-btn muted">Generate Random</button>
      </div>
    </div>`;
    if (!playlists.length) {
      html += `<div class="empty-state">No playlists found</div>`;
    } else {
      playlists.forEach((pl, i) => {
        const count = Array.isArray(pl.tracks) ? pl.tracks.length : (pl.songCount ?? pl.trackCount ?? 0);
        html += `<div class="list-row" data-pl="${i}">
          <div class="row-main">
            <span class="row-title">${esc(pl.name)}</span>
            <span class="row-sub">${count} tracks</span>
          </div>
          <button class="row-menu-btn" data-pl-menu="${i}" aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </button>
        </div>`;
      });
    }
    mainContent.innerHTML = html;
    injectLandscapeNav('playlists');

    document.getElementById('btn-create-pl')?.addEventListener('click', createPlaylist);
    document.getElementById('btn-gen-random')?.addEventListener('click', generateRandomPlaylist);

    mainContent.querySelectorAll('.list-row[data-pl]').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('[data-pl-menu]')) return;
        openPlaylist(parseInt(row.dataset.pl));
      });
      // long press to delete
      let _lpTimer = null;
      row.addEventListener('pointerdown', e => {
        if (e.target.closest('[data-pl-menu]')) return;
        _lpTimer = setTimeout(async () => {
          _lpTimer = null;
          const idx = parseInt(row.dataset.pl);
          const pl = playlists[idx];
          if (!pl) return;
          if (!(await showConfirmModal(`Delete "${pl.name}"?`))) return;
          if (pl.id) { const ok = await apiDeletePlaylist(pl.id); if (!ok) { showToast('Delete failed'); return; } }
          playlists.splice(idx, 1); showToast('Deleted'); renderPlaylists();
        }, 600);
      });
      row.addEventListener('pointerup', () => { clearTimeout(_lpTimer); _lpTimer = null; });
      row.addEventListener('pointercancel', () => { clearTimeout(_lpTimer); _lpTimer = null; });
      row.addEventListener('pointermove', () => { clearTimeout(_lpTimer); _lpTimer = null; });
    });
    mainContent.querySelectorAll('[data-pl-menu]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        showPlaylistMenu(btn, parseInt(btn.dataset.plMenu));
      });
    });
  }

  async function createPlaylist() {
    const name = await showInputModal('New Playlist');
    if (!name?.trim()) return;
    try {
      const r = { json: async () => await MusicAdapter.createPlaylist(name.trim()) };
      const d = await r.json();
      if (!d.ok) throw new Error();
      showToast('Playlist created');
      renderPlaylists();
    } catch(e) { showToast('Failed to create playlist'); }
  }

  async function generateRandomPlaylist() {
    if (!songs.length) { showToast('No songs in library'); return; }
    const name = await showInputModal('New Playlist', `Random ${playlists.length + 1}`);
    if (!name?.trim()) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5).slice(0, 20);
    try {
      const cd = await MusicAdapter.createPlaylist(name.trim());
      const plId = cd.id || cd.playlist?.id;
      if (plId && shuffled.length) {
        await MusicAdapter.updatePlaylist(plId, {songs:shuffled.map(s=>s.id)});
      }
      const pList = await MusicAdapter.getPlaylists();
      const oldPlaylists = playlists;
      playlists = (pList||[]).map(p => {
        const existing = oldPlaylists.find(op => op.id === p.id);
        return { id:p.id, name:p.name, songCount:p.count, tracks: existing?.tracks || [] };
      });
      const newPl = playlists.find(p => p.id === plId);
      if (newPl) newPl.tracks = shuffled;
      showToast('Playlist created');
      renderPlaylists();
    } catch(e) { showToast('Failed to create playlist'); }
  }

  async function openPlaylist(idx) {
    const pl = playlists[idx];
    if (!pl) return;
    if (pl.id && (!pl.tracks || pl.tracks.length === 0)) {
      showToast('Loading...');
      await apiLoadPlaylistTracks(pl);
    }
    currentPlaylistIndex = idx;
    navigateTo('playlist-detail', { pl, pIndex: idx });
  }

  function showPlaylistMenu(anchor, idx) {
    removeCtxMenu();
    const pl = playlists[idx];
    const menu = document.createElement('div');
    menu.id = 'ctx-menu';
    const rect = anchor.getBoundingClientRect();
    menu.style.top  = (rect.bottom + 4) + 'px';
    menu.style.right = (window.innerWidth - rect.right) + 'px';
    menu.innerHTML = `
      <button class="ctx-item" id="ctx-play">Play all</button>
      <button class="ctx-item" id="ctx-rename">Rename</button>
      <button class="ctx-item" id="ctx-edit">Edit tracks</button>
      <button class="ctx-item danger" id="ctx-delete">Delete</button>`;
    document.body.appendChild(menu);
    document.getElementById('ctx-play').addEventListener('click', async () => { removeCtxMenu(); await openPlaylist(idx); });
    document.getElementById('ctx-rename').addEventListener('click', async () => {
      removeCtxMenu();
      const newName = await showInputModal('Rename playlist', pl.name);
      if (!newName?.trim()) return;
      if (pl.id) { const ok = await apiRenamePlaylist(pl.id, newName.trim()); if (!ok) { showToast('Rename failed'); return; } }
      pl.name = newName.trim(); renderPlaylists();
    });
    document.getElementById('ctx-edit').addEventListener('click', () => { removeCtxMenu(); openPlaylist(idx); });
    document.getElementById('ctx-delete').addEventListener('click', async () => {
      removeCtxMenu();
      if (!(await showConfirmModal(`Delete "${pl.name}"?`))) return;
      if (pl.id) { const ok = await apiDeletePlaylist(pl.id); if (!ok) { showToast('Delete failed'); return; } }
      playlists.splice(idx, 1); showToast('Deleted'); renderPlaylists();
    });
    setTimeout(() => document.addEventListener('click', removeCtxMenu, { once: true }), 10);
  }
  function removeCtxMenu() { document.getElementById('ctx-menu')?.remove(); }

  /* ── PLAYLIST DETAIL ─────────────────────────────────────── */
  function renderPlaylistDetail(pl, pIndex) {
    if (!pl) { navigateTo('playlists'); return; }
    currentPlaylistIndex = pIndex ?? playlists.indexOf(pl);
    selectedTrackIds.clear();
    const tracks = pl.tracks || [];

    let html = `<div class="pl-detail-header">
      <button class="btn-back" id="btn-back-pl">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        Playlists
      </button>
      <span class="pl-detail-title">${esc(pl.name)}</span>
      <div class="pl-detail-actions">
        ${pl.id ? '<button class="toolbar-add" id="btn-add-songs">+ Add</button>' : ''}
        <span class="toolbar-selected-count" id="pl-sel-count"></span>
        <button id="pl-delete-sel" class="toolbar-delete" style="display:none">Delete</button>
        <label class="track-chk" title="Select all"><input type="checkbox" id="pl-select-all" /></label>
      </div>
    </div>
    <div class="playlist-detail-subheader">
      <span>${tracks.length} tracks</span>
      <button class="playlist-play-btn" id="btn-pl-play">Play All</button>
    </div>
    <div id="playlist-detail-list">`;

    tracks.forEach((track, i) => {
      const key = track.id != null ? String(track.id) : 'local-' + i;
      html += `<div class="track-row" data-track-id="${esc(key)}" data-track-index="${i}">
        <span class="drag-handle" draggable="true"><svg width="14" height="18" viewBox="0 0 10 16" fill="currentColor" style="opacity:0.5"><circle cx="3" cy="2.5" r="1.5"/><circle cx="7" cy="2.5" r="1.5"/><circle cx="3" cy="8" r="1.5"/><circle cx="7" cy="8" r="1.5"/><circle cx="3" cy="13.5" r="1.5"/><circle cx="7" cy="13.5" r="1.5"/></svg></span>
        <div class="track-info" data-play-idx="${i}">
          <span class="track-title">${esc(track.title)}</span>
          <span class="track-sub">${esc(track.artist || '')}</span>
        </div>
        <span class="track-dur">${fmtTime(track.duration)}</span>
        <label class="track-chk"><input type="checkbox" class="track-select" data-track-id="${esc(key)}" /></label>
      </div>`;
    });
    html += `</div>`;

    if (pl.id) {
      html += `<div id="add-songs-modal" class="add-songs-modal" aria-hidden="true">
        <div class="add-songs-backdrop"></div>
        <div class="add-songs-panel">
          <div class="add-songs-header">
            <span>Add Songs</span>
            <button class="add-songs-close" id="add-songs-close">&#10005;</button>
          </div>
          <input type="search" id="add-songs-search" class="add-songs-search-input" placeholder="Search library..." />
          <div id="add-songs-results" class="add-songs-results"></div>
        </div>
      </div>`;
    }
    mainContent.innerHTML = html;
    injectLandscapeNav('playlists');

    document.getElementById('btn-back-pl').addEventListener('click', () => navigateTo('playlists'));
    document.getElementById('btn-pl-play').addEventListener('click', () => {
      if (tracks.length) { currentQueue = [...tracks]; playSong(0, false); }
    });

    mainContent.querySelectorAll('.track-info[data-play-idx]').forEach(el => {
      el.addEventListener('click', () => {
        currentQueue = [...tracks];
        playSong(parseInt(el.dataset.playIdx), false);
      });
    });

    const selectAllCb = document.getElementById('pl-select-all');
    const deleteSelBtn = document.getElementById('pl-delete-sel');
    const countEl = document.getElementById('pl-sel-count');
    function updateSelUI() {
      const n = selectedTrackIds.size;
      if (countEl) countEl.textContent = n ? `${n} selected` : '';
      if (deleteSelBtn) deleteSelBtn.style.display = n > 0 ? '' : 'none';
      if (selectAllCb) {
        selectAllCb.checked = tracks.length > 0 && n === tracks.length;
        selectAllCb.indeterminate = n > 0 && n < tracks.length;
      }
    }
    mainContent.querySelectorAll('.track-select').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) selectedTrackIds.add(cb.dataset.trackId);
        else selectedTrackIds.delete(cb.dataset.trackId);
        updateSelUI();
      });
    });
    if (selectAllCb) {
      selectAllCb.addEventListener('change', () => {
        tracks.forEach((t, i) => {
          const k = t.id != null ? String(t.id) : 'local-' + i;
          if (selectAllCb.checked) selectedTrackIds.add(k);
          else selectedTrackIds.delete(k);
        });
        mainContent.querySelectorAll('.track-select').forEach(cb => { cb.checked = !!selectAllCb.checked; });
        updateSelUI();
      });
    }
    if (deleteSelBtn) {
      deleteSelBtn.addEventListener('click', async () => {
        if (!selectedTrackIds.size) return;
        if (!await showConfirm(`Remove ${selectedTrackIds.size} ${selectedTrackIds.size === 1 ? 'track' : 'tracks'}?`, 'Remove')) return;
        const indices = [];
        tracks.forEach((t, i) => { const k = t.id != null ? String(t.id) : 'local-' + i; if (selectedTrackIds.has(k)) indices.push(i); });
        if (pl.id) { const ok = await apiRemoveTracks(pl.id, indices); if (!ok) { showToast('Remove failed'); return; } }
        indices.sort((a,b)=>b-a).forEach(i => pl.tracks.splice(i, 1));
        selectedTrackIds.clear();
        renderPlaylistDetail(pl, currentPlaylistIndex);
      });
    }

    const listEl = document.getElementById('playlist-detail-list');
    if (listEl) setupDragDrop(listEl, pl);

    if (pl.id) {
      const addBtn   = document.getElementById('btn-add-songs');
      const modal    = document.getElementById('add-songs-modal');
      const closeBtn = document.getElementById('add-songs-close');
      const searchEl = document.getElementById('add-songs-search');
      function openAddModal() {
        modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
        renderAddSongsResults(pl, ''); searchEl?.focus();
      }
      function closeAddModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }
      addBtn?.addEventListener('click', openAddModal);
      closeBtn?.addEventListener('click', closeAddModal);
      modal?.querySelector('.add-songs-backdrop')?.addEventListener('click', closeAddModal);
      searchEl?.addEventListener('input', () => renderAddSongsResults(pl, searchEl.value.trim()));
    }
  }

  function renderAddSongsResults(pl, query) {
    const resultsEl = document.getElementById('add-songs-results');
    if (!resultsEl) return;
    const inPl = new Set((pl.tracks || []).map(t => t.id).filter(Boolean));
    let list = songs.filter(s => s.id && !inPl.has(s.id));
    if (query) { const q = query.toLowerCase(); list = list.filter(s => (s.title||'').toLowerCase().includes(q) || (s.artist||'').toLowerCase().includes(q)); }
    list = list.slice(0, 100);
    if (!list.length) { resultsEl.innerHTML = '<p class="add-songs-empty">No songs found.</p>'; return; }
    resultsEl.innerHTML = list.map(s => `<div class="add-songs-row">
      <div class="add-songs-info">
        <span class="add-songs-title">${esc(s.title)}</span>
        <span class="add-songs-artist">${esc(s.artist)}</span>
      </div>
      <span class="add-songs-dur">${fmtTime(s.duration)}</span>
      <button class="btn-add-one" data-sid="${esc(s.id)}">Add</button>
    </div>`).join('');
    resultsEl.querySelectorAll('.btn-add-one').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await apiAddSongs(pl.id, [btn.dataset.sid]);
        if (!ok) { showToast('Add failed'); return; }
        await apiLoadPlaylistTracks(pl);
        renderPlaylistDetail(pl, currentPlaylistIndex);
      });
    });
  }

  function setupDragDrop(container, pl) {
    let draggedRow = null;
    container.querySelectorAll('.drag-handle').forEach(handle => {
      const row = handle.closest('.track-row');
      if (!row) return;
      handle.addEventListener('dragstart', e => { draggedRow = row; e.dataTransfer.effectAllowed = 'move'; row.classList.add('dragging'); });
      handle.addEventListener('dragend', () => { row.classList.remove('dragging'); container.querySelectorAll('.track-row').forEach(r => r.classList.remove('drop-target')); draggedRow = null; });
    });
    container.querySelectorAll('.track-row').forEach(row => {
      row.addEventListener('dragover', e => { e.preventDefault(); if (draggedRow && draggedRow !== row) row.classList.add('drop-target'); });
      row.addEventListener('dragleave', () => row.classList.remove('drop-target'));
      row.addEventListener('drop', async e => {
        e.preventDefault(); row.classList.remove('drop-target');
        if (!draggedRow || draggedRow === row) return;
        const from = parseInt(draggedRow.dataset.trackIndex);
        const to   = parseInt(row.dataset.trackIndex);
        if (from === to) return;
        const item = pl.tracks[from];
        pl.tracks.splice(from, 1);
        pl.tracks.splice(from < to ? to - 1 : to, 0, item);
        const ids = pl.tracks.map(t => t.id).filter(Boolean);
        if (pl.id && ids.length) await apiSetOrder(pl, ids);
        renderPlaylistDetail(pl, currentPlaylistIndex);
      });
    });
  }

  /* ── FOLDERS ─────────────────────────────────────────────── */
  function renderFolders(view) {
    currentView = view;
    if (view === 'folder-artists') folderSubView = 'artists';
    else if (view === 'folder-albums') folderSubView = 'albums';
    else if (view === 'folder-blocked') folderSubView = 'blocked';
    else if (view === 'folder-songs') folderSubView = 'songs';
    // if view === 'folders', keep existing folderSubView (don't reset)

    let html = `<div class="sub-nav">
      <button class="sub-nav-btn${folderSubView==='songs'  ?' active':''}" data-sub="songs">Songs</button>
      <button class="sub-nav-btn${folderSubView==='artists'?' active':''}" data-sub="artists">Artists</button>
      <button class="sub-nav-btn${folderSubView==='albums' ?' active':''}" data-sub="albums">Albums</button>
      <button class="sub-nav-btn${folderSubView==='blocked'?' active':''}" data-sub="blocked">Blocked</button>
    </div>`;

    if (folderSubView === 'songs') {
      html += `<div class="section-header">SONGS (${songs.length})</div>`;
      songs.forEach((song, i) => {
        html += `<div class="list-row" data-song="${i}">
          <img class="row-thumb" src="${coverUrl(song.coverArt||song.id,60)}" alt="" loading="lazy"/>
          <div class="row-main"><span class="row-title">${esc(song.title)}</span><span class="row-sub">${esc(song.artist)}</span></div>
          <span class="row-dur">${fmtTime(song.duration)}</span>
        </div>`;
      });
    } else if (folderSubView === 'artists') {
      const map = new Map();
      songs.forEach(s => { const a = s.artist||'Unknown'; map.set(a,(map.get(a)||0)+1); });
      const artists = [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
      html += `<div class="section-header">ARTISTS (${artists.length})</div>`;
      artists.forEach(([name, count]) => {
        html += `<div class="list-row" data-artist="${esc(name)}">
          <div class="row-main"><span class="row-title">${esc(name)}</span><span class="row-sub">${count} song${count!==1?'s':''}</span></div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted);flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`;
      });
    } else if (folderSubView === 'albums') {
      const map = new Map();
      songs.forEach(s => {
        const k = s.album||'Unknown Album';
        if (!map.has(k)) map.set(k,{name:k,artist:s.artist||'',coverArt:s.coverArt||s.id,songs:[]});
        map.get(k).songs.push(s);
      });
      const albums = [...map.values()].sort((a,b)=>a.name.localeCompare(b.name));
      window.__pwaAlbums = albums;
      html += `<div class="section-header">ALBUMS (${albums.length})</div>`;
      albums.forEach((album, i) => {
        html += `<div class="list-row" data-album="${i}">
          <img class="row-thumb" src="${coverUrl(album.coverArt,60)}" alt="" loading="lazy"/>
          <div class="row-main"><span class="row-title">${esc(album.name)}</span><span class="row-sub">${esc(album.artist)} &middot; ${album.songs.length} tracks</span></div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted);flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`;
      });
    } else if (folderSubView === 'blocked') {
      const user = localStorage.getItem('l5user') || '';
      const navHtml = html;
      mainContent.innerHTML = navHtml + '<div class="section-header">BLOCKED</div><div style="padding:16px;color:var(--muted)">Loading...</div>';
      mainContent.querySelectorAll('.sub-nav-btn').forEach(btn => btn.addEventListener('click', () => renderFolders('folder-'+btn.dataset.sub)));
      Promise.resolve({ ok: true, json: async () => ({ blocked: await MusicAdapter.getBlocked() }) })
        .then(r => r.json())
        .then(async data => {
          const ids = (data.ok && Array.isArray(data.blocked)) ? data.blocked : [];
          blockedSongIds = new Set(ids); updateBlockBtn(); updateLsBlockBtn();
          if (!ids.length) {
            mainContent.innerHTML = navHtml + '<div class="section-header">BLOCKED (0)</div><div class="list-row"><div class="row-main"><span class="row-title" style="color:var(--muted)">No blocked songs</span></div></div>';
            mainContent.querySelectorAll('.sub-nav-btn').forEach(btn => btn.addEventListener('click', () => renderFolders('folder-'+btn.dataset.sub)));
            return;
          }
          const details = await Promise.all(ids.map(id =>
            Promise.resolve({ ok: true, json: async () => ({ ok:true, song: await MusicAdapter.getSong(id) }) })
              .then(r=>r.json()).then(d=>d.ok?d.song:null).catch(()=>null)
          ));
          const blocked = details.filter(Boolean);
          let bhtml = navHtml + `<div class="section-header">BLOCKED (${blocked.length})</div>`;
          blocked.forEach(song => {
            bhtml += `<div class="list-row" style="display:flex;align-items:center;gap:8px">
              <img class="row-thumb" src="${coverUrl(song.coverArt||song.id,60)}" alt="" loading="lazy"/>
              <div class="row-main"><span class="row-title">${esc(song.title)}</span><span class="row-sub">${esc(song.artist)}</span></div>
              <button class="unblock-btn-inline" data-sid="${esc(song.id)}" style="flex-shrink:0;font-size:0.78rem;color:#81c784;padding:4px 8px;background:none;border:none;cursor:pointer">Unblock</button>
            </div>`;
          });
          mainContent.innerHTML = bhtml;
          mainContent.querySelectorAll('.sub-nav-btn').forEach(btn => btn.addEventListener('click', () => renderFolders('folder-'+btn.dataset.sub)));
          mainContent.querySelectorAll('.unblock-btn-inline').forEach(btn => {
            btn.addEventListener('click', async () => {
              const row = btn.closest('.list-row');
              await MusicAdapter.unblockSong(btn.dataset.sid);
              blockedSongIds.delete(btn.dataset.sid);
              if (row) row.remove();
              const header = mainContent.querySelector('.section-header');
              const remaining = mainContent.querySelectorAll('.unblock-btn-inline').length;
              if (header) header.textContent = `BLOCKED (${remaining})`;
              if (!remaining) {
                const empty = document.createElement('div');
                empty.className = 'list-row';
                empty.innerHTML = '<div class="row-main"><span class="row-title" style="color:var(--muted)">No blocked songs</span></div>';
                mainContent.appendChild(empty);
              }
            });
          });
        })
        .catch(() => {
          mainContent.innerHTML = navHtml + '<div style="padding:16px;color:#e57373">Failed to load blocked songs.</div>';
          mainContent.querySelectorAll('.sub-nav-btn').forEach(btn => btn.addEventListener('click', () => renderFolders('folder-'+btn.dataset.sub)));
        });
      return;
    }

    mainContent.innerHTML = html;
    injectLandscapeNav('folders');
    mainContent.querySelectorAll('.sub-nav-btn').forEach(btn => btn.addEventListener('click', () => renderFolders('folder-'+btn.dataset.sub)));
    if (folderSubView === 'songs') {
      mainContent.querySelectorAll('.list-row[data-song]').forEach(row => {
        row.addEventListener('click', () => { currentQueue=[...songs]; playSong(parseInt(row.dataset.song),false); });
      });
    } else if (folderSubView === 'artists') {
      mainContent.querySelectorAll('.list-row[data-artist]').forEach(row => row.addEventListener('click', () => renderArtistSongs(row.dataset.artist)));
    } else {
      mainContent.querySelectorAll('.list-row[data-album]').forEach(row => row.addEventListener('click', () => renderAlbumSongs(parseInt(row.dataset.album))));
    }
  }

  function renderArtistSongs(artistName) {
    const aS = songs.filter(s => (s.artist||'Unknown') === artistName);
    let html = `<div class="pl-detail-header">
      <button class="btn-back" id="btn-back-artist">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15,18 9,12 15,6"/></svg> Artists
      </button>
      <span class="pl-detail-title">${esc(artistName)}</span>
      <div class="pl-detail-actions"><button class="playlist-play-btn" id="btn-artist-play">Play All</button></div>
    </div>
    <div class="playlist-detail-subheader"><span>${aS.length} songs</span></div>`;
    aS.forEach((s,i) => {
      html += `<div class="list-row" data-as="${i}">
        <img class="row-thumb" src="${coverUrl(s.coverArt||s.id,60)}" alt="" loading="lazy"/>
        <div class="row-main"><span class="row-title">${esc(s.title)}</span><span class="row-sub">${esc(s.album)}</span></div>
        <span class="row-dur">${fmtTime(s.duration)}</span>
      </div>`;
    });
    mainContent.innerHTML = html;
    injectLandscapeNav('folders');
    document.getElementById('btn-back-artist').addEventListener('click', () => renderFolders('folder-artists'));
    document.getElementById('btn-artist-play').addEventListener('click', () => { currentQueue=[...aS]; playSong(0,false); });
    mainContent.querySelectorAll('.list-row[data-as]').forEach(row => row.addEventListener('click', () => { currentQueue=[...aS]; playSong(parseInt(row.dataset.as),false); }));
  }

  function renderAlbumSongs(idx) {
    const album = (window.__pwaAlbums||[])[idx];
    if (!album) { renderFolders('folder-albums'); return; }
    let html = `<div class="pl-detail-header">
      <button class="btn-back" id="btn-back-album">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15,18 9,12 15,6"/></svg> Albums
      </button>
      <span class="pl-detail-title">${esc(album.name)}</span>
      <div class="pl-detail-actions"><button class="playlist-play-btn" id="btn-album-play">Play All</button></div>
    </div>
    <div class="playlist-detail-subheader"><span>${esc(album.artist)} &middot; ${album.songs.length} tracks</span></div>`;
    album.songs.forEach((s,i) => {
      html += `<div class="list-row" data-albs="${i}">
        <img class="row-thumb" src="${coverUrl(s.coverArt||s.id,60)}" alt="" loading="lazy"/>
        <div class="row-main"><span class="row-title">${esc(s.title)}</span><span class="row-sub">${esc(s.artist)}</span></div>
        <span class="row-dur">${fmtTime(s.duration)}</span>
      </div>`;
    });
    mainContent.innerHTML = html;
    injectLandscapeNav('folders');
    document.getElementById('btn-back-album').addEventListener('click', () => renderFolders('folder-albums'));
    document.getElementById('btn-album-play').addEventListener('click', () => { currentQueue=[...album.songs]; playSong(0,false); });
    mainContent.querySelectorAll('.list-row[data-albs]').forEach(row => row.addEventListener('click', () => { currentQueue=[...album.songs]; playSong(parseInt(row.dataset.albs),false); }));
  }

  /* ── SETTINGS ─────────────────────────────────────────────── */
  function renderSettings() {
    const user = esc(localStorage.getItem('l5user') || '');
    const role = localStorage.getItem('l5role') || 'user';
    const mode = localStorage.getItem('music_mode') || 'default';
    const curAccent = localStorage.getItem('l5_accent') || 'orange';
    const curBg = localStorage.getItem('l5_bg') || 'black';
    const adapterType = MusicAdapter.getType() || '';
    const adapterCfg = MusicAdapter.getConfig() || {};
    mainContent.innerHTML = `
      <div class="section-header">BACKEND</div>
      <div style="padding:0 0 12px">
        <div style="display:flex;flex-direction:column;gap:8px">
          <select id="set-backend-type" style="padding:8px;border-radius:8px;background:var(--bg-1);color:var(--fg);border:1px solid var(--stroke);font-size:14px">
            <option value="l5music"${adapterType==='l5music'?' selected':''}>L5Music</option>
            <option value="subsonic"${adapterType==='subsonic'?' selected':''}>Subsonic / Navidrome</option>
          </select>
          <input id="set-server-url" type="url" placeholder="Server URL (e.g. http://192.168.1.100:3002)" value="${esc(adapterCfg.server||'')}" style="padding:8px;border-radius:8px;background:var(--bg-1);color:var(--fg);border:1px solid var(--stroke);font-size:14px">
          <input id="set-username" type="text" placeholder="Username" value="${esc(adapterCfg.username||'')}" style="padding:8px;border-radius:8px;background:var(--bg-1);color:var(--fg);border:1px solid var(--stroke);font-size:14px">
          <input id="set-password" type="password" placeholder="Password" value="${esc(adapterCfg.password||adapterCfg.token||'')}" style="padding:8px;border-radius:8px;background:var(--bg-1);color:var(--fg);border:1px solid var(--stroke);font-size:14px">
          <button id="set-connect-btn" class="settings-chip-btn" style="padding:10px;font-weight:600;color:var(--accent)">Connect</button>
          <div id="set-status" style="font-size:12px;color:var(--muted)">${adapterType ? 'Connected: '+adapterType+' → '+(adapterCfg.server||'?') : 'Not connected'}</div>
        </div>
      </div>
      <div class="section-header">PI CAST (OPTIONAL)</div>
      <div style="padding:0 0 12px">
        <div style="display:flex;flex-direction:column;gap:8px">
          <input id="set-cast-url" type="url" placeholder="Cast server URL (e.g. http://192.168.1.50:3003)" value="${localStorage.getItem('l5p_cast_url')||''}" style="padding:8px;border-radius:8px;background:var(--bg-1);color:var(--fg);border:1px solid var(--stroke);font-size:14px">
          <div style="font-size:12px;color:var(--muted)">Play through a Pi with speakers attached. Your phone is just the remote.</div>
        </div>
      </div>
      <div class="section-header">MUSIC MODE</div>
      <div class="settings-row" style="gap:8px;flex-wrap:wrap" id="set-mode-row"></div>
      <div class="section-header">ACCENT</div>
      <div class="settings-row" style="gap:10px;flex-wrap:wrap">
        ${Object.entries(L5_ACCENTS).map(([k,v]) => '<div class="theme-dot'+(curAccent===k?' active':'')+'" data-accent="'+k+'" style="width:28px;height:28px;border-radius:50%;background:'+v.accent+';cursor:pointer"></div>').join('')}
      </div>
      <div class="section-header">BACKGROUND</div>
      <div class="settings-row" style="gap:8px;flex-wrap:wrap">
        ${Object.entries(L5_BGS).map(([k,v]) => '<button class="settings-chip-btn bg-btn'+(curBg===k?' active':'')+'" data-bg="'+k+'" style="'+(k==='warm'||k==='white'?'color:#1a1a1a;background:'+v.bg0+';border-color:rgba(0,0,0,.15)':'')+'">'+k.charAt(0).toUpperCase()+k.slice(1)+'</button>').join('')}
      </div>`;

    // Dynamic folder detection
    const modeRow = document.getElementById('set-mode-row');
    (async () => {
    const folders = MusicAdapter.isReady() ? await MusicAdapter.getFolders() : ['default'];
    if (!modeRow) return;

      if (folders.length <= 5) {
        modeRow.innerHTML = folders.map(f => {
          const label = f==='default'?'All':f.charAt(0).toUpperCase()+f.slice(1);
          return '<button class="settings-chip-btn mode-btn'+(mode===f?' active':'')+'" data-mode="'+f+'">'+label+'</button>';
        }).join('');
      } else {
        modeRow.innerHTML = '<select id="set-mode-select" style="padding:8px;border-radius:8px;background:var(--bg-1);color:var(--fg);border:1px solid var(--stroke);font-size:14px">' +
          folders.map(f => '<option value="'+f+'"'+(mode===f?' selected':'')+'>'+(f==='default'?'All':f.charAt(0).toUpperCase()+f.slice(1))+'</option>').join('') + '</select>';
      }
    mainContent.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const m = btn.dataset.mode;
        if (m === (localStorage.getItem('music_mode') || 'default')) return;
        localStorage.setItem('music_mode', m);
        const mLabel = m.charAt(0).toUpperCase() + m.slice(1);
        showToast('Switching to ' + mLabel + ' mode…');
        try {
          await l5get('/rescan');
        } catch (e) {
          console.error('rescan failed', e);
        }
        await loadLibrary();
        showToast(songs.length + ' songs loaded');
        renderSettings();
      });
    });
    // Dropdown handler (>5 folders)
    document.getElementById('set-mode-select')?.addEventListener('change', async function() {
      const m = this.value;
      localStorage.setItem('music_mode', m);
      showToast('Switching…');
      try { await l5get('/rescan'); } catch(e) {}
      await loadLibrary();
      showToast(songs.length + ' songs loaded');
      renderSettings();
    });
    })();
    injectLandscapeNav('settings');
    mainContent.querySelectorAll('.theme-dot').forEach(d => {
      d.addEventListener('click', () => { localStorage.setItem('l5_accent', d.dataset.accent); applyL5Theme(); renderSettings(); });
    });
    mainContent.querySelectorAll('.bg-btn').forEach(b => {
      b.addEventListener('click', () => { localStorage.setItem('l5_bg', b.dataset.bg); applyL5Theme(); renderSettings(); });
    });
    // Backend connect
    document.getElementById('set-connect-btn')?.addEventListener('click', () => connectBackend('set'));
    document.getElementById('set-cast-url')?.addEventListener('change', function() {
      let castUrl = this.value.trim();
      if (castUrl && !/^https?:\/\//.test(castUrl)) castUrl = 'http://' + castUrl;
      localStorage.setItem('l5p_cast_url', castUrl);
      showToast(castUrl ? 'Cast URL saved' : 'Cast URL cleared');
    });
  }

  async function connectBackend(prefix) {
    const type = document.getElementById(prefix+'-backend-type')?.value;
    let server = document.getElementById(prefix+'-server-url')?.value?.trim();
    const username = document.getElementById(prefix+'-username')?.value?.trim();
    const password = document.getElementById(prefix+'-password')?.value;
    const statusEl = document.getElementById(prefix+'-status');
    if (!server) { if (statusEl) statusEl.textContent = 'Enter a server URL'; return; }
    if (!/^https?:\/\//.test(server)) server = 'http://' + server;
    if (statusEl) statusEl.textContent = 'Connecting…';
    try {
      const cfg = { server };
      if (type === 'l5music') { cfg.password = password; cfg.username = username || 'player'; }
      else { cfg.username = username; cfg.password = password; }
      await MusicAdapter.init(type, cfg);
      await MusicAdapter.ping();
      if (statusEl) statusEl.textContent = 'Connected ✓';
      showToast('Connected to ' + type);
      await loadLibrary();
    } catch(e) {
      let msg = e.message || 'Connection failed';
      if (msg.includes('Unexpected token')) msg = 'Not a valid API server. Check the URL.';
      else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) msg = 'Cannot reach server. Check the URL and network.';
      else if (msg.includes('Login failed')) msg = 'Incorrect username or password.';
      if (statusEl) statusEl.textContent = msg;
    }
  }

  /* ── SEARCH ──────────────────────────────────────────────── */
  function renderSearch(query) {
    if (!query) { mainContent.innerHTML = '<div class="search-empty">Type to search...</div>'; return; }
    const q = query.toLowerCase();
    const results = songs.filter(s =>
      (s.title&&s.title.toLowerCase().includes(q)) ||
      (s.artist&&s.artist.toLowerCase().includes(q)) ||
      (s.album&&s.album.toLowerCase().includes(q))
    ).slice(0,50);
    let html = `<div class="section-header">RESULTS (${results.length})</div>`;
    if (!results.length) html += `<div class="search-empty">No results for "${esc(query)}"</div>`;
    else results.forEach((song,i) => {
      html += `<div class="list-row" data-res="${i}">
        <img class="row-thumb" src="${coverUrl(song.coverArt||song.id,60)}" alt="" loading="lazy"/>
        <div class="row-main"><span class="row-title">${esc(song.title)}</span><span class="row-sub">${esc(song.artist)}</span></div>
        <span class="row-dur">${fmtTime(song.duration)}</span>
      </div>`;
    });
    mainContent.innerHTML = html;
    mainContent.querySelectorAll('.list-row[data-res]').forEach(row => {
      row.addEventListener('click', () => {
        currentQueue=[...results]; playSong(parseInt(row.dataset.res),false);
        topbarDefault.classList.remove('hidden'); topbarSearch.classList.add('hidden'); searchInput.value='';
      });
    });
  }


  /* ── LIBRARY LOAD ────────────────────────────────────────── */
  function mapEntry(e) {
    return { id:e.id, title:e.title||'Unknown', artist:e.artist||'', album:e.album||'', duration:e.duration||0, coverArt:e.coverArt||e.id };
  }
  async function loadLibrary() {
    const loadEl = document.getElementById('loading-overlay');
    if (loadEl) loadEl.innerHTML = '<div class="spinner"></div><p>Loading library...</p>';
    const mode = localStorage.getItem('music_mode') || 'default';
    try {
      const folder = mode === 'default' ? '' : mode;
      const q = folder ? ('?folder='+folder+'&size=500') : '?size=500';
      const sData = await l5get('/random' + q);
      songs = (sData.songs||[]).map(s => ({ id:s.id, title:s.title||'?', artist:s.artist||'', album:s.album||'', duration:s.duration||0, url:l5streamUrl(s.id), coverUrl:s.hasCover?l5coverUrl(s.id):null }));
      const pData = await l5get('/playlists');
      playlists = (pData.playlists||[]).map(p=>({id:p.id,name:p.name,songCount:p.count,tracks:[]}));
      if (!currentQueue.length) currentQueue = [...songs].sort(() => Math.random() - 0.5);
      if (!currentQueue.length) currentIndex = 0;
    } catch (e) {
      console.error('Library load failed:', e);
      if (loadEl) loadEl.innerHTML = '<p style="color:#e57373;padding:20px">Failed to load library.<br>Check connection or login.</p>';
      throw e;
    }
  }

  /* ── SERVICE WORKER ──────────────────────────────────────── */
  /* ── SERVICE WORKER (disabled for cast edition) ───────── */

  /* ── UTILS ───────────────────────────────────────────────── */
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── INIT ────────────────────────────────────────────────── */
  async function init() {
    // Restore adapter from localStorage or go to settings
    if (!MusicAdapter.isReady()) {
      if (!await MusicAdapter.restore()) {
        document.getElementById('loading-overlay')?.remove();
        navigateTo('settings');
        return;
      }
    }
    try {
      await Promise.all([loadLibrary(), loadBlockedSongs(), loadShuffleLog(), syncRole()]);
      document.getElementById('loading-overlay')?.remove();
      // Restore last session
      if (songs.length) {
        const lastId = localStorage.getItem('l5_last_song');
        if (lastId && !currentQueue.length) {
          currentQueue = songs.slice();
          const idx = currentQueue.findIndex(s => String(s.id) === lastId);
          if (idx >= 0) currentIndex = idx;
        }
      }
      navigateTo('now-playing');
      updateNowPlayingMeta();
    } catch (e) {
      // loadLibrary already showed error in overlay
    }
  }
  function renderAdminView() {}


  init();

  // ── ADMIN DELETE SONG (long-press on mobile) ──
  (function initMobileDeleteSong() {
    const isAdmin = () => (localStorage.getItem('l5role') || 'user') === 'admin';
    const menu = document.createElement('div');
    menu.id = 'ctx-delete-menu';
    menu.style.cssText = 'display:none;position:fixed;z-index:9999;background:var(--bg-2);border:1px solid var(--stroke);border-radius:8px;padding:4px 0;box-shadow:0 8px 24px rgba(0,0,0,0.5);min-width:140px;';
    menu.innerHTML = '<div id="ctx-delete-btn-m" style="padding:10px 16px;color:#ff5555;font-size:0.9rem;cursor:pointer;">Delete Song</div>';
    document.body.appendChild(menu);
    let targetSongId = null; let targetEl = null;

    function getSongFromEl(el) {
      const lr = el.closest('.list-row[data-song]');
      if (lr) return songs[parseInt(lr.dataset.song, 10)];
      const si = el.closest('.song-item');
      if (si && si.dataset.index != null) return songs[parseInt(si.dataset.index, 10)];
      if (si) { const ub = si.querySelector('[data-sid]'); if (ub) return { id: ub.dataset.sid }; }
      const qr = el.closest('.queue-row');
      if (qr) { const idx = Array.from(qr.parentElement.children).indexOf(qr); const start = Math.max(0, currentIndex); return currentQueue[start + idx] || null; }
      const lr2 = el.closest(".list-row"); if (lr2 && !lr2.dataset.song) { const ub = lr2.querySelector("[data-sid]"); if (ub) return { id: ub.dataset.sid }; }
      return null;
    }
    function showMenu(x, y, song, el) {
      targetSongId = song.id; targetEl = el;
      menu.style.display = 'block';
      menu.style.left = Math.min(x, window.innerWidth - 160) + 'px';
      menu.style.top = Math.min(y, window.innerHeight - 50) + 'px';
    }
    function hideMenu() { menu.style.display = 'none'; targetSongId = null; targetEl = null; }
    document.addEventListener('click', (e) => { if (!menu.contains(e.target)) hideMenu(); });

    let lpTimer = null; let lpTarget = null;
    document.addEventListener('touchstart', (e) => {
      if (!isAdmin()) return;
      const song = getSongFromEl(e.target);
      if (!song) return;
      const row = e.target.closest('.list-row,.song-item,.queue-row');
      lpTarget = { song, el: row, x: e.touches[0].clientX, y: e.touches[0].clientY };
      lpTimer = setTimeout(() => {
        window.getSelection()?.removeAllRanges();
        showMenu(lpTarget.x, lpTarget.y, lpTarget.song, lpTarget.el);
        lpTimer = null;
      }, 500);
    }, { passive: true });
    document.addEventListener('touchmove', () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } });
    document.addEventListener('touchend', () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } });

    document.getElementById('ctx-delete-btn-m').addEventListener('click', async () => {
      if (!targetSongId) return;
      const sid = targetSongId; const el = targetEl;
      hideMenu();
      if (!await l5confirm('Delete this song permanently?')) return;
      try {
        const r = { ok: true, json: async () => await MusicAdapter.deleteSong(sid) };
        const d = await r.json();
        if (d.ok) {
          const delSong = currentQueue[currentIndex];
          const wasPlaying = delSong && String(delSong.id) === String(sid);
          songs = songs.filter(s => s.id !== sid);
          blockedSongIds.delete(String(sid));
          currentQueue = currentQueue.filter(s => String(s.id) !== String(sid));
          if (currentIndex >= currentQueue.length) currentIndex = Math.max(0, currentQueue.length - 1);
          if (el) el.remove();
          if (wasPlaying && currentQueue.length) { audio.pause(); audio.src = "";
            playSong(currentIndex, true);
          } else if (wasPlaying) {
            audio.pause(); audio.src = '';
          }
          showToast('Song deleted');
        } else { showToast(d.error || 'Delete failed'); }
      } catch (e) { showToast('Delete failed'); }
    });
  })();

  // ── WEBSOCKET SYNC HANDLER ──
  window._onWsSync = function(msg) {
    if (!msg.songId || !msg.queueIds) return;
    // Rebuild queue from synced song IDs
    const newQueue = msg.queueIds.map(id => songs.find(s => String(s.id) === String(id))).filter(Boolean);
    if (!newQueue.length) return;
    currentQueue = newQueue;
    currentIndex = msg.currentIndex || 0;
    if (currentIndex >= currentQueue.length) currentIndex = 0;
    const song = currentQueue[currentIndex];
    if (!song) return;
    localStorage.setItem('l5_last_song', String(song.id));
    // Update UI but don't play audio (other device is playing)
    if (!audio.src || audio.paused) {
      audio.src = streamUrl(song.id);
      audio.load();
      audio.currentTime = msg.position || 0;
      // Don't auto-play — other device owns playback
    }
    updateNowPlayingMeta();
    if (currentView === "now-playing") renderQueueList();
  };

} // end initMobile()


/* ═══════════════════════════════════════════════════════════════════
   DESKTOP APP  (was music.js)
   ═══════════════════════════════════════════════════════════════════ */
function initDesktop() {
  // No redirect here — single auth guard in config.js (musicui_authed). Avoid double redirect.

  const navItems = document.querySelectorAll('#nav-items .nav-item');
  const mainView = document.getElementById('main-view');
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const randomPlaysBtn = document.getElementById('random-plays-btn');
  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const nowPlayingTitle = document.getElementById('now-playing-title');
  const nowPlayingArtist = document.getElementById('now-playing-artist');

  let songs = [];
  let playlists = [];
  let currentQueue = [];
  let currentIndex = -1;
  let shuffleMode = localStorage.getItem('l5shuffle') === '1';
  let currentPlaylistIndex = null;
  let selectedTrackIds = new Set();
  // blockedSongIds, blockSong, unblockSong, isSongBlocked, loadBlockedSongs are module-level shared functions

  function updateDesktopBlockBtn() {
    const btn = document.getElementById('desktop-block-btn');
    if (!btn) return;
    const idx = currentQueue[currentIndex]; const song = idx !== undefined ? songs[idx] : null;
    const blocked = song && isSongBlocked(song.id);
    btn.classList.toggle('active', !!blocked);
    btn.style.color = blocked ? '#ff5252' : '#e57373';
    btn.title = blocked ? 'Unblock Song' : 'Block Song';
  }
  function showDesktopToast(msg) {
    let t = document.getElementById('desktop-toast');
    if (!t) { t = document.createElement('div'); t.id = 'desktop-toast'; t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:var(--bg-2);color:var(--text-0);padding:8px 18px;border-radius:20px;font-size:0.85rem;z-index:9999;pointer-events:none;transition:opacity 0.3s'; document.body.appendChild(t); }
    t.textContent = msg; t.style.opacity = '1';
    clearTimeout(t._to); t._to = setTimeout(() => { t.style.opacity = '0'; }, 2000);
  }

  const audio = AudioProxy;

  function updateRangeFill(range) {
    if (!range) return;
    const min = parseFloat(range.min) || 0;
    const max = parseFloat(range.max) || 100;
    const val = parseFloat(range.value) || 0;
    const percent = (max - min) ? ((val - min) / (max - min)) * 100 : 0;
    range.style.setProperty('--progress', percent + '%');
  }
  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => { updateRangeFill(volumeSlider); });
    updateRangeFill(volumeSlider);
  }
  const progressSliderEl = document.getElementById('progress-slider');
  const currentTimeEl = document.getElementById('current-time');
  const durationTimeEl = document.getElementById('duration-time');
  const coverImg = document.getElementById('cover-art');
  let isSeeking = false;

  function renderTimeLabels() {
    if (!currentTimeEl || !durationTimeEl || !audio) return;
    currentTimeEl.textContent = fmtDuration(audio.currentTime || 0);
    durationTimeEl.textContent = fmtDuration(audio.duration || 0);
  }

  if (progressSliderEl) {
    progressSliderEl.addEventListener('input', () => updateRangeFill(progressSliderEl));
    updateRangeFill(progressSliderEl);
    progressSliderEl.addEventListener('pointerdown', () => { isSeeking = true; });
    progressSliderEl.addEventListener('pointerup', () => {
      isSeeking = false;
      if (audio && !isNaN(progressSliderEl.value)) audio.currentTime = Number(progressSliderEl.value);
    });
    progressSliderEl.addEventListener('change', () => {
      isSeeking = false;
      if (audio && !isNaN(progressSliderEl.value)) audio.currentTime = Number(progressSliderEl.value);
    });
  }

  if (audio) {
    audio.addEventListener('timeupdate', () => {
      if (!isSeeking && progressSliderEl) {
        const d = audio.duration;
        if (d && isFinite(d)) { progressSliderEl.max = d; progressSliderEl.value = audio.currentTime || 0; }
        updateRangeFill(progressSliderEl);
        renderTimeLabels();
      }
    });
    audio.addEventListener('loadedmetadata', () => {
      if (progressSliderEl && audio.duration && isFinite(audio.duration)) {
        progressSliderEl.max = audio.duration; progressSliderEl.value = 0; updateRangeFill(progressSliderEl);
      }
      renderTimeLabels();
    });
  }

  /* ── L5CORE desktop API helpers ──────────────────────── */
  async function fetchPlaylistTracks(pl) {
    if (!pl.id) return;
    try {
      const data = await l5get('/playlists/' + pl.id);
      pl.tracks = (data.playlist.songs || []).map(s => ({
        id: s.id, title: s.title, artist: s.artist, album: s.album,
        duration: s.duration || 0, url: l5streamUrl(s.id)
      }));
      pl.trackCount = pl.tracks.length;
    } catch (e) { pl.tracks = []; }
  }

  async function renamePlaylist(id, name) {
    try { const r = { json: async()=>await MusicAdapter.updatePlaylist(id,{name}) }; return (await r.json()).ok; }
    catch(e) { return false; }
  }

  async function deletePlaylist(id) {
    try { const r = { json: async()=>await MusicAdapter.deletePlaylist(id) }; return (await r.json()).ok; }
    catch(e) { return false; }
  }

  async function removeTracksFromPlaylist(id, indices) {
    if (!id || !indices.length) return false;
    try {
      const pl = await MusicAdapter.getPlaylist(id);
      const arr = (pl.songs || []).slice();
      [...indices].sort((a,b)=>b-a).forEach(i => arr.splice(i,1));
      const result = await MusicAdapter.updatePlaylist(id, {songs:arr.map(s=>s.id)});
      return !!result.ok;
    } catch(e) { return false; }
  }

  async function addSongsToPlaylist(id, songIds) {
    if (!id || !songIds.length) return false;
    try {
      const data = await l5get('/playlists/' + id);
      const existing = (data.playlist.songs || []).map(s => s.id);
      const r = { json: async()=>await MusicAdapter.updatePlaylist(id,{songs:[...existing,...songIds]}) };
      return (await r.json()).ok;
    } catch(e) { return false; }
  }

  async function setPlaylistOrder(id, orderedIds) {
    if (!id || !orderedIds.length) return false;
    try {
      const result = await MusicAdapter.updatePlaylist(id, {songs:orderedIds});
      return !!result.ok;
    } catch(e) { return false; }
  }

  async function fetchData() {
    try {
      const mode = localStorage.getItem('music_mode') || 'default';
      const folder = mode === 'default' ? '' : mode;
      const q = folder ? ('?folder=' + folder + '&size=500') : '?size=500';
      const sData = await l5get('/random' + q);
      songs = (sData.songs || []).map(s => ({
        id: s.id, title: s.title || '?', artist: s.artist || '', album: s.album || '',
        duration: s.duration || 0,
        url: l5streamUrl(s.id),
        coverUrl: s.hasCover ? l5coverUrl(s.id) : null
      }));
      const pData = await l5get('/playlists');
      playlists = (pData.playlists || []).map(p => ({ id: p.id, name: p.name, trackCount: p.count, tracks: [] }));
    } catch(e) { console.error('fetchData', e); songs = []; playlists = []; }
  }

  async function createPlaylist() {
    const name = await showPrompt('New Playlist');
    if (!name || !name.trim()) return;
    try {
      const d = await MusicAdapter.createPlaylist(name.trim());
      if (d.id || d.ok) { await fetchData(); loadView('playlists'); }
      else showAlert('Failed to create playlist.');
    } catch(e) { showAlert('Failed to create playlist.'); }
  }

  function applyMenuPreferences() {
    const hideSongs = localStorage.getItem('hide-songs') === 'true';
    const hideArtists = localStorage.getItem('hide-artists') === 'true';
    const hidePlaylists = localStorage.getItem('hide-playlists') === 'true';
    const songsItem = document.querySelector('li[data-view="songs"]');
    const artistsItem = document.querySelector('li[data-view="artists"]');
    const playlistsItem = document.querySelector('li[data-view="playlists"]');
    if (songsItem) songsItem.style.display = hideSongs ? 'none' : '';
    if (artistsItem) artistsItem.style.display = hideArtists ? 'none' : '';
    if (playlistsItem) playlistsItem.style.display = hidePlaylists ? 'none' : '';
  }

  const sidebarEl = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const sidebarToggle = document.getElementById('sidebar-toggle');

  function closeMobileSidebar() {
    if (sidebarEl) sidebarEl.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.setAttribute('aria-hidden', 'true');
    if (sidebarToggle) sidebarToggle.setAttribute('aria-expanded', 'false');
  }

  function loadView(viewName) {
    closeMobileSidebar();
    const foldersLi = document.querySelector('li[data-view="folders"]');
    if (foldersLi) {
      const inFolders = ['folder-songs', 'folder-artists', 'folder-albums', 'folder-blocked'].includes(viewName);
      foldersLi.classList.toggle('open', inFolders);
    }
    document.querySelectorAll('#nav-items .nav-item, #nav-items .sub-item, .sidebar-footer .nav-item').forEach(item => item.classList.remove('active'));
    const active = document.querySelector(`[data-view="${viewName}"]`);
    if (active) active.classList.add('active');
    switch (viewName) {
      case 'now-playing':   renderNowPlaying(); break;
      case 'random-plays':  renderNowPlaying(); break;
      case 'playlists':     l5get('/playlists').then(d => { playlists = (d.playlists||[]).map(p=>({id:p.id,name:p.name,trackCount:p.count,tracks:[]})); renderPlaylists(); }); break;
      case 'folder-songs':  renderSongs(); break;
      case 'folder-artists':renderArtists(); break;
      case 'folder-albums': renderAlbums(); break;
      case 'folder-blocked': renderBlockedSongs(); break;
      case 'settings':      renderSettings(); break;
      default:              renderNowPlaying();
    }
  }

  function renderSongs() {
    if (songs.length === 0) { mainView.innerHTML = '<p>No songs found.</p>'; return; }
    let html = renderViewHeader('Songs') + '<div class="section"><div class="list songs-list">';
    songs.forEach((song, index) => {
      html += `<div class="song-item" data-index="${index}"><span class="song-main">${escapeHtml(song.title)}</span><span class="song-duration">${fmtDuration(song.duration)}</span></div>`;
    });
    html += '</div></div>';
    mainView.innerHTML = html;
    document.querySelectorAll('.song-item').forEach(el => {
      el.addEventListener('click', () => playSong(parseInt(el.dataset.index, 10)));
    });
  }

  function renderArtists() {
    if (songs.length === 0) { mainView.innerHTML = '<p>No artists found.</p>'; return; }
    const artistList = Array.from(new Set(songs.map(s => s.artist))).sort();
    let html = renderViewHeader('Artists') + '<div class="section"><div class="list list--flat" id="artistList">';
    artistList.forEach(artist => {
      html += `<div class="list-row" data-artist="${escapeHtml(artist)}"><span class="list-row-text">${escapeHtml(artist)}</span></div>`;
    });
    html += '</div></div>';
    mainView.innerHTML = html;
    document.querySelectorAll('#artistList .list-row').forEach(el => {
      el.addEventListener('click', () => renderArtistSongs(el.dataset.artist));
    });
  }

  function renderArtistSongs(artist) {
    const filtered = songs.filter(s => s.artist === artist);
    const backBtnHtml = '<button type="button" class="btn-chip" id="folder-back-btn">← Artists</button>';
    let html = renderViewHeader(artist, backBtnHtml) + '<div class="section"><div class="list songs-list">';
    filtered.forEach(song => {
      const index = songs.indexOf(song);
      html += `<div class="song-item" data-index="${index}"><span class="song-main">${escapeHtml(song.title)}</span><span class="song-duration">${fmtDuration(song.duration)}</span></div>`;
    });
    html += '</div></div>';
    mainView.innerHTML = html;
    document.getElementById('folder-back-btn')?.addEventListener('click', () => renderArtists());
    document.querySelectorAll('.song-item').forEach(el => {
      el.addEventListener('click', () => playSong(parseInt(el.dataset.index, 10)));
    });
  }

  function renderPlaylists() {
    const rightBtns = '<button id="btn-create-playlist" class="btn btn-chip">+ Create Playlist</button>' +
      '<button id="btn-generate-random" class="btn btn-chip">Generate Random</button>';
    let html = renderViewHeader('Playlists', rightBtns) + '<div class="section">';
    if (playlists.length === 0) {
      html += '<p class="mt">No playlists found.</p>';
    } else {
      html += '<div class="list playlist-list">';
      playlists.forEach((pl, index) => {
        const count = Array.isArray(pl.tracks) && pl.tracks.length > 0 ? pl.tracks.length : (pl.trackCount || 0);
        html += `<div class="playlist-row" data-playlist-index="${index}">`;
        html += `<span class="playlist-name">${escapeHtml(pl.name)} (${count})</span>`;
        html += '<div class="playlist-actions">';
        html += `<button type="button" class="kebab-btn" data-playlist-index="${index}">⋯</button>`;
        html += '<div class="dropdown playlist-dropdown">';
        html += '<button type="button" class="dropdown-item" data-action="rename">Rename</button>';
        html += '<button type="button" class="dropdown-item" data-action="edit">Edit</button>';
        html += '<button type="button" class="dropdown-item" data-action="delete">Delete</button>';
        html += '</div></div></div>';
      });
      html += '</div>';
    }
    html += '</div>';
    mainView.innerHTML = html;
    document.getElementById('btn-create-playlist')?.addEventListener('click', createPlaylist);
    document.getElementById('btn-generate-random')?.addEventListener('click', generateRandomPlaylist);
    mainView.querySelectorAll('.playlist-name').forEach(el => {
      el.addEventListener('click', (e) => {
        const row = e.target.closest('.playlist-row');
        if (!row) return;
        renderPlaylistSongs(parseInt(row.dataset.playlistIndex, 10));
      });
    });
    mainView.querySelectorAll('.kebab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdown = btn.nextElementSibling;
        const open = mainView.querySelector('.playlist-dropdown.open');
        if (open && open !== dropdown) open.classList.remove('open');
        dropdown.classList.toggle('open');
      });
    });
    mainView.querySelectorAll('.playlist-dropdown .dropdown-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const dropdown = e.target.closest('.playlist-dropdown');
        const btn = dropdown && dropdown.previousElementSibling;
        const idx = btn ? parseInt(btn.dataset.playlistIndex, 10) : -1;
        dropdown.classList.remove('open');
        const pl = playlists[idx];
        if (!pl) return;
        const action = e.target.dataset.action;
        if (action === 'rename') {
          const newName = await showPrompt('Rename Playlist', pl.name);
          if (newName != null && newName.trim()) {
            if (pl.id) { const ok = await renamePlaylist(pl.id, newName.trim()); if (ok) { pl.name = newName.trim(); renderPlaylists(); } else showAlert('Failed to rename.'); }
            else { pl.name = newName.trim(); renderPlaylists(); }
          }
        } else if (action === 'edit') {
          renderPlaylistSongs(idx);
        } else if (action === 'delete') {
          if (!await showConfirm(`Delete "${pl.name}"?`, 'Delete')) return;
          if (pl.id) { const ok = await deletePlaylist(pl.id); if (ok) { playlists.splice(idx, 1); renderPlaylists(); } else showAlert('Failed to delete.'); }
          else { playlists.splice(idx, 1); renderPlaylists(); }
        }
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderViewHeader(title, rightHtml = '') {
    return '<div class="view-header"><div class="view-title">' + escapeHtml(title) + '</div><div class="view-header-right">' + rightHtml + '</div></div>';
  }

  function fmtDuration(sec) {
    sec = Number(sec || 0);
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  async function generateRandomPlaylist() {
    if (!songs.length) { showDesktopToast('No songs in library'); return; }
    const name = await showPrompt('New Playlist', `Random ${playlists.length + 1}`);
    if (!name?.trim()) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5).slice(0, 20);
    try {
      const cd = await MusicAdapter.createPlaylist(name.trim());
      const plId = cd.id || cd.playlist?.id;
      if (plId) await MusicAdapter.updatePlaylist(plId, {songs:shuffled.map(s=>s.id)});
      showDesktopToast('Playlist created');
      await fetchData();
      loadView('playlists');
    } catch(e) { showDesktopToast('Failed to create playlist'); }
  }

  async function renderPlaylistSongs(pIndex) {
    const pl = playlists[pIndex];
    if (!pl) return;
    currentPlaylistIndex = pIndex;
    selectedTrackIds.clear();
    if (pl.id && (!pl.tracks || pl.tracks.length === 0) && (pl.trackCount || 0) > 0) {
      mainView.innerHTML = `<h2>${escapeHtml(pl.name)}</h2><p>Loading tracks…</p>`;
      await fetchPlaylistTracks(pl);
    }
    const tracks = pl.tracks || [];
    let html = '<div class="pl-detail-header">';
    html += '<button type="button" class="playlist-back-btn" id="playlist-back-btn">← Playlists</button>';
    html += `<span class="pl-detail-title">${escapeHtml(pl.name)}</span>`;
    html += '<div class="pl-detail-actions">';
    if (pl.id) html += '<button type="button" class="toolbar-add" id="playlist-add-songs-btn">Add songs</button>';
    html += '<span class="toolbar-selected-count" id="playlist-selected-count"></span>';
    html += '<button type="button" id="plDeleteSelected" class="toolbar-delete btn-label" style="display:none">Delete</button>';
    html += '<label class="track-chk toolbar-select-all"><input type="checkbox" id="plSelectAll" /></label>';
    html += '</div></div><div class="section"><div class="list playlist-detail-list" id="playlist-detail-list">';
    tracks.forEach((track, i) => {
      const trackKey = track.id != null ? String(track.id) : 'local-' + i;
      const songIndex = track.id && songs.length ? songs.findIndex(s => s.id === track.id) : -1;
      html += `<div class="track-row" data-track-id="${escapeHtml(trackKey)}" data-track-index="${i}">`;
      html += '<span class="drag-handle" draggable="true">⠿</span>';
      html += `<div class="track-title song-main" data-song-index="${songIndex}">${escapeHtml(track.title)}</div>`;
      html += `<span class="song-duration">${fmtDuration(track.duration)}</span>`;
      html += `<label class="track-chk"><input type="checkbox" class="track-select" data-track-id="${escapeHtml(trackKey)}" /></label>`;
      html += '</div>';
    });
    html += '</div></div>';
    if (pl.id) {
      html += '<div id="add-songs-modal" class="add-songs-modal" aria-hidden="true">';
      html += '<div class="add-songs-modal-backdrop"></div><div class="add-songs-modal-panel">';
      html += '<div class="add-songs-modal-header"><h3>Add Songs</h3><button class="add-songs-close">×</button></div>';
      html += '<input type="search" class="add-songs-search" placeholder="Search library…" />';
      html += '<div class="add-songs-results"></div></div></div>';
    }
    mainView.innerHTML = html;

    document.getElementById('playlist-back-btn')?.addEventListener('click', () => loadView('playlists'));

    const listEl = document.getElementById('playlist-detail-list');
    const selectAllCb = document.getElementById('plSelectAll');
    const deleteBtn = document.getElementById('plDeleteSelected');
    const countEl = document.getElementById('playlist-selected-count');

    function updateSelectionUI() {
      const n = selectedTrackIds.size;
      if (countEl) countEl.textContent = n ? `${n} selected` : '';
      if (deleteBtn) deleteBtn.style.display = n > 0 ? '' : 'none';
      if (selectAllCb) { selectAllCb.checked = tracks.length > 0 && n === tracks.length; selectAllCb.indeterminate = n > 0 && n < tracks.length; }
    }
    mainView.querySelectorAll('.track-select').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) selectedTrackIds.add(cb.dataset.trackId); else selectedTrackIds.delete(cb.dataset.trackId);
        updateSelectionUI();
      });
    });
    if (selectAllCb) {
      selectAllCb.addEventListener('change', () => {
        if (selectAllCb.checked) tracks.forEach((t, i) => selectedTrackIds.add(t.id != null ? String(t.id) : 'local-' + i));
        else selectedTrackIds.clear();
        mainView.querySelectorAll('.track-select').forEach(cb => { cb.checked = !!selectAllCb.checked; });
        updateSelectionUI();
      });
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (selectedTrackIds.size === 0) return;
        if (!await showConfirm(`Remove ${selectedTrackIds.size} ${selectedTrackIds.size === 1 ? 'track' : 'tracks'}?`, 'Remove')) return;
        const indicesToRemove = [];
        tracks.forEach((t, i) => { const key = t.id != null ? String(t.id) : 'local-' + i; if (selectedTrackIds.has(key)) indicesToRemove.push(i); });
        indicesToRemove.sort((a, b) => b - a);
        if (pl.id) { const ok = await removeTracksFromPlaylist(pl.id, indicesToRemove); if (!ok) { showAlert('Failed to remove tracks.'); return; } }
        indicesToRemove.forEach(i => pl.tracks.splice(i, 1));
        selectedTrackIds.clear();
        renderPlaylistSongs(pIndex);
      });
    }
    updateSelectionUI();

    mainView.querySelectorAll('.track-title').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.songIndex, 10);
        if (idx >= 0 && idx < songs.length) playSong(idx);
      });
    });

    if (listEl) setupDragDrop(listEl, pl, pIndex);

    if (pl.id) {
      const addBtn = document.getElementById('playlist-add-songs-btn');
      const modal = document.getElementById('add-songs-modal');
      if (addBtn && modal) {
        addBtn.addEventListener('click', () => {
          modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
          const si = modal.querySelector('.add-songs-search');
          if (si) { si.value = ''; si.focus(); }
          renderAddSongsResults(modal, pl, pIndex, '');
        });
        modal.querySelector('.add-songs-close')?.addEventListener('click', () => closeAddSongsModal(modal));
        modal.querySelector('.add-songs-modal-backdrop')?.addEventListener('click', () => closeAddSongsModal(modal));
        const si = modal.querySelector('.add-songs-search');
        if (si) si.addEventListener('input', () => renderAddSongsResults(modal, pl, pIndex, si.value.trim()));
      }
    }
  }

  function closeAddSongsModal(modal) { if (!modal) return; modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); }

  function renderAddSongsResults(modal, pl, pIndex, query) {
    const resultsEl = modal?.querySelector('.add-songs-results');
    if (!resultsEl) return;
    const inPlaylist = new Set((pl.tracks || []).map(t => t.id).filter(Boolean));
    let list = songs.filter(s => s.id && !inPlaylist.has(s.id));
    if (query) { const q = query.toLowerCase(); list = list.filter(s => (s.title && s.title.toLowerCase().includes(q)) || (s.artist && s.artist.toLowerCase().includes(q))); }
    list = list.slice(0, 100);
    let html = '';
    list.forEach(song => {
      html += `<div class="add-songs-row"><span class="add-songs-info song-main">${escapeHtml(song.title)}</span><span class="song-duration">${fmtDuration(song.duration)}</span><button type="button" class="btn-label add-songs-add-one" data-song-id="${escapeHtml(song.id)}">Add</button></div>`;
    });
    resultsEl.innerHTML = html || '<p class="add-songs-empty">No songs to show.</p>';
    resultsEl.querySelectorAll('.add-songs-add-one').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.songId;
        if (!id) return;
        const ok = await addSongsToPlaylist(pl.id, [id]);
        if (!ok) { showAlert('Failed to add track.'); return; }
        await fetchPlaylistTracks(pl);
        await renderPlaylistSongs(pIndex);
      });
    });
  }

  function setupDragDrop(container, pl, pIndex) {
    let draggedRow = null;
    container.querySelectorAll('.drag-handle').forEach(handle => {
      const row = handle.closest('.track-row');
      if (!row) return;
      handle.addEventListener('dragstart', (e) => { draggedRow = row; e.dataTransfer.effectAllowed = 'move'; row.classList.add('dragging'); });
      handle.addEventListener('dragend', () => { row.classList.remove('dragging'); container.querySelectorAll('.track-row').forEach(r => r.classList.remove('drop-target')); draggedRow = null; });
    });
    container.querySelectorAll('.track-row').forEach(row => {
      row.addEventListener('dragover', (e) => { e.preventDefault(); if (draggedRow && draggedRow !== row) row.classList.add('drop-target'); });
      row.addEventListener('dragleave', () => row.classList.remove('drop-target'));
      row.addEventListener('drop', (e) => {
        e.preventDefault(); row.classList.remove('drop-target');
        if (!draggedRow || draggedRow === row) return;
        const from = parseInt(draggedRow.dataset.trackIndex, 10);
        const to = parseInt(row.dataset.trackIndex, 10);
        if (from === to) return;
        const item = pl.tracks[from];
        pl.tracks.splice(from, 1);
        pl.tracks.splice(from < to ? to - 1 : to, 0, item);
        const ids = (pl.tracks || []).map(t => t.id).filter(Boolean);
        if (pl.id && ids.length > 0) setPlaylistOrder(pl.id, ids).then(() => renderPlaylistSongs(pIndex));
        else renderPlaylistSongs(pIndex);
      });
    });
  }

  function renderSettings() {
    const username = localStorage.getItem('l5user') || '—';
    const role = localStorage.getItem('l5role') || 'user';
    const mode = localStorage.getItem('music_mode') || 'default';
    const curAccent = localStorage.getItem('l5_accent') || 'orange';
    const curBg = localStorage.getItem('l5_bg') || 'black';
    const adapterType = MusicAdapter.getType() || '';
    const adapterCfg = MusicAdapter.getConfig() || {};
    let html = renderViewHeader('Settings');
    html += `<div class="section"><div class="section-title">Backend</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding:8px 0;align-items:center">
        <select id="dset-backend-type" style="padding:6px 10px;border-radius:8px;background:var(--bg-1);color:var(--fg);border:1px solid var(--stroke);font-size:13px">
          <option value="l5music"${adapterType==='l5music'?' selected':''}>L5Music</option>
          <option value="subsonic"${adapterType==='subsonic'?' selected':''}>Subsonic / Navidrome</option>
        </select>
        <input id="dset-server-url" type="url" placeholder="Server URL" value="${escapeHtml(adapterCfg.server||'')}" style="padding:6px 10px;border-radius:8px;background:var(--bg-1);color:var(--fg);border:1px solid var(--stroke);font-size:13px;flex:1;min-width:200px">
        <input id="dset-username" type="text" placeholder="Username" value="${escapeHtml(adapterCfg.username||'')}" style="padding:6px 10px;border-radius:8px;background:var(--bg-1);color:var(--fg);border:1px solid var(--stroke);font-size:13px;width:120px">
        <input id="dset-password" type="password" placeholder="Password" value="${escapeHtml(adapterCfg.password||adapterCfg.token||'')}" style="padding:6px 10px;border-radius:8px;background:var(--bg-1);color:var(--fg);border:1px solid var(--stroke);font-size:13px;width:120px">
        <button id="dset-connect-btn" class="btn-chip" style="font-weight:600;color:var(--accent)">Connect</button>
      </div>
      <div id="dset-status" style="font-size:12px;color:var(--muted);padding:0 0 4px">${adapterType ? 'Connected: '+adapterType+' → '+(adapterCfg.server||'?') : 'Not connected'}</div>
    </div>`;
    html += `<div class="section"><div class="section-title">Pi Cast (Optional)</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding:8px 0;align-items:center">
        <input id="dset-cast-url" type="url" placeholder="Cast server URL (e.g. http://192.168.1.50:3003)" value="${escapeHtml(localStorage.getItem('l5p_cast_url')||'')}" style="padding:6px 10px;border-radius:8px;background:var(--bg-1);color:var(--fg);border:1px solid var(--stroke);font-size:13px;flex:1;min-width:200px">
        <button id="dset-cast-save" class="btn-chip" style="font-weight:600">Save</button>
      </div>
      <div style="font-size:12px;color:var(--muted);padding:0 0 4px">Play through a Pi with speakers. Your phone is just the remote.</div>
    </div>`;
    html += `<div class="section"><div class="section-title">Music Mode</div>
      <div id="dset-mode-row" style="display:flex;gap:8px;flex-wrap:wrap;padding:8px 0"></div></div>`;
    html += '<div class="section"><div class="section-title">Accent</div><div style="display:flex;gap:10px;flex-wrap:wrap;padding:8px 0">';
    html += Object.entries(L5_ACCENTS).map(([k,v]) => '<div class="theme-dot'+(curAccent===k?' active':'')+'" data-accent="'+k+'" style="width:28px;height:28px;border-radius:50%;background:'+v.accent+';cursor:pointer"></div>').join('');
    html += '</div><div class="section-title" style="margin-top:8px">Background</div><div style="display:flex;gap:8px;flex-wrap:wrap;padding:8px 0">';
    html += Object.entries(L5_BGS).map(([k,v]) => '<button class="btn-chip bg-btn'+(curBg===k?' active':'')+'" data-bg="'+k+'" style="'+(k==='warm'||k==='white'?'color:#1a1a1a;background:'+v.bg0+';border-color:rgba(0,0,0,.15)':'')+'">'+k.charAt(0).toUpperCase()+k.slice(1)+'</button>').join('');
    html += '</div></div>';
    mainView.innerHTML = html;

    // Dynamic folder detection (desktop)
    const dModeRow = document.getElementById('dset-mode-row');
    (async () => {
    const dFolders = MusicAdapter.isReady() ? await MusicAdapter.getFolders() : ['default'];
    if (!dModeRow) return;
    if (dFolders.length <= 5) {
        dModeRow.innerHTML = dFolders.map(f => {
          const label = f==='default'?'All':f.charAt(0).toUpperCase()+f.slice(1);
          return '<button class="btn-chip mode-btn'+(mode===f?' active':'')+'" data-mode="'+f+'">'+label+'</button>';
        }).join('');
      } else {
        dModeRow.innerHTML = '<select id="dset-mode-select" style="padding:6px 10px;border-radius:8px;background:var(--bg-1);color:var(--fg);border:1px solid var(--stroke);font-size:13px">' +
          dFolders.map(f => '<option value="'+f+'"'+(mode===f?' selected':'')+'>'+(f==='default'?'All':f.charAt(0).toUpperCase()+f.slice(1))+'</option>').join('') + '</select>';
    }
    mainView.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const m = btn.dataset.mode;
        if (m === (localStorage.getItem('music_mode') || 'default')) return;
        localStorage.setItem('music_mode', m);
        try {
          await l5get('/rescan');
        } catch (e) {
          console.error('rescan failed', e);
        }
        await fetchData();
        renderSettings();
      });
    });
    // Dropdown handler (>5 folders)
    document.getElementById('dset-mode-select')?.addEventListener('change', async function() {
      localStorage.setItem('music_mode', this.value);
      await fetchData();
      renderSettings();
    });
    })();

    mainView.querySelectorAll('.theme-dot').forEach(d => {
      d.addEventListener('click', () => { localStorage.setItem('l5_accent', d.dataset.accent); applyL5Theme(); renderSettings(); });
    });
    mainView.querySelectorAll('.bg-btn').forEach(b => {
      b.addEventListener('click', () => { localStorage.setItem('l5_bg', b.dataset.bg); applyL5Theme(); renderSettings(); });
    });
    // Backend connect
    document.getElementById('dset-connect-btn')?.addEventListener('click', async () => {
      const type = document.getElementById('dset-backend-type')?.value;
      let server = document.getElementById('dset-server-url')?.value?.trim();
      const user = document.getElementById('dset-username')?.value?.trim();
      const pass = document.getElementById('dset-password')?.value;
      const statusEl = document.getElementById('dset-status');
      if (!server) { if (statusEl) statusEl.textContent = 'Enter a server URL'; return; }
      if (!/^https?:\/\//.test(server)) server = 'http://' + server;
      if (statusEl) statusEl.textContent = 'Connecting…';
      try {
        const cfg = { server };
        if (type === 'l5music') { cfg.password = pass; cfg.username = user || 'player'; }
        else { cfg.username = user; cfg.password = pass; }
        await MusicAdapter.init(type, cfg);
        await MusicAdapter.ping();
        if (statusEl) statusEl.textContent = 'Connected ✓';
        showDesktopToast('Connected to ' + type);
        await Promise.all([fetchData(), loadBlockedSongs(), loadShuffleLog()]);
      } catch(e) {
        let msg = e.message || 'Connection failed';
        if (msg.includes('Unexpected token')) msg = 'Not a valid API server. Check the URL.';
        else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) msg = 'Cannot reach server. Check the URL and network.';
        else if (msg.includes('Login failed')) msg = 'Incorrect username or password.';
        if (statusEl) statusEl.textContent = msg;
      }
    });
    document.getElementById('dset-cast-save')?.addEventListener('click', () => {
      let url = document.getElementById('dset-cast-url')?.value?.trim() || '';
      if (url && !/^https?:\/\//.test(url)) url = 'http://' + url;
      localStorage.setItem('l5p_cast_url', url);
      showDesktopToast(url ? 'Cast URL saved' : 'Cast URL cleared');
    });

  }

  function performSearch(query) {
    if (!query) return;
    const lower = query.toLowerCase();
    const filteredSongs = songs.filter(s => s.title.toLowerCase().includes(lower) || s.artist.toLowerCase().includes(lower));
    const filteredArtists = Array.from(new Set(filteredSongs.map(s => s.artist)));
    let html = renderViewHeader('Results for "' + escapeHtml(query) + '"');
    if (filteredSongs.length > 0) {
      html += '<h3>Songs</h3><div class="list songs-list">';
      filteredSongs.forEach(song => {
        const index = songs.indexOf(song);
        html += `<div class="song-item" data-index="${index}"><span class="song-main">${escapeHtml(song.title)}</span><span class="song-duration">${fmtDuration(song.duration)}</span></div>`;
      });
      html += '</div>';
    }
    if (filteredArtists.length > 0) {
      html += '<h3>Artists</h3><div class="list artist-list">';
      filteredArtists.forEach(artist => { html += `<div class="artist-item" data-artist="${artist}">${artist}</div>`; });
      html += '</div>';
    }
    if (filteredSongs.length === 0 && filteredArtists.length === 0) html += '<p>No results found.</p>';
    mainView.innerHTML = html;
    document.querySelectorAll('.song-item').forEach(el => {
      el.addEventListener('click', () => playSong(parseInt(el.dataset.index, 10)));
    });
    document.querySelectorAll('.artist-item').forEach(el => {
      el.addEventListener('click', () => renderArtistSongs(el.dataset.artist));
    });
  }

  function renderNowPlaying() {
    if (currentQueue.length === 0) {
      mainView.innerHTML = '<div class="now-playing-empty"><p>No tracks in the queue.</p><p>Press <strong>Random Play</strong> to start.</p></div>';
      return;
    }
    const currentSongIndex = currentIndex >= 0 && currentIndex < currentQueue.length ? currentQueue[currentIndex] : currentQueue[0];
    const currentSong = songs[currentSongIndex];
    const coverSrc = (currentSong && currentSong.coverUrl) ? currentSong.coverUrl : 'assets/music_logo.png';
    const title = currentSong ? escapeHtml(currentSong.title) : '—';
    const artist = currentSong ? escapeHtml(currentSong.artist) : '—';

    let html = '<div class="now-playing-portrait">';
    html += `<div class="now-playing-art-panel"><img src="${coverSrc}" alt="" class="now-playing-cover" /><div class="now-playing-current-title">${title}</div><div class="now-playing-current-artist">${artist}</div></div>`;
    html += '<div class="now-playing-queue-section"><div class="section-title">Up Next</div><div class="list now-playing-list">';
    const startIdx = Math.max(0, currentIndex);
    for (let idx = startIdx; idx < currentQueue.length; idx++) {
      const songIndex = currentQueue[idx];
      const song = songs[songIndex];
      if (!song || isSongBlocked(song.id)) continue;
      const isCurrent = idx === currentIndex;
      html += `<div class="song-item${isCurrent ? ' current' : ''}" data-index="${songIndex}" data-queue-idx="${idx}"><span class="song-main">${escapeHtml(song.title)}</span><span class="song-duration">${fmtDuration(song.duration)}</span></div>`;
    }
    html += '</div></div></div>';
    mainView.innerHTML = html;
    document.querySelectorAll('.now-playing-list .song-item').forEach(el => {
      el.addEventListener('click', () => { playSong(parseInt(el.dataset.index, 10)); renderNowPlaying(); });
    });
  }

  function renderAlbums() {
    if (songs.length === 0) { mainView.innerHTML = '<p>No albums found.</p>'; return; }
    const albumList = Array.from(new Set(songs.map(s => s.album || 'Unknown Album'))).sort();
    let html = renderViewHeader('Albums') + '<div class="section"><div class="list list--flat" id="albumList">';
    albumList.forEach(album => {
      html += `<div class="list-row" data-album="${escapeHtml(album)}"><span class="list-row-text">${escapeHtml(album)}</span></div>`;
    });
    html += '</div></div>';
    mainView.innerHTML = html;
    document.querySelectorAll('#albumList .list-row').forEach(el => {
      el.addEventListener('click', () => renderAlbumSongs(el.dataset.album));
    });
  }

  function renderAlbumSongs(album) {
    const filtered = songs.filter(s => (s.album || 'Unknown Album') === album);
    const backBtnHtml = '<button type="button" class="btn-chip" id="folder-back-btn">← Albums</button>';
    let html = renderViewHeader(album, backBtnHtml) + '<div class="section"><div class="list songs-list">';
    filtered.forEach(song => {
      const index = songs.indexOf(song);
      html += `<div class="song-item" data-index="${index}"><span class="song-main">${escapeHtml(song.title)}</span><span class="song-duration">${fmtDuration(song.duration)}</span></div>`;
    });
    html += '</div></div>';
    mainView.innerHTML = html;
    document.getElementById('folder-back-btn')?.addEventListener('click', () => renderAlbums());
    document.querySelectorAll('.songs-list .song-item').forEach(el => {
      el.addEventListener('click', () => playSong(parseInt(el.dataset.index, 10)));
    });
  }

  function renderBlockedSongs() {
    const user = localStorage.getItem('l5user') || '';
    mainView.innerHTML = renderViewHeader('Blocked Songs') + '<div class="section"><p style="padding:16px;color:var(--muted)">Loading...</p></div>';
    Promise.resolve({ ok: true, json: async () => ({ blocked: await MusicAdapter.getBlocked() }) })
      .then(r => r.json())
      .then(async data => {
        const ids = (data.ok && Array.isArray(data.blocked)) ? data.blocked : [];
        blockedSongIds = new Set(ids); updateDesktopBlockBtn();
        if (!ids.length) {
          mainView.innerHTML = renderViewHeader('Blocked Songs') + '<div class="section"><p style="padding:16px;color:var(--muted)">No blocked songs.</p></div>';
          return;
        }
        const details = await Promise.all(ids.map(id =>
          MusicAdapter.getSong(id).catch(() => null)
        ));
        const blocked = details.filter(Boolean);
        let rows = '';
        blocked.forEach(song => {
          rows += `<div class="song-item" style="display:flex;align-items:center;gap:8px">
            <span class="song-main" style="flex:1">${escapeHtml(song.title || 'Unknown')} <span style="color:var(--muted);font-size:0.85em">${escapeHtml(song.artist || '')}</span></span>
            <button class="btn-label unblock-desktop" data-sid="${escapeHtml(String(song.id))}">Unblock</button>
          </div>`;
        });
        mainView.innerHTML = renderViewHeader('Blocked Songs') + '<div class="section"><div class="list songs-list">' + rows + '</div></div>';
        mainView.querySelectorAll('.unblock-desktop').forEach(btn => {
          btn.addEventListener('click', async () => {
            const row = btn.closest('.song-item');
            await MusicAdapter.unblockSong(btn.dataset.sid);
            blockedSongIds.delete(btn.dataset.sid);
            if (row) row.remove();
            const remaining = mainView.querySelectorAll('.unblock-desktop').length;
            const header = mainView.querySelector('.view-header, h2, .section-header');
            if (header) header.textContent = remaining ? `Blocked Songs` : `Blocked Songs`;
            if (!remaining) {
              const list = mainView.querySelector('.songs-list');
              if (list) list.innerHTML = '<p style="padding:16px;color:var(--muted)">No blocked songs</p>';
            }
          });
        });
      })
      .catch(() => {
        mainView.innerHTML = renderViewHeader('Blocked Songs') + '<div class="section"><p style="padding:16px;color:#e57373">Failed to load.</p></div>';
      });
  }


  async function startRandomPlays() {
    if (songs.length === 0) return;
    shuffleMode = true; localStorage.setItem('l5shuffle', '1');
    let queue = await buildShuffleQueue(songs);
    if (queue.length === 0) { await resetShuffleLog(); queue = await buildShuffleQueue(songs); }
    if (queue.length === 0) return;
    currentQueue = queue;
    currentIndex = 0;
    playSong(currentQueue[0]);
    loadView('now-playing');
  }

  function playSong(index) {
    if (index < 0 || index >= songs.length) return;
    if (currentQueue.length === 0 || !currentQueue.includes(index)) {
      currentQueue = shuffleMode ? shuffleArray([...songs.keys()]) : [...songs.keys()];
      currentIndex = index;
    } else { currentIndex = currentQueue.indexOf(index); }
    const song = songs[index];
    logShuffleSong(song.id, songs.length);
    localStorage.setItem('l5_last_song', String(song.id));
    audio.src = song.url || 'data:audio/mpeg;base64,//uQxAA==';
    nowPlayingTitle.textContent = song.title;
    nowPlayingArtist.textContent = '';
    if (coverImg) coverImg.src = (song.coverUrl || 'assets/music_logo.png');
    if (localStorage.getItem('random-volume') === 'true') {
      const randomVol = Math.random();
      audio.volume = randomVol; volumeSlider.value = randomVol; localStorage.setItem('volume', randomVol);
    }
    audio.currentTime = 0;
    audio.play().catch(err => console.error(err));
    playBtn.classList.add('playing');
    updateDesktopBlockBtn();
    if (!playSong._autoAdvance) {
      loadView('now-playing');
    } else {
      if (mainView.querySelector(".now-playing-portrait")) renderNowPlaying();
    }
  }

  async function playNext() {
    if (shuffleMode) {
      currentIndex++;
      if (currentIndex >= currentQueue.length) {
        await resetShuffleLog();
        currentQueue = await buildShuffleQueue(songs);
        currentIndex = 0;
        if (currentQueue.length === 0) return;
      }
      const idx = currentQueue[currentIndex];
      playSong._autoAdvance = true; playSong(idx); playSong._autoAdvance = false;
    } else {
      if (currentQueue.length === 0) return;
      let next = (currentIndex + 1) % currentQueue.length;
      let attempts = 0;
      while (isSongBlocked(songs[currentQueue[next]].id) && attempts < currentQueue.length) {
        next = (next + 1) % currentQueue.length;
        attempts++;
      }
      currentIndex = next;
      playSong._autoAdvance = true; playSong(currentQueue[currentIndex]); playSong._autoAdvance = false;
    }
  }

  function playPrev() {
    if (currentQueue.length === 0) return;
    currentIndex = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
    playSong._autoAdvance = true; playSong(currentQueue[currentIndex]); playSong._autoAdvance = false;
  }

  function shuffleArray(arr) { return arr.slice().sort(() => Math.random() - 0.5); }

  audio.addEventListener('play', () => { playBtn.classList.add('playing'); });
  audio.addEventListener('pause', () => { playBtn.classList.remove('playing'); });
  audio.addEventListener('ended', () => playNext());

  playBtn.addEventListener('click', () => {
    if (audio.src && !audio.paused) { audio.pause(); playBtn.classList.remove('playing'); }
    else if (audio.src) { audio.play().catch(err => console.error(err)); playBtn.classList.add('playing'); }
    else if (songs.length > 0) playSong(0);
  });
  nextBtn.addEventListener('click', playNext);
  prevBtn.addEventListener('click', playPrev);
  if (randomPlaysBtn) randomPlaysBtn.addEventListener('click', () => startRandomPlays());
  document.getElementById('desktop-block-btn')?.addEventListener('click', async () => {
    const idx = currentQueue[currentIndex]; if (idx === undefined) return; const song = songs[idx];
    if (!song) return;
    if (isSongBlocked(song.id)) { await unblockSong(song.id); showDesktopToast('Unblocked'); }
    else {
      const title = song.title || 'this song';
      if (!(await showConfirm(`Block "${title}"?`, 'Block'))) return;
      await blockSong(song.id); showDesktopToast('Blocked'); playNext();
    }
    updateDesktopBlockBtn();
    updateBlockBtn();
    updateLsBlockBtn();
  });
  volumeSlider.addEventListener('input', () => { audio.volume = parseFloat(volumeSlider.value); localStorage.setItem('volume', audio.volume); });

  navItems.forEach(item => {
    item.addEventListener('click', e => {
      const view = item.getAttribute('data-view');
      if (item.classList.contains('has-children')) { if (view === 'folders') return; item.classList.toggle('open'); return; }
      if (view === 'generate-playlists') { generateRandomPlaylist(); return; }
      if (view === 'random-plays') { startRandomPlays(); return; }
      if (view === 'settings') { renderSettings(); return; }
      loadView(view);
    });
  });

  document.querySelectorAll('#nav-items .sub-item').forEach(subItem => {
    subItem.addEventListener('click', e => { e.stopPropagation(); loadView(subItem.getAttribute('data-view')); });
  });

  const navSettingsBtn = document.getElementById('nav-settings');
  if (navSettingsBtn) navSettingsBtn.addEventListener('click', (e) => { loadView('settings'); e.currentTarget.blur(); });

  if (searchBtn) searchBtn.addEventListener('click', () => performSearch(searchInput.value.trim()));
  searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(searchInput.value.trim()); });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.playlist-actions')) {
      document.querySelectorAll('.playlist-dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });


  const foldersItem = document.querySelector('li[data-view="folders"]');
  if (foldersItem) {
    foldersItem.addEventListener('click', (e) => {
      if (!e.target.closest('.sub-nav')) foldersItem.classList.toggle('open');
    });
  }


  if (sidebarToggle && sidebarEl && sidebarBackdrop) {
    sidebarToggle.addEventListener('click', () => {
      const isOpen = sidebarEl.classList.toggle('open');
      sidebarBackdrop.classList.toggle('open', isOpen);
      sidebarBackdrop.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      sidebarToggle.setAttribute('aria-expanded', isOpen);
    });
    sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebarEl && sidebarEl.classList.contains('open')) closeMobileSidebar();
    });
  }

  (async () => {
    applyMenuPreferences();
    // Restore adapter from localStorage or go to settings
    if (!MusicAdapter.isReady() && !await MusicAdapter.restore()) {
      loadView('settings');
      return;
    }
    await Promise.all([fetchData(), loadBlockedSongs(), loadShuffleLog(), syncRole()]);
    loadView('now-playing');
  })();

  // ── ADMIN DELETE SONG (right-click / long-press) ──
  (function initDeleteSong() {
    const isAdmin = () => (localStorage.getItem('l5role') || 'user') === 'admin';
    const menu = document.createElement('div');
    menu.id = 'ctx-delete-menu';
    menu.style.cssText = 'display:none;position:fixed;z-index:9999;background:var(--bg-2);border:1px solid var(--stroke);border-radius:8px;padding:4px 0;box-shadow:0 8px 24px rgba(0,0,0,0.5);min-width:140px;';
    menu.innerHTML = '<div id="ctx-delete-btn" style="padding:10px 16px;color:#ff5555;font-size:0.9rem;cursor:pointer;">Delete Song</div>';
    document.body.appendChild(menu);

    let targetSongId = null;
    let targetEl = null;

    function getSongFromEl(el) {
      const si = el.closest('.song-item');
      if (si && si.dataset.index != null) return songs[parseInt(si.dataset.index, 10)];
      const lr = el.closest('.list-row[data-song]');
      if (lr) return songs[parseInt(lr.dataset.song, 10)];
      const ti = el.closest('[data-song-index]');
      if (ti) return songs[parseInt(ti.dataset.songIndex, 10)];
      // blocked view: song-item with data-sid on unblock button
      if (si) { const ub = si.querySelector('[data-sid]'); if (ub) return { id: ub.dataset.sid }; }
      return null;
    }

    function showMenu(x, y, song, el) {
      targetSongId = song.id; targetEl = el;
      menu.style.display = 'block';
      menu.style.left = Math.min(x, window.innerWidth - 160) + 'px';
      menu.style.top = Math.min(y, window.innerHeight - 50) + 'px';
    }
    function hideMenu() { menu.style.display = 'none'; targetSongId = null; targetEl = null; }
    document.addEventListener('click', (e) => { if (!menu.contains(e.target)) hideMenu(); });

    // Desktop: right-click
    document.addEventListener('contextmenu', (e) => {
      if (!isAdmin()) return;
      const song = getSongFromEl(e.target);
      if (!song) return;
      e.preventDefault();
      showMenu(e.clientX, e.clientY, song, e.target.closest('.song-item,.list-row,[data-song-index]'));
    });

    // Mobile: long-press
    let lpTimer = null; let lpTarget = null;
    document.addEventListener('touchstart', (e) => {
      if (!isAdmin()) return;
      const song = getSongFromEl(e.target);
      if (!song) return;
      lpTarget = { song, el: e.target.closest('.song-item,.list-row,[data-song-index]'), x: e.touches[0].clientX, y: e.touches[0].clientY };
      lpTimer = setTimeout(() => {
        e.preventDefault();
        showMenu(lpTarget.x, lpTarget.y, lpTarget.song, lpTarget.el);
        lpTimer = null;
      }, 500);
    }, { passive: false });
    document.addEventListener('touchmove', () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } });
    document.addEventListener('touchend', () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } });

    // Delete action
    document.getElementById('ctx-delete-btn').addEventListener('click', async () => {
      if (!targetSongId) return;
      const sid = targetSongId; const el = targetEl;
      hideMenu();
      if (!await l5confirm('Delete this song permanently?')) return;
      try {
        const r = { ok: true, json: async () => await MusicAdapter.deleteSong(sid) };
        const d = await r.json();
        if (d.ok) {
          const oldIdx = songs.findIndex(s => s.id === sid);
          const wasPlaying = oldIdx >= 0 && currentQueue[currentIndex] === oldIdx;
          songs = songs.filter(s => s.id !== sid);
          blockedSongIds.delete(String(sid));
          if (oldIdx >= 0) {
            currentQueue = currentQueue.filter(i => i !== oldIdx).map(i => i > oldIdx ? i - 1 : i);
            if (currentIndex >= currentQueue.length) currentIndex = Math.max(0, currentQueue.length - 1);
          }
          if (el) el.remove();
          if (wasPlaying && currentQueue.length) { audio.pause(); audio.src = "";
            playSong(currentQueue[currentIndex]);
          } else if (wasPlaying) {
            audio.pause(); audio.src = '';
          }
          showDesktopToast('Song deleted');
        } else { showDesktopToast(d.error || 'Delete failed'); }
      } catch (e) { showDesktopToast('Delete failed'); }
    });
  })();

  // ── WEBSOCKET SYNC HANDLER ──
  window._onWsSync = function(msg) {
    if (!msg.songId || !msg.queueIds) return;
    // Rebuild queue from synced song IDs
    const newQueue = msg.queueIds.map(id => songs.findIndex(s => String(s.id) === String(id))).filter(i => i >= 0);
    if (!newQueue.length) return;
    currentQueue = newQueue;
    currentIndex = msg.currentIndex || 0;
    if (currentIndex >= currentQueue.length) currentIndex = 0;
    const songIdx = currentQueue[currentIndex];
    const song = songs[songIdx];
    if (!song) return;
    localStorage.setItem('l5_last_song', String(song.id));
    // Update UI but don't play audio
    nowPlayingTitle.textContent = song.title;
    nowPlayingArtist.textContent = song.artist || '';
    if (coverImg) coverImg.src = song.coverUrl || 'assets/music_logo.png';
    if (!audio.src || audio.paused) {
      audio.src = song.url || '';
      audio.load();
      audio.currentTime = msg.position || 0;
    }
    if (mainView.querySelector(".now-playing-portrait")) renderNowPlaying();
  };

} // end initDesktop()
