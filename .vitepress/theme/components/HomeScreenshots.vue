<script setup lang="ts">
import { data as files } from '../../screenshots.data.ts';
import { fileName, SCHEMES, type Screen, type Viewport, VIEWPORTS } from '../../screenshots.ts';

interface Shot {
  screen: Screen;
  viewport: Viewport;
  alt: string;
}

// Each shown in the visitor's colour scheme; a shot appears once both of its images exist.
const SHOTS: Shot[] = [
  {
    screen: 'reader',
    viewport: 'desktop',
    alt: 'The Newses reader: feeds and categories, the article list, and an open article',
  },
  { screen: 'article', viewport: 'phone', alt: 'An article in Newses on a phone' },
  { screen: 'filters', viewport: 'desktop', alt: 'Filters in Newses settings' },
  { screen: 'settings', viewport: 'desktop', alt: 'Themes and appearance settings in Newses' },
];

const shots = SHOTS.filter((shot) =>
  SCHEMES.every((scheme) => files.includes(fileName(shot.screen, shot.viewport, scheme))),
).map((shot) => ({ ...shot, ...VIEWPORTS[shot.viewport] }));
</script>

<template>
  <section v-if="shots.length > 0" class="home-screenshots" aria-label="Screenshots">
    <figure v-for="shot in shots" :key="shot.screen" :class="[shot.viewport, shot.screen]">
      <img
        v-for="scheme in SCHEMES"
        :key="scheme"
        :class="scheme"
        :src="`/screenshots/${fileName(shot.screen, shot.viewport, scheme)}`"
        :alt="shot.alt"
        :width="shot.width * shot.scale"
        :height="shot.height * shot.scale"
        loading="lazy"
        decoding="async"
      />
    </figure>
  </section>
</template>

<style scoped>
.home-screenshots {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin: 48px auto 0;
}

/* The reader beside the phone, then the other screens two by two. */
@media (min-width: 960px) {
  .home-screenshots {
    grid-template-columns: repeat(4, 1fr);
    align-items: start;
  }

  figure.reader {
    grid-column: span 3;
  }

  figure.desktop:not(.reader) {
    grid-column: span 2;
  }
}

figure {
  margin: 0;
}

figure.phone {
  max-width: 280px;
  justify-self: center;
}

img {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
</style>

<style>
/* Only the visitor's scheme; lazy images that are not shown are not fetched. */
.dark .home-screenshots img.light,
html:not(.dark) .home-screenshots img.dark {
  display: none;
}
</style>
