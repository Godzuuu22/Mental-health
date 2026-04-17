<template>
  <div class="chat-shell">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="ai-profile">
          <div class="ai-avatar-lg">
            <span>⚙️</span>
            <div class="avatar-ring"></div>
          </div>
          <h3>The Mentor</h3>
          <p>Growth & Discipline Advisor</p>
          <div class="online-badge"><span class="pulse"></span>Analyzing Performance</div>
        </div>

        <div class="divider"></div>

        <div class="field-group">
          <label>Your Name</label>
          <input
            v-model="userName"
            type="text"
            class="sidebar-input"
            placeholder="Enter your name…"
            @keyup.enter="focusInput"
          />
        </div>

        <div class="field-group">
          <label>Performance Focus</label>
          <div class="quick-chips">
            <button v-for="chip in quickChips" :key="chip.label" class="chip" @click="sendQuick(chip.text)">
              {{ chip.label }}
            </button>
          </div>
        </div>

        <div class="mood-meter">
          <label>Energy Level</label>
          <div class="mood-emojis">
            <button
              v-for="m in energyLevels"
              :key="m.val"
              class="mood-btn"
              :class="{ selected: selectedEnergy === m.val }"
              @click="selectedEnergy = m.val; sendQuick(m.prompt)"
            >{{ m.emoji }}</button>
          </div>
        </div>
      </div>

      <div class="sidebar-bottom">
        <div class="msg-count">{{ messages.length }} insights</div>
        <button class="clear-btn" @click="clearChat">🗑 Reset session</button>
      </div>
    </aside>

    <!-- Main -->
    <div class="chat-main">
      <!-- Header -->
      <div class="chat-header">
        <div class="header-left">
          <div class="header-avatar">⚙️</div>
          <div>
            <strong>The Mentor</strong>
            <div class="header-sub">{{ loading ? 'Optimizing advice…' : 'Advanced Performance Support' }}</div>
          </div>
        </div>
        <div class="header-pill">
          <span class="pill-dot"></span>
          Live Guidance
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-area" ref="messagesArea">
        <!-- Welcome -->
        <div v-if="messages.length === 0" class="welcome-wrap">
          <div class="welcome-glow"></div>
          <div class="welcome-icon">⚙️</div>
          <h2>Focus, {{ userName || 'User' }}.</h2>
          <p>I am here to architect your discipline. Tell me your objectives, your current bottlenecks, or where you're lacking consistency.</p>
          <div class="starter-grid">
            <button v-for="s in starters" :key="s" class="starter-btn" @click="sendQuick(s)">
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Bubbles -->
        <transition-group name="msg" tag="div" class="bubble-list">
          <div v-for="msg in messages" :key="msg.id" class="msg-row" :class="msg.role">
            <div v-if="msg.role === 'assistant'" class="bubble-avatar">⚙️</div>
            <div class="bubble-col" :class="msg.role">
              <div class="bubble" :class="msg.role">
                <span v-if="msg.role === 'assistant'" v-html="renderMarkdown(msg.content)"></span>
                <span v-else>{{ msg.content }}</span>
              </div>
              <span class="bubble-time">{{ msg.time }}</span>
            </div>
            <div v-if="msg.role === 'user'" class="bubble-avatar user">{{ userInitial }}</div>
          </div>
        </transition-group>

        <!-- Typing -->
        <div v-if="loading" class="msg-row assistant typing-row">
          <div class="bubble-avatar">⚙️</div>
          <div class="bubble-col assistant">
            <div class="bubble assistant typing-bubble">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <transition name="slide-up">
        <div v-if="errorMessage" class="error-bar">
          <span>⚠️ {{ errorMessage }}</span>
          <button @click="errorMessage = ''">✕</button>
        </div>
      </transition>

      <!-- Input -->
      <div class="input-zone">
        <div class="input-box" :class="{ focused: inputFocused }">
          <textarea
            ref="chatInput"
            v-model="currentMessage"
            class="chat-textarea"
            placeholder="Report your progress or status…"
            rows="1"
            @keydown.enter.prevent="handleEnter"
            @focus="inputFocused = true"
            @blur="inputFocused = false"
            @input="autoResize"
          ></textarea>
          <button
            class="send-btn"
            :class="{ ready: currentMessage.trim() && !loading }"
            :disabled="!currentMessage.trim() || loading"
            @click="sendMessage"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="input-footer">
          <span>Objective tracking active &middot; Analyze with <kbd>Enter</kbd></span>
          <span class="powered-by">Growth AI Engine</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AiSupport',
  data() {
    return {
      userName: '',
      currentMessage: '',
      messages: [],
      loading: false,
      errorMessage: '',
      inputFocused: false,
      selectedEnergy: null,
      msgCounter: 0,
      quickChips: [
        { label: '📉 Low Productivity', text: "I'm struggling to get things done today." },
        { label: '🛑 Procrastination', text: "I keep putting off my important tasks." },
        { label: '🎯 Target Missing', text: "I'm losing focus on my long-term goals." },
        { label: '😴 Sleep Issues', text: "My sleep schedule is ruining my mornings." },
        { label: '🔥 Burnout', text: "I'm pushing hard but starting to feel drained." },
        { label: '📈 Peak State', text: "I'm in a flow state, how do I maintain it?" },
      ],
      energyLevels: [
        { val: 1, emoji: '🪫', prompt: "My energy is at zero. I need a recovery strategy." },
        { val: 2, emoji: '🥱', prompt: "I'm feeling sluggish and unmotivated." },
        { val: 3, emoji: '⚡', prompt: "I'm ready to work. Give me an objective." },
        { val: 4, emoji: '🚀', prompt: "I'm at 100% capacity. How do I optimize further?" },
      ],
      starters: [
        "How do I build a 5 AM habit?",
        "Help me design a deep work protocol",
        "I failed my habit today, what now?",
        "Give me a discipline-building exercise",
        "How do I eliminate distractions?",
        "Explain the growth mindset in action",
      ],
    };
  },
  computed: {
    userInitial() {
      return this.userName ? this.userName.charAt(0).toUpperCase() : 'U';
    },
    conversationHistory() {
      return this.messages.map((m) => ({ role: m.role, content: m.content }));
    },
  },
  methods: {
    now() {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    autoResize(e) {
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 150) + 'px';
    },
    focusInput() {
      this.$refs.chatInput?.focus();
    },
    handleEnter(e) {
      if (e.shiftKey) return;
      this.sendMessage();
    },
    async sendQuick(text) {
      this.currentMessage = text;
      await this.sendMessage();
    },
    async sendMessage() {
      const text = this.currentMessage.trim();
      if (!text || this.loading) return;

      this.currentMessage = '';
      this.$nextTick(() => {
        if (this.$refs.chatInput) this.$refs.chatInput.style.height = 'auto';
      });

      this.messages.push({
        id: ++this.msgCounter,
        role: 'user',
        content: text,
        time: this.now(),
      });
      this.scrollToBottom();

      this.loading = true;
      this.errorMessage = '';

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userName: this.userName,
            messages: this.conversationHistory, // Note: System prompt is handled in the backend
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          this.errorMessage = data.reply || data.error || 'Connection failure.';
          return;
        }

        this.messages.push({
          id: ++this.msgCounter,
          role: 'assistant',
          content: data.reply || "Awaiting your report.",
          time: this.now(),
        });
      } catch (err) {
        console.error(err);
        this.errorMessage = 'Mentor node unreachable.';
      } finally {
        this.loading = false;
        this.scrollToBottom();
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.messagesArea;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },
    clearChat() {
      this.messages = [];
      this.errorMessage = '';
      this.msgCounter = 0;
      this.selectedEnergy = null;
    },
    renderMarkdown(text) {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
    },
  },
};
</script>

