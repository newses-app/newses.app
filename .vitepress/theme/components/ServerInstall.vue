<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { VPBadge } from 'vitepress/theme';
import { latestRelease, releasedText } from '../latest.ts';
import {
  type ReleaseFile,
  type ReleaseManifest,
  SERVER_FILES,
  serverCommands,
} from '../release.ts';

// One step of installing or running the server, from the latest release. The page is rendered
// without the release, so it never needs rebuilding for one; without scripts, or when the fetch
// fails, it links the downloads page.
const props = defineProps<{ part: 'install' | 'upgrade' | 'nginx-proxy' | 'verify' | 'image' }>();

const downloads = __DOWNLOADS_URL__;
const manifest = ref<ReleaseManifest>();
const failed = ref(false);
/** The files shown in full, by the name they are saved as, once their SHA-256 matches. */
const contents = ref<{ name: string; lang: string; text: string }[]>([]);

const server = computed(() => manifest.value?.server);
const commands = computed(() => {
  if (!server.value) return [];
  const all = serverCommands(server.value);
  return {
    install: all.install,
    upgrade: all.upgrade,
    'nginx-proxy': all.nginxProxy,
    verify: all.verify,
    image: all.image,
  }[props.part];
});

function shown(release: ReleaseManifest): [string, ReleaseFile][] {
  if (!release.server) return [];
  if (props.part === 'install') {
    return [
      [SERVER_FILES.compose, release.server.compose],
      [SERVER_FILES.env, release.server.env],
    ];
  }
  if (props.part === 'nginx-proxy') return [[SERVER_FILES.nginxProxy, release.server.nginxProxy]];
  return [];
}

onMounted(async () => {
  try {
    manifest.value = await latestRelease();
  } catch {
    failed.value = true;
    return;
  }
  // A file that cannot be fetched, or is not the released one, is left out.
  const files = await Promise.all(
    shown(manifest.value).map(async ([name, file]) => {
      try {
        return {
          name,
          lang: name.endsWith('.yaml') ? 'yaml' : 'env',
          text: await releasedText(file),
        };
      } catch {
        return undefined;
      }
    }),
  );
  contents.value = files.filter((file) => file !== undefined);
});
</script>

<template>
  <div class="server-install">
    <template v-if="manifest && server">
      <p v-if="part === 'install'" class="release">
        Newses {{ manifest.version }}
        <VPBadge v-if="manifest.prerelease" type="warning" text="Prerelease" />
      </p>
      <div class="language-sh">
        <button title="Copy Code" class="copy"></button>
        <span class="lang">sh</span>
        <pre tabindex="0"><code>{{ commands.join('\n') }}</code></pre>
      </div>
      <details v-for="file in contents" :key="file.name" class="details custom-block">
        <summary>{{ file.name }}</summary>
        <div :class="`language-${file.lang}`">
          <button title="Copy Code" class="copy"></button>
          <span class="lang">{{ file.lang }}</span>
          <pre tabindex="0"><code>{{ file.text }}</code></pre>
        </div>
      </details>
    </template>
    <p v-else-if="manifest">
      The latest release has no server image: install
      <a href="/guide/self-hosting#building-from-source">from source</a>.
    </p>
    <template v-else>
      <p v-if="failed" class="warning">The latest release could not be loaded.</p>
      <p>
        The commands are in the Server section of the latest release's
        <a :href="downloads">downloads</a>.
      </p>
    </template>
  </div>
</template>

<style scoped>
.release {
  margin-bottom: 0;
}

.warning {
  color: var(--vp-c-warning-1);
}
</style>
