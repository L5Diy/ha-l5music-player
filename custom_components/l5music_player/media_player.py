"""L5Music Player media player entity."""
from __future__ import annotations

import asyncio
from datetime import timedelta
import logging
from typing import Any

import aiohttp

from homeassistant.components.media_player import (
    MediaPlayerDeviceClass,
    MediaPlayerEntity,
    MediaPlayerEntityFeature,
    MediaPlayerState,
    MediaType,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST, CONF_PORT
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import DOMAIN, SCAN_INTERVAL_SECONDS

_LOGGER = logging.getLogger(__name__)

SCAN_INTERVAL = timedelta(seconds=SCAN_INTERVAL_SECONDS)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up L5Music Player media player from a config entry."""
    host = entry.data[CONF_HOST]
    port = entry.data[CONF_PORT]
    async_add_entities([L5MusicPlayerEntity(entry, host, port)], True)


class L5MusicPlayerEntity(MediaPlayerEntity):
    """Representation of an L5Music Player."""

    _attr_device_class = MediaPlayerDeviceClass.SPEAKER
    _attr_has_entity_name = True
    _attr_name = None  # Uses device name
    _attr_supported_features = (
        MediaPlayerEntityFeature.PAUSE
        | MediaPlayerEntityFeature.PLAY
        | MediaPlayerEntityFeature.STOP
        | MediaPlayerEntityFeature.VOLUME_SET
        | MediaPlayerEntityFeature.VOLUME_STEP
        | MediaPlayerEntityFeature.SEEK
        | MediaPlayerEntityFeature.PLAY_MEDIA
        | MediaPlayerEntityFeature.NEXT_TRACK
        | MediaPlayerEntityFeature.PREVIOUS_TRACK
    )

    def __init__(self, entry: ConfigEntry, host: str, port: int) -> None:
        """Initialize the L5Music Player entity."""
        self._host = host
        self._port = port
        self._base_url = f"http://{host}:{port}"
        self._entry = entry

        self._attr_unique_id = f"{host}:{port}"
        self._attr_device_info = {
            "identifiers": {(DOMAIN, f"{host}:{port}")},
            "name": "L5Music Player",
            "manufacturer": "L5Diy",
            "model": "L5Music Player",
            "sw_version": "1.0.0",
        }

        # State
        self._attr_state = MediaPlayerState.IDLE
        self._attr_volume_level = 1.0
        self._attr_media_title = None
        self._attr_media_artist = None
        self._attr_media_album_name = None
        self._attr_media_content_type = MediaType.MUSIC
        self._attr_media_duration = None
        self._attr_media_position = None
        self._attr_media_position_updated_at = None
        self._attr_media_image_url = None
        self._available = True
        self._sw_version = None

    @property
    def available(self) -> bool:
        """Return True if entity is available."""
        return self._available

    async def _api_call(
        self, method: str, path: str, json_data: dict | None = None
    ) -> dict | None:
        """Make an API call to l5music-player."""
        url = f"{self._base_url}{path}"
        try:
            async with aiohttp.ClientSession() as session:
                kwargs: dict[str, Any] = {"timeout": aiohttp.ClientTimeout(total=5)}
                if json_data is not None:
                    kwargs["json"] = json_data
                if method == "GET":
                    async with session.get(url, **kwargs) as resp:
                        if resp.status == 200:
                            return await resp.json()
                elif method == "POST":
                    async with session.post(url, **kwargs) as resp:
                        if resp.status == 200:
                            return await resp.json()
        except (aiohttp.ClientError, asyncio.TimeoutError):
            _LOGGER.debug("Cannot connect to %s", url)
            return None
        except Exception:
            _LOGGER.exception("Error calling %s", url)
            return None
        return None

    async def async_update(self) -> None:
        """Fetch latest state from l5music-player."""
        data = await self._api_call("GET", "/cast/status")
        if data is None or not data.get("ok"):
            self._available = False
            return

        self._available = True
        state_str = data.get("state", "idle")

        if state_str == "playing":
            self._attr_state = MediaPlayerState.PLAYING
        elif state_str == "paused":
            self._attr_state = MediaPlayerState.PAUSED
        else:
            self._attr_state = MediaPlayerState.IDLE

        self._attr_volume_level = (data.get("volume", 100) or 100) / 100.0

        song = data.get("song")
        if song:
            self._attr_media_title = song.get("title") or None
            self._attr_media_artist = song.get("artist") or None
            self._attr_media_album_name = song.get("album") or None
            self._attr_media_image_url = song.get("coverUrl") or None
        else:
            self._attr_media_title = None
            self._attr_media_artist = None
            self._attr_media_album_name = None
            self._attr_media_image_url = None

        duration = data.get("duration", 0) or 0
        position = data.get("position", 0) or 0
        self._attr_media_duration = int(duration) if duration else None
        self._attr_media_position = int(position) if position else None
        self._attr_media_position_updated_at = dt_util.utcnow()

    # ── Playback controls ──────────────────────────────────────────────────

    async def async_media_play(self) -> None:
        """Send resume command."""
        await self._api_call("POST", "/cast/resume")

    async def async_media_pause(self) -> None:
        """Send pause command."""
        await self._api_call("POST", "/cast/pause")

    async def async_media_stop(self) -> None:
        """Send stop command."""
        await self._api_call("POST", "/cast/stop")

    async def async_media_next_track(self) -> None:
        """Send next track command.

        Note: Queue is managed by the PWA. This is a placeholder
        for HA automations that might send next/prev via the API.
        The l5music-player server can be extended to support
        server-side queue management if needed.
        """
        _LOGGER.debug("next_track called — queue is PWA-managed")

    async def async_media_previous_track(self) -> None:
        """Send previous track command."""
        _LOGGER.debug("previous_track called — queue is PWA-managed")

    async def async_media_seek(self, position: float) -> None:
        """Seek to a position."""
        await self._api_call("POST", "/cast/seek", {"position": position})

    async def async_set_volume_level(self, volume: float) -> None:
        """Set volume level (0..1)."""
        await self._api_call("POST", "/cast/volume", {"level": int(volume * 100)})

    async def async_volume_up(self) -> None:
        """Turn volume up."""
        current = self._attr_volume_level or 0.5
        await self.async_set_volume_level(min(1.0, current + 0.05))

    async def async_volume_down(self) -> None:
        """Turn volume down."""
        current = self._attr_volume_level or 0.5
        await self.async_set_volume_level(max(0.0, current - 0.05))

    async def async_play_media(
        self,
        media_type: str,
        media_id: str,
        enqueue: str | None = None,
        announce: bool | None = None,
        **kwargs: Any,
    ) -> None:
        """Play a piece of media by URL.

        media_id should be a stream URL that mpv can play.
        Extra data can be passed via kwargs for title/artist metadata.
        """
        payload: dict[str, Any] = {"streamUrl": media_id}

        # Allow passing metadata via extra data
        extra = kwargs.get("extra") or {}
        if isinstance(extra, dict):
            payload["id"] = extra.get("id", "")
            payload["title"] = extra.get("title", "")
            payload["artist"] = extra.get("artist", "")
            payload["album"] = extra.get("album", "")
            payload["coverUrl"] = extra.get("coverUrl", "")

        await self._api_call("POST", "/cast/load", payload)
