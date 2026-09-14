const Dashboard = {
  init() {
    // Bind quest complete/delete events
    EventBus.on('quest:completed', () => { this.updateHud(); this.render(); });
    EventBus.on('player:leveled-up', () => { this.updateHud(); });
    EventBus.on('coins:gained', () => { this.updateHud(); });
    EventBus.on('state:updated', () => { this.updateHud(); this.render(); });
  },
  
  updateHud() {
    const p = State.player;
    const pct = p.xpToNextLevel > 0 ? Math.min(100, (p.xp / p.xpToNextLevel) * 100) : 100;
    const el = id => document.getElementById(id);
    if (el('hud-avatar')) el('hud-avatar').textContent = Player.getAvatarForLevel(p.level);
    if (el('hud-level')) el('hud-level').textContent = `Lv.${p.level}`;
    if (el('hud-name')) el('hud-name').textContent = p.name;
    if (el('hud-title')) el('hud-title').textContent = Player.getTitleForLevel(p.level);
    if (el('xp-bar')) el('xp-bar').style.width = `${pct}%`;
    if (el('xp-label')) el('xp-label').textContent = `${p.xp} / ${p.xpToNextLevel} XP`;
    if (el('hud-coins')) el('hud-coins').textContent = p.coins;
    if (el('hud-streak')) el('hud-streak').textContent = p.streak;
    if (el('shop-coins-display')) el('shop-coins-display').textContent = p.coins;
  },
  
  render() {
    const p = State.player;
    const quests = Quests.getAll();
    const completed = quests.filter(q => q.completed);
    const total = quests.length;
    const pct = total > 0 ? Math.round((completed.length / total) * 100) : 0;
    const today = new Date();
    const el = id => document.getElementById(id);
    
    if (el('dashboard-date')) el('dashboard-date').textContent = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (el('welcome-avatar')) el('welcome-avatar').textContent = Player.getAvatarForLevel(p.level);
    if (el('welcome-name')) el('welcome-name').textContent = `Welcome back, ${p.name}!`;
    if (el('welcome-subtitle')) el('welcome-subtitle').textContent = `Level ${p.level} ${Player.getTitleForLevel(p.level)} — keep going!`;
    if (el('welcome-streak-count')) el('welcome-streak-count').textContent = p.streak;
    
    // Daily ring
    const circumference = 314.16;
    const offset = circumference - (circumference * pct / 100);
    const ring = el('daily-ring');
    if (ring) { ring.style.strokeDasharray = `${circumference} ${circumference}`; ring.style.strokeDashoffset = offset; }
    if (el('daily-percent')) el('daily-percent').textContent = `${pct}%`;
    if (el('daily-completed')) el('daily-completed').textContent = completed.length;
    if (el('daily-total')) el('daily-total').textContent = total;
    
    // Quick stats
    if (el('stat-total-quests')) el('stat-total-quests').textContent = p.totalQuestsCompleted;
    if (el('stat-total-xp')) el('stat-total-xp').textContent = p.totalXp;
    if (el('stat-total-coins')) el('stat-total-coins').textContent = p.totalCoinsEarned;
    if (el('stat-achievements')) el('stat-achievements').textContent = Object.values(State.achievements).filter(a => a.unlocked).length;
    
    // Level progress
    if (el('dash-level-circle')) el('dash-level-circle').textContent = p.level;
    if (el('dash-level-title')) el('dash-level-title').textContent = Player.getTitleForLevel(p.level);
    const lvlPct = p.xpToNextLevel > 0 ? (p.xp / p.xpToNextLevel) * 100 : 100;
    if (el('dash-xp-bar')) el('dash-xp-bar').style.width = `${lvlPct}%`;
    if (el('dash-xp-text')) el('dash-xp-text').textContent = `${p.xp} / ${p.xpToNextLevel} XP to Level ${p.level + 1}`;
    
    // Quest preview
    this._renderQuestPreview();
    this._renderRecentAchievements();
  },
  
  _renderQuestPreview() {
    const container = document.getElementById('dash-quest-preview');
    if (!container) return;
    const quests = Quests.getAll().slice(0, 5);
    if (quests.length === 0) { container.innerHTML = '<p style="color:var(--text-muted);font-family:Exo 2,sans-serif;font-size:14px;">No quests yet. Create some!</p>'; return; }
    const catIcons = { study: '📚', exercise: '💪', reading: '📖', learning: '🔬', personal: '🎯' };
    container.innerHTML = quests.map(q => `
      <div class="quest-preview-item">
        <span class="qp-icon">${catIcons[q.category] || '📜'}</span>
        <span class="qp-name ${q.completed ? 'done' : ''}">${q.name}</span>
        <span class="qp-xp">+${q.xpReward} XP</span>
        <span class="qp-done">${q.completed ? '✅' : '⬜'}</span>
      </div>`).join('');
  },
  
  _renderRecentAchievements() {
    const container = document.getElementById('dash-recent-achievements');
    if (!container) return;
    const defs = Achievements.getAll();
    const unlocked = Object.entries(State.achievements)
      .filter(([,a]) => a.unlocked)
      .sort((a, b) => b[1].unlockedAt - a[1].unlockedAt)
      .slice(0, 3);
    if (unlocked.length === 0) { container.innerHTML = '<p style="color:var(--text-muted);font-family:Exo 2,sans-serif;font-size:14px;">No achievements yet. Complete quests!</p>'; return; }
    container.innerHTML = unlocked.map(([id, data]) => {
      const def = defs[id];
      if (!def) return '';
      const date = new Date(data.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `<div class="dash-achievement-item"><span class="dash-ach-icon">${def.icon}</span><div><div class="dash-ach-name">${def.name}</div><div class="dash-ach-date">${date}</div></div></div>`;
    }).join('');
  },
  
  renderQuests(filter = 'all') {
    const list = document.getElementById('quest-list');
    const empty = document.getElementById('quest-empty');
    if (!list) return;
    const quests = Quests.getFiltered(filter);
    if (quests.length === 0) {
      list.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }
    empty?.classList.add('hidden');
    const catIcons = { study: '📚', exercise: '💪', reading: '📖', learning: '🔬', personal: '🎯' };
    list.innerHTML = quests.map(q => `
      <div class="quest-card ${q.completed ? 'completed' : ''}" data-id="${q.id}" data-cat="${q.category}">
        <div class="quest-icon">${catIcons[q.category] || '📜'}</div>
        <div class="quest-body">
          <div class="quest-name ${q.completed ? 'done' : ''}">${q.name}</div>
          <div class="quest-meta">
            <span class="quest-cat-badge" data-cat="${q.category}">${q.category}</span>
            <span class="quest-diff-badge ${q.difficulty}">${q.difficulty}</span>
          </div>
        </div>
        <div class="quest-rewards">
          <span class="quest-xp">⚡ ${q.xpReward}</span>
          <span class="quest-coin">🪙 ${q.coinReward}</span>
        </div>
        <div class="quest-actions">
          <button class="quest-complete-btn ${q.completed ? 'done' : ''}" data-id="${q.id}">${q.completed ? '✅' : '○'}</button>
          <button class="quest-delete-btn" data-id="${q.id}">🗑️</button>
        </div>
      </div>`).join('');
    
    // Bind events
    list.querySelectorAll('.quest-complete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (Quests.complete(id)) {
          const card = list.querySelector(`.quest-card[data-id="${id}"]`);
          card?.classList.add('completing');
          setTimeout(() => this.renderQuests(filter), 100);
        }
      });
    });
    list.querySelectorAll('.quest-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this quest?')) {
          Quests.delete(btn.dataset.id);
          this.renderQuests(filter);
          this.render();
        }
      });
    });
  },
  
  renderAchievements() {
    const grid = document.getElementById('achievements-grid');
    const achUnlocked = document.getElementById('ach-unlocked');
    const achBar = document.getElementById('ach-progress-bar');
    if (!grid) return;
    const defs = Achievements.getAll();
    const unlockedCount = Object.values(State.achievements).filter(a => a.unlocked).length;
    if (achUnlocked) achUnlocked.textContent = unlockedCount;
    if (achBar) achBar.style.width = `${(unlockedCount / 22) * 100}%`;
    grid.innerHTML = Object.entries(defs).map(([id, def]) => {
      const ach = State.achievements[id];
      const unlocked = ach?.unlocked;
      const date = unlocked ? new Date(ach.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      return `
        <div class="ach-card ${unlocked ? 'unlocked' : 'locked'}">
          ${unlocked ? '<div class="ach-badge">✓</div>' : ''}
          <span class="ach-icon">${def.icon}</span>
          <div class="ach-name">${def.name}</div>
          <div class="ach-desc">${def.desc}</div>
          ${unlocked ? `<div class="ach-date">${date}</div>` : ''}
        </div>`;
    }).join('');
  },
  
  renderShop() {
    this._renderPresetShop();
    this.renderCustomShop();
  },
  
  _renderPresetShop() {
    const grid = document.getElementById('shop-rewards-grid');
    const coinsEl = document.getElementById('shop-coins-display');
    if (!grid) return;
    if (coinsEl) coinsEl.textContent = State.player.coins;
    const items = Shop.getPresets();
    grid.innerHTML = items.map(item => {
      const purchased = Shop.isPurchased(item.id);
      const canAfford = State.player.coins >= item.cost;
      return `
        <div class="shop-item ${purchased ? 'purchased' : ''} ${!canAfford && !purchased ? 'insufficient' : ''}">
          <div class="shop-icon">${item.icon}</div>
          <div class="shop-name">${item.name}</div>
          <div class="shop-desc">${item.desc}</div>
          <div class="shop-cost">🪙 ${item.cost}</div>
          <button class="btn btn-primary btn-small shop-buy-btn" data-id="${item.id}" ${purchased ? 'disabled' : ''}>${purchased ? 'Claimed ✓' : 'Claim'}</button>
        </div>`;
    }).join('');
    grid.querySelectorAll('.shop-buy-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = Shop.buyPreset(btn.dataset.id);
        if (!result.success) Notifications.showError(result.reason);
        else { this.renderShop(); this.updateHud(); }
      });
    });
  },
  
  renderCustomShop() {
    const grid = document.getElementById('custom-rewards-grid');
    const empty = document.getElementById('custom-rewards-empty');
    if (!grid) return;
    const rewards = State.shop.customRewards;
    if (rewards.length === 0) { grid.innerHTML = ''; empty?.classList.remove('hidden'); return; }
    empty?.classList.add('hidden');
    grid.innerHTML = rewards.map(r => `
      <div class="shop-item custom-reward-card">
        <button class="custom-delete-btn" data-id="${r.id}">✕</button>
        <div class="shop-icon">${r.icon}</div>
        <div class="shop-name">${r.name}</div>
        <div class="shop-desc">${r.desc || ''}</div>
        <div class="shop-cost">🪙 ${r.cost}</div>
        <button class="btn btn-primary btn-small shop-buy-btn" data-id="${r.id}">Claim</button>
      </div>`).join('');
    grid.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = Shop.buyCustom(btn.dataset.id);
        if (!result.success) Notifications.showError(result.reason);
        else { this.updateHud(); }
      });
    });
    grid.querySelectorAll('.custom-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this reward?')) { Shop.deleteCustomReward(btn.dataset.id); this.renderCustomShop(); }
      });
    });
  }
};
