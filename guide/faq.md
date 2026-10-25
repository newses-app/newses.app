---
description: Common questions about running and using Newses.
---

# FAQ

## Is there a Newses I can sign up for?

No. Newses is self-hosted: you [run your own server](./getting-started) and add the people who use it. There is no sign-up page; admins [add users](./account#users).

## Can I use Newses on an iPhone or a Mac?

Use the web app in Safari. There are no iOS or macOS apps yet; the [desktop apps](./apps) are for Windows and Linux. On an iPhone, add Newses to the Home Screen so Safari keeps your [offline articles](./reading#offline-in-the-browser).

## Does my RSS app work with Newses?

If it supports a Tiny Tiny RSS, Google Reader, or FreshRSS account, probably. See [Third-party clients](./clients).

## How often are feeds checked?

As often as the server's default, unless you set a feed's "Check for updates". A feed is checked once for everyone who follows it, and Newses checks less often when a site or the feed asks it to. A feed's "Edit feed" dialog says how often it is checked and why.

## Why did a feed stop updating?

After too many failed checks in a row, Newses stops checking a feed. "Edit feed" shows the last error, "Test fetch" shows what the site sent, and "Update now" tries again.

## Can Newses read feeds on my home network?

Not by default: feeds on private and loopback addresses are blocked. A self-hoster can allow them with [`FETCH_ALLOW_PRIVATE_NETWORKS`](./self-hosting#configuration).

## Are old articles deleted?

Yes, after a time the server sets, which you can change in Settings > Preferences > "Updates" or per feed. Starred, published, noted, labelled, and shared articles are kept. Servers with the archive on keep the rest in the [archive](./reading#the-archive).

## I lost my authenticator. How do I sign in?

Use one of your recovery codes at the code prompt. Without them, an admin can [turn two-factor sign-in off](./account#two-factor-sign-in) for you.

## How do I move Newses to another server?

See [Moving to another instance](./self-hosting#moving-to-another-instance).
