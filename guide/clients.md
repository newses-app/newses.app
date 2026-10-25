---
description: Connect TTRSS and Google Reader apps such as TTRSS for Android, Newsboat, and ReadYou to Newses with an app password.
---

# Third-party clients

Newses speaks the Tiny Tiny RSS API and the Google Reader API, so apps written for either can read from it. Both are always on; there is nothing to enable on the server.

## Connect an app

1. In Newses, open Settings > Account > "App passwords" and choose "New app password". Name it after the app or device, enter your current password, and copy the password it shows; it is not shown again.
2. Under "Connecting apps", copy the server URL for the kind of app:

   | Setting | For |
   |---|---|
   | "Server URL for TTRSS apps" | Tiny Tiny RSS clients |
   | "Server URL for Google Reader apps" | Google Reader clients |
   | "Server URL for apps that offer only FreshRSS" | Apps whose only matching account type is FreshRSS |

3. In the app, sign in with your user name (also under "Connecting apps") and the app password.
4. Set the app to sync no more often than "Connecting apps" suggests.

Your account password does not work in these apps; only app passwords do. They skip two-factor authentication, so give each app its own and revoke it under "App passwords" when you stop using the app, which signs that app out. While you have to change a password an admin set for you, the APIs refuse to sign in; change it in Newses first.

The server URLs come from the server's [`PUBLIC_URL`](./self-hosting#configuration), or else the address you opened Newses at.

## Known clients

| App | API |
|---|---|
| TTRSS for Android | Tiny Tiny RSS |
| Newsboat | Tiny Tiny RSS or Google Reader |
| ReadYou | Google Reader |

Newses is built against these apps. Other clients of either API may work, but are not verified.

## What carries over

Tiny Tiny RSS apps:
- Categories, feeds, labels, notes, and the special feeds; the Archived feed is always empty.
- Read, starred, and published states, and catching up.
- Subscribing, unsubscribing, and sharing a page to your published feed.
- A category also lists its subcategories' articles.

Google Reader apps:
- Folders are categories, with subcategories as `Parent/Child`; tags are labels.
- Read, starred, kept-unread, and published states.
- Subscribing, renaming, and removing folders and tags.

Feeds set to "Hide from All articles" stay out of All articles, Fresh, and their counts in both APIs, as in Newses.

## When an app misbehaves

A self-hoster can set [`COMPAT_TRACE`](./self-hosting#configuration) to log every call an app makes, with credentials redacted, to see what it sends.
