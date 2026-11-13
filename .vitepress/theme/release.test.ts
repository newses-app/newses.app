import { describe, expect, it } from 'vitest';
import {
  fileName,
  formatSize,
  installers,
  platformOf,
  type ReleaseFile,
  type ReleaseManifest,
  type ServerRelease,
  serverCommands,
  serverFiles,
  sha256,
} from './release.ts';

const file = (name: string): ReleaseFile => ({
  url: `https://reader.example.com/downloads/1.2.3/${name}`,
  size: 130_661_032,
  sha256: 'ab'.repeat(32),
});

const windows = {
  installer: file('newses-1.2.3-windows-setup.exe'),
  zip: file('newses-1.2.3-windows-x64.zip'),
  portable: file('newses-1.2.3-windows-portable.exe'),
};
const android = { ...file('newses-1.2.3.apk'), versionCode: 1020399 };
const manifest: ReleaseManifest = {
  version: '1.2.3',
  prerelease: false,
  published: '2026-10-20T02:18:39.235Z',
  windows,
  linux: { appImage: file('newses-1.2.3-linux.AppImage'), deb: file('newses-1.2.3-linux.deb') },
  android,
};

describe('installers', () => {
  it('lists every installer, the recommended one first for each platform', () => {
    expect(installers(manifest).map((i) => i.label)).toEqual([
      'Windows installer',
      'Windows portable',
      'Windows zip',
      'Linux deb',
      'Linux AppImage',
      'Android APK',
    ]);
  });

  it('leaves out the portable exe of releases without one', () => {
    const { portable: _, ...older } = windows;
    expect(installers({ ...manifest, windows: older }).map((i) => i.label)).not.toContain(
      'Windows portable',
    );
  });

  it('lists only the platforms a release built', () => {
    const { windows: _, ...linuxAndAndroid } = manifest;
    expect(installers(linuxAndAndroid).map((i) => i.platform)).toEqual([
      'linux',
      'linux',
      'android',
    ]);
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
    expect(fileName(android.url)).toBe('newses-1.2.3.apk');
    expect(formatSize(130_661_032)).toBe('130.7 MB');
  });
});

const server: ServerRelease = {
  image: {
    repository: 'public.ecr.aws/example/newses',
    tag: '1.2.3',
    digest: `sha256:${'cd'.repeat(32)}`,
  },
  compose: file('newses-1.2.3-compose.yaml'),
  env: file('newses-1.2.3-env.example'),
  nginxProxy: file('newses-1.2.3-compose.nginx-proxy.yaml'),
  publicKey: file('newses-1.2.3-cosign.pub'),
};
const check = (name: string) => `echo '${'ab'.repeat(32)}  ${name}' | sha256sum -c`;

describe('serverCommands', () => {
  it('downloads the compose file and sample settings under their install names, and checks them', () => {
    expect(serverCommands(server).install).toEqual([
      'mkdir newses && cd newses',
      `curl -fL -o compose.yaml ${server.compose.url}`,
      check('compose.yaml'),
      `curl -fL -o .env ${server.env.url}`,
      check('.env'),
    ]);
  });

  it('upgrades with the new compose file alone, keeping .env', () => {
    expect(serverCommands(server).upgrade).toEqual([
      `curl -fL -o compose.yaml ${server.compose.url}`,
      check('compose.yaml'),
      'docker compose up -d',
    ]);
  });

  it('starts behind nginx-proxy with both files', () => {
    expect(serverCommands(server).nginxProxy.at(-1)).toBe(
      'docker compose -f compose.yaml -f compose.nginx-proxy.yaml up -d',
    );
  });

  it('verifies the image by tag with the release’s public key, and pulls it by tag or digest', () => {
    const commands = serverCommands(server);
    expect(commands.verify).toEqual([
      `curl -fL -o cosign.pub ${server.publicKey.url}`,
      check('cosign.pub'),
      'cosign verify --key cosign.pub public.ecr.aws/example/newses:1.2.3',
    ]);
    expect(commands.image).toEqual([
      'docker pull public.ecr.aws/example/newses:1.2.3',
      `docker pull public.ecr.aws/example/newses@sha256:${'cd'.repeat(32)}`,
    ]);
  });
});

describe('serverFiles', () => {
  it('lists the server’s files, the compose file first', () => {
    expect(serverFiles(server).map((item) => item.label)).toEqual([
      'Compose file',
      'Sample settings',
      'nginx-proxy override',
      'Image signing key',
    ]);
  });
});

describe('sha256', () => {
  it('hashes text as UTF-8, in hex', async () => {
    expect(await sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
