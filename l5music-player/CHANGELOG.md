# Changelog

## 1.0.8

- Fix sidebar icons blowout on iPad/tablet screens

## 1.0.7

- Fix Pi Cast state: server was reporting "idle" during playback
- Simplified state logic: song loaded + duration > 0 = playing or paused
- Progress bar and timer now update during Pi Cast playback

## 1.0.6

- Fix progress bar timer: desktop ID mismatch (duration-time → total-time)

## 1.0.5

- Revert audio-proxy cast poll (caused flickering)
- Restore browser playback progress bar
- Keep server.js mpv unpause fix

## 1.0.4

- Fix Pi Cast: mpv auto-unpause after loading song
- Fix Pi Cast: progress bar sync with cast server
- Fix Pi Cast: loadedmetadata fires when real duration arrives
- AudioProxy cast poll drives UI updates directly

## 1.0.3

- Auto-add http:// when user forgets protocol in server URL or cast URL
- User-friendly error messages (not raw JSON errors)
- Custom modal for Pi Cast unavailable alert

## 1.0.2

- Pi Cast: show alert when not configured instead of silently failing
- Fix song restarting when switching playback output
- Preserve song position and play state on output switch

## 1.0.1

- Fix addon startup — override s6-overlay entrypoint

## 1.0.0

- Initial release
- Universal backend support
- Browser playback
- Pi Cast optional
- Dynamic music folder detection
- Theme customization
