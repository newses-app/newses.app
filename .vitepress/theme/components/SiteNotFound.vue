<script setup lang="ts">
// The default theme's 404 page (via the alias in config.ts), as the main landmark, with ways on.
const LINKS = [
  { text: 'Home', link: '/' },
  { text: 'Getting started', link: '/guide/getting-started' },
  { text: 'Download', link: '/download' },
  { text: 'Contributing', link: '/contributing/' },
];
</script>

<template>
  <main class="NotFound">
    <p class="code">404</p>
    <h1 class="title">Page not found</h1>
    <div class="divider" />
    <p class="text">
      This page doesn't exist, or has moved. Search the site, or start from one of these:
    </p>
    <nav class="links" aria-label="Pages">
      <a v-for="item in LINKS" :key="item.link" class="link" :href="item.link">{{ item.text }}</a>
    </nav>
  </main>
</template>

<style scoped>
.NotFound {
  padding: 64px 24px 96px;
  text-align: center;
}

@media (min-width: 768px) {
  .NotFound {
    padding: 96px 32px 168px;
  }
}

.code {
  line-height: 64px;
  font-size: 64px;
  font-weight: 600;
}

.title {
  padding-top: 12px;
  line-height: 28px;
  font-size: 24px;
  font-weight: 700;
}

.divider {
  margin: 24px auto 18px;
  width: 64px;
  height: 1px;
  background-color: var(--vp-c-divider);
}

.text {
  margin: 0 auto;
  max-width: 360px;
  font-size: 16px;
  color: var(--vp-c-text-2);
}

.links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  padding-top: 24px;
}

.link {
  display: inline-block;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 16px;
  padding: 3px 16px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  transition:
    border-color 0.25s,
    color 0.25s;
}

.link:hover {
  border-color: var(--vp-c-brand-2);
  color: var(--vp-c-brand-2);
}
</style>
