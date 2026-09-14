const Shop = {
  _presets: [
    { id: 'pizza', name: 'Pizza Night', desc: 'Order your favorite pizza', icon: '🍕', cost: 50 },
    { id: 'movie', name: 'Movie Night', desc: 'Watch a movie of your choice', icon: '🎬', cost: 75 },
    { id: 'gaming', name: 'Gaming Session', desc: '2 hours of guilt-free gaming', icon: '🎮', cost: 40 },
    { id: 'relax', name: 'Relax Day', desc: 'A full day of relaxation', icon: '🛁', cost: 100 },
    { id: 'shopping', name: 'Shopping Trip', desc: 'Buy something you want', icon: '🛍️', cost: 200 },
    { id: 'icecream', name: 'Ice Cream', desc: 'Treat yourself to ice cream', icon: '🍦', cost: 25 },
    { id: 'book', name: 'New Book', desc: 'Buy a book you wanted', icon: '📖', cost: 60 },
    { id: 'trip', name: 'Day Trip', desc: 'Plan a fun day trip', icon: '✈️', cost: 300 }
  ],
  
  getPresets() { return this._presets; },
  
  isPurchased(id) { return State.shop.purchased.includes(id); },
  
  buyPreset(id) {
    const item = this._presets.find(p => p.id === id);
    if (!item) return { success: false, reason: 'Item not found' };
    if (this.isPurchased(id)) return { success: false, reason: 'Already purchased' };
    if (!Player.spendCoins(item.cost)) return { success: false, reason: 'Not enough coins' };
    State.shop.purchased.push(id);
    State.save();
    EventBus.emit('shop:purchased', { item });
    Achievements.check('shopaholic');
    return { success: true };
  },
  
  addCustomReward(name, desc, cost, icon) {
    const reward = { id: 'custom_' + Date.now(), name, desc, cost: parseInt(cost), icon: icon || '🎁', createdAt: Date.now() };
    State.shop.customRewards.push(reward);
    State.save();
    return reward;
  },
  
  buyCustom(id) {
    const reward = State.shop.customRewards.find(r => r.id === id);
    if (!reward) return { success: false, reason: 'Reward not found' };
    if (!Player.spendCoins(reward.cost)) return { success: false, reason: 'Not enough coins' };
    EventBus.emit('shop:purchased', { item: reward });
    Achievements.check('shopaholic');
    return { success: true };
  },
  
  deleteCustomReward(id) {
    const idx = State.shop.customRewards.findIndex(r => r.id === id);
    if (idx === -1) return false;
    State.shop.customRewards.splice(idx, 1);
    State.save();
    return true;
  }
};
