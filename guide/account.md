---
description: Your Newses password, email address and digest, two-factor sign-in with recovery codes, app passwords, signed-in devices, and how admins add users.
---

# Account and security

Everything here is in Settings > Account.

## Password

"Change password" needs at least 8 characters and not a common password; changing it signs out your other devices. An account an admin set up with a generated password asks for your own at the first sign-in; the generated one expires after 7 days.

## Email address

Where the server can send email, "Email" takes the address Newses mails you at:
1. Enter it and choose "Send confirmation link".
2. Open the link in the email, in any browser, and choose "Confirm address". The link works for 24 hours; the email is in your language.

Until you confirm it, the address shows as waiting, with buttons to send the link again or cancel; an address you confirmed earlier keeps receiving mail meanwhile. Delete the address to stop all mail. Admins see your confirmed address in Settings > Users.

Self-hosters turn email on with `SMTP_URL`; see [Email](./self-hosting#email).

## Email digest

Under "Digest", once your address is confirmed, "Email digest" sends you the unread articles that came in since the last digest, daily or weekly:
- "Day" (weekly) and "Time" set when it comes, in "Time zone", which starts as your device's.
- It lists the articles shown in All articles, so not those of feeds hidden from it or scored below your threshold, newest first and at most 100, by category and feed, each with the start of its text, a link that opens it in Newses, and a link to the original; it counts the rest.
- Nothing comes when no new article is unread.
- "Mark the articles in a digest read" marks the ones it lists read once it is sent.

"Send a test digest" first shows what it would hold: how many unread articles, and what each of your plugins expects it to cost, such as the digest summary's tokens and dollars. "Send it" emails it within a minute or so, whether or not your digest is on: the unread articles that came in over the last day, with what your plugins add and, for any that added nothing, why. It changes nothing: your next digest comes as it would have, and no article is marked read. It needs an unread article from the last day.

The email is in your language. "Unsubscribe" in it, or your mail app's unsubscribe button, turns the digest off; turn it on again here. The server needs email and `PUBLIC_URL` for digests ([Configuration](./self-hosting#configuration)).

## Two-factor sign-in

"Set up two-factor authentication" adds a code from an authenticator app to every sign-in, in the browser and the apps:
1. Confirm your password.
2. Scan the QR code with the authenticator app (or enter the key shown), and enter the 6-digit code it gives.
3. Save the 10 recovery codes ("Copy" or "Download"). Each signs you in once if you lose the authenticator, and they are not shown again.

Turning it on signs out your other devices. Afterwards, the section shows how many recovery codes are left, with "New recovery codes" and "Turn off".

If you lose both the authenticator and the recovery codes, an admin can turn two-factor sign-in off for you (Settings > Users > "Reset two-factor authentication"), and you set it up again.

## App passwords

Apps that use the Tiny Tiny RSS or Google Reader API sign in with an app password, not your password, and skip two-factor sign-in. See [Third-party clients](./clients).

## Signed-in devices

"Signed-in devices" lists where you are signed in and when each was last active; "Sign out" ends any of them.

## Users

Newses has no sign-up; admins add people. In Settings > Users, an admin sees each user's confirmed email address, creates users ("New user", optionally "Administrator"), resets passwords and two-factor sign-in, and disables or deletes users. A reset password signs the user out everywhere and stops their app passwords. Self-hosters can do the same from the command line; see [Users](./self-hosting#users).
