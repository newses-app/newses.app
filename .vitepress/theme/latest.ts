// Reads the app stage's latest release in the browser, once per page load however many
// components show it.
import { type ReleaseFile, type ReleaseManifest, sha256 } from './release.ts';

let latest: Promise<ReleaseManifest> | undefined;

/** The latest release's manifest; a failed fetch is tried again by the next caller. */
export function latestRelease() {
  latest ??= fetch(__LATEST_JSON_URL__, { cache: 'no-cache' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`latest.json: ${String(response.status)}`);
      return (await response.json()) as ReleaseManifest;
    })
    .catch((error: unknown) => {
      latest = undefined;
      throw error;
    });
  return latest;
}

/** A released file's text, only if it is the file the manifest describes. */
export async function releasedText(file: ReleaseFile) {
  // `vitepress dev` proxies the downloads folder, which allows only the site's origins.
  const url = import.meta.env.DEV ? new URL(file.url).pathname : file.url;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${file.url}: ${String(response.status)}`);
  const text = await response.text();
  if ((await sha256(text)) !== file.sha256) throw new Error(`${file.url}: SHA-256 mismatch`);
  return text;
}
