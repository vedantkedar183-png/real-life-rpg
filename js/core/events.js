const EventBus = {
  _listeners: {},
  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  },
  off(event, cb) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(l => l !== cb);
  },
  emit(event, data) {
    if (!this._listeners[event]) return;
    this._listeners[event].forEach(cb => { try { cb(data); } catch(e) { console.error('EventBus error:', e); } });
  }
};
