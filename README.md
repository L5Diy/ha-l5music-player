# L5Music Player

A universal music streaming PWA that works with any Subsonic-compatible server (Navidrome, Airsonic, Gonic) or L5Music.

**One frontend, any backend.** Open it in a browser, connect to your music server, play music.

## Features

- **Universal backend support** — L5Music, Navidrome, Airsonic, Gonic, or any Subsonic API server
- **Browser playback** — plays through your device (phone, laptop, tablet)
- **Pi Cast (optional)** — play through a Raspberry Pi with speakers, use your phone as a remote
- **Dynamic music folders** — auto-detects folder structure from your library
- **Playlists** — create, edit, reorder, delete
- **Shuffle, block, search** — full music player controls
- **Theme customization** — accent colors + background themes
- **Mobile + Desktop** — responsive PWA, works on any screen size
- **No account required** — just point to your server and play

## Quick Start

### Option 1: Self-host (any web server)

The frontend is just static files. Serve the `public/` folder with any web server:

```bash
# With Node.js
npx serve public

# With Python
cd public && python3 -m http.server 8080

# With nginx, Apache, Caddy — just point to the public/ folder
```

Then open `http://localhost:8080` in a browser and configure your backend in Settings.

### Option 2: Pi Cast (play through Pi speakers)

Run the one-click setup on a Raspberry Pi:

```bash
curl -sSL https://raw.githubusercontent.com/L5Diy/ha-l5music-player/main/setup-picast.sh | bash
```

This installs Node.js, mpv, and the player. The Pi serves the frontend and acts as a cast receiver. Your phone becomes a remote control — music plays from the Pi even when you close the browser.

## Setup

1. Open the player in any browser
2. Go to **Settings** → **Backend**
3. Select your backend type: **L5Music** or **Subsonic / Navidrome**
4. Enter your server URL, username, and password
5. Tap **Connect**
6. Start playing music

### Pi Cast (Optional)

To play music through a Pi's speakers instead of your phone:

1. Run `setup-picast.sh` on your Pi (see above)
2. In **Settings** → **Pi Cast**, enter the Pi's URL (e.g. `http://192.168.1.50:3003`)
3. Tap **Save**
4. Tap the **⋮** menu in the top bar → select **Pi Cast**
5. Music now plays from the Pi. Your phone is just the remote.

## Architecture

```
┌──────────────────────────────────────────────┐
│  Frontend (PWA)                              │
│  app.js + adapters + audio-proxy             │
│                                              │
│  ┌─────────────┐    ┌──────────────────┐     │
│  │ This Device  │    │ Pi Cast          │     │
│  │ <audio> tag  │    │ CastAudio → mpv  │     │
│  └─────────────┘    └──────────────────┘     │
└──────────────────┬───────────────────────────┘
                   │ adapter layer
        ┌──────────┴──────────┐
        │                     │
   L5Music API         Subsonic API
   (l5music-core)      (Navidrome, etc.)
```

## Files

| File | Purpose |
|------|---------|
| `public/app.js` | Main PWA (mobile + desktop) |
| `public/adapter.js` | Backend adapter interface |
| `public/adapter-l5music.js` | L5Music API adapter |
| `public/adapter-subsonic.js` | Subsonic/Navidrome adapter |
| `public/audio-proxy.js` | Hot-swappable playback (Audio ↔ CastAudio) |
| `public/cast-audio.js` | CastAudio shim for Pi Cast |
| `public/index.html` | HTML shell |
| `public/styles.css` | Desktop styles |
| `public/pwa.css` | Mobile styles |
| `server.js` | Pi Cast server (Node.js + mpv, 162 lines) |
| `setup-picast.sh` | One-click Pi Cast installer |
| `custom_components/` | Home Assistant integration |

## Home Assistant Integration

This repo also includes an HA custom component that exposes the Pi Cast server as a standard media player entity.

### Install via HACS

1. Open HACS → three dots → **Custom repositories**
2. Add `https://github.com/L5Diy/ha-l5music-player` as **Integration**
3. Search "L5Music Player" and install
4. Restart HA → Settings → Devices & Services → Add → L5Music Player
5. Enter Pi host and port (default 3003)

The media player card supports play, pause, stop, seek, and volume.

## License

MIT
