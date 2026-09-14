const Storage = {
  KEY: 'rpg_v1',
  get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  },
  set(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch(e) {}
  },
  clear() { localStorage.removeItem(this.KEY); }
};
