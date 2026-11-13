// The app stage's `/downloads/latest.json`: `ReleaseManifest` in newses-app/newses
// (`shared/src/release.ts`), which the site cannot import.

/** A published file: its download URL, size in bytes, and SHA-256 (hex). */
export interface ReleaseFile {
  url: string;
  size: number;
  sha256: string;
}

export interface ReleaseManifest {
  version: string;
  prerelease: boolean;
  /** ISO 8601 time of publishing. */
  published: string;
  /**
   * Each platform when the release built it: the project's stages build all three, a Docker
   * install's apps build Linux and Android. Releases before 0.3.4 have no portable exe.
   */
  windows?: { installer: ReleaseFile; zip: ReleaseFile; portable?: ReleaseFile };
  linux?: { appImage: ReleaseFile; deb: ReleaseFile };
  android?: ReleaseFile & { versionCode: number };
  /** Releases from stages that publish the server image. */
  server?: ServerRelease;
}

/** The server image and the files that run it with Docker Compose. */
export interface ServerRelease {
  image: { repository: string; tag: string; digest: string };
  compose: ReleaseFile;
  env: ReleaseFile;
  nginxProxy: ReleaseFile;
  publicKey: ReleaseFile;
}

export type Platform = 'windows' | 'linux' | 'android';

export interface Installer {
  platform: Platform;
  label: string;
  file: ReleaseFile;
}

/** Every installer in the release, each platform's recommended one first. */
export function installers(manifest: ReleaseManifest): Installer[] {
  const { windows, linux, android } = manifest;
  const all: (Omit<Installer, 'file'> & { file: ReleaseFile | undefined })[] = [
    { platform: 'windows', label: 'Windows installer', file: windows?.installer },
    { platform: 'windows', label: 'Windows portable', file: windows?.portable },
    { platform: 'windows', label: 'Windows zip', file: windows?.zip },
    // AppArmor stops the AppImage's sandbox on Ubuntu 24.04 and later.
    { platform: 'linux', label: 'Linux deb', file: linux?.deb },
    { platform: 'linux', label: 'Linux AppImage', file: linux?.appImage },
    { platform: 'android', label: 'Android APK', file: android },
  ];
  return all.filter((installer): installer is Installer => installer.file !== undefined);
}

/** The platform a browser runs on, if Newses has an app for it. */
export function platformOf(userAgent: string): Platform | undefined {
  // Android user agents also name Linux.
  if (/Android/i.test(userAgent)) return 'android';
  if (/Windows/i.test(userAgent)) return 'windows';
  if (/Linux|X11/i.test(userAgent) && !/CrOS/i.test(userAgent)) return 'linux';
  return undefined;
}

export const fileName = (url: string) => url.slice(url.lastIndexOf('/') + 1);

export const formatSize = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)} MB`;

/** The names the server's files are saved as, in the install's folder. */
export const SERVER_FILES = {
  compose: 'compose.yaml',
  env: '.env',
  nginxProxy: 'compose.nginx-proxy.yaml',
  publicKey: 'cosign.pub',
} as const;

const fetchAndCheck = (file: ReleaseFile, as: string) => [
  `curl -fL -o ${as} ${file.url}`,
  `echo '${file.sha256}  ${as}' | sha256sum -c`,
];

/** The server's commands, as the downloads page gives them. */
export function serverCommands(server: ServerRelease) {
  const { repository, tag, digest } = server.image;
  return {
    install: [
      'mkdir newses && cd newses',
      ...fetchAndCheck(server.compose, SERVER_FILES.compose),
      ...fetchAndCheck(server.env, SERVER_FILES.env),
    ],
    upgrade: [...fetchAndCheck(server.compose, SERVER_FILES.compose), 'docker compose up -d'],
    nginxProxy: [
      ...fetchAndCheck(server.nginxProxy, SERVER_FILES.nginxProxy),
      `docker compose -f ${SERVER_FILES.compose} -f ${SERVER_FILES.nginxProxy} up -d`,
    ],
    verify: [
      ...fetchAndCheck(server.publicKey, SERVER_FILES.publicKey),
      `cosign verify --key ${SERVER_FILES.publicKey} ${repository}:${tag}`,
    ],
    image: [`docker pull ${repository}:${tag}`, `docker pull ${repository}@${digest}`],
  };
}

/** The server's files for the download page, the compose file first. */
export const serverFiles = (server: ServerRelease) => [
  { label: 'Compose file', file: server.compose },
  { label: 'Sample settings', file: server.env },
  { label: 'nginx-proxy override', file: server.nginxProxy },
  { label: 'Image signing key', file: server.publicKey },
];

/** The SHA-256 of a text, in hex, as `latest.json` gives files'. */
export async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
