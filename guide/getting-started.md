---
description: Run Newses with Docker, sign in, and subscribe to your first feed.
---

# Getting started

Newses runs on any machine with Docker and Git.

## Get the code

```sh
git clone https://github.com/newses-app/newses
cd newses
```

<!--@include: ./self-hosting.md#commands-->

## Install

<!--@include: ./self-hosting.md#install-->

## Subscribe to a feed

1. Choose "Subscribe" at the top of the sidebar.
2. Enter a feed's address, or the address of a web page that links to its feed.
3. Confirm, and Newses opens the feed.

Coming from another reader, import its OPML export under Settings > Feeds > "Import OPML"; coming from Tiny Tiny RSS, [migrate everything](./migration-ttrss), articles included.

## Next

- To reach Newses from outside your network and use the apps, put it behind HTTPS: [Reverse proxy and TLS](./self-hosting#reverse-proxy-and-tls).
- Add the people you share it with: [Users](./account#users).
- Install the [desktop and Android apps](./apps), or connect [your existing RSS app](./clients).
- Learn your way around: [Reading](./reading).
