const Router = {
  currentTab: 'dashboard',
  
  init() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) this.navigateTo(tab);
      });
    });
  },
  
  navigateTo(tab) {
    if (!tab) return;
if (tab === this.currentTab) return;
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tab}`);
    });
    this.currentTab = tab;
    EventBus.emit('tab:changed', { tab });
    
    // Render stats charts when stats tab opened
    if (tab === 'stats') {
      Stats.updateSummaryStats();
      Stats.renderCharts();
    }
    // Update dashboard when opened
    if (tab === 'dashboard') {
      Dashboard.render();
    }
  }
};
