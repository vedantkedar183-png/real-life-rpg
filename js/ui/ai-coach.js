/**
 * ai-coach.js - AI Coach tab UI
 */
const AICoach = {
  _chatHistory: [],
  _initialized: false,
  
  init() {
    this._checkSetup();
    this._bindEvents();
  },
  
  _checkSetup() {
    const hasKey = AI.hasApiKey();
    const setup = document.getElementById('ai-setup');
    const content = document.getElementById('ai-content');
    if (setup) setup.classList.toggle('hidden', hasKey);
    if (content) content.classList.toggle('hidden', !hasKey);
  },
  
  _bindEvents() {
    document.getElementById('ai-save-key-btn')?.addEventListener('click', () => {
      const key = document.getElementById('ai-key-input')?.value?.trim();
      if (!key || key.length < 10) { Notifications.showError('Please enter a valid API key'); return; }
      AI.setApiKey(key);
      this._checkSetup();
      this.loadAll();
      Notifications.showInfo('AI Coach Activated!', 'Your coach is ready to guide you!');
    });
    
    document.getElementById('ai-refresh-btn')?.addEventListener('click', () => this.loadAll());
    
    document.getElementById('ai-chat-send')?.addEventListener('click', () => this._sendChat());
    document.getElementById('ai-chat-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._sendChat(); }
    });
    
    EventBus.on('settings:saved', () => {
      const keyInput = document.getElementById('settings-ai-key');
      if (keyInput?.value?.trim().length > 10) { AI.setApiKey(keyInput.value); this._checkSetup(); }
    });
  },
  
  async loadAll() {
    if (!AI.hasApiKey()) return;
    this._initialized = true;
    await Promise.allSettled([this.loadDailyBrief(), this.loadFocusQuest(), this.loadInsights()]);
  },
  
  async loadDailyBrief() {
    const loading = document.getElementById('ai-brief-loading');
    const content = document.getElementById('ai-brief-content');
    const text = document.getElementById('ai-brief-text');
    if (!text) return;
    loading?.classList.remove('hidden'); content?.classList.add('hidden');
    try {
      const brief = await AI.getDailyBrief();
      text.textContent = brief;
      loading?.classList.add('hidden'); content?.classList.remove('hidden');
    } catch(e) {
      loading?.classList.add('hidden'); content?.classList.remove('hidden');
      text.textContent = `Could not load: ${e.message}`;
    }
  },
  
  async loadFocusQuest() {
    const loading = document.getElementById('ai-focus-loading');
    const content = document.getElementById('ai-focus-content');
    const quests = Quests.getAll().filter(q => !q.completed);
    if (quests.length === 0) {
      loading?.classList.add('hidden'); content?.classList.remove('hidden');
      if (document.getElementById('ai-focus-icon')) document.getElementById('ai-focus-icon').textContent = '🎉';
      if (document.getElementById('ai-focus-name')) document.getElementById('ai-focus-name').textContent = 'All Quests Complete!';
      if (document.getElementById('ai-focus-reason')) document.getElementById('ai-focus-reason').textContent = 'Outstanding! All quests done for today.';
      return;
    }
    loading?.classList.remove('hidden'); content?.classList.add('hidden');
    try {
      const result = await AI.getFocusQuest();
      if (result) {
        if (document.getElementById('ai-focus-icon')) document.getElementById('ai-focus-icon').textContent = result.icon || '⚔️';
        if (document.getElementById('ai-focus-name')) document.getElementById('ai-focus-name').textContent = result.quest;
        if (document.getElementById('ai-focus-reason')) document.getElementById('ai-focus-reason').textContent = result.reason;
      }
      loading?.classList.add('hidden'); content?.classList.remove('hidden');
    } catch(e) {
      loading?.classList.add('hidden'); content?.classList.remove('hidden');
      if (document.getElementById('ai-focus-name')) document.getElementById('ai-focus-name').textContent = quests[0]?.name || 'Start any quest!';
      if (document.getElementById('ai-focus-reason')) document.getElementById('ai-focus-reason').textContent = 'Begin your adventure!';
    }
  },
  
  async loadInsights() {
    const container = document.getElementById('ai-insights-row');
    if (!container) return;
    container.innerHTML = `<div class="ai-insight-card" style="grid-column:1/-1"><div class="ai-loading"><div class="ai-spinner"></div><p>Loading insights...</p></div></div>`;
    try {
      const cards = await AI.getInsightCards();
      container.innerHTML = cards.map(c => `
        <div class="ai-insight-card">
          <span class="ai-insight-icon">${c.icon || '💡'}</span>
          <div class="ai-insight-title">${c.title}</div>
          <div class="ai-insight-text">${c.insight}</div>
        </div>`).join('');
    } catch(e) {
      container.innerHTML = `<div class="ai-insight-card" style="grid-column:1/-1;text-align:center"><span class="ai-insight-icon">⚠️</span><div class="ai-insight-title">Could not load insights</div><div class="ai-insight-text">${e.message}</div></div>`;
    }
  },
  
  async _sendChat() {
    const input = document.getElementById('ai-chat-input');
    const messages = document.getElementById('ai-chat-messages');
    if (!input || !messages) return;
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    this._addBubble(msg, 'user');
    this._chatHistory.push({ role: 'user', text: msg });
    const thinkingId = 'think-' + Date.now();
    messages.insertAdjacentHTML('beforeend', `<div class="chat-bubble coach thinking" id="${thinkingId}"><div class="ai-spinner"></div><span>Thinking...</span></div>`);
    messages.scrollTop = messages.scrollHeight;
    try {
      const reply = await AI.chat(msg, this._chatHistory);
      document.getElementById(thinkingId)?.remove();
      this._addBubble(reply, 'coach');
      this._chatHistory.push({ role: 'coach', text: reply });
    } catch(e) {
      document.getElementById(thinkingId)?.remove();
      this._addBubble(`Error: ${e.message}`, 'coach');
    }
  },
  
  _addBubble(text, role) {
    const messages = document.getElementById('ai-chat-messages');
    if (!messages) return;
    const div = document.createElement('div');
    div.className = `chat-bubble ${role}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  },
  
  onTabOpen() {
    if (!this._initialized && AI.hasApiKey()) this.loadAll();
    const settingsKey = document.getElementById('settings-ai-key');
    if (settingsKey && AI.hasApiKey()) settingsKey.value = AI.getApiKey();
  }
};
