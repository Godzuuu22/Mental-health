<template>
  <div class="breathing-shell" :style="{ '--phase-color': phaseColor }">
    <div class="bg-glow" :class="{ active: isActive }"></div>

    <div class="breathing-ui">
      <!-- Technique selector -->
      <div class="technique-tabs">
        <button
          v-for="(cfg, key) in techniques"
          :key="key"
          class="tab-btn"
          :class="{ active: currentMode === key }"
          @click="selectTechnique(key)"
        >
          {{ cfg.emoji }} {{ cfg.name }}
        </button>
      </div>

      <!-- Info banner -->
      <div class="technique-info">
        <span>{{ techniques[currentMode].desc }}</span>
      </div>

      <!-- Visualizer -->
      <div class="visualizer-wrap">
        <!-- Outer ripple rings -->
        <div class="ripple-ring ring-1" :class="{ expand: currentPhase.type === 'expand', active: isActive }"></div>
        <div class="ripple-ring ring-2" :class="{ expand: currentPhase.type === 'expand', active: isActive }"></div>

        <!-- Main orb -->
        <div class="orb-container">
          <div class="main-orb" :class="[currentPhase.type, { idle: !isActive }]" :style="orbStyle">
            <div class="orb-inner">
              <span class="phase-text">{{ isActive ? currentPhase.text : 'Ready' }}</span>
              <span class="timer-text">{{ isActive ? timerSeconds + 's' : '' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase progress -->
      <div class="phase-track">
        <div
          v-for="(ph, i) in techniques[currentMode].phases"
          :key="i"
          class="phase-dot"
          :class="{ active: phaseIndex === i && isActive }"
        >
          <span>{{ ph.text }}</span>
          <span class="ph-dur">{{ ph.duration }}s</span>
        </div>
      </div>

      <!-- Session stats -->
      <div class="session-stats">
        <div class="stat-item">
          <strong>{{ cycleCount }}</strong>
          <span>Cycles</span>
        </div>
        <div class="stat-item">
          <strong>{{ sessionTime }}</strong>
          <span>Session</span>
        </div>
        <div class="stat-item">
          <strong>{{ completionPct }}%</strong>
          <span>Phase</span>
        </div>
      </div>

      <!-- Controls -->
      <div class="controls">
        <button class="ctrl-btn secondary" @click="reset" :disabled="!isActive && cycleCount === 0">
          ↺ Reset
        </button>
        <button class="ctrl-btn primary" @click="toggle">
          <span v-if="!isActive">▶ Begin</span>
          <span v-else>⏸ Pause</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';

defineOptions({ name: 'BreathingExercise' })

const techniques = {
  box: {
    name: 'Box Breathing',
    emoji: '🟦',
    desc: 'Reduces stress and improves focus — used by Navy SEALs',
    phases: [
      { text: 'Inhale', type: 'expand', duration: 4 },
      { text: 'Hold', type: 'hold-big', duration: 4 },
      { text: 'Exhale', type: 'shrink', duration: 4 },
      { text: 'Hold', type: 'hold-small', duration: 4 },
    ],
  },
  relax: {
    name: '4-7-8 Relax',
    emoji: '🌙',
    desc: 'Activates the parasympathetic system — ideal for sleep',
    phases: [
      { text: 'Inhale', type: 'expand', duration: 4 },
      { text: 'Hold', type: 'hold-big', duration: 7 },
      { text: 'Exhale', type: 'shrink', duration: 8 },
    ],
  },
  calm: {
    name: 'Calm Breath',
    emoji: '🌊',
    desc: 'Simple rhythmic breathing to ease anxiety quickly',
    phases: [
      { text: 'Inhale', type: 'expand', duration: 5 },
      { text: 'Exhale', type: 'shrink', duration: 5 },
    ],
  },
};

const currentMode = ref('box');
const isActive = ref(false);
const phaseIndex = ref(0);
const timerSeconds = ref(0);
const cycleCount = ref(0);
const sessionSeconds = ref(0);
const completionPct = ref(0);
let phaseInterval = null;
let sessionInterval = null;

const currentPhase = computed(() => techniques[currentMode.value].phases[phaseIndex.value]);

const phaseColor = computed(() => {
  if (!isActive.value) return '#818cf8';
  return currentPhase.value.type === 'expand' ? '#00e5cc' : '#818cf8';
});

const orbStyle = computed(() => ({
  transition: `transform ${currentPhase.value.duration}s cubic-bezier(0.4,0,0.2,1), box-shadow 0.8s ease`,
}));

const sessionTime = computed(() => {
  const m = Math.floor(sessionSeconds.value / 60);
  const s = sessionSeconds.value % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
});

const selectTechnique = (key) => {
  stop();
  currentMode.value = key;
};

const toggle = () => isActive.value ? pause() : start();

const start = () => {
  isActive.value = true;
  runPhase();
  sessionInterval = setInterval(() => sessionSeconds.value++, 1000);
};

const pause = () => {
  isActive.value = false;
  clearInterval(phaseInterval);
  clearInterval(sessionInterval);
};

const reset = () => {
  pause();
  phaseIndex.value = 0;
  timerSeconds.value = 0;
  cycleCount.value = 0;
  sessionSeconds.value = 0;
  completionPct.value = 0;
};

const stop = () => {
  reset();
};

const runPhase = () => {
  if (!isActive.value) return;
  const duration = currentPhase.value.duration;
  timerSeconds.value = duration;
  completionPct.value = 0;

  phaseInterval = setInterval(() => {
    timerSeconds.value--;
    completionPct.value = Math.round(((duration - timerSeconds.value) / duration) * 100);

    if (timerSeconds.value <= 0) {
      clearInterval(phaseInterval);
      const phases = techniques[currentMode.value].phases;
      phaseIndex.value = (phaseIndex.value + 1) % phases.length;
      if (phaseIndex.value === 0) cycleCount.value++;
      runPhase();
    }
  }, 1000);
};

onUnmounted(stop);
</script>

<style scoped>
.breathing-shell {
  min-height: calc(100vh - 68px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  position: relative;
  overflow: hidden;
  transition: background 2s ease;
}

.bg-glow {
  position: absolute;
  width: 600px; height: 600px;
  background: radial-gradient(circle, var(--phase-color, var(--purple)), transparent 70%);
  border-radius: 50%;
  opacity: 0;
  filter: blur(60px);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  transition: opacity 2s ease, background 2s ease;
  pointer-events: none;
}
.bg-glow.active { opacity: 0.12; }

.breathing-ui {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  padding: 40px 20px;
  width: 100%;
  max-width: 560px;
  text-align: center;
}

/* Tabs */
.technique-tabs { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }

.tab-btn {
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-2);
  font-size: 14px;
  font-weight: 500;
  padding: 10px 18px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.tab-btn:hover { background: rgba(255,255,255,0.08); color: var(--text); }
.tab-btn.active {
  background: var(--teal-dim);
  border-color: rgba(0,229,204,0.35);
  color: var(--teal);
  font-weight: 600;
}

.technique-info {
  font-size: 13px;
  color: var(--text-3);
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 9px 18px;
}

/* Visualizer */
.visualizer-wrap {
  position: relative;
  width: 280px; height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ripple-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid var(--phase-color);
  opacity: 0;
  transition: all 0.5s ease;
}
.ripple-ring.ring-1 { width: 180px; height: 180px; }
.ripple-ring.ring-2 { width: 240px; height: 240px; }

.ripple-ring.active {
  opacity: 0.2;
  animation: pulse-ring 4s ease-in-out infinite;
}
.ripple-ring.ring-2.active { animation-delay: 0.5s; opacity: 0.12; }
.ripple-ring.expand { opacity: 0.4 !important; }

@keyframes pulse-ring {
  0%,100% { transform: scale(1); opacity: 0.2; }
  50% { transform: scale(1.08); opacity: 0.05; }
}

.orb-container { position: relative; z-index: 2; }

.main-orb {
  width: 160px; height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #00e5cc, #818cf8 60%, #0ea5e9);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(0.5);
  filter: blur(1px);
  box-shadow:
    0 0 40px rgba(0,229,204,0.3),
    0 0 80px rgba(129,140,248,0.15);
}

.main-orb.expand { transform: scale(1); filter: blur(0px); }
.main-orb.hold-big { transform: scale(1); filter: blur(0px); }
.main-orb.shrink { transform: scale(0.5); filter: blur(1px); }
.main-orb.hold-small { transform: scale(0.5); filter: blur(1px); }
.main-orb.idle { transform: scale(0.7); filter: blur(0.5px); animation: float 4s ease-in-out infinite; }

@keyframes float {
  0%,100% { transform: scale(0.7) translateY(0); }
  50% { transform: scale(0.72) translateY(-8px); }
}

.orb-inner { text-align: center; color: #080c14; }
.phase-text { display: block; font-size: 17px; font-weight: 800; }
.timer-text { display: block; font-size: 13px; opacity: 0.7; margin-top: 2px; }

/* Phase track */
.phase-track {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.phase-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 12px;
  color: var(--text-3);
  transition: all 0.3s;
}
.phase-dot.active {
  background: var(--teal-dim);
  border-color: rgba(0,229,204,0.35);
  color: var(--teal);
}
.ph-dur { font-size: 11px; font-weight: 600; }

/* Session stats */
.session-stats {
  display: flex;
  gap: 20px;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 60px;
}
.stat-item strong { font-size: 24px; font-weight: 800; color: var(--text); }
.stat-item span { font-size: 11px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.8px; }

/* Controls */
.controls { display: flex; gap: 14px; }

.ctrl-btn {
  padding: 14px 32px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.ctrl-btn.primary {
  background: linear-gradient(135deg, var(--teal), #0ea5e9);
  border: none;
  color: #080c14;
  min-width: 160px;
  box-shadow: 0 0 30px rgba(0,229,204,0.2);
}
.ctrl-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 0 44px rgba(0,229,204,0.35); }

.ctrl-btn.secondary {
  background: transparent;
  border: 1px solid var(--border-2);
  color: var(--text-2);
}
.ctrl-btn.secondary:hover { border-color: rgba(255,255,255,0.25); color: var(--text); }
.ctrl-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }

@media (max-width: 600px) {
  .visualizer-wrap { width: 220px; height: 220px; }
  .main-orb { width: 130px; height: 130px; }
}
</style>