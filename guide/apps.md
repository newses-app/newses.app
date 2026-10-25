---
description: Install the Newses desktop apps for Windows and Linux and the Android app, connect them to your server, and keep them up to date.
---

# Desktop and Android apps

The apps connect to any Newses server over HTTPS, keep articles for reading offline, and can hold several servers or accounts at once.

## Install

Get them from [Download](/download), which also lists each file's SHA-256.

| Platform | File | Notes |
|---|---|---|
| Windows 10 and 11 (x64) | Installer | Installs for the current user; updates itself |
| | Portable exe | Runs without installing, from a USB drive too; keeps its data in a `Newses Data` folder beside it; starts a few seconds slower |
| | Zip | Runs without installing |
| Linux (x64) | deb | For Debian and Ubuntu: `sudo apt install ./newses-<version>-linux-amd64.deb` |
| | AppImage | `chmod +x` it, then run it. On Ubuntu 24.04 and later, AppArmor stops its sandbox, so use the deb |
| Android 7 and later | APK | Open it on the phone and allow installs from your browser when asked |

## Connect

At first launch, enter your server's address; `https://` is added if you leave it out, and other schemes are refused. Then sign in, with your two-factor code if you use one.

The server must be on HTTPS, and its proxy must pass the headers the apps need; see [Reverse proxy and TLS](./self-hosting#reverse-proxy-and-tls).

### Several servers or accounts

Each server and user is a profile, named after the server's `INSTANCE_NAME` or host unless you rename it.
- Add one with "Add server" in the profile menu at the top of the drawer, or under Settings > Account > "Profiles".
- Switch from the same menu. Only the profile in use syncs; the others keep their offline articles.
- Under "Profiles", each profile's menu can rename it, remove its downloaded data, or remove it.

## Updates

| App | Updates |
|---|---|
| Windows installer, AppImage | Download in the background and install when you restart the app ("Restart to update") |
| Portable exe, zip, deb | "Download" opens the downloads page; install the new version yourself |
| Android | At launch, at most once a day, offers the new version; "Download" opens the APK, and you confirm the install |

Desktop apps check at launch and every 6 hours. Settings > Account > "App" shows the version and has "Check for updates".

## Offline reading

The apps always keep articles for reading offline: unread and starred articles with their text and images, and those read in the last 7 days, within a storage limit. Offline, everything you read, star, label, or note is sent when the server is back; filters, sharing, full text, and account settings need the server.

Settings > "Offline" sets how many unread articles to keep, the storage limit, and whether to download images. On Android, it can also keep images to Wi-Fi and sync about every 30 minutes while the app is closed.

Offline articles are stored unencrypted on the device. Signing out deletes them, and asks first if changes are still waiting to be sent.

## Desktop extras

Settings > Account > "App":
- "Notify me about new entries while the app is in the background": one notification, updated at most every 15 minutes, opens the feed or category you click.
- "Keep running in the tray when the window is closed": the tray menu opens the app, checks for new entries, and switches profiles.
- "Start when I sign in to my computer" (not in the portable exe).

On Android, sharing a link to Newses offers to subscribe to it or publish it.

## Where data is kept

- Windows installer and zip: `%APPDATA%\Newses`.
- Portable exe: the `Newses Data` folder beside it. On another PC or Windows user, every profile signs in again.
- Linux: without a system keyring, every profile signs in again after each launch.
