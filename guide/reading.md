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
| "Search" | Searches the open feed's titles, text, and your notes, best matches first |
| "Show" | "Unread, or all when none" (default), "All articles", or "Unread only" |
| "Sort" | "Newest first" (default), "Oldest first", or "By title"; search results are always by relevance |
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
- "Theme": the built-in "Original", "Terminal", and "Sketch", your own, and those others on the server have published.
- "Adjust this theme": colours, fonts, interface text size, corners, spacing, borders, shadows, and effects, saved as you go. "Save as new theme" keeps them as your own theme, which you can export, import, and publish to everyone on the server.

## Offline in the browser

Settings > Offline > "Keep articles on this device to read without a connection" keeps unread and starred articles, and those read in the last 7 days, in the browser for reading without a connection. What you read, star, label, or note offline is sent when the connection is back. The [desktop and Android apps](./apps#offline-reading) always do this.

Safari deletes kept articles after 7 days without a visit; adding Newses to the Home Screen keeps them.
