---
description: Turn on the plugins installed on a Newses server, approve the hosts they reach, set their settings, and what happens when one keeps failing.
---

# Plugins

Plugins add to what Newses does, such as calling a web address when your published feed changes. The server's operator installs them when deploying it: on Docker with the [plugins override](./self-hosting#plugins), on AWS by listing them, as npm packages at exact versions, in the stage's `plugins` in the deployment config, then `scripts/store-deploy-config.sh --apply --release dev` (or `prod`), which shows what changes and deploys the stage with them. Everything else is in Settings > Plugins. Admins always see the tab; others see it once plugins are installed. To write one, see [Writing plugins](./plugin-authors).

Plugins run inside the server with all its access, and the way they are written may still change. Install only plugins you trust.

## For the server (admins)

Each installed plugin shows its name, version, package, and what it does:
- "On for this server" turns it on for everyone; plugins you can turn on for yourself also need each user to turn them on.
- "Approved hosts" are the only hosts the plugin may send data to, and so the only hosts its address settings may point at. It suggests the hosts the plugin asks for; add others, such as the host of a webhook, as host names (`api.netlify.com`).
- Its settings, if it has any, are saved with "Save". A plugin can't be turned on until its required settings are set.

Changes are recorded in the [audit log](./self-hosting#monitoring) as `plugin_updated`, with the names of changed settings but never their values.

## For yourself

Plugins an admin turned on that you can use yourself show "For me": "On for me" turns one on, its settings are saved with "Save", and "Remove my settings" deletes your settings and what the plugin keeps for you.

## Send test

Plugins that can be tested show "Send test" under their settings: it runs the plugin with the saved settings, such as calling a webhook once, and shows what happened, such as the status code it got back. Save changes first. The plugin must be on, for the server or for you; tests never count toward turning it off.

For a plugin that adds to your digest, such as the digest summary, "Send test" under "For me" then sends you a test digest, as "Send a test digest" does in [your account's digest settings](./account#email-digest): it shows what the plugin adds, or why it added nothing. "Estimate cost", for plugins that can, says what such a test digest would cost now, without sending it.

## Secrets

Settings such as API keys and tokens are secrets: stored encrypted, and never shown again. A saved secret says "Saved"; type a new value to replace it, or clear an optional one with its clear button, then "Save".

## When a plugin keeps failing

A plugin that fails 10 times in a row is turned off, with what its last run said (such as `HTTP 401 Unauthorized`) or how it failed:
- When its own settings are yours, such as a webhook's address, it is turned off for you only. Check your settings, then turn it on again.
- Otherwise it is turned off for the server, and admins get the `plugin.disabled` [alert](./self-hosting#monitoring). Turning it on again resolves it.

A failing plugin never stops articles from arriving, pages from loading, or digests from going out.

An installed plugin this version of Newses won't run, such as one written for another version of the plugin API, is left out of the tab, and admins get the `plugin.refused` [alert](./self-hosting#monitoring) with the reason until a deployment installs a version that works or removes it.

## Plugins no longer installed

The settings of a plugin the operator removed are kept, listed under "No longer installed", so reinstalling it brings them back. "Remove settings" deletes its settings, every user's, and its data.
