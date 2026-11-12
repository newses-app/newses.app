---
description: Subscribe to feeds in Newses, import and export OPML, organise feeds into categories, and set each feed's options.
---

# Feeds

## Subscribe

"Subscribe" at the top of the sidebar (or `f s`) asks for the "Feed or website address": a feed's URL, or a web page that links to its feed. If the page offers several, you choose one. Pick a "Category", or leave it "Uncategorised", and Newses opens the new feed.

Newses reads RSS, Atom, RDF, and JSON Feed.

Each feed is checked once for everyone on the server who follows it, so a popular feed can be checked more often than you set.

### Feeds that need a login

For a feed behind a login (HTTP Basic authentication), tick "This feed needs a login" and enter its "Login" and "Password"; the box is ticked for you when the feed says it needs one. The login is sent only to the feed's own site, and the password is stored encrypted and never shown again. A feed with a login is checked for you alone. Its articles are never kept in the [archive](./reading#the-archive).

"Edit feed" changes the login, keeping the saved password when "Password" is left empty, or removes it by unticking the box. New details are tried before they are saved. Adding or removing a login brings the feed's articles in again as new; starred and published ones are kept.

Third-party apps using the TTRSS API can subscribe with a login too. Logins need a connection: they are never kept on the device to send later.

## Import and export

Settings > Feeds:
- "Import OPML" subscribes to the feeds in an OPML file from another reader, with its folders as categories, and reports how many were new, already subscribed, or invalid.
- "Export OPML" saves all your subscriptions as `subscriptions.opml`.

To bring over everything from Tiny Tiny RSS, articles and settings included, see [Migrating from TTRSS](./migration-ttrss).

## Categories

Categories can hold feeds and other categories. Drag feeds and categories in the sidebar to move them, or set "Category" and "Position" when editing one. Settings > Feeds lists them under "Categories", with "New category". Deleting a category moves its feeds and subcategories to its parent.

## Feed options

"Edit feed" (the pencil above the list, `f e`, or the feed's row in Settings > Feeds):

| Option | Does |
|---|---|
| "Title" | Your own name for the feed |
| "Category", "Position" | Where it sits in the sidebar |
| "Check for updates" | How often it is checked; "Default" follows Settings > Preferences > "Updates" |
| "Delete articles" | When its old articles are deleted, or "Never"; "Default" follows Settings > Preferences > "Updates" |
| "Full text" | Fetches each new article's web page and shows its text first |
| "Pause updates" | Stops checking it for you; new articles still arrive when someone else's subscription checks it, and "Update now" still checks it |
| "Hide from All articles" | Leaves it out of All articles, Fresh, their counts, catching up, and search there, also in [third-party apps](./clients) |

The dialog says how often the feed is checked and why, when it was last checked, and its last error. "Test fetch" shows what the server receives from the feed, the articles it finds, and which of your filters match. "Unsubscribe" removes the feed; its starred and published articles are kept.

A feed that fails too many times in a row stops updating. "Update now" tries again; Settings > Feeds > "Only feeds with errors" lists those that have problems.
