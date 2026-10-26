---
description: Organise Newses articles with labels, tags, notes, and scores, and act on new articles automatically with filters.
---

# Labels, tags, notes, and scores

| <span class="visually-hidden">Property</span> | Labels | Tags | Notes |
|---|---|---|---|
| What | A set of coloured labels you define | Free-text words | Your text on one article |
| Where to browse | Each label is a sidebar feed with an unread count | "Tags" in the sidebar, or `g t` | Shown on the article and in the list; found by search |
| Added by | You, or a filter | You, a filter, or the feed's own categories | You |

## Labels

Settings > Labels creates labels, with a name, text and background colours, and a preview that warns when the colours are hard to read. On an article, "Labels" (`a l`) ticks the labels it has, and can create a new one. Deleting a label removes it from its articles.

## Tags

On an article, "Tags" (`T`) edits its tags, separated by commas, up to 50. The categories a feed gives its articles become tags too. "Tags" in the sidebar lists them with their article counts, and a tag on an article opens its feed of articles.

## Notes

On an article, "Add note" (`a n`) attaches up to 10,000 characters of plain text. Notes show on the article and after a note icon in the list, and search finds them. A noted article is never deleted when old articles are cleaned up.

## Scores

Every article has a score, 0 unless changed. "Set score" on an article sets it; filters add to or subtract from it. A score other than 0 shows next to the article.

Settings > Preferences:
- "Highlight articles scored above" (0): highlights them in the list.
- "Hide articles scored below" (−500): leaves them out of feeds, categories, All articles, and Fresh, and their counts. They stay in Starred, Published, Recently read, labels, and tags.

## Filters

Filters act on new articles as they arrive. Settings > Filters lists them in the order they run.

A filter has rules and actions:
- "Match": "All rules" or "Any rule"; "Act on articles that do not match" reverses it.
- Each rule matches a "Field" ("Title", "Content", "Title or content", "Author", "Link", or "Tag") against a "Pattern", optionally "Only in" some feeds or categories, or "Not matching".
- Actions: "Delete", "Mark read", "Star", "Publish", "Add label", "Add tag", "Change score" (adds the amount, which can be negative), and "Stop processing filters", which ends the run for that article.

Patterns are regular expressions ([RE2 syntax](https://github.com/google/re2/wiki/Syntax)), ignoring case unless they start with `(?-i)`.

"Test" shows which of your 1,000 most recent articles a filter matches, before you save it. "Apply to existing articles" runs a filter on the articles you already have. Starred, published, noted, labelled, and shared articles are never deleted.
