const Player = {
  getLevelThreshold(level) { return Math.floor(100 * Math.pow(level, 1.5)); },
  
  getAvatarForLevel(level) {
    if (level <= 4) return '🧙';
    if (level <= 9) return '⚔️';
    if (level <= 14) return '🛡️';
    if (level <= 19) return '🗡️';
    if (level <= 29) return '👑';
    if (level <= 49) return '⭐';
    return '🌟';
  },
  
  getTitleForLevel(level) {
    if (level <= 4) return 'Novice';
    if (level <= 9) return 'Adventurer';
    if (level <= 14) return 'Warrior';
    if (level <= 19) return 'Champion';
    if (level <= 29) return 'Legend';
    if (level <= 49) return 'Epic Hero';
    return 'Mythic';
  },
  
  addXp(amount) {
    const p = State.player;
    p.totalXp += amount;
    p.xp += amount;
    EventBus.emit('xp:gained', { amount, totalXp: p.totalXp });
    this._checkLevelUp();
    State.save();
  },
  
  _checkLevelUp() {
    const p = State.player;
    while (p.xp >= this.getLevelThreshold(p.level)) {
      p.xp -= this.getLevelThreshold(p.level);
      p.level++;
      p.xpToNextLevel = this.getLevelThreshold(p.level);
      EventBus.emit('player:leveled-up', { newLevel: p.level, title: this.getTitleForLevel(p.level), avatar: this.getAvatarForLevel(p.level) });
    }
    p.xpToNextLevel = this.getLevelThreshold(p.level);
  },
  
  addCoins(amount) {
    const p = State.player;
    p.coins += amount;
    p.totalCoinsEarned += amount;
    EventBus.emit('coins:gained', { amount });
    State.save();
  },
  
  spendCoins(amount) {
    const p = State.player;
    if (p.coins < amount) return false;
    p.coins -= amount;
    State.save();
    return true;
  },
  
  updateStreak() {
    const p = State.player;
    const today = State._getToday();
    if (p.lastActiveDate === today) return;
    p.streak++;
    p.bestStreak = Math.max(p.bestStreak, p.streak);
    p.lastActiveDate = today;
    EventBus.emit('streak:updated', { streak: p.streak });
    State.save();
  },
  
  setName(name) {
    State.player.name = name.trim() || 'Hero';
    State.save();
    EventBus.emit('state:updated', {});
  }
};
