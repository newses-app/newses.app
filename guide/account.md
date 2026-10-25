---
description: Your Newses password, two-factor sign-in with recovery codes, app passwords, signed-in devices, and how admins add users.
---

# Account and security

Everything here is in Settings > Account.

## Password

"Change password" needs at least 8 characters and not a common password; changing it signs out your other devices. An account an admin set up with a generated password asks for your own at the first sign-in; the generated one expires after 7 days.

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

Newses has no sign-up; admins add people. In Settings > Users, an admin creates users ("New user", optionally "Administrator"), resets passwords and two-factor sign-in, and disables or deletes users. A reset password signs the user out everywhere and stops their app passwords. Self-hosters can do the same from the command line; see [Users](./self-hosting#users).
