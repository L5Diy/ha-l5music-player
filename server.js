'use strict';
const express = require('express');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = 3003;
const VERSION = 'b3';
const MPV_SOCKET = '/tmp/l5music-player-mpv.sock';

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ─── MPV IPC ─────────────────────────────────────────────────────────────────
let mpvProcess = null;
let requestId = 0;
const pending = new Map();
let ipcBuffer = '';
let ipcSocket = null;

const state = {
  playing: false, paused: false, idle: true,
  volume: 100, position: 0, duration: 0,
  song: null,
};

function startMpv() {
  try { fs.unlinkSync(MPV_SOCKET); } catch {}
  mpvProcess = spawn('mpv', ['--idle=yes', '--no-video', '--no-terminal', '--audio-display=no', `--input-ipc-server=${MPV_SOCKET}`], { stdio: 'ignore' });
  mpvProcess.on('exit', (code) => { console.log(`[mpv] exited ${code}, restarting...`); ipcSocket = null; setTimeout(startMpv, 2000); });
  const wait = () => { if (fs.existsSync(MPV_SOCKET)) connectIpc(); else setTimeout(wait, 200); };
  setTimeout(wait, 300);
}

function connectIpc() {
  const sock = net.createConnection(MPV_SOCKET);
  sock.setEncoding('utf8');
  sock.on('connect', () => {
    console.log('[mpv] IPC connected');
    ipcSocket = sock;
    mpvCommand('observe_property', [1, 'pause']);
    mpvCommand('observe_property', [2, 'volume']);
    mpvCommand('observe_property', [3, 'time-pos']);
    mpvCommand('observe_property', [4, 'duration']);
    mpvCommand('observe_property', [5, 'idle-active']);
    mpvCommand('observe_property', [6, 'core-idle']);
  });
  sock.on('data', (data) => {
    ipcBuffer += data;
    const lines = ipcBuffer.split('\n');
    ipcBuffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      try { handleMpvMessage(JSON.parse(line)); } catch {}
    }
  });
  sock.on('error', (err) => console.error('[mpv] IPC error:', err.message));
  sock.on('close', () => { console.log('[mpv] IPC disconnected'); ipcSocket = null; });
}

function mpvCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    if (!ipcSocket) return reject(new Error('mpv not connected'));
    const id = ++requestId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('timeout')); }, 5000);
    pending.set(id, { resolve, reject, timer });
    ipcSocket.write(JSON.stringify({ command: [command, ...args], request_id: id }) + '\n');
  });
}
function mpvSet(prop, value) { return mpvCommand('set_property', [prop, value]); }

function handleMpvMessage(msg) {
  if (msg.request_id && pending.has(msg.request_id)) {
    const p = pending.get(msg.request_id);
    clearTimeout(p.timer); pending.delete(msg.request_id);
    if (msg.error && msg.error !== 'success') p.reject(new Error(msg.error));
    else p.resolve(msg.data);
    return;
  }
  if (msg.event === 'property-change') {
    switch (msg.name) {
      case 'pause': state.paused = !!msg.data; state.playing = !state.paused && !state.idle; break;
      case 'volume': if (typeof msg.data === 'number') state.volume = Math.round(msg.data); break;
      case 'time-pos': if (typeof msg.data === 'number') state.position = msg.data; break;
      case 'duration': if (typeof msg.data === 'number') state.duration = msg.data; break;
      case 'idle-active': state.idle = !!msg.data; if (state.idle) { state.playing = false; state.position = 0; state.duration = 0; } break;
      case 'core-idle': if (!state.paused && !msg.data && !state.idle) state.playing = true; if (msg.data && !state.paused) state.playing = false; break;
    }
  }
  if (msg.event === 'end-file') { state.playing = false; state.idle = true; state.position = 0; state.duration = 0; }
}

// ─── CAST API ────────────────────────────────────────────────────────────────
app.get('/ping', (req, res) => {
  res.json({ ok: true, name: 'l5music-player', version: VERSION, mpv: !!ipcSocket });
});

app.post('/cast/load', async (req, res) => {
  const { id, streamUrl, title, artist, album, coverUrl } = req.body;
  if (!streamUrl) return res.status(400).json({ ok: false, error: 'streamUrl required' });
  try {
    state.song = { id, streamUrl, title: title || '', artist: artist || '', album: album || '', coverUrl: coverUrl || '' };
    await mpvCommand('loadfile', [streamUrl, 'replace']);
    setTimeout(() => mpvSet('pause', false).catch(()=>{}), 500);
    state.idle = false; state.playing = true; state.paused = false; state.position = 0;
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/cast/pause', async (req, res) => {
  try { await mpvSet('pause', true); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/cast/resume', async (req, res) => {
  try { await mpvSet('pause', false); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/cast/stop', async (req, res) => {
  try { await mpvCommand('stop'); state.song = null; state.playing = false; state.paused = false; state.idle = true; state.position = 0; state.duration = 0; res.json({ ok: true }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/cast/seek', async (req, res) => {
  const { position } = req.body;
  if (typeof position !== 'number') return res.status(400).json({ ok: false, error: 'position required' });
  try { await mpvCommand('seek', [position, 'absolute']); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.post('/cast/volume', async (req, res) => {
  const { level } = req.body;
  if (typeof level !== 'number') return res.status(400).json({ ok: false, error: 'level required' });
  try { await mpvSet('volume', Math.max(0, Math.min(100, level))); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

app.get('/cast/status', (req, res) => {
  let s = 'idle';
  if (state.song && state.duration > 0) {
    s = state.paused ? 'paused' : 'playing';
  }
  res.json({ ok: true, state: s, song: state.song, position: Math.round(state.position * 10) / 10, duration: Math.round(state.duration * 10) / 10, volume: state.volume });
});

// ─── STATIC + START ──────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[l5music-player] ${VERSION} listening on :${PORT}`);
  startMpv();
});
