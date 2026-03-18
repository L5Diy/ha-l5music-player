# L5Music Player — Feature Roadmap

## Playback Output Selector (Optional Feature)

### The Problem
When you play music in a browser, the audio is tied to that device.
Your phone is the speaker. You cannot use another app without interrupting the music.

### The Solution: Cast to Pi
A Playback Output option in Settings:

- **Browser** (default) — Audio plays through the browser on your device. Works everywhere.
- **Pi Cast** — Audio plays through the Pi speakers via mpv. Phone becomes a remote control.

### Why This Matters
**The goal is to free the phone.**

With Pi Cast:
- Pick songs on your phone
- Pi fetches audio and plays through its speakers (3.5mm, HDMI, USB DAC, Bluetooth)
- Close the browser, switch apps, watch YouTube, take a call — music keeps playing
- Open the PWA again anytime to skip, pause, or change songs

Without Pi Cast, your phone is the player. With Pi Cast, your phone is just the remote.

### How It Works
1. server.js runs on the Pi (Node.js + Express, 162 lines)
2. It spawns mpv in idle mode with an IPC socket
3. Frontend sends commands via HTTP:
   - POST /cast/load { streamUrl, title, artist } — play a song
   - POST /cast/pause / POST /cast/resume
   - POST /cast/seek { position } — seek to position
   - POST /cast/volume { level } — volume 0-100
   - GET /cast/status — current state, position, duration
4. server.js relays to mpv via Unix socket IPC
5. mpv handles audio: fetch stream, decode, output via PipeWire/ALSA

### Who Needs This
- Anyone running L5Music Player on a Raspberry Pi with speakers attached
- Home Assistant setups where the Pi is the media hub
- Anyone who wants a dedicated music player that does not tie up their phone

### Implementation Status
- [x] server.js with cast/mpv API (complete, 162 lines)
- [x] Cast API endpoints (load, pause, resume, stop, seek, volume, status)
- [ ] Playback Output toggle in Settings UI (Browser / Pi Cast)
- [ ] CastAudio shim (switchable drop-in for native Audio)
- [ ] Auto-detect server.js availability
