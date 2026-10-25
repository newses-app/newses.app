import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { siteRoutes } from './site-routes.ts';

const route = (host: string, uri: string): unknown =>
  runInNewContext(`${siteRoutes('example.com')}\nhandler(event)`, {
    event: { request: { uri, headers: { host: { value: host } }, querystring: {} } },
  });

describe('siteRoutes', () => {
  it('serves clean URLs and folders from their HTML files', () => {
    expect(route('example.com', '/guide/self-hosting')).toMatchObject({
      uri: '/guide/self-hosting.html',
    });
    expect(route('example.com', '/')).toMatchObject({ uri: '/index.html' });
    expect(route('example.com', '/contributing/adr/')).toMatchObject({
      uri: '/contributing/adr/index.html',
    });
    expect(route('example.com', '/assets/app.Bx1.js')).toMatchObject({
      uri: '/assets/app.Bx1.js',
    });
  });

  it('redirects other hosts to the same path on the domain', () => {
    expect(route('www.example.com', '/guide/self-hosting')).toEqual({
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: 'https://example.com/guide/self-hosting' } },
    });
  });
});
