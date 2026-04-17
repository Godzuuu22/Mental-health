<template>
  <div class="wellness-page">
    <!-- Page header -->
    <div class="page-hero">
      <div class="hero-badge">🚀 Growth System</div>
      <h1>Habits & <span class="g-text">Discipline</span></h1>
      <p>Log your daily activities, maintain consistency, and build a high-performance lifestyle.</p>
    </div>

    <div class="wellness-grid">
      <!-- Discipline Score Ring -->
      <div class="card score-card">
        <div class="card-label">Discipline Score</div>
        <div class="ring-wrap">
          <svg viewBox="0 0 120 120" class="ring-svg">
            <circle class="ring-bg" cx="60" cy="60" r="50"/>
            <circle
              class="ring-progress"
              cx="60" cy="60" r="50"
              :style="{ strokeDashoffset: 314 - (314 * disciplineScore) / 100 }"
              :stroke="scoreColor"
            />
          </svg>
          <div class="ring-center">
            <span class="ring-num">{{ disciplineScore }}</span>
            <span class="ring-label">{{ scoreLabel }}</span>
          </div>
        </div>
        <div class="score-pills">
          <div class="score-pill">
            <span class="pill-val" style="color: #00e5cc">{{ habitsHistory.length }}</span>
            <span>Logs</span>
          </div>
          <div class="score-pill">
            <span class="pill-val" style="color: #818cf8">{{ streakDays }}d</span>
            <span>Streak</span>
          </div>
        </div>
      </div>

      <!-- Quick Log -->
      <div class="card log-card">
        <div class="card-label">Log New Activity</div>
        <div class="log-form">
          <input
            v-model="newActivity"
            type="text"
            class="log-input"
            placeholder="What did you achieve today?"
            @keyup.enter="submitHabit"
          />
          <div class="status-selector">
            <button 
              v-for="s in ['completed', 'partial', 'failed']" 
              :key="s"
              class="status-btn"
              :class="{ active: currentStatus === s, [s]: true }"
              @click="currentStatus = s"
            >
              {{ s.charAt(0).toUpperCase() + s.slice(1) }}
            </button>
          </div>
          <button class="submit-btn" :disabled="!newActivity.trim() || submitting" @click="submitHabit">
            {{ submitting ? 'Saving...' : 'Log Activity →' }}
          </button>
        </div>
        
        <div v-if="successMsg" class="success-toast">{{ successMsg }}</div>
      </div>

      <!-- Habits History (Laborary Requirement) -->
      <div class="card habits-card">
        <div class="card-label">Activity History</div>
        <div v-if="loading" class="loading-state">Loading history...</div>
        <div v-else-if="habitsHistory.length === 0" class="empty-state">
          No activities logged yet. Start your discipline journey above.
        </div>
        <div v-else class="habits-list">
          <div
            v-for="log in habitsHistory.slice(0, 6)"
            :key="log.id"
            class="habit-row"
          >
            <div class="habit-check" :class="log.status">
              <span v-if="log.status === 'completed'">✓</span>
              <span v-else-if="log.status === 'partial'">~</span>
              <span v-else>✕</span>
            </div>
            <div class="habit-content">
              <span class="habit-text">{{ log.activity }}</span>
              <span class="habit-date">{{ formatDate(log.timestamp) }}</span>
            </div>
            <span class="user-tag">{{ log.user_name || 'You' }}</span>
          </div>
        </div>
      </div>

      <!-- Growth Tips -->
      <div class="card trend-card">
        <div class="card-label">Growth Mindset</div>
        <div class="tips-list">
          <div v-for="tip in growthTips" :key="tip.title" class="tip-item">
            <strong>{{ tip.title }}</strong>
            <p>{{ tip.text }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

defineOptions({ name: 'GrowthView' })

const newActivity = ref('');
const currentStatus = ref('completed');
const submitting = ref(false);
const loading = ref(false);
const habitsHistory = ref([]);
const successMsg = ref('');

const fetchHabits = async () => {
  loading.value = true;
  try {
    const res = await fetch('/habits');
    if (res.ok) {
      habitsHistory.value = await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch habits:", err);
  } finally {
    loading.value = false;
  }
};

const submitHabit = async () => {
  if (!newActivity.value.trim()) return;
  submitting.value = true;
  try {
    const res = await fetch('/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity: newActivity.value,
        status: currentStatus.value,
        userName: localStorage.getItem('growth_user') || 'User'
      })
    });
    if (res.ok) {
      newActivity.value = '';
      successMsg.value = 'Activity logged successfully!';
      setTimeout(() => successMsg.value = '', 3000);
      await fetchHabits();
    }
  } catch (err) {
    console.error("Submit error:", err);
  } finally {
    submitting.value = false;
  }
};

const disciplineScore = computed(() => {
  if (habitsHistory.value.length === 0) return 0;
  const recent = habitsHistory.value.slice(0, 10);
  const completed = recent.filter(h => h.status === 'completed').length;
  const partial = recent.filter(h => h.status === 'partial').length;
  return Math.round(((completed + (partial * 0.5)) / recent.length) * 100);
});

