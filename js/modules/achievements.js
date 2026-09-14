const Achievements = {
  _definitions: {
    first_quest: { name: 'First Blood', desc: 'Complete your first quest', icon: '⚔️' },
    quest_5: { name: 'Quest Veteran', desc: 'Complete 5 quests', icon: '🎖️' },
    quest_25: { name: 'Quest Master', desc: 'Complete 25 quests', icon: '🏅' },
    quest_100: { name: 'Quest Legend', desc: 'Complete 100 quests', icon: '🏆' },
    level_5: { name: 'Rising Hero', desc: 'Reach Level 5', icon: '🌟' },
    level_10: { name: 'Champion', desc: 'Reach Level 10', icon: '💎' },
    level_25: { name: 'Legend', desc: 'Reach Level 25', icon: '👑' },
    streak_3: { name: 'On a Roll', desc: '3-day streak', icon: '🔥' },
    streak_7: { name: 'Weekly Warrior', desc: '7-day streak', icon: '⚡' },
    streak_30: { name: 'Unstoppable', desc: '30-day streak', icon: '☄️' },
    coins_100: { name: 'Coin Collector', desc: 'Earn 100 coins', icon: '🪙' },
    coins_500: { name: 'Wealthy Hero', desc: 'Earn 500 coins', icon: '💰' },
    xp_1000: { name: 'XP Hunter', desc: 'Earn 1000 total XP', icon: '✨' },
    study_master: { name: 'Scholar', desc: 'Complete 10 study quests', icon: '📚' },
    exercise_master: { name: 'Athlete', desc: 'Complete 10 exercise quests', icon: '💪' },
    hard_core: { name: 'Hard Core', desc: 'Complete 5 hard quests', icon: '🗡️' },
    daily_hero: { name: 'Daily Hero', desc: 'Complete all quests in a day', icon: '🦸' },
    early_bird: { name: 'Early Bird', desc: 'Complete a quest before 9 AM', icon: '🌅' },
    night_owl: { name: 'Night Owl', desc: 'Complete a quest after 10 PM', icon: '🦉' },
    shopaholic: { name: 'Shopaholic', desc: 'Buy 3 rewards', icon: '🛒' },
    custom_quest: { name: 'Creator', desc: 'Create a custom quest', icon: '✏️' },
    collector: { name: 'Collector', desc: 'Unlock 10 achievements', icon: '🎁' }
  },
  
  getAll() { return this._definitions; },
  
  isUnlocked(id) { return State.achievements[id]?.unlocked === true; },
  
  unlock(id) {
    if (this.isUnlocked(id)) return false;
    State.achievements[id] = { unlocked: true, unlockedAt: Date.now() };
    State.save();
    const def = this._definitions[id];
    if (def) EventBus.emit('achievement:unlocked', { id, ...def });
    return true;
  },
  
  check(id) {
    if (this.isUnlocked(id)) return;
    const p = State.player;
    const quests = State.quests;
    const done = quests.filter(q => q.completed);
    const history = State.stats.history;
    const totalCompleted = p.totalQuestsCompleted;
    const unlockedCount = Object.values(State.achievements).filter(a => a.unlocked).length;
    
    let shouldUnlock = false;
    const h = new Date().getHours();
    
    switch(id) {
      case 'first_quest': shouldUnlock = totalCompleted >= 1; break;
      case 'quest_5': shouldUnlock = totalCompleted >= 5; break;
      case 'quest_25': shouldUnlock = totalCompleted >= 25; break;
      case 'quest_100': shouldUnlock = totalCompleted >= 100; break;
      case 'level_5': shouldUnlock = p.level >= 5; break;
      case 'level_10': shouldUnlock = p.level >= 10; break;
      case 'level_25': shouldUnlock = p.level >= 25; break;
      case 'streak_3': shouldUnlock = p.streak >= 3; break;
      case 'streak_7': shouldUnlock = p.streak >= 7; break;
      case 'streak_30': shouldUnlock = p.streak >= 30; break;
      case 'coins_100': shouldUnlock = p.totalCoinsEarned >= 100; break;
      case 'coins_500': shouldUnlock = p.totalCoinsEarned >= 500; break;
      case 'xp_1000': shouldUnlock = p.totalXp >= 1000; break;
      case 'study_master': {
        const count = Object.values(history).reduce((sum, day) => sum + (day.categoryCounts?.study || 0), 0);
        shouldUnlock = count >= 10; break;
      }
      case 'exercise_master': {
        const count = Object.values(history).reduce((sum, day) => sum + (day.categoryCounts?.exercise || 0), 0);
        shouldUnlock = count >= 10; break;
      }
      case 'hard_core': {
        const count = Object.values(history).reduce((sum, day) => sum + (day.hardCompleted || 0), 0);
        shouldUnlock = count >= 5; break;
      }
      case 'daily_hero': {
        const today = State._getToday();
        const todayData = history[today];
        shouldUnlock = todayData && todayData.questsCompleted >= quests.length && quests.length > 0; break;
      }
      case 'early_bird': shouldUnlock = h < 9; break;
      case 'night_owl': shouldUnlock = h >= 22; break;
      case 'shopaholic': shouldUnlock = State.shop.purchased.length >= 3; break;
      case 'custom_quest': shouldUnlock = true; break;
      case 'collector': shouldUnlock = unlockedCount >= 10; break;
    }
    
    if (shouldUnlock) this.unlock(id);
  },
  
  checkAll() {
    Object.keys(this._definitions).forEach(id => this.check(id));
  }
};
