const Quests = {
  getAll() { return State.quests; },
  
  getFiltered(category) {
    const all = State.quests;
    if (!category || category === 'all') return all;
    return all.filter(q => q.category === category);
  },
  
  add(name, category, difficulty, description = '') {
    const xpMap = { easy: 30, medium: 60, hard: 120 };
    const coinMap = { easy: 10, medium: 20, hard: 40 };
    const quest = {
      id: Date.now().toString(),
      name: name.trim(),
      category,
      difficulty,
      xpReward: xpMap[difficulty] || 60,
      coinReward: coinMap[difficulty] || 20,
      description,
      completed: false,
      completedAt: null,
      createdAt: Date.now()
    };
    State.quests.push(quest);
    State.save();
    EventBus.emit('quest:added', { quest });
    Achievements.check('custom_quest');
    return quest;
  },
  
  complete(id) {
    const quest = State.quests.find(q => q.id === id);
    if (!quest || quest.completed) return false;
    quest.completed = true;
    quest.completedAt = Date.now();
    const p = State.player;
    p.totalQuestsCompleted++;
    Stats.recordCompletion(quest);
    Player.addXp(quest.xpReward);
    Player.addCoins(quest.coinReward);
    Player.updateStreak();
    State.save();
    EventBus.emit('quest:completed', { quest });
    Achievements.checkAll();
    return true;
  },
  
  delete(id) {
    const idx = State.quests.findIndex(q => q.id === id);
    if (idx === -1) return false;
    State.quests.splice(idx, 1);
    State.save();
    EventBus.emit('quest:deleted', { id });
    return true;
  }
};
