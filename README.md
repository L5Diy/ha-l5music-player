# L5Music Player — Home Assistant Add-on

A universal music streaming PWA that runs as a Home Assistant add-on. Works with Navidrome, Subsonic, Airsonic, Gonic, or L5Music.

**Install the add-on, open it, enter your music server URL, and play.**

## Install

1. In Home Assistant, go to **Settings → Add-ons → Add-on Store**
2. Click **⋮** (top right) → **Repositories**
3. Paste: `https://github.com/L5Diy/ha-l5music-player`
4. Click **Add** → Close
5. Find **L5Music Player** in the store → **Install**
6. Start the add-on → **Open Web UI**

## Setup

1. Go to **Settings** (in the player)
2. Select backend: **L5Music** or **Subsonic / Navidrome**
3. Enter your server URL, username, and password
4. Tap **Connect**
5. Play music

## Features

- **Universal backend** — works with any Subsonic-compatible server
- **Browser playback** — audio plays through your device
- **Mobile + Desktop** — responsive PWA
- **Dynamic music folders** — auto-detects from your library
- **Playlists** — create, edit, reorder, delete
- **Shuffle, block, search** — full player controls
- **Theme customization** — accent colors + backgrounds

## Architecture

```
Home Assistant
  └── L5Music Player Add-on (Docker)
        └── nginx → serves PWA on port 8099
              └── Frontend (adapter.js + app.js)
                    ├── L5Music API ──→ your L5Music server
                    └── Subsonic API ──→ your Navidrome / Airsonic / Gonic
```

The add-on is a lightweight Docker container running nginx. It serves static HTML/JS files. The frontend talks directly to your music server from the browser — no proxy, no middleware.

## Pi Cast (Optional)

Play music through a Raspberry Pi's speakers instead of your phone. Your phone becomes a remote control.

See [FEATURES.md](FEATURES.md) for details. This is a separate optional setup — not required for the add-on.

## License

MIT
