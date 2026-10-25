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
  /** Releases before 0.3.4 have no portable exe. */
  windows: { installer: ReleaseFile; zip: ReleaseFile; portable?: ReleaseFile };
  linux: { appImage: ReleaseFile; deb: ReleaseFile };
  android: ReleaseFile & { versionCode: number };
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
  return [
    { platform: 'windows' as const, label: 'Windows installer', file: windows.installer },
    ...(windows.portable
      ? [{ platform: 'windows' as const, label: 'Windows portable', file: windows.portable }]
      : []),
    { platform: 'windows' as const, label: 'Windows zip', file: windows.zip },
    { platform: 'linux' as const, label: 'Linux AppImage', file: linux.appImage },
    { platform: 'linux' as const, label: 'Linux deb', file: linux.deb },
    { platform: 'android' as const, label: 'Android APK', file: android },
  ];
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
