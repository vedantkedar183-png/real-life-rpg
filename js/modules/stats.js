const Stats = {
  _charts: {},
  
  recordCompletion(quest) {
    const today = State._getToday();
    const h = State.stats.history;
    if (!h[today]) h[today] = { xpEarned: 0, questsCompleted: 0, categoryCounts: {}, hardCompleted: 0 };
    h[today].xpEarned += quest.xpReward;
    h[today].questsCompleted++;
    h[today].categoryCounts[quest.category] = (h[today].categoryCounts[quest.category] || 0) + 1;
    if (quest.difficulty === 'hard') h[today].hardCompleted++;
    State.save();
  },
  
  getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  },
  
  getCategoryBreakdown() {
    const cats = { study: 0, exercise: 0, reading: 0, learning: 0, personal: 0 };
    Object.values(State.stats.history).forEach(day => {
      Object.entries(day.categoryCounts || {}).forEach(([cat, count]) => {
        if (cats.hasOwnProperty(cat)) cats[cat] += count;
      });
    });
    return cats;
  },
  
  renderCharts() {
    this._renderXpChart();
    this._renderQuestsChart();
    this._renderCategoryChart();
    this._renderWeeklySummary();
  },
  
  _destroyChart(id) {
    if (this._charts[id]) { this._charts[id].destroy(); delete this._charts[id]; }
  },
  
  _chartDefaults() {
    return {
      color: '#8ba7be',
      plugins: { legend: { labels: { color: '#8ba7be', font: { family: 'Exo 2' } } } },
      scales: {
        x: { ticks: { color: '#4a6580' }, grid: { color: 'rgba(0,212,255,0.06)' } },
        y: { ticks: { color: '#4a6580' }, grid: { color: 'rgba(0,212,255,0.06)' } }
      }
    };
  },
  
  _renderXpChart() {
    this._destroyChart('xp');
    const canvas = document.getElementById('xp-chart');
    if (!canvas) return;
    const days = this.getLast7Days();
    const labels = days.map(d => { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { weekday: 'short' }); });
    const data = days.map(d => State.stats.history[d]?.xpEarned || 0);
    const defaults = this._chartDefaults();
    this._charts.xp = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'XP Earned', data, backgroundColor: 'rgba(0,212,255,0.3)', borderColor: '#00d4ff', borderWidth: 2, borderRadius: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, ...defaults }
    });
  },
  
  _renderQuestsChart() {
    this._destroyChart('quests');
    const canvas = document.getElementById('quests-chart');
    if (!canvas) return;
    const days = this.getLast7Days();
    const labels = days.map(d => { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { weekday: 'short' }); });
    const data = days.map(d => State.stats.history[d]?.questsCompleted || 0);
    const defaults = this._chartDefaults();
    this._charts.quests = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{ label: 'Quests Completed', data, borderColor: '#b06ef3', backgroundColor: 'rgba(176,110,243,0.1)', borderWidth: 2, pointBackgroundColor: '#b06ef3', tension: 0.4, fill: true }]
      },
      options: { responsive: true, maintainAspectRatio: false, ...defaults }
    });
  },
  
  _renderCategoryChart() {
    this._destroyChart('category');
    const canvas = document.getElementById('category-chart');
    if (!canvas) return;
    const breakdown = this.getCategoryBreakdown();
    const labels = Object.keys(breakdown).map(k => k.charAt(0).toUpperCase() + k.slice(1));
    const data = Object.values(breakdown);
    this._charts.category = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: ['rgba(142,197,252,0.7)','rgba(255,107,53,0.7)','rgba(0,245,160,0.7)','rgba(176,110,243,0.7)','rgba(255,215,0,0.7)'], borderColor: 'rgba(0,0,0,0.3)', borderWidth: 2 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#8ba7be', font: { family: 'Exo 2' }, padding: 12 } } }
      }
    });
  },
  
  _renderWeeklySummary() {
    const container = document.getElementById('weekly-summary');
    if (!container) return;
    const days = this.getLast7Days();
    const totalXp = days.reduce((sum, d) => sum + (State.stats.history[d]?.xpEarned || 0), 0);
    const totalQuests = days.reduce((sum, d) => sum + (State.stats.history[d]?.questsCompleted || 0), 0);
    const activeDays = days.filter(d => State.stats.history[d]?.questsCompleted > 0).length;
    const avgXp = activeDays > 0 ? Math.round(totalXp / activeDays) : 0;
    container.innerHTML = `
      <div class="week-stat"><span class="week-stat-label">Total XP This Week</span><span class="week-stat-val">${totalXp}</span></div>
      <div class="week-stat"><span class="week-stat-label">Quests Completed</span><span class="week-stat-val">${totalQuests}</span></div>
      <div class="week-stat"><span class="week-stat-label">Active Days</span><span class="week-stat-val">${activeDays}/7</span></div>
      <div class="week-stat"><span class="week-stat-label">Avg XP/Active Day</span><span class="week-stat-val">${avgXp}</span></div>
    `;
  },
  
  updateSummaryStats() {
    const p = State.player;
    const el = id => document.getElementById(id);
    if (el('stats-total-xp')) el('stats-total-xp').textContent = p.totalXp;
    if (el('stats-total-quests')) el('stats-total-quests').textContent = p.totalQuestsCompleted;
    if (el('stats-best-streak')) el('stats-best-streak').textContent = p.bestStreak;
    if (el('stats-total-coins-earned')) el('stats-total-coins-earned').textContent = p.totalCoinsEarned;
  }
};
