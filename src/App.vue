<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink to="/home" class="brand">
        <span class="brand-glyph">🚀</span>
        <span>Growth System</span>
      </RouterLink>

      <nav class="navbar">
        <RouterLink to="/home">Dashboard</RouterLink>
        <RouterLink to="/AiSupport">The Mentor</RouterLink>
        <RouterLink to="/Wellness">Habits</RouterLink>
        <RouterLink to="/Breathing">Focus</RouterLink>
      </nav>

      <div class="nav-cta">
        <RouterLink to="/AiSupport" class="cta-btn">Consult The Mentor →</RouterLink>
      </div>
    </header>

    <main class="page-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  height: 68px;
  background: rgba(8, 12, 20, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 19px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.3px;
}

.brand-glyph {
  font-size: 18px;
  filter: drop-shadow(0 0 8px rgba(0,229,204,0.4));
}

.navbar {
  display: flex;
  gap: 6px;
}

.navbar a {
  text-decoration: none;
  color: var(--text-2);
  font-size: 14px;
  font-weight: 500;
  padding: 7px 14px;
  border-radius: 10px;
  transition: all 0.2s;
}

.navbar a:hover {
  color: var(--text);
  background: rgba(255,255,255,0.06);
}

.navbar a.router-link-active {
  color: var(--teal);
  background: var(--teal-dim);
}

.cta-btn {
  text-decoration: none;
  background: linear-gradient(135deg, var(--teal), var(--purple));
  color: #080c14;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 10px;
  transition: opacity 0.2s, transform 0.15s;
  white-space: nowrap;
}

.cta-btn:hover { opacity: 0.88; transform: translateY(-1px); }

.page-content {
  flex: 1;
}

@media (max-width: 768px) {
  .topbar { padding: 0 20px; }
  .nav-cta { display: none; }
  .navbar a { padding: 6px 10px; font-size: 13px; }
}
</style>