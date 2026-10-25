<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { VPBadge, VPButton } from 'vitepress/theme';
import {
  fileName,
  formatSize,
  installers,
  type Platform,
  platformOf,
  type ReleaseManifest,
} from '../release.ts';

// The page is rendered without the release, so it never needs rebuilding for one; without
// scripts, or when the fetch fails, it links the full downloads page.
const downloads = __DOWNLOADS_URL__;
const manifest = ref<ReleaseManifest>();
const failed = ref(false);
const platform = ref<Platform>();

const files = computed(() => (manifest.value ? installers(manifest.value) : []));
const recommended = computed(() => files.value.find((i) => i.platform === platform.value));
const checksums = computed(() =>
  manifest.value ? new URL(`${manifest.value.version}/SHA256SUMS`, downloads).href : '',
);
const published = computed(() =>
  manifest.value
    ? new Date(manifest.value.published).toLocaleDateString('en', { dateStyle: 'long' })
    : '',
);

onMounted(async () => {
  platform.value = platformOf(navigator.userAgent);
  try {
    const response = await fetch(__LATEST_JSON_URL__, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`latest.json: ${String(response.status)}`);
    manifest.value = (await response.json()) as ReleaseManifest;
  } catch {
    failed.value = true;
  }
});
</script>

<template>
  <div class="download-list">
    <template v-if="manifest">
      <p>
        Newses {{ manifest.version }}
        <VPBadge v-if="manifest.prerelease" type="warning" text="Prerelease" />, published
        {{ published }}.
      </p>
      <p v-if="recommended">
        <VPButton
          :href="recommended.file.url"
          :text="`Download the ${recommended.label}`"
          target="_self"
        />
        {{ formatSize(recommended.file.size) }}
      </p>
      <table>
        <thead>
          <tr>
            <th>Installer</th>
            <th>File and SHA-256</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="installer in files"
            :key="installer.file.url"
            :class="{ recommended: installer === recommended }"
          >
            <td>{{ installer.label }}</td>
            <td>
              <a :href="installer.file.url">{{ fileName(installer.file.url) }}</a>
              <span class="size">{{ formatSize(installer.file.size) }}</span>
              <code class="sha256">{{ installer.file.sha256 }}</code>
            </td>
          </tr>
        </tbody>
      </table>
      <p>
        Checksums of every file:
        <a :href="checksums">SHA256SUMS</a>.
      </p>
    </template>
    <p v-else-if="failed" class="warning">The latest release could not be loaded.</p>
    <p>
      Every file, with commands to download, check, and install it:
      <a :href="downloads">all downloads</a>.
    </p>
  </div>
</template>

<style scoped>
/* The page's link styles would otherwise apply to the button. */
.download-list :deep(.VPButton) {
  text-decoration: none;
  color: var(--vp-button-brand-text);
}

.recommended td {
  background-color: var(--vp-c-brand-soft);
}

.size {
  margin-left: 0.5em;
  white-space: nowrap;
  color: var(--vp-c-text-2);
}

.sha256 {
  display: block;
  margin-top: 0.25em;
  width: fit-content;
  word-break: break-all;
}

.warning {
  color: var(--vp-c-warning-1);
}
</style>
