/**
 * ai.js - Google Gemini AI Coach integration
 */

const AI = {

  API_KEY_STORAGE: 'rpg_gemini_key',

  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent',

  getApiKey() {
    return localStorage.getItem(this.API_KEY_STORAGE) || '';
  },

  setApiKey(key) {
    localStorage.setItem(this.API_KEY_STORAGE, key.trim());
  },

  hasApiKey() {
    return this.getApiKey().length > 10;
  },

  async generateContent(prompt) {
    const key = this.getApiKey();

    if (!key) {
      throw new Error('No API key. Add your Gemini key in Settings.');
    }

    const response = await fetch(`${this.API_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 600,
          topP: 0.95
        }
      })
    });

    if (!response.ok) {
      let errMsg = `HTTP ${response.status}`;

      try {
        const err = await response.json();
        errMsg = err.error?.message || errMsg;
      } catch (e) {}

      throw new Error(errMsg);
    }

    const data = await response.json();

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return text;
  },

  _buildContext() {
    const p = State.player;
    const unlockedAch = Object.values(State.achievements)
      .filter(a => a.unlocked).length;

    const breakdown = Stats.getCategoryBreakdown();
    const entries = Object.entries(breakdown);
    const sorted = [...entries].sort((a, b) => a[1] - b[1]);

    const weakest = sorted[0] || ['none', 0];
    const strongest = sorted[sorted.length - 1] || ['none', 0];

    const hour = new Date().getHours();
    const timeOfDay =
      hour < 12 ? 'morning' :
      hour < 17 ? 'afternoon' :
      'evening';

    return `You are an energetic RPG-style life coach AI. Use RPG/gaming metaphors naturally. Be concise and actionable.

Player Stats:

- Name: ${p.name}, Level: ${p.level} ${Player.getTitleForLevel(p.level)}

- Current Streak: ${p.streak} days | Best Streak: ${p.bestStreak} days

- Total Quests Completed: ${p.totalQuestsCompleted}

- Total XP: ${p.totalXp} | Coins: ${p.coins}

- Achievements: ${unlockedAch}/22 unlocked

- Strongest category: ${strongest[0]} (${strongest[1]} quests done)

- Weakest category: ${weakest[0]} (${weakest[1]} quests done)

- Time of day: ${timeOfDay}`;
  },

  async getDailyBrief() {
    const ctx = this._buildContext();

    const hour = new Date().getHours();
    const time =
      hour < 12 ? 'morning' :
      hour < 17 ? 'afternoon' :
      'evening';

    return this.generateContent(`${ctx}

Write a short energetic daily motivational brief (3-4 sentences) for this ${time}. Reference the player's specific stats. Use RPG language (adventurer, quest, level up, XP). End with ONE actionable tip for today. No markdown, just plain text.`);
  },

  async getInsightCards() {
    const ctx = this._buildContext();

    const raw = await this.generateContent(`${ctx}

Generate exactly 3 short productivity insight cards. Return ONLY a valid JSON array:

[{"title": "short title", "insight": "1-2 sentence insight", "icon": "single emoji"}, ...]

Focus on: weakness to improve, strength to leverage, habit tip. No other text outside the JSON.`);

    const match = raw.match(/\[.*\]/s);

    if (!match) {
      throw new Error('Could not parse insight cards');
    }

    return JSON.parse(match[0]);
  },

  async getFocusQuest() {
    const ctx = this._buildContext();

    const quests = Quests.getAll().filter(q => !q.completed);

    if (quests.length === 0) return null;

    const questList = quests
      .map(q => `"${q.name}" (${q.category}, ${q.difficulty})`)
      .join(', ');

    const raw = await this.generateContent(`${ctx}

Available quests today: ${questList}

Pick ONE quest to focus on first. Return ONLY valid JSON:

{"quest": "exact quest name", "reason": "1-2 sentences using RPG language", "icon": "single emoji"}`);

    const match = raw.match(/\{.*\}/s);

    if (!match) return null;

    return JSON.parse(match[0]);
  },

  async chat(userMessage, history = []) {
    const ctx = this._buildContext();

    const historyText = history
      .slice(-6)
      .map(m => `${m.role === 'user' ? 'Player' : 'Coach'}: ${m.text}`)
      .join('\n');

    return this.generateContent(`${ctx}

You are their personal AI life coach. Be concise (2-3 sentences max), warm, use occasional RPG metaphors.

${historyText ? `Recent conversation:\n${historyText}\n` : ''}Player: ${userMessage}

Coach:`);
  }

};