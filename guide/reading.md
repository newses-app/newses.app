---
description: The Newses sidebar and special feeds, the article list and its options, reading articles, search, full text, the archive, appearance, and offline reading in the browser.
---

# Reading

## The sidebar

From the top:
- "Subscribe", to add a feed ([Feeds](./feeds)).
- The special feeds, with their unread counts:

  | Feed | Shows |
  |---|---|
  | "All articles" | Every article, except from feeds set to "Hide from All articles" |
  | "Fresh" | Unread articles newer than "Fresh articles are newer than" in Settings > Preferences (24 hours unless you change it) |
  | "Starred" | Articles you starred; the count is of unread ones |
  | "Published" | Articles in your [published feed](./sharing); the count is of unread ones |
  | "Recently read" | Articles you read in the last 7 days |

- Your [labels](./organising#labels), each a feed of its articles, once you have one.
- "Tags", which opens a list of your [tags](./organising#tags).
- "Feeds": your categories and feeds. A category shows the articles of its feeds and subcategories. Drag feeds and categories to move them.

A feed's icons mark it "Paused", "Hidden from All articles", or "Stopped" after repeated errors. "Settings" and "Sign out" are at the bottom.

## The article list

The toolbar above the list:

| Control | Does |
|---|---|
| "Search" | Searches the open feed's titles, text, and your notes, best matches first; see [Search](#search) |
| "Show" | "Unread, or all when none" (default), "All articles", or "Unread only" |
| "Sort" | "Newest first" (default), "Oldest first", or "By title"; searches with words are by relevance |
| Layout | "Three panes" (list and article side by side) or "Combined (expanded articles)" |
| "Mark as read" | Catches up on the open feed: "All articles", or those "Older than one day", "Older than 7 days", or "Older than 14 days" |
| "Update now" | Asks the server to check the feed now |
| "Browse archive" | Past articles of the feed or of All articles (below) |
| "Edit feed" | The open feed's [options](./feeds#feed-options) |

On narrow screens, the less used ones move into "More actions", and the list and article show one at a time.

Settings > Preferences sets the defaults for "Show", "Sort", and the layout, and:
- "Show a preview of each article in the list" (on).
- "In the combined layout, mark articles read as they scroll past" (off).
- "Hide feeds without unread articles" (off).
- "Ask before marking many articles read" (on).

## Search

Words find the articles with all of them in the title, the text, or your note, whatever their accents: `cafe` finds "café". In articles in a language with a stemmer, such as English, Spanish, Italian, or German, words find their other forms too: `song` finds "songs", `cancion` finds "canciones". Words are matched in the languages of your feeds and of Newses. Notes and the archive's older articles match accents only, not other forms. Operators narrow a search, alone or with words:

| Write | Finds |
|---|---|
| `"two words"` | The words together |
| `cake OR pie` | Either word |
| `-word` | Articles without the word |
| `title:text`, `author:text`, `note:text` | Articles whose title, author, or note contains the text |
| `tag:name`, `label:name` | Articles with that tag or label; quote names with spaces: `label:"Read later"` |
| `note:true`, `note:false` | Articles with a note, or without one |
| `unread:true`, `star:true`, `pub:true` | Unread, starred, or published articles; `false` for the others |
| `@2024-05-01`, `@today`, `@yesterday`, `@-3days`, `@-2weeks` | Articles of that day, in your time zone |

A `-` before an operator turns it round: `-tag:recipes` finds the articles without that tag. Operators are in English in every language. A search of operators alone lists the newest first. They are Tiny Tiny RSS's operators, so its [apps](./clients) can use them too, with days in UTC.

Without a connection, search covers the articles on the device. In [the archive](#the-archive), past articles have no stars, notes, tags, labels, or unread state, so operators asking for them find nothing.

## Articles

Opening an article marks it read; marking it unread again keeps it unread. Its buttons:

| Button | Does |
|---|---|
| "Star" | Keeps it in Starred |
| "Publish" | Adds it to your [published feed](./sharing#published-feed) |
| "Mark read" / "Mark unread" | |
| "Labels", "Tags", "Add note", "Set score" | See [Labels, tags, notes, and scores](./organising) |
| "Share" | Makes a [public link](./sharing#share-links) to it |
| "Full text" | Shows the article from its web page (below) |
| "Open original" | Opens the article's web page |

Starred, published, noted, labelled, and shared articles are never deleted when old articles are cleaned up.

### Full text

Feeds that send only a summary can show the whole article: "Full text" fetches the article's web page and shows its text. Press it again to go back to the feed's version. To get full text for every new article of a feed, turn on "Full text" in its [options](./feeds#feed-options).

### Images

"Load article images through this server, so image hosts cannot see your address", in Settings > Preferences, fetches images through your Newses server instead of from your browser. It is off unless you turn it on.

### Article text

Settings > Preferences > "Article text" sets the font, line width ("Narrow" to "Full width"), and text size of articles.

## The archive

Old articles are deleted after a time the server sets, unless starred, published, noted, labelled, or shared. Servers that keep an archive move them there instead: "Browse archive" lists and searches them, and starring, publishing, labelling, or noting one brings it back to its feed. With a search open, "Search the archive" repeats it over the archive.

## Appearance

Settings > Appearance:
- "Mode": "Follow system" (default), "Light", or "Dark".
- "Theme": the built-in "Original", "Terminal", "Sketch", "Catppuccin", "Solarized", "Amber monitor", "E-ink", "Synthwave", "Gruvbox", "Noir", and "Saul", your own, and those others on the server have published.
- "Adjust this theme": colours, fonts, interface text size, corners, spacing, borders, shadows, and effects, saved as you go. "Save as new theme" keeps them as your own theme, which you can export, import, and publish to everyone on the server.

## Language

Newses is available in English, Spanish, Italian, and German. Choose in Settings > Preferences > Language, where each language is listed by its own name. "System default" follows your browser or device: a regional variant such as Mexican Spanish shows Spanish, and a language Newses doesn't have shows English.

Your choice follows your account to your other devices. Sign-in screens use the last language shown on that device. In the desktop app, the tray and menus follow it too.

Articles stay in the language they were written in, and read right to left when their text does.

## Offline in the browser

Settings > Offline > "Keep articles on this device to read without a connection" keeps unread and starred articles, and those read in the last 7 days, in the browser for reading without a connection. What you read, star, label, or note offline is sent when the connection is back. The [desktop and Android apps](./apps#offline-reading) always do this.

Safari deletes kept articles after 7 days without a visit; adding Newses to the Home Screen keeps them.

## Notifications in the browser

Settings > Account > "Notifications" > "Notify me about new entries on this device" shows one notification with the running total of new articles, at most every 30 minutes, also while Newses is closed; clicking it opens the feed or category. It is set per browser and per account, and the browser asks to allow notifications first. It needs Newses over HTTPS. On iPhone and iPad, add Newses to the Home Screen, open it from there, and turn it on there.
