/* CastAudio — drop-in Audio replacement that routes to Pi mpv */
class CastAudio extends EventTarget {
  constructor(castUrl) {
    super();
    this._castUrl = castUrl || location.origin;
    this._src = ''; this._volume = 0.8;
    this._currentTime = 0; this._duration = 0;
    this._paused = true; this._ended = false;
    this._prevState = 'idle';
    this._pollId = setInterval(() => this._poll(), 1500);
  }
  get src() { return this._src; }
  set src(url) { this._src = url; this._ended = false; }
  get volume() { return this._volume; }
  set volume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    fetch(this._castUrl+'/cast/volume',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({level:Math.round(this._volume*100)})}).catch(()=>{});
  }
  get currentTime() { return this._currentTime; }
  set currentTime(t) {
    this._currentTime = t;
    fetch(this._castUrl+'/cast/seek',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({position:t})}).catch(()=>{});
  }
  get duration() { return this._duration; }
  get paused() { return this._paused; }
  get ended() { return this._ended; }
  get muted() { return false; }
  set muted(v) {}
  load() {}
  play() {
    if (!this._src) return Promise.resolve();
    if (this._paused && this._prevState === 'paused') {
      return fetch(this._castUrl+'/cast/resume',{method:'POST'}).then(()=>{
        this._paused=false;
        this.dispatchEvent(new Event('play'));
      }).catch(()=>{});
    }
    return fetch(this._castUrl+'/cast/load',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({streamUrl:this._src})
    }).then(()=>{
      this._paused=false;this._currentTime=0;this._duration=0;this._ended=false;
      this.dispatchEvent(new Event('play'));
    }).catch(e=>console.error('[cast] load error',e));
  }
  pause() {
    fetch(this._castUrl+'/cast/pause',{method:'POST'}).then(()=>{
      this._paused=true;
      this.dispatchEvent(new Event('pause'));
    }).catch(()=>{});
  }
  async _poll() {
    try {
      const r = await fetch(this._castUrl+'/cast/status');
      if (!r.ok) return;
      const d = await r.json();
      if (!d.ok) return;
      if (typeof d.position==="number") this._currentTime=d.position;
      if (typeof d.duration==="number"&&d.duration>0) {
        if (this._duration===0&&d.duration>0) { this._duration=d.duration; this.dispatchEvent(new Event("loadedmetadata")); }
        else this._duration=d.duration;
      }
      const oldState = this._prevState;
      if (d.state==='playing') {
        this._paused=false;
        if (oldState!=='playing') this.dispatchEvent(new Event('play'));
      } else if (d.state==='paused') {
        this._paused=true;
        if (oldState==='playing') this.dispatchEvent(new Event('pause'));
      } else if (d.state==='idle'&&oldState==='playing') {
        this._paused=true;this._ended=true;this._currentTime=0;
        this.dispatchEvent(new Event('ended'));
      }
      this._prevState = d.state;
      if (d.state==='playing'||d.state==='paused') {
        this.dispatchEvent(new Event('timeupdate'));
      }
    } catch {}
  }
  destroy() { clearInterval(this._pollId); }
}
