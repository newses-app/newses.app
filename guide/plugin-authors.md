---
description: Write a Newses server plugin with @newses/plugin-api — hooks, the context, settings, limits, testing, publishing, and versioning.
---

# Writing plugins

A plugin is an npm package the server runs in its own process: it hears about new entries and changes to a user's published feed, and can add to digests. Operators install plugins when they deploy ([Docker](./self-hosting#plugins), AWS in [Plugins](./plugins)); admins and users turn them on in Settings > Plugins. No plugin code runs in the browser or the apps.

The plugin API is 0.x: a minor release may break plugins, and they say which minor they were written for. Plugins run with the server's access to its data, so operators install only plugins they trust.

## Start

[newses-plugin-template](https://github.com/newses-app/newses-plugin-template) is a repository to start from: TypeScript, lint, Vitest with the test kit, the AGPL, and GitHub Actions that test it and publish it to npm with provenance. Without it:

```sh
npm install --save-dev @newses/plugin-api zod @types/node
```

The package's default export is the plugin:

```ts
import { definePlugin, url } from '@newses/plugin-api';
import { z } from 'zod';

export default definePlugin({
  id: 'build-hook',
  version: '1.0.0',
  apiVersion: '^0.1',
  scopes: ['user'],
  settings: { user: z.object({ target: url({ secret: true }) }) },
  messages: {
    en: {
      name: 'Build hook',
      description: 'Calls your build hook, at an address you approve, when your published feed changes.',
      'settings.target': 'Build hook address',
    },
  },
  hooks: {
    'published.changed': {
      debounceSeconds: 120,
      run: async (event, context) => {
        const target = context.userSettings?.target;
        if (!target) return;
        const response = await context.fetch(target, { method: 'POST', signal: context.signal });
        if (!response.ok) throw new Error(`The build hook answered ${String(response.status)}`);
      },
    },
  },
});
```

| Field | What it is |
|---|---|
| `id` | Stable id, 1 to 40 lower-case letters, digits, and hyphens, starting with a letter; settings and data are kept under it |
| `version` | The plugin's own version (semver) |
| `apiVersion` | The plugin API versions it works with, as a caret range: `^0.1`, or `^0.1.2` to need a later patch |
| `scopes` | `instance`: admins turn it on for everyone; `user`: each user also turns it on for themselves |
| `hosts` | Lower-case host names it asks to reach; admins approve them, and may approve others |
| `settings` | `instance` and `user` (scope `user` only) zod object schemas |
| `messages` | Its text in Settings > Plugins, per language |
| `hooks` | The hooks it implements, below |

## Hooks

| Hook | Runs | Gets | Returns |
|---|---|---|---|
| `entries.added` | After entries arrive in a user's feeds, from a fetch or a new subscription | The user's id and up to 500 entries, each with its plain text (at most 20,000 characters) and content hash | Nothing |
| `published.changed` | After entries join or leave a user's published feed, by any means | The entries now published, the ids that left, and the published feed's address | Nothing |
| `digest.compose` | While a user's digest is being sent | The listed entries with their excerpts and content hashes, the digest's language and frequency, how many more it counts, and the first 2,000 of those (`unlisted`, from plugin API 0.1.1) | An overview, and text per entry id |
| `test` | When someone presses "Send test" in Settings > Plugins | Nothing but the context, with the saved settings | `{ ok, message }`: whether it passed, and what happened as plain text (at most 500 characters), such as `HTTP 204 No Content` |

- For a plugin with `digest.compose` and user settings, a user's "Send test" runs `test`, if there is one, and when it passes, sends them a test digest of their unread articles from the last day, which shows what `digest.compose` adds, or why it added nothing (from Newses servers with API 1.17). A test digest's run never counts toward turning the plugin off.
- Event hooks (`entries.added`, `published.changed`) run after the change is saved, at least once, for each user the plugin is on for. `debounceSeconds` (0 to 3600) gathers the changes within that window of the first into one event. A run that throws or runs out of time is tried again after 1, 4, 16, and 64 minutes, then 4 and 6 hours, then dropped; the same changes may arrive twice, so make runs safe to repeat.
- Entries are as the user sees them when the event is delivered: an entry deleted since is left out (or counts as unpublished). An entry's feed is the user's subscription; a feed with a login has no address, and pages saved from the web have no feed.
- `digest.compose` returns plain text: never HTML or links, which the digest shows as written. Blank lines separate paragraphs; the overview may hold 4,000 characters, each entry's text 1,000, and text for entries the digest does not list is ignored. The digest goes out without a plugin that fails, runs out of time, or returns more.
- Each hook may run for 60 seconds, a test for 30; then `context.signal` aborts and the run counts as failed.
- A test runs for the user who pressed it when the plugin has user settings, else for the instance (an admin), while the plugin is on there. A test that throws fails with what it threw. Tests never count toward turning a plugin off.

## The context

| Field | What it is |
|---|---|
| `pluginId` | The plugin's id |
| `signal` | Aborts when the hook's time is up; pass it to long work |
| `logger` | `debug`, `info`, `warn`, `error` to the server's log, tagged with the plugin; never log article text or secrets |
| `fetch` | The standard `fetch`, for the plugin and SDKs that take one |
| `settings` | The instance settings, secrets in the clear, typed by the schema |
| `userSettings` | The user's settings, for a plugin with user settings |
| `storage` | Key-value storage for the instance |
| `userStorage` | Key-value storage for the user the hook runs for |

- `fetch` reaches only http(s) addresses on hosts an admin approved, within the per-site limits feeds have, never while a site has asked Newses to wait, and not private addresses unless the operator allows them. Redirects are returned, not followed; a refused request rejects with a `TypeError`.
- Storage keeps JSON values under keys of 1 to 200 characters, each value at most 64 KiB, at most 10,000 keys and 16 MiB per store, optionally expiring after 1 second to 366 days (`ttlSeconds`). `list(prefix, { after, limit })` pages through keys in order. Past a limit, `set` rejects with a `RangeError`.

## Settings

- Settings are zod object schemas. The server checks saved settings against them, and the hook gets what the schema gives, defaults applied.
- `secret()` marks a setting stored encrypted and never shown again, such as an API key; `url()` an http(s) address on an approved host, and `url({ secret: true })` one holding a token; `multiline()` a larger text box; `feeds()` some of the user's feeds, as the subscription ids entries carry in `feed.id` (from plugin API 0.1.1, user settings only). Only top-level settings may be marked.
- Settings > Plugins builds the form from the schema: text, multi-line text, addresses, secrets, booleans, choices (`z.enum`), numbers, a picker of the user's feeds, and lists of objects of those. A setting of another kind is kept as saved.
- `messages` are plain text per language tag (`en`, `de`, `pt-BR`): `name`, `description` (say what the plugin sends, and to whom), `settings.<field>`, `settings.<field>.hint`, `settings.<field>.option.<value>`, and `settings.<field>.item.<property>`. A missing message falls back to the language without a region, then English, then the key.

## Failures

- A hook that throws, runs out of time, or returns what it may not counts as a failure; nothing it does fails a fetch, a page, or a digest.
- What a hook throws is shown in Settings > Plugins to whoever owns the settings it ran with (its message, at most 300 characters): say what went wrong, such as `HTTP 401 Unauthorized`, and never put secrets in it.
- After 10 failures in a row, the plugin is turned off: for the user, when the plugin has user settings and ran for a user, else for the instance, which raises the `plugin.disabled` alert. Turning it on again resets the count.
- A plugin the server will not load (an `apiVersion` that does not accept the server's plugin API, an invalid definition, an id another plugin has) is left out, with the reason in the `plugin.refused` alert.

## Testing

`@newses/plugin-api/testing` runs hooks as the server does, with any test runner:

```ts
import { fixtureEntry, runHook } from '@newses/plugin-api/testing';
import { expect, it } from 'vitest';
import plugin from './index.ts';

it('calls the build hook', async () => {
  const requests: Request[] = [];
  await runHook(
    plugin,
    'published.changed',
    { userId: 1, feedUrl: null, published: [fixtureEntry()], unpublished: [] },
    {
      userSettings: { target: 'https://api.netlify.com/build_hooks/abc' },
      hosts: ['api.netlify.com'],
      fetch: (request) => {
        requests.push(request as Request);
        return Promise.resolve(new Response(null, { status: 200 }));
      },
    },
  );
  expect(requests[0]?.method).toBe('POST');
});
```

| Export | Does |
|---|---|
| `runTest(plugin, options)` | Runs the `test` hook as "Send test" does, checking what it reports |
| `runHook(plugin, hook, input, options)` | Checks the plugin accepts this plugin API, parses `settings` and `userSettings` with its schemas, runs the hook under its time limit (`timeoutMs` to shorten it), checks a digest hook's result, and returns it with the context; throws where the server would count a failure |
| `createTestContext(options)` | A context: `fetch` reaches `hosts` only, through `options.fetch`, without following redirects; `logs` holds what was logged |
| `MemoryStore` | Storage in memory with the server's limits and expiry (`now` sets its clock) |
| `fixtureEntry`, `fixtureEntryWithText`, `fixtureDigestEntry` | Entries as the hooks get them, any field overridden |

To try a plugin in a running Newses before publishing it, pack it with `npm pack` and install the file in a Docker install ([Trying a plugin before it is published](./self-hosting#trying-a-plugin-before-it-is-published)).

## Publishing

- Publish to npm as an ES module whose default export is the plugin, built to JavaScript.
- List `@newses/plugin-api` and `zod` as peer dependencies, never dependencies: the server provides both, and refuses a plugin that brings its own `zod` or plugin API.
- Install scripts never run.
- Operators' builds fail on packages with known high or critical vulnerabilities, and on licences Newses cannot ship: the AGPL 3.0, GPL 3.0, LGPL, MIT, ISC, BSD, Apache 2.0, and similar permissive licences are fine.
- Operators install exact versions, so every change is a new version.

## Versioning

- While the plugin API's major version is 0, a patch adds (a hook, a field) and a minor may break. `apiVersion: '^0.1'` accepts every 0.1 patch; `^0.1.2` needs 0.1.2 or a later 0.1 patch, for something a patch added.
- A server whose plugin API a plugin does not accept refuses it, with the `plugin.refused` alert, and keeps running.

## Licence

The plugin API is licensed under the AGPL 3.0 or later, as Newses is. A plugin runs inside the server, so license it under the AGPL or a licence compatible with it; the template uses the AGPL 3.0 or later.
