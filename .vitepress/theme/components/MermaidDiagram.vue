<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useData } from 'vitepress';

// Rendered in the browser, so the page carries the diagram's source and mermaid loads only on
// pages with a diagram; without scripts, the source shows.
const props = defineProps<{ code: string }>();
const source = decodeURIComponent(props.code);
const svg = ref('');
const { isDark } = useData();
let count = 0;

const MIN_SCALE = 0.1;
const MAX_SCALE = 4;
const STEP = 1.25;
// The inline view's height limit, as in the styles below.
const INLINE_HEIGHT = 0.7;

const figure = useTemplateRef<HTMLElement>('figure');
const viewport = useTemplateRef<HTMLElement>('viewport');
// The diagram's own size, from its viewBox.
const size = ref({ width: 0, height: 0 });
const scale = ref(1);
// Fitted diagrams refit as their space changes, until the reader zooms.
const fitted = ref(true);
const fullscreen = ref(false);
const canFullscreen = ref(false);
const percent = computed(() => `${String(Math.round(scale.value * 100))}%`);

async function render(): Promise<void> {
  const { default: mermaid } = await import('mermaid');
  // Labels are sized by measuring their text, so measure in the page's font, once loaded.
  await document.fonts.ready;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: isDark.value ? 'dark' : 'default',
    fontFamily: getComputedStyle(document.body).fontFamily,
    // Sized by the viewer below, from the diagram's own size.
    flowchart: { useMaxWidth: false },
  });
  count += 1;
  svg.value = (await mermaid.render(`mermaid-${String(count)}-${String(Date.now())}`, source)).svg;
  await nextTick();
  const element = viewport.value?.querySelector('svg');
  if (!element) return;
  const box = element.viewBox.baseVal;
  size.value = { width: box.width, height: box.height };
  element.removeAttribute('width');
  element.removeAttribute('height');
  element.style.removeProperty('max-width');
  if (fitted.value) fit();
}

function zoomTo(next: number): void {
  const element = viewport.value;
  if (!element) return;
  // Keep what is in the middle of the view there.
  const x = (element.scrollLeft + element.clientWidth / 2) / element.scrollWidth;
  const y = (element.scrollTop + element.clientHeight / 2) / element.scrollHeight;
  scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
  void nextTick(() => {
    element.scrollLeft = x * element.scrollWidth - element.clientWidth / 2;
    element.scrollTop = y * element.scrollHeight - element.clientHeight / 2;
  });
}

function zoom(factor: number): void {
  fitted.value = false;
  zoomTo(scale.value * factor);
}

function actualSize(): void {
  fitted.value = false;
  zoomTo(1);
}

/** The whole diagram in view: inline, never larger than its own size; full screen, up to double. */
function fit(): void {
  fitted.value = true;
  const element = viewport.value;
  if (!element || size.value.width === 0) return;
  const height = fullscreen.value ? element.clientHeight : window.innerHeight * INLINE_HEIGHT;
  zoomTo(
    Math.min(
      element.clientWidth / size.value.width,
      height / size.value.height,
      fullscreen.value ? 2 : 1,
    ),
  );
}

async function toggleFullscreen(): Promise<void> {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await figure.value?.requestFullscreen();
}

function onFullscreenChange(): void {
  fullscreen.value =
    document.fullscreenElement !== null && document.fullscreenElement === figure.value;
  void nextTick(fit);
}

// Mouse drags pan; touch scrolls natively.
let drag: { x: number; y: number } | undefined;

function onPointerDown(event: PointerEvent): void {
  if (event.pointerType !== 'mouse' || event.button !== 0 || fitted.value) return;
  drag = { x: event.clientX, y: event.clientY };
  viewport.value?.setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent): void {
  const element = viewport.value;
  if (!drag || !element) return;
  element.scrollLeft -= event.clientX - drag.x;
  element.scrollTop -= event.clientY - drag.y;
  drag = { x: event.clientX, y: event.clientY };
}

function onPointerUp(): void {
  drag = undefined;
}

let resized: ResizeObserver | undefined;

onMounted(() => {
  canFullscreen.value = document.fullscreenEnabled;
  document.addEventListener('fullscreenchange', onFullscreenChange);
  resized = new ResizeObserver(() => {
    if (fitted.value) fit();
  });
  if (figure.value) resized.observe(figure.value);
  void render();
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  resized?.disconnect();
});

watch(isDark, render);
</script>

<template>
  <figure ref="figure" class="mermaid-diagram" :class="{ fullscreen }">
    <template v-if="svg">
      <div class="toolbar" role="toolbar" aria-label="Diagram">
        <button
          type="button"
          title="Zoom out"
          aria-label="Zoom out"
          :disabled="scale <= MIN_SCALE"
          @click="zoom(1 / STEP)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>
        </button>
        <button type="button" class="percent" title="Actual size" @click="actualSize">
          {{ percent }}
        </button>
        <button
          type="button"
          title="Zoom in"
          aria-label="Zoom in"
          :disabled="scale >= MAX_SCALE"
          @click="zoom(STEP)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5v14" /></svg>
        </button>
        <button type="button" title="Fit" :aria-pressed="fitted" @click="fit">Fit</button>
        <button
          v-if="canFullscreen"
          type="button"
          :title="fullscreen ? 'Exit full screen' : 'Full screen'"
          :aria-label="fullscreen ? 'Exit full screen' : 'Full screen'"
          @click="toggleFullscreen"
        >
          <svg v-if="fullscreen" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"
            />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"
            />
          </svg>
        </button>
      </div>
      <!-- eslint-disable vue/no-v-html -- mermaid's output, sanitised by securityLevel 'strict' -->
      <div
        ref="viewport"
        class="viewport"
        :class="{ pannable: !fitted }"
        :style="{
          '--diagram-width': `${String(size.width * scale)}px`,
          '--diagram-height': `${String(size.height * scale)}px`,
        }"
        tabindex="0"
        aria-label="Diagram"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        v-html="svg"
      />
      <!-- eslint-enable vue/no-v-html -->
    </template>
    <pre v-else class="mermaid-source"><code>{{ source }}</code></pre>
  </figure>
</template>

<style scoped>
.mermaid-diagram {
  /* Mermaid measures labels in a temporary element under <body>, so match its line height. */
  line-height: 24px;
  margin: 16px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.mermaid-diagram.fullscreen {
  display: flex;
  flex-direction: column;
  margin: 0;
  border: none;
  border-radius: 0;
  background: var(--vp-c-bg);
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding: 4px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.toolbar button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 6px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 500;
}

.toolbar button:hover:not(:disabled),
.toolbar button[aria-pressed='true'] {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-1);
}

.toolbar button:disabled {
  opacity: 0.4;
}

.toolbar button.percent {
  min-width: 56px;
  font-variant-numeric: tabular-nums;
}

.toolbar svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Auto margins centre the diagram while it fits, and let it scroll from its edge once it doesn't. */
.viewport {
  display: flex;
  max-height: 70vh;
  overflow: auto;
}

.fullscreen .viewport {
  flex: 1;
  max-height: none;
}

.viewport.pannable {
  cursor: grab;
  user-select: none;
}

.viewport.pannable:active {
  cursor: grabbing;
}

.viewport :deep(svg) {
  flex: none;
  width: var(--diagram-width);
  height: var(--diagram-height);
  max-width: none;
  margin: auto;
}

/* Labels are paragraphs, which the page's text styles would otherwise space out. */
.viewport :deep(p) {
  margin: 0;
  line-height: inherit;
}
</style>
