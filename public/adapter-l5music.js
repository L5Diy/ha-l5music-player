/**
 * L5Music adapter — talks to l5music-core API
 */
(function () {
  let server = '';
  let token = '';
  let user = '';

  function headers() {
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    return h;
  }

  async function get(path) {
    const r = await fetch(server + path, { headers: headers() });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  async function post(path, body) {
    const r = await fetch(server + path, {
      method: 'POST', headers: headers(), body: JSON.stringify(body)
    });
    return r.json();
  }

  async function put(path, body) {
    const r = await fetch(server + path, {
      method: 'PUT', headers: headers(), body: JSON.stringify(body)
    });
    return r.json();
  }

  async function del(path, body) {
    const r = await fetch(server + path, {
      method: 'DELETE', headers: headers(), body: body ? JSON.stringify(body) : undefined
    });
    return r.json();
  }

  MusicAdapter.register('l5music', {
    async init(cfg) {
      server = (cfg.server || '').replace(/\/$/, '');
      user = cfg.username || 'player';
      // If password provided, login to get session token
      if (cfg.password) {
        const r = await fetch(server + '/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, password: cfg.password })
        });
        const d = await r.json();
        if (!d.ok && !d.token) throw new Error(d.error || 'Login failed');
        token = d.token || '';
      } else if (cfg.token) {
        token = cfg.token;
      } else {
        token = '';
      }
    },

    async ping() {
      const d = await get('/ping');
      return d.ok;
    },

    async getMe() {
      const d = await get('/me');
      return { username: d.username || user, role: d.role || 'user' };
    },

    // Library
    async getSongs(opts) {
      let q = '?size=9999';
      if (opts && opts.folder && opts.folder !== 'all') q += '&folder=' + encodeURIComponent(opts.folder);
      const d = await get('/songs' + q);
      return (d.songs || []).map(s => ({
        id: s.id, title: s.title || '?', artist: s.artist || '', album: s.album || '',
        duration: s.duration || 0, folder: s.folder || 'default', hasCover: !!s.hasCover
      }));
    },

    async getRandomSongs(opts) {
      let q = '?size=' + (opts && opts.size || 500);
      if (opts && opts.folder && opts.folder !== 'all') q += '&folder=' + encodeURIComponent(opts.folder);
      const d = await get('/random' + q);
      return (d.songs || []).map(s => ({
        id: s.id, title: s.title || '?', artist: s.artist || '', album: s.album || '',
        duration: s.duration || 0, folder: s.folder || 'default', hasCover: !!s.hasCover
      }));
    },

    async getSong(id) {
      const d = await get('/songs/' + id);
      return d.song || null;
    },

    async getArtists() {
      const d = await get('/artists');
      return (d.artists || []).map(a => ({ name: a.name, count: a.count || 0 }));
    },

    async getAlbums() {
      const d = await get('/albums');
      return (d.albums || []).map(a => ({ name: a.name, artist: a.artist || '', count: a.count || 0 }));
    },

    async search(query) {
      const d = await get('/songs?search=' + encodeURIComponent(query) + '&size=9999');
      return (d.songs || []).map(s => ({
        id: s.id, title: s.title || '?', artist: s.artist || '', album: s.album || '',
        duration: s.duration || 0, hasCover: !!s.hasCover
      }));
    },

    getStreamUrl(id) {
      return server + '/stream?id=' + encodeURIComponent(id) + (token ? '&token=' + encodeURIComponent(token) : '');
    },

    getCoverUrl(id) {
      return id ? server + '/cover?id=' + encodeURIComponent(id) + (token ? '&token=' + encodeURIComponent(token) : '') : '';
    },

    async rescan() {
      const d = await get('/rescan');
      return d;
    },

    // Playlists
    async getPlaylists() {
      const d = await get('/playlists');
      return (d.playlists || []).map(p => ({ id: p.id, name: p.name, count: p.count || 0 }));
    },

    async getPlaylist(id) {
      const d = await get('/playlists/' + id);
      const pl = d.playlist || d;
      return { id: pl.id, name: pl.name, songs: pl.songs || [] };
    },

    async createPlaylist(name) {
      const d = await post('/playlists', { name });
      return d.playlist || d;
    },

    async updatePlaylist(id, data) {
      const d = await put('/playlists/' + id, data);
      return d;
    },

    async deletePlaylist(id) {
      return del('/playlists/' + id);
    },

    // Blocked
    async getBlocked() {
      const d = await get('/blocked?user=' + encodeURIComponent(user));
      return d.blocked || [];
    },

    async blockSong(songId) {
      return post('/blocked', { user, songId });
    },

    async unblockSong(songId) {
      return del('/blocked', { user, songId });
    },

    // Shuffle log
    async getShuffleLog() {
      const d = await get('/shuffle-log?user=' + encodeURIComponent(user));
      return d.log || [];
    },

    async logShuffle(songId, totalSongs) {
      return post('/shuffle-log', { user, songId, totalSongs });
    },

    async clearShuffleLog() {
      return del('/shuffle-log', { user });
    },

    // Optional
    async deleteSong(id) {
      return del('/songs/' + id);
    },
  });
})();