<style scoped>
/* ── Shell Layout ── */
.chat-shell {
  display: flex;
  height: calc(100vh - 68px);
  background: var(--bg);
  overflow: hidden;
}

/* ── Sidebar ── */
.sidebar {
  width: 268px;
  min-width: 268px;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-right: 1px solid var(--border);
  overflow-y: auto;
}

.sidebar-top { flex: 1; padding: 24px 18px 16px; display: flex; flex-direction: column; gap: 20px; }

.ai-profile { text-align: center; }

.ai-avatar-lg {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0 auto 12px;
  background: linear-gradient(135deg, var(--teal), var(--purple));
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #080c14;
}

.avatar-ring {
  position: absolute;
  inset: -4px;
  border-radius: 22px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, var(--teal), var(--purple)) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: destination-out;
  mask-composite: exclude;
  animation: spin 8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.ai-profile h3 { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 3px; }
.ai-profile p { font-size: 12px; color: var(--text-3); margin-bottom: 10px; }

.online-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(0, 229, 204, 0.1);
  border: 1px solid rgba(0, 229, 204, 0.2);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 11px;
  color: var(--teal);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pulse {
  width: 7px; height: 7px;
  background: var(--teal);
  border-radius: 50%;
  display: inline-block;
  animation: blink 2s infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }

