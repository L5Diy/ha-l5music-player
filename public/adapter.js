/**
 * L5Music Player — Backend Adapter System
 * adapter.js — interface + manager
 *
 * Usage:
 *   adapter.init('l5music', { server: 'http://...', username, password })
 *   adapter.init('subsonic', { server: 'http://...', username, password })
 *   const songs = await adapter.getSongs();
 *   const url = adapter.getStreamUrl(songId);
 */

const MusicAdapter = (() => {
  const adapters = {};
  let active = null;
  let config = {};

  function register(name, impl) {
    adapters[name] = impl;
  }

  async function init(name, cfg) {
    if (!adapters[name]) throw new Error('Unknown adapter: ' + name);
    config = cfg || {};
    active = adapters[name];
    active._config = config;
    if (active.init) await active.init(config);
    // Save to localStorage
    localStorage.setItem('l5p_adapter', name);
    localStorage.setItem('l5p_adapter_config', JSON.stringify(config));
  }

  async function restore() {
    const name = localStorage.getItem('l5p_adapter');
    const cfg = localStorage.getItem('l5p_adapter_config');
    if (name && adapters[name]) {
      config = cfg ? JSON.parse(cfg) : {};
      active = adapters[name];
      active._config = config;
      if (active.init) await active.init(config);
      return true;
    }
    return false;
  }

  function isReady() { return !!active; }
  function getType() { return localStorage.getItem('l5p_adapter') || ''; }
  function getConfig() { return config; }

  // Proxy all calls to the active adapter
  function call(method, ...args) {
    if (!active) throw new Error('No adapter configured. Go to Settings.');
    if (!active[method]) throw new Error('Adapter does not support: ' + method);
    return active[method](...args);
  }

  return {
    register, init, restore, isReady, getType, getConfig,
    // Auth
    ping: () => call('ping'),
    getMe: () => call('getMe'),
    // Library
    getSongs: (opts) => call('getSongs', opts),
    getRandomSongs: (opts) => call('getRandomSongs', opts),
    getSong: (id) => call('getSong', id),
    getArtists: () => call('getArtists'),
    getAlbums: () => call('getAlbums'),
    search: (query) => call('search', query),
    getStreamUrl: (id) => call('getStreamUrl', id),
    getCoverUrl: (id) => call('getCoverUrl', id),
    rescan: () => call('rescan'),
    // Playlists
    getPlaylists: () => call('getPlaylists'),
    getPlaylist: (id) => call('getPlaylist', id),
    createPlaylist: (name) => call('createPlaylist', name),
    updatePlaylist: (id, data) => call('updatePlaylist', id, data),
    deletePlaylist: (id) => call('deletePlaylist', id),
    // User actions
    getBlocked: () => call('getBlocked'),
    blockSong: (songId) => call('blockSong', songId),
    unblockSong: (songId) => call('unblockSong', songId),
    getShuffleLog: () => call('getShuffleLog'),
    logShuffle: (songId, total) => call('logShuffle', songId, total),
    clearShuffleLog: () => call('clearShuffleLog'),
    // Optional
    deleteSong: (id) => call('deleteSong', id),
    // Feature flags
    supports: (feature) => active && typeof active[feature] === 'function',
  };
})();
