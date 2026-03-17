# L5Music Player — Home Assistant Integration

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)

A Home Assistant custom integration that controls [L5Music Player](https://github.com/L5Diy/L5Music) — a lightweight Node.js + mpv music playback server for Raspberry Pi.

L5Music Player acts as a cast receiver: your browser or HA dashboard sends stream URLs, and the Pi plays them through whatever audio output is active (Bluetooth speaker, HDMI, headphones, etc.).

## Features

- **Media player entity** — appears as a standard HA media player card
- **Play / Pause / Stop / Seek / Volume** — full transport controls
- **Play any URL** — use `media_player.play_media` to play any audio URL
- **No hardcoded audio device** — plays to whatever PipeWire/PulseAudio default sink is active
- **Config flow** — add via Settings → Devices & Services (no YAML needed)
- **HACS compatible** — install through HACS as a custom repository

## Requirements

A running **l5music-player** instance (Node.js + mpv) accessible on your network. See [L5Music Player setup](https://github.com/L5Diy/L5Music).

## Installation

### HACS (Recommended)

1. Open HACS in your Home Assistant
2. Click the three dots menu → **Custom repositories**
3. Add `https://github.com/L5Diy/l5music-player-ha` as an **Integration**
4. Search for "L5Music Player" and install
5. Restart Home Assistant

### Manual

1. Copy the `custom_components/l5music_player` folder to your `config/custom_components/` directory
2. Restart Home Assistant

## Configuration

1. Go to **Settings → Devices & Services → Add Integration**
2. Search for **L5Music Player**
3. Enter the host (IP address) and port (default: 3003) of your l5music-player instance
4. Done — the media player entity appears on your dashboard

## Usage

### Dashboard

Add a **Media Player** card pointing to `media_player.l5music_player` and control playback directly.

### Automations

```yaml
# Play a URL
action: media_player.play_media
target:
  entity_id: media_player.l5music_player
data:
  media_content_type: music
  media_content_id: "http://your-server:3002/stream?id=123&token=abc"
```

```yaml
# Pause
action: media_player.media_pause
target:
  entity_id: media_player.l5music_player
```

```yaml
# Set volume to 50%
action: media_player.volume_set
target:
  entity_id: media_player.l5music_player
data:
  volume_level: 0.5
```

## L5Music Player API

The integration communicates with these endpoints on the l5music-player server:

| Endpoint | Method | Description |
|---|---|---|
| `/ping` | GET | Health check |
| `/cast/status` | GET | Current playback state |
| `/cast/load` | POST | Load and play a stream URL |
| `/cast/pause` | POST | Pause playback |
| `/cast/resume` | POST | Resume playback |
| `/cast/stop` | POST | Stop and clear |
| `/cast/seek` | POST | Seek to position |
| `/cast/volume` | POST | Set volume (0-100) |

## License

MIT
