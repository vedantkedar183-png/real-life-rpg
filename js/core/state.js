const State = {
  _data: null,
  
  init() {
    this._data = Storage.get();
    if (!this._data) {
      this._data = {
        player: {
          name: 'Hero', level: 1, xp: 0, xpToNextLevel: 100, totalXp: 0,
          coins: 0, totalCoinsEarned: 0, streak: 0, bestStreak: 0,
          lastActiveDate: null, totalQuestsCompleted: 0, createdAt: Date.now()
        },
        quests: this._defaultQuests(),
        achievements: {},
        shop: { purchased: [], customRewards: [] },
        stats: { history: {} }
      };
    }
    this._checkDailyReset();
    this._initAchievements();
    this.save();
  },
  
  get() { return this._data; },
  get player() { return this._data.player; },
  get quests() { return this._data.quests; },
  get achievements() { return this._data.achievements; },
  get shop() { return this._data.shop; },
  get stats() { return this._data.stats; },
  
  save() { Storage.set(this._data); },
  
  _checkDailyReset() {
    const today = this._getToday();
    const lastDate = this._data.player.lastActiveDate;
    if (lastDate && lastDate !== today) {
      const yesterday = this._getYesterday();
      if (lastDate !== yesterday) this._data.player.streak = 0;
      this._data.quests.forEach(q => { q.completed = false; q.completedAt = null; });
    }
  },
  
  _getToday() { return new Date().toISOString().split('T')[0]; },
  _getYesterday() { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; },
  
  _defaultQuests() {
    const now = Date.now();
    return [
      { id: (now+1).toString(), name: 'Morning Study Session', category: 'study', difficulty: 'medium', xpReward: 60, coinReward: 20, description: 'Study for at least an hour.', completed: false, completedAt: null, createdAt: now },
      { id: (now+2).toString(), name: 'Daily Workout', category: 'exercise', difficulty: 'hard', xpReward: 120, coinReward: 40, description: 'Complete a full workout routine.', completed: false, completedAt: null, createdAt: now },
      { id: (now+3).toString(), name: 'Read for 30 Minutes', category: 'reading', difficulty: 'easy', xpReward: 30, coinReward: 10, description: 'Read a book of your choice.', completed: false, completedAt: null, createdAt: now },
      { id: (now+4).toString(), name: 'Learn Something New', category: 'learning', difficulty: 'medium', xpReward: 60, coinReward: 20, description: 'Spend time learning a new skill.', completed: false, completedAt: null, createdAt: now },
      { id: (now+5).toString(), name: 'Personal Goal', category: 'personal', difficulty: 'medium', xpReward: 60, coinReward: 20, description: 'Work on a personal goal.', completed: false, completedAt: null, createdAt: now }
    ];
  },
  
  _initAchievements() {
    const ids = ['first_quest','quest_5','quest_25','quest_100','level_5','level_10','level_25','streak_3','streak_7','streak_30','coins_100','coins_500','xp_1000','study_master','exercise_master','hard_core','daily_hero','early_bird','night_owl','shopaholic','custom_quest','collector'];
    ids.forEach(id => { if (!this._data.achievements[id]) this._data.achievements[id] = { unlocked: false, unlockedAt: null }; });
  }
};
