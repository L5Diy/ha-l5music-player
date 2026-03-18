/**
 * Subsonic adapter — works with Navidrome, Airsonic, Gonic, etc.
 * Uses Subsonic REST API: http://www.subsonic.org/pages/api.jsp
 */
(function () {
  let server = '';
  let username = '';
  let salt = '';
  let tokenHash = '';
  let clientName = 'L5MusicPlayer';
  let apiVersion = '1.16.1';

  function makeSalt() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = '';
    for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  async function md5(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('MD5', buf).catch(() => null);
    if (hash) {
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback: simple MD5 for environments without crypto.subtle MD5
    // Most browsers don't support MD5 via subtle, so we use a minimal impl
    return md5Fallback(str);
  }

  // Minimal MD5 implementation for token auth
  function md5Fallback(string) {
    function md5cycle(x, k) {
      var a = x[0], b = x[1], c = x[2], d = x[3];
      a = ff(a,b,c,d,k[0],7,-680876936);d = ff(d,a,b,c,k[1],12,-389564586);c = ff(c,d,a,b,k[2],17,606105819);b = ff(b,c,d,a,k[3],22,-1044525330);
      a = ff(a,b,c,d,k[4],7,-176418897);d = ff(d,a,b,c,k[5],12,1200080426);c = ff(c,d,a,b,k[6],17,-1473231341);b = ff(b,c,d,a,k[7],22,-45705983);
      a = ff(a,b,c,d,k[8],7,1770035416);d = ff(d,a,b,c,k[9],12,-1958414417);c = ff(c,d,a,b,k[10],17,-42063);b = ff(b,c,d,a,k[11],22,-1990404162);
      a = ff(a,b,c,d,k[12],7,1804603682);d = ff(d,a,b,c,k[13],12,-40341101);c = ff(c,d,a,b,k[14],17,-1502002290);b = ff(b,c,d,a,k[15],22,1236535329);
      a = gg(a,b,c,d,k[1],5,-165796510);d = gg(d,a,b,c,k[6],9,-1069501632);c = gg(c,d,a,b,k[11],14,643717713);b = gg(b,c,d,a,k[0],20,-373897302);
      a = gg(a,b,c,d,k[5],5,-701558691);d = gg(d,a,b,c,k[10],9,38016083);c = gg(c,d,a,b,k[15],14,-660478335);b = gg(b,c,d,a,k[4],20,-405537848);
      a = gg(a,b,c,d,k[9],5,568446438);d = gg(d,a,b,c,k[14],9,-1019803690);c = gg(c,d,a,b,k[3],14,-187363961);b = gg(b,c,d,a,k[8],20,1163531501);
      a = gg(a,b,c,d,k[13],5,-1444681467);d = gg(d,a,b,c,k[2],9,-51403784);c = gg(c,d,a,b,k[7],14,1735328473);b = gg(b,c,d,a,k[12],20,-1926607734);
      a = hh(a,b,c,d,k[5],4,-378558);d = hh(d,a,b,c,k[8],11,-2022574463);c = hh(c,d,a,b,k[11],16,1839030562);b = hh(b,c,d,a,k[14],23,-35309556);
      a = hh(a,b,c,d,k[1],4,-1530992060);d = hh(d,a,b,c,k[4],11,1272893353);c = hh(c,d,a,b,k[7],16,-155497632);b = hh(b,c,d,a,k[10],23,-1094730640);
      a = hh(a,b,c,d,k[13],4,681279174);d = hh(d,a,b,c,k[0],11,-358537222);c = hh(c,d,a,b,k[3],16,-722521979);b = hh(b,c,d,a,k[6],23,76029189);
      a = hh(a,b,c,d,k[9],4,-640364487);d = hh(d,a,b,c,k[12],11,-421815835);c = hh(c,d,a,b,k[15],16,530742520);b = hh(b,c,d,a,k[2],23,-995338651);
      a = ii(a,b,c,d,k[0],6,-198630844);d = ii(d,a,b,c,k[7],10,1126891415);c = ii(c,d,a,b,k[14],15,-1416354905);b = ii(b,c,d,a,k[5],21,-57434055);
      a = ii(a,b,c,d,k[12],6,1700485571);d = ii(d,a,b,c,k[3],10,-1894986606);c = ii(c,d,a,b,k[10],15,-1051523);b = ii(b,c,d,a,k[1],21,-2054922799);
      a = ii(a,b,c,d,k[8],6,1873313359);d = ii(d,a,b,c,k[15],10,-30611744);c = ii(c,d,a,b,k[6],15,-1560198380);b = ii(b,c,d,a,k[13],21,1309151649);
      a = ii(a,b,c,d,k[4],6,-145523070);d = ii(d,a,b,c,k[11],10,-1120210379);c = ii(c,d,a,b,k[2],15,718787259);b = ii(b,c,d,a,k[9],21,-343485551);
      x[0] = add32(a,x[0]);x[1] = add32(b,x[1]);x[2] = add32(c,x[2]);x[3] = add32(d,x[3]);
    }
    function cmn(q,a,b,x,s,t){a=add32(add32(a,q),add32(x,t));return add32((a<<s)|(a>>>(32-s)),b);}
    function ff(a,b,c,d,x,s,t){return cmn((b&c)|((~b)&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&(~d)),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t){return cmn(c^(b|(~d)),a,b,x,s,t);}
    function add32(a,b){return(a+b)&0xFFFFFFFF;}
    var n = string.length, state = [1732584193,-271733879,-1732584194,271733878], i;
    for (i = 64; i <= n; i += 64) {
      var s = string.substring(i-64,i), tail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
      for (var j = 0; j < 64; j++) tail[j>>2] |= s.charCodeAt(j) << ((j%4)<<3);
      md5cycle(state, tail);
    }
    s = string.substring(i-64);
    tail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    for (j = 0; j < s.length; j++) tail[j>>2] |= s.charCodeAt(j) << ((j%4)<<3);
    tail[j>>2] |= 0x80 << ((j%4)<<3);
    if (j > 55) { md5cycle(state, tail); tail = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; }
    tail[14] = n * 8;
    md5cycle(state, tail);
    var hex = '';
    for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) hex += ((state[i]>>((j*8))&0xFF)).toString(16).padStart(2,'0');
    return hex;
  }

  function authParams() {
    return `u=${encodeURIComponent(username)}&t=${tokenHash}&s=${salt}&v=${apiVersion}&c=${clientName}&f=json`;
  }

  async function get(path) {
    const url = server + '/rest' + path + (path.includes('?') ? '&' : '?') + authParams();
    const r = await fetch(url);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const resp = d['subsonic-response'];
    if (!resp || resp.status !== 'ok') throw new Error(resp?.error?.message || 'Subsonic error');
    return resp;
  }

  // Internal: flatten nested artist/album structures into flat song list
  let _allSongs = [];
  let _playlists = [];

  MusicAdapter.register('subsonic', {
    async init(cfg) {
      server = (cfg.server || '').replace(/\/$/, '');
      username = cfg.username || '';
      const password = cfg.password || '';
      salt = makeSalt();
      tokenHash = md5Fallback(password + salt);
      _allSongs = [];
    },

    async ping() {
      const d = await get('/ping');
      return true;
    },

    async getMe() {
      return { username, role: 'user' };
    },

    async getSongs(opts) {
      // Subsonic doesn't have a flat song list — we fetch via search or random
      if (_allSongs.length === 0) {
        // Use search3 with empty query to get all songs (Navidrome supports this)
        try {
          const d = await get('/search3?query=""&songCount=10000&albumCount=0&artistCount=0');
          const results = d.searchResult3 || {};
          _allSongs = (results.song || []).map(mapSong);
        } catch {
          // Fallback: get random songs
          const d = await get('/getRandomSongs?size=500');
          _allSongs = (d.randomSongs?.song || []).map(mapSong);
        }
      }
      let list = _allSongs;
      if (opts && opts.folder && opts.folder !== 'all') {
        list = list.filter(s => s.folder === opts.folder);
      }
      return list;
    },

    async getRandomSongs(opts) {
      const size = (opts && opts.size) || 500;
      const d = await get('/getRandomSongs?size=' + size);
      return (d.randomSongs?.song || []).map(mapSong);
    },

    async getSong(id) {
      const d = await get('/getSong?id=' + encodeURIComponent(id));
      return d.song ? mapSong(d.song) : null;
    },

    async getArtists() {
      const d = await get('/getArtists');
      const idx = d.artists?.index || [];
      const artists = [];
      idx.forEach(i => (i.artist || []).forEach(a => artists.push({ name: a.name, count: a.albumCount || 0 })));
      return artists;
    },

    async getAlbums() {
      const d = await get('/getAlbumList2?type=alphabeticalByName&size=500');
      return (d.albumList2?.album || []).map(a => ({ name: a.name || a.title, artist: a.artist || '', count: a.songCount || 0 }));
    },

    async search(query) {
      const d = await get('/search3?query=' + encodeURIComponent(query) + '&songCount=100&albumCount=0&artistCount=0');
      return (d.searchResult3?.song || []).map(mapSong);
    },

    getStreamUrl(id) {
      return server + '/rest/stream?id=' + encodeURIComponent(id) + '&' + authParams();
    },

    getCoverUrl(id) {
      return id ? server + '/rest/getCoverArt?id=' + encodeURIComponent(id) + '&size=300&' + authParams() : '';
    },

    async rescan() {
      try { await get('/startScan'); } catch {}
      return { ok: true };
    },

    async getFolders() {
      try {
        const d = await get('/getMusicFolders');
        const mf = d.musicFolders?.musicFolder || [];
        return ['default', ...mf.map(f => f.name)];
      } catch(e) { return ['default']; }
    },

    // Playlists
    async getPlaylists() {
      const d = await get('/getPlaylists');
      return (d.playlists?.playlist || []).map(p => ({ id: p.id, name: p.name, count: p.songCount || 0 }));
    },

    async getPlaylist(id) {
      const d = await get('/getPlaylist?id=' + encodeURIComponent(id));
      const pl = d.playlist || {};
      return { id: pl.id, name: pl.name, songs: (pl.entry || []).map(mapSong) };
    },

    async createPlaylist(name) {
      const d = await get('/createPlaylist?name=' + encodeURIComponent(name));
      return d.playlist || { id: Date.now(), name };
    },

    async updatePlaylist(id, data) {
      let url = '/updatePlaylist?playlistId=' + encodeURIComponent(id);
      if (data.name) url += '&name=' + encodeURIComponent(data.name);
      if (data.songs) data.songs.forEach(sid => { url += '&songIdToAdd=' + encodeURIComponent(sid); });
      await get(url);
      return { ok: true };
    },

    async deletePlaylist(id) {
      await get('/deletePlaylist?id=' + encodeURIComponent(id));
      return { ok: true };
    },

    // Blocked / Shuffle — Subsonic doesn't support these natively
    // Store locally in localStorage
    async getBlocked() {
      return JSON.parse(localStorage.getItem('l5p_blocked') || '[]');
    },
    async blockSong(songId) {
      const list = JSON.parse(localStorage.getItem('l5p_blocked') || '[]');
      if (!list.includes(songId)) { list.push(songId); localStorage.setItem('l5p_blocked', JSON.stringify(list)); }
      return { ok: true };
    },
    async unblockSong(songId) {
      const list = JSON.parse(localStorage.getItem('l5p_blocked') || '[]').filter(id => id !== songId);
      localStorage.setItem('l5p_blocked', JSON.stringify(list));
      return { ok: true };
    },

    async getShuffleLog() {
      return JSON.parse(localStorage.getItem('l5p_shuffle_log') || '[]');
    },
    async logShuffle(songId, totalSongs) {
      const log = JSON.parse(localStorage.getItem('l5p_shuffle_log') || '[]');
      log.push({ songId, totalSongs, ts: Date.now() });
      localStorage.setItem('l5p_shuffle_log', JSON.stringify(log));
      return { ok: true };
    },
    async clearShuffleLog() {
      localStorage.setItem('l5p_shuffle_log', '[]');
      return { ok: true };
    },
  });

  // Map Subsonic song object to our standard format
  function mapSong(s) {
    return {
      id: s.id,
      title: s.title || '?',
      artist: s.artist || '',
      album: s.album || '',
      duration: s.duration || 0,
      folder: s.path ? s.path.split('/')[0] || 'default' : 'default',
      hasCover: !!s.coverArt,
      coverArtId: s.coverArt || s.id,
    };
  }
})();
