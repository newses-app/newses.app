---
layout: home
titleTemplate: Self-hosted RSS reader

hero:
  name: Newses
  text: Your feeds, on your own server
  tagline: A self-hosted, multi-user RSS reader and Tiny Tiny RSS replacement, with web, desktop, and Android apps.
  image:
    src: /favicon.svg
    alt: ''
  actions:
    - theme: brand
      text: Self-host
      link: /guide/getting-started
    - theme: alt
      text: Download the apps
      link: /download

features:
  - title: One fetch for everyone
    details: Each feed is fetched once for all who follow it, with conditional requests and respect for each site's limits.
    link: /guide/feeds
    linkText: Feeds
  - title: Filters and scores
    details: Rules on title, content, author, link, or tag mark, star, publish, label, tag, or delete new articles, and score them to highlight or hide them.
    link: /guide/organising#filters
    linkText: Filters
  - title: Labels, tags, and notes
    details: Coloured labels with their own feeds, free-text tags, and private notes that search finds.
    link: /guide/organising
    linkText: Organising
  - title: Full text
    details: The whole article from its web page, for one article or every new one in a feed.
    link: /guide/reading#full-text
    linkText: Reading
  - title: Keyboard shortcuts
    details: Tiny Tiny RSS's keys by default, every one of them remappable.
    link: /guide/shortcuts
    linkText: Shortcuts
  - title: Public sharing
    details: A published RSS feed, public links to articles, and bookmarklets to publish any page.
    link: /guide/sharing
    linkText: Sharing
  - title: Two-factor sign-in
    details: Authenticator codes with recovery codes, and app passwords for other apps.
    link: /guide/account
    linkText: Account
  - title: TTRSS and Google Reader APIs
    details: Keep TTRSS for Android, Newsboat, ReadYou, or another Tiny Tiny RSS or Google Reader app.
    link: /guide/clients
    linkText: Clients
  - title: Web, desktop, and Android
    details: The web app in any browser, apps for Windows, Linux, and Android, all able to read offline.
    link: /guide/apps
    linkText: Apps
---

<script setup>
import HomeScreenshots from './.vitepress/theme/components/HomeScreenshots.vue';
</script>

<HomeScreenshots />

## Coming from Tiny Tiny RSS

Newses imports a Tiny Tiny RSS database directly: users, categories, feeds, articles with their read, starred, and published state, scores, labels, tags, notes, filters, and settings. Your published feed keeps its address, and your TTRSS apps keep working against the same API. See [Migrating from TTRSS](/guide/migration-ttrss).
