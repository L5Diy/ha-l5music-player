/* AudioProxy — wraps Audio or CastAudio, hot-swappable */
const AudioProxy = (() => {
  let backend = null;
  const listeners = [];
  function create() {
    const mode = localStorage.getItem('l5p_output') || 'browser';
    return (mode==='cast' && typeof CastAudio!=='undefined') ? new CastAudio(localStorage.getItem('l5p_cast_url')||'') : new Audio();
  }
  function attachListeners(b) {
    listeners.forEach(([ev, fn]) => b.addEventListener(ev, fn));
  }
  function detachListeners(b) {
    listeners.forEach(([ev, fn]) => b.removeEventListener(ev, fn));
  }
  backend = create();
  const proxy = {
    addEventListener(ev, fn) {
      listeners.push([ev, fn]);
      backend.addEventListener(ev, fn);
    },
    get src() { return backend.src; },
    set src(v) { backend.src = v; },
    get volume() { return backend.volume; },
    set volume(v) { backend.volume = v; },
    get currentTime() { return backend.currentTime; },
    set currentTime(v) { backend.currentTime = v; },
    get duration() { return backend.duration || 0; },
    get paused() { return backend.paused; },
    get ended() { return backend.ended; },
    get muted() { return backend.muted; },
    set muted(v) { backend.muted = v; },
    load() { backend.load(); },
    play() { return backend.play(); },
    pause() { backend.pause(); },
    swap(mode) {
      localStorage.setItem('l5p_output', mode);
      const wasSrc = backend.src;
      const wasTime = backend.currentTime;
      const wasPlaying = !backend.paused;
      try { backend.pause(); } catch(e) {}
      if (backend.destroy) backend.destroy();
      detachListeners(backend);
      backend = create();
      attachListeners(backend);
      if (wasSrc) {
        backend.src = wasSrc;
        backend.load();
        const restore = () => {
          backend.currentTime = wasTime;
          if (wasPlaying) backend.play().catch(()=>{});
          backend.removeEventListener('loadedmetadata', restore);
        };
        backend.addEventListener('loadedmetadata', restore);
      }
    },
    getMode() { return localStorage.getItem('l5p_output')||'browser'; }
  };
  return proxy;
})();
