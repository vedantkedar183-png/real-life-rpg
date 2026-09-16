const Notifications = {
  init() {
    EventBus.on('xp:gained', ({ amount }) => {
      this.show('XP Gained!', `+${amount} XP earned`, '✨', 'toast-xp');
    });
    EventBus.on('coins:gained', ({ amount }) => {
      this.show('Coins Earned!', `+${amount} coins`, '🪙', 'toast-coin');
    });
    EventBus.on('achievement:unlocked', ({ name, icon }) => {
      this.show('Achievement Unlocked!', `${icon} ${name}`, '🏆', 'toast-achievement', 4000);
    });
    EventBus.on('player:leveled-up', ({ newLevel, title, avatar }) => {
      this._showLevelUp(newLevel, title, avatar);
    });
    EventBus.on('shop:purchased', ({ item }) => {
      this.show('Reward Claimed!', `${item.icon} ${item.name} — Enjoy!`, '🎉', 'toast-success');
    });
    EventBus.on('streak:updated', ({ streak }) => {
      if (streak > 0 && streak % 7 === 0) {
        this.show('Streak Milestone!', `${streak} days in a row! Amazing!`, '🔥', 'toast-achievement', 4000);
      }
    });
    document.getElementById('levelup-close')?.addEventListener('click', () => {
      document.getElementById('levelup-modal')?.classList.add('hidden');
    });
  },
  
  show(title, msg, icon, type = '', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icon}</span><div class="toast-content"><div class="toast-title">${title}</div>${msg ? `<div class="toast-msg">${msg}</div>` : ''}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  
  showError(msg) { this.show('Error', msg, '❌', 'toast-error'); },
  showInfo(title, msg) { this.show(title, msg, 'ℹ️', 'toast-success'); },
  
  _showLevelUp(level, title, avatar) {
    const modal = document.getElementById('levelup-modal');
    if (!modal) return;
    document.getElementById('levelup-icon').textContent = avatar;
    document.getElementById('levelup-level').textContent = `Level ${level}`;
    document.getElementById('levelup-title-earned').textContent = `Title Unlocked: ${title}`;
    modal.classList.remove('hidden');
    this._spawnParticles();
  },
  
  _spawnParticles() {
    const container = document.getElementById('levelup-particles');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#00d4ff','#b06ef3','#ffd700','#ff6b9d','#00f5a0'];
   const particleCount = 20;

for (let i = 0; i < particleCount; i++) {
      p.className = 'particle';
      const angle = (Math.random() * 360) * Math.PI / 180;
      const dist = 80 + Math.random() * 120;
      p.style.cssText = `left:50%;top:50%;background:${colors[Math.floor(Math.random()*colors.length)]};--dx:${Math.cos(angle)*dist}px;--dy:${Math.sin(angle)*dist}px;animation-delay:${Math.random()*0.3}s;`;
      container.appendChild(p);
    }
  }
};