.divider { height: 1px; background: var(--border); }

label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--text-3);
  margin-bottom: 8px;
}

.sidebar-input {
  width: 100%;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text);
  font-size: 14px;
  padding: 10px 12px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}
.sidebar-input::placeholder { color: var(--text-3); }
.sidebar-input:focus { border-color: rgba(0,229,204,0.4); }

.quick-chips { display: flex; flex-direction: column; gap: 6px; }

.chip {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border);
  border-radius: 9px;
  color: var(--text-2);
  font-size: 13px;
  padding: 9px 12px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: all 0.2s;
}
.chip:hover { background: var(--teal-dim); border-color: rgba(0,229,204,0.3); color: var(--text); transform: translateX(2px); }

.mood-meter label { margin-bottom: 10px; }
.mood-emojis { display: flex; gap: 8px; }
.mood-btn {
  flex: 1;
  padding: 10px 4px;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 22px;
  cursor: pointer;
  transition: all 0.2s;
}
.mood-btn:hover { transform: translateY(-2px); border-color: var(--border-2); }
.mood-btn.selected { background: var(--teal-dim); border-color: rgba(0,229,204,0.4); }

.sidebar-bottom {
  padding: 14px 18px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.msg-count { font-size: 11px; color: var(--text-3); font-weight: 600; text-transform: uppercase; }

.clear-btn {
  background: rgba(248,113,113,0.08);
  border: 1px solid rgba(248,113,113,0.15);
  border-radius: 9px;
  color: var(--danger);
  font-size: 11px;
  font-weight: 600;
  padding: 7px 12px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}
.clear-btn:hover { background: rgba(248,113,113,0.16); }

/* ── Chat Main ── */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-2);
  min-width: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.header-left { display: flex; align-items: center; gap: 12px; }

.header-avatar {
  width: 42px; height: 42px;
  background: linear-gradient(135deg, var(--teal), var(--purple));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #080c14;
  font-weight: 700;
}

.header-left strong { color: var(--text); font-size: 15px; display: block; }
.header-sub { color: var(--text-3); font-size: 12px; margin-top: 1px; }

.header-pill {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(34,211,165,0.08);
  border: 1px solid rgba(34,211,165,0.18);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 11px;
  color: var(--green);
  font-weight: 600;
  text-transform: uppercase;
}

.pill-dot {
  width: 7px; height: 7px;
  background: var(--green);
  border-radius: 50%;
  animation: pulse-dot 2s infinite;
}
@keyframes pulse-dot {
  0% { box-shadow: 0 0 0 0 rgba(34,211,165,0.5); }
  70% { box-shadow: 0 0 0 7px rgba(34,211,165,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,211,165,0); }
}

/* ── Messages ── */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 28px 28px 16px;
  scroll-behavior: smooth;
  display: flex;
  flex-direction: column;
}

.welcome-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 16px;
  position: relative;
}

.welcome-glow {
  position: absolute;
  width: 360px; height: 360px;
  background: var(--teal);
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.08;
}

