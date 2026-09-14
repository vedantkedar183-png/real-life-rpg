(function() {
  'use strict';
  
  function showLoadingScreen() {
    const bar = document.getElementById('loading-bar');
    if (bar) setTimeout(() => { bar.style.width = '100%'; }, 50);
  }
  
  function hideLoadingScreen() {
    const loading = document.getElementById('loading-screen');
    const app = document.getElementById('app');
    if (loading) {
      loading.style.transition = 'opacity 0.6s ease';
      loading.style.opacity = '0';
      setTimeout(() => { loading.style.display = 'none'; if (app) app.classList.remove('hidden'); }, 600);
    }
  }
  
  function initGame() {
    State.init();
    Notifications.init();
    Router.init();
    Dashboard.init();
    AICoach.init();
    
    Dashboard.updateHud();
    Dashboard.render();
    Dashboard.renderQuests();
    Dashboard.renderAchievements();
    Dashboard.renderShop();
    
    setupQuestModal();
    setupRewardModal();
    setupSettingsModal();
    setupQuestFilters();
    setupShopTabs();
    
    EventBus.on('tab:changed', ({ tab }) => {
      if (tab === 'ai') AICoach.onTabOpen();
    });
  }
  
  function setupQuestModal() {
    const modal = document.getElementById('add-quest-modal');
    let selectedCategory = 'study';
    let selectedDifficulty = 'medium';
    
    function openModal() {
      if (!modal) return;
      modal.classList.remove('hidden');
      const nameInput = document.getElementById('quest-name-input');
      const descInput = document.getElementById('quest-desc-input');
      if (nameInput) { nameInput.value = ''; nameInput.focus(); }
      if (descInput) descInput.value = '';
      selectedCategory = 'study';
      selectedDifficulty = 'medium';
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === 'study'));
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.diff === 'medium'));
    }
    function closeModal() { modal?.classList.add('hidden'); }
    
    document.getElementById('add-quest-btn')?.addEventListener('click', openModal);
    document.getElementById('add-quest-empty-btn')?.addEventListener('click', openModal);
    document.getElementById('close-quest-modal')?.addEventListener('click', closeModal);
    document.getElementById('cancel-quest-btn')?.addEventListener('click', closeModal);
    modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCategory = btn.dataset.cat;
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedDifficulty = btn.dataset.diff;
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    document.getElementById('save-quest-btn')?.addEventListener('click', () => {
      const name = document.getElementById('quest-name-input')?.value?.trim();
      if (!name) { Notifications.showError('Please enter a quest name!'); return; }
      const desc = document.getElementById('quest-desc-input')?.value || '';
      Quests.add(name, selectedCategory, selectedDifficulty, desc);
      Dashboard.renderQuests(currentFilter);
      Dashboard.render();
      closeModal();
      Notifications.showInfo('Quest Added!', `"${name}" added to your quest log.`);
    });
  }
  
  let currentFilter = 'all';
  function setupQuestFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Dashboard.renderQuests(currentFilter);
      });
    });
  }
  
  function setupRewardModal() {
    const modal = document.getElementById('add-reward-modal');
    function openModal() { modal?.classList.remove('hidden'); }
    function closeModal() { modal?.classList.add('hidden'); }
    document.getElementById('add-reward-btn')?.addEventListener('click', openModal);
    document.getElementById('close-reward-modal')?.addEventListener('click', closeModal);
    document.getElementById('cancel-reward-btn')?.addEventListener('click', closeModal);
    modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.getElementById('save-reward-btn')?.addEventListener('click', () => {
      const name = document.getElementById('reward-name-input')?.value?.trim();
      const desc = document.getElementById('reward-desc-input')?.value?.trim() || '';
      const cost = document.getElementById('reward-cost-input')?.value;
      const icon = document.getElementById('reward-icon-input')?.value?.trim() || '🎁';
      if (!name) { Notifications.showError('Please enter a reward name!'); return; }
      if (!cost || parseInt(cost) < 1) { Notifications.showError('Please enter a valid cost!'); return; }
      Shop.addCustomReward(name, desc, cost, icon);
      Dashboard.renderCustomShop();
      closeModal();
      ['reward-name-input','reward-desc-input','reward-cost-input','reward-icon-input'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      Notifications.showInfo('Reward Created!', `${icon} ${name}`);
    });
  }
  
  function setupSettingsModal() {
    const modal = document.getElementById('settings-modal');
    function openModal() {
      modal?.classList.remove('hidden');
      const nameInput = document.getElementById('settings-name-input');
      if (nameInput) nameInput.value = State.player.name;
      const aiKeyEl = document.getElementById('settings-ai-key');
      if (aiKeyEl) aiKeyEl.value = AI.getApiKey();
    }
    function closeModal() { modal?.classList.add('hidden'); }
    document.getElementById('hud-settings-btn')?.addEventListener('click', openModal);
    document.getElementById('close-settings-modal')?.addEventListener('click', closeModal);
    modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.getElementById('save-settings-btn')?.addEventListener('click', () => {
      const name = document.getElementById('settings-name-input')?.value?.trim();
      Player.setName(name || 'Hero');
      const aiKey = document.getElementById('settings-ai-key')?.value?.trim();
      if (aiKey && aiKey.length > 10) { AI.setApiKey(aiKey); AICoach._checkSetup(); }
      EventBus.emit('settings:saved', {});
      Dashboard.updateHud();
      Dashboard.render();
      closeModal();
      Notifications.showInfo('Saved!', 'Profile updated successfully.');
    });
    document.getElementById('reset-game-btn')?.addEventListener('click', () => {
      if (confirm('Reset ALL game progress? This cannot be undone!')) {
        if (confirm('Last warning! All XP, quests, and achievements will be deleted.')) { Storage.clear(); location.reload(); }
      }
    });
  }
  
  function setupShopTabs() {
    document.querySelectorAll('.shop-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.shop-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.shopTab;
        const grid = document.getElementById('shop-rewards-grid');
        const custom = document.getElementById('shop-custom-section');
        if (tab === 'rewards') { if (grid) grid.style.display = ''; custom?.classList.add('hidden'); }
        else { if (grid) grid.style.display = 'none'; custom?.classList.remove('hidden'); }
      });
    });
  }
  
  window.addEventListener('DOMContentLoaded', () => {
    showLoadingScreen();
    setTimeout(() => { initGame(); setTimeout(hideLoadingScreen, 400); }, 1900);
  });
  
})();
