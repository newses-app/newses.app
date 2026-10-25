import { describe, expect, it } from 'vitest';
import {
  fileName,
  formatSize,
  installers,
  platformOf,
  type ReleaseFile,
  type ReleaseManifest,
} from './release.ts';

const file = (name: string): ReleaseFile => ({
  url: `https://reader.example.com/downloads/1.2.3/${name}`,
  size: 130_661_032,
  sha256: 'ab'.repeat(32),
});

const manifest: ReleaseManifest = {
  version: '1.2.3',
  prerelease: false,
  published: '2026-10-20T02:18:39.235Z',
  windows: {
    installer: file('newses-1.2.3-windows-setup.exe'),
    zip: file('newses-1.2.3-windows-x64.zip'),
    portable: file('newses-1.2.3-windows-portable.exe'),
  },
  linux: { appImage: file('newses-1.2.3-linux.AppImage'), deb: file('newses-1.2.3-linux.deb') },
  android: { ...file('newses-1.2.3.apk'), versionCode: 1020399 },
};

describe('installers', () => {
  it('lists every installer, the recommended one first for each platform', () => {
    expect(installers(manifest).map((i) => i.label)).toEqual([
      'Windows installer',
      'Windows portable',
      'Windows zip',
      'Linux AppImage',
      'Linux deb',
      'Android APK',
    ]);
  });

  it('leaves out the portable exe of releases without one', () => {
    const { portable: _, ...windows } = manifest.windows;
    expect(installers({ ...manifest, windows }).map((i) => i.label)).not.toContain(
      'Windows portable',
    );
  });
});

describe('platformOf', () => {
  it('recognises Windows, Linux, and Android, and nothing else', () => {
    expect(platformOf('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('windows');
    expect(platformOf('Mozilla/5.0 (X11; Linux x86_64)')).toBe('linux');
    expect(platformOf('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('android');
    expect(platformOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)')).toBeUndefined();
    expect(platformOf('Mozilla/5.0 (X11; CrOS x86_64 14541.0.0)')).toBeUndefined();
  });
});

describe('formatting', () => {
  it('names files from their URL and gives sizes in MB', () => {
    expect(fileName(manifest.android.url)).toBe('newses-1.2.3.apk');
    expect(formatSize(130_661_032)).toBe('130.7 MB');
  });
});