.welcome-icon {
  width: 72px; height: 72px;
  background: linear-gradient(135deg, var(--teal), var(--purple));
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: #080c14;
  margin-bottom: 24px;
}

.welcome-wrap h2 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 32px;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}

.welcome-wrap p {
  color: var(--text-2);
  font-size: 16px;
  line-height: 1.7;
  max-width: 480px;
  margin-bottom: 32px;
}

.starter-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 500px;
}

.starter-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  padding: 13px 16px;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
  line-height: 1.5;
}
.starter-btn:hover {
  background: var(--teal-dim);
  border-color: rgba(0,229,204,0.3);
  color: var(--text);
  transform: translateY(-2px);
}

/* ── Bubble list ── */
.bubble-list { display: flex; flex-direction: column; gap: 24px; padding-bottom: 10px; }

.msg-row { display: flex; align-items: flex-end; gap: 12px; }
.msg-row.user { flex-direction: row-reverse; }

.bubble-avatar {
  width: 34px; height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--teal), var(--purple));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #080c14;
  font-weight: 700;
  flex-shrink: 0;
}
.bubble-avatar.user {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

.bubble-col { display: flex; flex-direction: column; gap: 6px; max-width: 70%; }
.bubble-col.user { align-items: flex-end; }

.bubble {
  padding: 16px 20px;
  border-radius: 22px;
  font-size: 15px;
  line-height: 1.65;
  word-break: break-word;
}

.bubble.assistant {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-bottom-left-radius: 4px;
}

.bubble.user {
  background: linear-gradient(135deg, var(--teal) 0%, #0ea5e9 100%);
  color: #080c14;
  font-weight: 600;
  border-bottom-right-radius: 4px;
}

.bubble :deep(strong) { font-weight: 700; color: var(--teal); }
.msg-row.user .bubble :deep(strong) { color: #080c14; }

.bubble-time { font-size: 11px; color: var(--text-3); padding: 0 4px; font-weight: 500; }

/* ── Typing ── */
.typing-bubble { padding: 16px 24px; min-width: 60px; }
.dot {
  width: 7px; height: 7px;
  background: var(--teal);
  border-radius: 50%;
  animation: bounce 1.3s infinite ease-in-out;
  margin-right: 6px;
}
.dot:nth-child(2) { animation-delay: 0.18s; }
.dot:nth-child(3) { animation-delay: 0.36s; margin-right: 0; }

/* ── Error ── */
.error-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(248,113,113,0.12);
  border-top: 1.5px solid rgba(248,113,113,0.25);
  color: #fca5a5;
  font-size: 14px;
  font-weight: 500;
}
.error-bar button { background: none; border: none; color: var(--danger); cursor: pointer; font-size: 16px; font-weight: 700; }

/* ── Input ── */
.input-zone { padding: 20px 28px 24px; background: var(--surface); border-top: 1px solid var(--border); }

.input-box {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: var(--bg-2);
  border: 1.5px solid var(--border);
  border-radius: 18px;
  padding: 12px 12px 12px 20px;
  transition: all 0.25s;
}

.input-box.focused { border-color: rgba(0,229,204,0.45); box-shadow: 0 0 0 5px rgba(0,229,204,0.08); background: var(--surface-2); }

.chat-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 15px;
  font-family: inherit;
  resize: none;
  line-height: 1.6;
  max-height: 150px;
}

.send-btn {
  width: 44px; height: 44px;
  border-radius: 12px;
  border: none;
  background: var(--surface-2);
  color: var(--text-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.send-btn.ready { background: linear-gradient(135deg, var(--teal), #0ea5e9); color: #080c14; box-shadow: 0 4px 15px rgba(0,229,204,0.25); }
.send-btn.ready:hover { transform: translateY(-2px) scale(1.05); }

.input-footer { display: flex; justify-content: space-between; margin-top: 10px; font-size: 11px; color: var(--text-3); font-weight: 500; }
.input-footer kbd { background: var(--surface-2); border: 1px solid var(--border-2); padding: 2px 5px; border-radius: 4px; font-size: 10px; color: var(--text-2); }

@media (max-width: 900px) { .sidebar { display: none; } }
</style>