const streakDays = computed(() => {
  // Mock streak logic based on history
  return habitsHistory.value.length > 0 ? Math.min(habitsHistory.value.length, 7) : 0;
});

const scoreColor = computed(() => {
  if (disciplineScore.value >= 80) return '#00e5cc';
  if (disciplineScore.value >= 50) return '#fbbf24';
  return '#f87171';
});

const scoreLabel = computed(() => {
  if (disciplineScore.value >= 80) return 'Elite';
  if (disciplineScore.value >= 50) return 'Building';
  return 'Lacking';
});

const growthTips = [
  { title: 'The 2-Minute Rule', text: 'If it takes less than 2 minutes, do it now to build momentum.' },
  { title: 'Deep Work', text: 'Schedule 90-minute blocks for high-concentration activities.' },
  { title: 'Failure is Data', text: 'Treat every setback as data for your next improvement cycle.' }
];

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

onMounted(fetchHabits);
</script>

<style scoped>
.wellness-page { max-width: 1100px; margin: 0 auto; padding: 48px 24px 60px; }

/* Hero */
.page-hero { margin-bottom: 40px; }
.hero-badge {
  display: inline-block;
  background: rgba(0, 229, 204, 0.1);
  border: 1px solid rgba(0, 229, 204, 0.2);
  color: var(--teal);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 20px;
  margin-bottom: 14px;
  letter-spacing: 0.5px;
}
.page-hero h1 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(30px, 4vw, 48px);
  font-weight: 800;
  letter-spacing: -1px;
  color: var(--text);
  margin-bottom: 8px;
}
.g-text {
  background: linear-gradient(135deg, var(--teal), var(--purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.page-hero p { color: var(--text-2); font-size: 16px; max-width: 600px; }

/* Grid */
.wellness-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 30px;
  transition: border-color 0.25s, transform 0.25s;
}
.card:hover { border-color: var(--border-2); transform: translateY(-2px); }

.card-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-3);
  margin-bottom: 24px;
}

/* Score ring */
.ring-wrap {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto 22px;
}
.ring-svg { transform: rotate(-90deg); width: 100%; height: 100%; }
.ring-bg { fill: none; stroke: var(--surface-2); stroke-width: 10; }
.ring-progress {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
  stroke-dasharray: 314;
  transition: stroke-dashoffset 1s ease, stroke 0.5s ease;
}
.ring-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.ring-num { font-size: 36px; font-weight: 800; color: var(--text); line-height: 1; }
.ring-label { font-size: 12px; color: var(--text-3); margin-top: 2px; }

.score-pills { display: flex; gap: 12px; justify-content: center; }
.score-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 10px 20px;
  font-size: 12px;
  color: var(--text-2);
}
.pill-val { font-size: 22px; font-weight: 700; }

/* Log Form */
.log-form { display: flex; flex-direction: column; gap: 16px; }
.log-input {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  padding: 14px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}
.log-input:focus { border-color: var(--teal); }

.status-selector { display: flex; gap: 8px; }
.status-btn {
  flex: 1;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-2);
  color: var(--text-3);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.status-btn.active.completed { background: rgba(0, 229, 204, 0.15); border-color: var(--teal); color: var(--teal); }
.status-btn.active.partial { background: rgba(251, 191, 36, 0.15); border-color: var(--warning); color: var(--warning); }
.status-btn.active.failed { background: rgba(248, 113, 113, 0.15); border-color: var(--danger); color: var(--danger); }

.submit-btn {
  background: linear-gradient(135deg, var(--teal), #0ea5e9);
  color: #080c14;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}
.submit-btn:hover { opacity: 0.9; transform: scale(1.02); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.success-toast {
  margin-top: 12px;
  padding: 10px;
  background: rgba(34, 211, 165, 0.1);
  color: var(--green);
  border-radius: 10px;
  text-align: center;
  font-size: 13px;
}

/* History */
.loading-state, .empty-state { text-align: center; color: var(--text-3); font-size: 14px; padding: 40px 0; }
.habits-list { display: flex; flex-direction: column; gap: 12px; }
.habit-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.habit-check {
  width: 24px; height: 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12px;
}
.habit-check.completed { background: var(--teal); color: #080c14; }
.habit-check.partial { background: var(--warning); color: #080c14; }
.habit-check.failed { background: var(--danger); color: white; }

.habit-content { flex: 1; display: flex; flex-direction: column; }
.habit-text { font-size: 15px; color: var(--text); font-weight: 500; }
.habit-date { font-size: 11px; color: var(--text-3); }

.user-tag {
  font-size: 10px;
  background: var(--surface-2);
  padding: 4px 8px;
  border-radius: 6px;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Tips */
.tips-list { display: flex; flex-direction: column; gap: 18px; }
.tip-item strong { display: block; color: var(--teal); font-size: 14px; margin-bottom: 4px; }
.tip-item p { color: var(--text-2); font-size: 13px; line-height: 1.5; }

@media (max-width: 768px) {
  .wellness-grid { grid-template-columns: 1fr; }
}
</style>