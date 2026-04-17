<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>
      <div class="hero-content">
        <div class="badge">🚀 Peak Performance AI System</div>
        <h1>
          Master Your<br>
          <span class="gradient-text">Discipline & Growth</span>
        </h1>
        <p class="hero-sub">
          The Growth System leverage AI to help you build ironclad habits, track daily discipline, and optimize your life — one objective at a time.
        </p>
        <div class="hero-actions">
          <RouterLink to="/AiSupport" class="btn-primary">Consult The Mentor</RouterLink>
          <RouterLink to="/Wellness" class="btn-ghost">Log Daily Habit</RouterLink>
        </div>
        <div class="hero-stats">
          <div class="stat"><strong>50K+</strong><span>Objectives Met</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><strong>95%</strong><span>High Output</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><strong>24/7</strong><span>Accountability</span></div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features-section">
      <div class="section-label">Performance Suite</div>
      <h2 class="section-title">Tools for the Ambitious</h2>
      <div class="features-grid">
        <div v-for="feat in features" :key="feat.id" class="feat-card">
          <div class="feat-icon" :style="{ background: feat.bg }">{{ feat.icon }}</div>
          <h3>{{ feat.title }}</h3>
          <p>{{ feat.desc }}</p>
          <RouterLink :to="feat.link" class="feat-link">Launch Module →</RouterLink>
        </div>
      </div>
    </section>

    <!-- CTA banner -->
    <section class="cta-section">
      <div class="cta-card">
        <div class="cta-orb"></div>
        <h2>Ready to architect your potential?</h2>
        <p>The Mentor is waiting to analyze your current performance. No excuses — just results.</p>
        <RouterLink to="/AiSupport" class="btn-primary">Talk to The Mentor Now</RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { ref } from 'vue'

defineOptions({ name: 'HomeLanding' })

const features = ref([
  {
    id: 1,
    icon: '⚙️',
    title: 'The Mentor AI',
    desc: 'Receive direct, data-driven advice on how to optimize your productivity and overcome procrastination.',
    link: '/AiSupport',
    bg: 'linear-gradient(135deg,rgba(0,229,204,0.15),rgba(0,229,204,0.05))',
  },
  {
    id: 2,
    icon: '🎯',
    title: 'Habit Tracker',
    desc: 'Log activities in your MySQL-powered vault. Track consistency and watch your discipline score rise.',
    link: '/Wellness',
    bg: 'linear-gradient(135deg,rgba(34,211,165,0.15),rgba(34,211,165,0.05))',
  },
  {
    id: 3,
    icon: '⚡',
    title: 'Focus Mode',
    desc: 'Utilize specialized focus exercises designed to calm the mind and prepare for deep work sessions.',
    link: '/Breathing',
    bg: 'linear-gradient(135deg,rgba(129,140,248,0.15),rgba(129,140,248,0.05))',
  },
])
</script>

<style scoped>
.home { overflow-x: hidden; }

/* ── Hero ── */
.hero {
  position: relative;
  min-height: calc(100vh - 68px);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
  overflow: hidden;
}

.hero-bg { position: absolute; inset: 0; pointer-events: none; }

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.35;
}
.orb-1 { width: 500px; height: 500px; background: var(--teal); top: -150px; left: -100px; animation: drift 10s ease-in-out infinite alternate; }
.orb-2 { width: 400px; height: 400px; background: var(--purple); bottom: -100px; right: -80px; animation: drift 13s ease-in-out infinite alternate-reverse; }
.orb-3 { width: 300px; height: 300px; background: #0ea5e9; top: 40%; left: 45%; animation: drift 8s ease-in-out infinite alternate; }

@keyframes drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(30px, 20px) scale(1.05); }
}

.hero-content { position: relative; z-index: 1; max-width: 760px; }

.badge {
  display: inline-block;
  background: var(--teal-dim);
  border: 1px solid rgba(0,229,204,0.25);
  color: var(--teal);
  font-size: 13px;
  font-weight: 700;
  padding: 6px 16px;
  border-radius: 20px;
  letter-spacing: 0.5px;
  margin-bottom: 28px;
  text-transform: uppercase;
}

h1 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(44px, 7vw, 80px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -2px;
  color: var(--text);
  margin-bottom: 22px;
}

.gradient-text {
  background: linear-gradient(135deg, var(--teal), var(--purple) 60%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-sub {
  font-size: clamp(16px, 2vw, 19px);
  color: var(--text-2);
  line-height: 1.7;
  max-width: 600px;
  margin: 0 auto 36px;
}

.hero-actions { display: flex; gap: 14px; justify-content: center; margin-bottom: 48px; flex-wrap: wrap; }

.btn-primary {
  text-decoration: none;
  background: linear-gradient(135deg, var(--teal), #0ea5e9);
  color: #080c14;
  font-size: 15px;
  font-weight: 700;
  padding: 14px 30px;
  border-radius: 14px;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 0 40px rgba(0,229,204,0.25);
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 0 60px rgba(0,229,204,0.4); }

.btn-ghost {
  text-decoration: none;
  border: 1px solid var(--border-2);
  color: var(--text-2);
  font-size: 15px;
  font-weight: 600;
  padding: 14px 28px;
  border-radius: 14px;
  transition: all 0.2s;
}
.btn-ghost:hover { border-color: rgba(255,255,255,0.25); color: var(--text); background: rgba(255,255,255,0.04); }

.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.stat { display: flex; flex-direction: column; gap: 2px; }
.stat strong { font-size: 22px; font-weight: 800; color: var(--text); }
.stat span { font-size: 12px; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.8px; }
.stat-divider { width: 1px; height: 36px; background: var(--border-2); }

/* ── Features ── */
.features-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 80px 24px;
  text-align: center;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--teal);
  margin-bottom: 14px;
}

.section-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(28px, 4vw, 44px);
  font-weight: 800;
  color: var(--text);
  letter-spacing: -1px;
  margin-bottom: 50px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.feat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 30px;
  text-align: left;
  transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
  position: relative;
  overflow: hidden;
}

.feat-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,229,204,0.03), transparent 60%);
  opacity: 0;
  transition: opacity 0.3s;
}

.feat-card:hover { transform: translateY(-6px); border-color: var(--border-2); box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
.feat-card:hover::before { opacity: 1; }

.feat-icon {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 18px;
}

.feat-card h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 10px;
}

.feat-card p {
  font-size: 14px;
  color: var(--text-2);
  line-height: 1.7;
  margin-bottom: 18px;
}

.feat-link {
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--teal);
  transition: opacity 0.2s;
}
.feat-link:hover { opacity: 0.75; }

/* ── CTA ── */
.cta-section { padding: 60px 24px 100px; }

.cta-card {
  max-width: 700px;
  margin: 0 auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 60px 40px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta-orb {
  position: absolute;
  width: 300px;
  height: 300px;
  background: var(--teal);
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.1;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.cta-card h2 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 800;
  color: var(--text);
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}

.cta-card p {
  color: var(--text-2);
  font-size: 16px;
  margin-bottom: 30px;
}
</style>