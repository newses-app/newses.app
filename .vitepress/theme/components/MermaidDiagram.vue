<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useData } from 'vitepress';

// Rendered in the browser, so the page carries the diagram's source and mermaid loads only on
// pages with a diagram; without scripts, the source shows.
const props = defineProps<{ code: string }>();
const source = decodeURIComponent(props.code);
const svg = ref('');
const { isDark } = useData();
let count = 0;

async function render(): Promise<void> {
  const { default: mermaid } = await import('mermaid');
  // Labels are sized by measuring their text, so measure in the page's font, once loaded.
  await document.fonts.ready;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: isDark.value ? 'dark' : 'default',
    fontFamily: getComputedStyle(document.body).fontFamily,
    // At their own size, scrolling sideways if wider than the page, so the text stays readable.
    flowchart: { useMaxWidth: false },
  });
  count += 1;
  svg.value = (await mermaid.render(`mermaid-${String(count)}-${String(Date.now())}`, source)).svg;
}

onMounted(render);
watch(isDark, render);
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- mermaid's output, sanitised by securityLevel 'strict' -->
  <div v-if="svg" class="mermaid-diagram" v-html="svg" />
  <pre v-else class="mermaid-source"><code>{{ source }}</code></pre>
</template>

<style scoped>
.mermaid-diagram {
  /* Mermaid measures labels in a temporary element under <body>, so match its line height. */
  line-height: 24px;
  margin: 16px 0;
  overflow-x: auto;
  text-align: center;
}

/* Labels are paragraphs, which the page's text styles would otherwise space out. */
.mermaid-diagram :deep(p) {
  margin: 0;
  line-height: inherit;
}
</style>
