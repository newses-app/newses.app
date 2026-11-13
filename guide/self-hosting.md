---
description: Install, configure, upgrade, back up, and move a Newses server running on Docker.
---

# Self-hosting with Docker

<!-- #region commands -->
Newses runs from a folder holding a release's `compose.yaml` and its settings in `.env`, on a linux/amd64 or linux/arm64 host with Docker Compose 2.23.1 or later. Commands run in that folder, and `C` stands for `docker compose`. In a checkout ([Building from source](./self-hosting#building-from-source)), commands run from its root, `C` stands for `docker compose -f docker/compose.yaml`, and the settings are in `docker/.env`.
<!-- #endregion commands -->

## Install

<!-- #region install -->
1. Download the compose file, and the sample settings as `.env`, into a new folder:

   <ServerInstall part="install" />

2. In `.env`, change `POSTGRES_PASSWORD`, and set `APP_SECRET` to the output of `openssl rand -base64 48`.
3. Set `ADMIN_LOGIN` and `ADMIN_PASSWORD` for the first admin, or create it with the CLI after step 4.
4. `C up -d`

`migrate` runs once and exits. `server` and `worker` start after it succeeds. The app listens on `HTTP_PORT` (default 8080): open it in a browser and sign in. `GET /healthz` returns `200` with `{"status":"ok"}` when the database and job queue are reachable.
<!-- #endregion install -->

The image is signed. To check it with [cosign](https://docs.sigstore.dev/cosign/system_config/installation/):

<ServerInstall part="verify" />

## Configuration

`.env`:

| Variable | Default | Purpose |
|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | — | Database credentials; also used to build `DATABASE_URL` |
| `APP_SECRET` | — | At least 32 characters; keys for encrypting stored 2FA secrets and feed passwords and for signing tokens. Back it up with the database: changing or losing it disables 2FA for every user, and feeds with a login stop updating until their readers enter the password again |
| `HTTP_PORT` | `8080` | Host port for the server |
| `LOG_LEVEL` | `info` | `trace`, `debug`, `info`, `warn`, `error`, `fatal`; `debug` and `trace` log request, feed, page, and image URLs (secret keys stay redacted), which reach OTLP too when it is on |
| `PUBLIC_URL` | unset | The address readers use, e.g. `https://reader.example.com`; makes published-feed links absolute. Unset uses each request's address, which needs a proxy that forwards `Host` |
| `INSTANCE_NAME` | unset | What the desktop and Android apps call this server, e.g. `Home` (up to 100 characters), naming its profiles `user @ Home`; unset uses the host |
| `SOURCE_URL` | unset | Where Settings > "About" sends readers for this server's source code. Set it if you run changed code, as the AGPL requires; unset links the Newses repository at the image's version |
| `COMPAT_TRACE` | `false` | `true` logs every TTRSS and Google Reader API call with its parameters (credentials redacted), to diagnose a client |
| `TRUST_PROXY` | `false` | `true`, the number of proxy hops, or the reverse proxy's address/CIDR, so client IPs (login throttling) and HTTPS (secure cookies) come from forwarded headers |
| `FEED_UPDATE_INTERVAL_MINUTES` | `30` | Default minutes between fetches of a feed (5–1440) |
| `FEED_PURGE_DAYS` | `180` | Default age in days after which entries are deleted unless starred, published, noted, labelled, or shared; `0` keeps everything |
| `ARCHIVE_ENABLED` | `true` | Keeps entries that purge deletes in a cold-storage archive in the `blobs` volume, where users browse and restore them; `false` deletes them for good |
| `FEED_DISABLE_AFTER_FAILURES` | `20` | Consecutive failed fetches after which a feed is disabled until refreshed |
| `FETCH_ALLOW_PRIVATE_NETWORKS` | unset | Feeds on private or loopback addresses are blocked; set `true` or comma-separated CIDRs (e.g. `192.168.1.0/24`) to allow LAN feeds |
| `ADMIN_LOGIN`, `ADMIN_PASSWORD` | unset | First admin, created at startup only while no users exist; remove once created. Well-known logins such as `admin` and `root` are refused |
| `BACKUP_RETENTION_DAYS` | `14` | Days of nightly dumps kept by the `backup` service |
| `OPS_RETENTION_DAYS` | `90` | Days of activity, request, site, and job statistics, and resolved alerts, kept for the Operations page |
| `AUDIT_RETENTION_DAYS` | `365` | Days of audit events kept |
| `OPS_HOST_HOURLY_BUDGET` | `200` | Requests to one site in an hour above which an alert opens |
| `SMTP_URL` | unset | Mail server for alert emails, e.g. `smtps://user:password@mail.example.com:465` |
| `ALERT_EMAIL_TO` | unset | Address alerts are emailed to; needs `SMTP_URL`. Unset keeps alerts on the Operations page only |
| `ALERT_EMAIL_FROM` | `Newses <newses@localhost>` | Sender of alert emails |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | unset | OTLP/HTTP endpoint for traces, metrics, and logs, e.g. `http://lgtm:4318` for the `observability` profile; unset turns OpenTelemetry off |
| `OTEL_EXPORTER_OTLP_HEADERS` | unset | Headers for the endpoint, e.g. `authorization=Bearer …` |
| `OTEL_TRACES_SAMPLER`, `OTEL_TRACES_SAMPLER_ARG` | `parentbased_always_on`, `1` | Trace sampling, e.g. `parentbased_traceidratio` and `0.1` |
| `OTEL_METRIC_EXPORT_INTERVAL` | `15000` | Milliseconds between metric exports |
| `DEPLOYMENT_ENVIRONMENT` | `self-hosted` | `deployment.environment.name` on all telemetry |
| `GRAFANA_PORT` | `3000` | Port of Grafana on `127.0.0.1` (`observability` profile) |
| `NEWSES_IMAGE` | The release's image; in a checkout, `newses:latest` | Image to run; in a checkout, the tag it builds |
| `COMPOSE_PROJECT_NAME` | `newses` | Prefix of container and volume names; a stack created as `rss-reader` keeps that name to keep its volumes |
| `VIRTUAL_HOST`, `LETSENCRYPT_HOST` | unset | Public hostname for nginx-proxy and acme-companion (`compose.nginx-proxy.yaml`) |
| `COMPOSE_PROFILES` | unset | Optional services to run, comma-separated: `ntfy` ([Push to Android](#push-to-android)), `backup`, `observability` |
| `NTFY_HOST` | unset | Hostname of the bundled ntfy (`ntfy` profile), e.g. `ntfy.example.com`; the Android app suggests it, and the server reaches it even on a private address |
| `NTFY_PORT` | `8081` | Host port the bundled ntfy is published on, for your proxy |
| `NTFY_AUTH_ACCESS` | `*:up*:wo` | The bundled ntfy's access for everyone: `*:up*:deny` lets only users given access publish ([Push to Android](#push-to-android)) |
| `PUSH_TOKENS` | unset | ntfy access tokens the server publishes with, comma-separated `host=token` pairs, for a ntfy that only lets users publish |
| `NGINX_PROXY_NETWORK` | `nginx-proxy` | Existing Docker network of nginx-proxy |
| `RELEASE_TAG` | unset | The tag your app downloads are built from, the installed version's, e.g. `v1.2.3` ([Your own app downloads](#your-own-app-downloads)) |
| `APPS_PLATFORMS` | `linux,android` | The apps built: `linux`, `android`, or both |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | empty | Your Android release keystore, base64, its password, key alias, and key password, which sign the APK; empty builds no APK |

Application variables, set in `compose.yaml`:

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection URL |
| `HOST`, `PORT` | `0.0.0.0`, `8080` | Server bind address inside the container |
| `BLOB_DIR` | `/data/blobs` | Favicon and image cache, and the archive (`blobs` volume) |
| `DOWNLOADS_DIR` | `/data/downloads` | Your own app downloads, served at `/downloads/` (`downloads` volume); unset serves none |
| `PUSH_DISTRIBUTOR_URL` | `https://` and `NTFY_HOST` | UnifiedPush distributor the Android app suggests to readers |
| `PUSH_TRUSTED_HOSTS` | `NTFY_HOST` | Comma-separated hosts whose push endpoints may be on private addresses, without allowing feeds there |

## Users

Admins manage users through the admin API (`/api/v1/admin/users`). From the host, with the stack running:

- Create: `echo 'the password' | C exec -T server newses cli user create <login> [--admin]`
- Reset a password, sign the user out everywhere, and revoke their app passwords: `echo 'new password' | C exec -T server newses cli user reset-password <login>`
- Turn off a user's two-factor authentication and sign them out everywhere: `C exec server newses cli user reset-2fa <login>`

## Logs

`C logs server worker` shows JSON logs. Warnings from the server about slowness:

| Message | Meaning |
|---|---|
| `Slow request` | A response took over 2 s |
| `Client closed the connection before the response was sent` | The browser or proxy gave up waiting |

Both include `pool` (`waiting` > 0: requests queued for a database connection) and `eventLoopDelayMaxMs` (high: the server was blocked). Neither high points at the database or at password hashing.

With OpenTelemetry on, log lines inside a request or job carry `trace_id` and `span_id`.

## Monitoring

Admins open Settings > Operations:

| Tab | Shows |
|---|---|
| Alerts | Open alerts and those resolved in the last 7 days; a banner when the worker's checks stopped |
| Sites | Requests to each site in 24 hours or 7 days: outcomes, share answered "not modified", busiest hour against the budget, Retry-After pauses |
| Jobs | Runs, failures, and durations of feed fetches, favicons, full text, and the scheduled tasks |
| Users | Last seen, requests by app, and articles read over 7 and 30 days |
| Audit log | Sign-ins, failed sign-ins, password, 2FA, app-password, and user changes |

The worker checks for problems every 5 minutes and emails changes to `ALERT_EMAIL_TO` when `SMTP_URL` is set.

Traces, metrics, and logs:

1. Set `OTEL_EXPORTER_OTLP_ENDPOINT=http://lgtm:4318` in `.env`.
2. `C --profile observability up -d`
3. Open `http://127.0.0.1:3000` (on the Docker host; tunnel with `ssh -L 3000:127.0.0.1:3000` from elsewhere). Grafana allows anonymous admin access, so keep it off public interfaces. The `newses` folder has dashboards for the overview, API, jobs, remote sites, and runtime; Explore searches traces (Tempo) and logs (Loki).

Any OTLP/HTTP backend works instead of the bundled one. Telemetry carries route patterns and host names, never credentials, feed URLs, or article content.

## Upgrade

Download the newer release's compose file over yours, and start it; `.env` stays:

<ServerInstall part="upgrade" />

Add the `--profile` options the stack runs with to `up`. Migrations apply before the new server and worker start. Settings new in the release are in its sample settings ([Download](/download#server)).

In a checkout: `git pull && C up -d --build`.

With [your own app downloads](#your-own-app-downloads), build them again from the new version's tag, so the apps update too.

## Reverse proxy and TLS

### nginx-proxy

1. In `.env`, set `VIRTUAL_HOST` (and `LETSENCRYPT_HOST` when acme-companion issues certificates). If nginx-proxy's Docker network is not called `nginx-proxy`, set `NGINX_PROXY_NETWORK`.
2. Download the override, beside `compose.yaml`, and start with both:

   <ServerInstall part="nginx-proxy" />

   In a checkout: `C -f docker/compose.nginx-proxy.yaml up -d`.
3. From then on, `C` names both files: `docker compose -f compose.yaml -f compose.nginx-proxy.yaml`, in a checkout `docker compose -f docker/compose.yaml -f docker/compose.nginx-proxy.yaml`.

The server then joins the proxy network and is not published on the host. `TRUST_PROXY` defaults to `1`, the proxy being the only hop.

### Other proxies

Forward to the server's port 8080 and pass `X-Forwarded-For` and `X-Forwarded-Proto`. Set `TRUST_PROXY` to the number of proxies in front of the server or to the proxy's address. `true` also trusts `X-Forwarded-For` entries sent by clients, which lets them evade per-IP login throttling.

The desktop and mobile apps need HTTPS. The proxy must forward the `Authorization` and `Origin` headers and `OPTIONS` requests, which carry the apps' bearer tokens and CORS preflights.

`/api/v1/events` is a long-lived event stream. nginx and nginx-proxy need no extra configuration. Other proxies must not buffer its responses and must allow at least 30 s between bytes (the server sends a heartbeat every 25 s).

The bundled ntfy needs its own virtual host for `NTFY_HOST`, forwarding to `NTFY_PORT` with WebSocket upgrades and the same long-lived connections (it sends a keepalive every 45 s), and `X-Forwarded-For`.

## Push to Android

The server pushes new entries to the Android app through the reader's [UnifiedPush](https://unifiedpush.org) distributor, so it syncs within minutes even while closed; without one it syncs every 30 minutes. Readers can use the public ntfy.sh, or a ntfy you run beside Newses:

1. Give ntfy its own hostname, such as `ntfy.example.com` beside `reader.example.com`, with a DNS record pointing at the server (a wildcard record covers it). ntfy does not run under a path of the reader's address.
2. In `.env`, set `NTFY_HOST` and add `ntfy` to `COMPOSE_PROFILES`, then `C up -d`.
3. Route `NTFY_HOST` to it over HTTPS: nginx-proxy does with the override ([nginx-proxy](#nginx-proxy)); other proxies forward it to `NTFY_PORT` ([Other proxies](#other-proxies)).
4. Give each reader an ntfy user that can read UnifiedPush topics, and tell them its name and password:

   ```sh
   C exec ntfy ntfy user add <name>
   C exec ntfy ntfy access <name> 'up*' read-only
   ```

Anyone can publish to `up*` topics, as servers push there; reading them, and every other topic, needs a user. Its users and messages are in the `ntfy` volume. Readers then set up the app ([Push on Android](./apps#push-on-android)).

To let only Newses publish there, give it a user of its own with a token:

1. Create the user, let it publish to UnifiedPush topics, and make its token:

   ```sh
   C exec ntfy ntfy user add newses
   C exec ntfy ntfy access newses 'up*' write-only
   C exec ntfy ntfy token add newses
   ```

2. In `.env`, set `PUSH_TOKENS=ntfy.example.com=tk_…` (your `NTFY_HOST` and the token) and `NTFY_AUTH_ACCESS=*:up*:deny`, then `C up -d`.

Other apps' servers can then no longer push to readers through it.

## Apps

Install the desktop and Android apps from [Download](/download) and enter the server's HTTPS address at first launch; see [Desktop and Android apps](./apps). The proxy needs the headers above.

### Your own app downloads

Your server can offer the desktop app for Linux and the Android app at `https://<your server>/downloads/`, built from the Newses source of your installed version. Apps installed from there update from your server rather than from the project's downloads. Windows and macOS apps are not built.

The build runs from a checkout, on a linux/amd64 host (on arm64 Docker emulates it, slowly), and takes a few GB of disk and a while the first time.

1. Set `PUBLIC_URL` in `.env` to the server's `https://` address: the apps check it for updates, over HTTPS only.
2. For the Android app, create a release keystore, which signs every version you build. From a checkout, with JDK 21's `keytool`, and a folder on a drive you keep offline as the backup:

   ```sh
   scripts/android-signing-setup.sh --backup /media/backup --docker
   ```

   It writes the keystore to the backup folder, prints its password to keep in your password manager, and sets the `ANDROID_KEYSTORE_*` and `ANDROID_KEY_*` values in the checkout's `docker/.env`; copy those four lines to your install's `.env` if it is elsewhere. Losing the keystore or its password means installed apps can never be updated again. To build only the Linux app, set `APPS_PLATFORMS=linux` instead.
3. Get the source of your installed version (the version in `compose.yaml`'s image), and set `RELEASE_TAG` in `.env` to its tag:

   ```sh
   git clone --depth 1 --branch v<version> https://github.com/newses-app/newses newses-source
   ```

4. Build, with your install's `.env`:

   ```sh
   docker compose --env-file ~/newses/.env -f newses-source/docker/compose.yaml \
     -f newses-source/docker/compose.apps.yaml --profile apps run --rm apps
   ```

   In a checkout's own stack: `C -f docker/compose.apps.yaml --profile apps run --rm apps`.

The apps, their checksums, and their bills of materials are then at `/downloads/`, with commands to install each; the server serves them from the `downloads` volume. Building again replaces them, and a release replaces the prerelease before it.

An Android app signed with your keystore cannot update one installed from the project's downloads, or the reverse: to switch, uninstall the app first, which deletes its offline articles and sign-ins.

## Backups

- Enable nightly dumps with `C --profile backup up -d`. Dumps go to the `backups` volume as `newses-YYYYMMDD-HHMMSS.dump` and are pruned after `BACKUP_RETENTION_DAYS`.
- Take an ad-hoc dump with `C exec db sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > newses.dump`.
- Back up the `blobs` volume too. Favicons and cached images re-fetch, but the archive (`archive/` in the volume) is not in the dumps and cannot be re-fetched. `scripts/export-instance.sh` writes both to one bundle, which `scripts/restore-instance.sh` loads ([Moving to another instance](#moving-to-another-instance)).

## Restore

1. `C stop server worker`
2. Restore one of:
   - From the backups volume: `C exec backup pg_restore --clean --if-exists -d "$POSTGRES_DB" /backups/<file>.dump`
   - From a local file: `C exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < newses.dump`
3. `C start server worker`

## Scripts

Exporting, restoring, and importing from TTRSS run scripts that drive Docker from the host, from a checkout of [newses-app/newses](https://github.com/newses-app/newses) at the installed version's tag (the version in `compose.yaml`'s image). Name the install's compose files with `--compose`, once for each:

```sh
git clone --depth 1 --branch v<version> https://github.com/newses-app/newses newses-scripts
newses-scripts/scripts/export-instance.sh newses-bundle --compose ~/newses/compose.yaml
```

A checkout's own stack needs no `--compose`. The scripts warn when the install runs a version other than their checkout's.

## Moving to another instance

Moves everything to another Docker host or an AWS stage, or from an AWS stage to Docker (`--aws dev|prod` on either script; bundle contents in [Architecture](/contributing/architecture#moving-an-instance)). The target must run the same version of Newses or a newer one.

1. Start the target: `C up -d` on the new host, with its own `APP_SECRET`.
2. On the source: `scripts/export-instance.sh newses-bundle --freeze`. The source stays stopped; `C start server worker` restarts it. Without `--freeze` it keeps running, and changes after the export are lost.
3. Copy `newses-bundle/` to the target host privately (it holds password hashes and the source's `APP_SECRET`), e.g. `scp -r`.
4. On the target: `scripts/restore-instance.sh newses-bundle --dry-run`, then without `--dry-run`. The target's database is saved first as `newses-pre-restore-<time>.dump`.
5. Point DNS or the proxy at the target, and set `PUBLIC_URL` there if the address changed.
6. Delete the bundle.

Everyone signs in again, two-factor authentication included; the apps need the new address if it changed. Feed passwords move with the bundle.

## Building from source

A checkout builds the image itself:

```sh
git clone https://github.com/newses-app/newses
cd newses
cp docker/.env.example docker/.env
```

Then follow [Install](#install) from step 2, in `docker/.env`, and start with `C up -d --build`.

### Moving a checkout's stack to the published image

The release's compose file has the checkout's project name (`newses`, or `COMPOSE_PROJECT_NAME`) and volumes, so the stack keeps its data. The release must be the checkout's version or newer.

1. Download the files as in [Install](#install) step 1, then copy the checkout's `docker/.env` over `.env`, and remove `NEWSES_IMAGE` from it if set.
2. In the checkout: `docker compose -f docker/compose.yaml down`. The volumes stay.
3. In the new folder: `docker compose up -d`, with the `--profile` options the stack ran with.

## Without Compose

Platforms that run containers without Compose (Kubernetes, Unraid, Portainer without a stack) run the release's image:

<ServerInstall part="image" />

Each role is the container's command, with the [settings](#configuration) as environment variables, the same `APP_SECRET` in each, and `DATABASE_URL` pointing at PostgreSQL (the compose file runs version 18) with the `unaccent` extension available, as it is wherever PostgreSQL's contrib modules are installed:

| Role | Runs | Volume | Health check |
|---|---|---|---|
| `migrate` | Applies migrations and exits; before `server` and `worker` start, at install and after each upgrade | — | — |
| `server` | The web app and API, on port 8080 | `/data/blobs` | `wget -qO- http://127.0.0.1:8080/healthz` |
| `worker` | Feed fetches and scheduled tasks | `/data/blobs`, the same volume as `server` | `newses worker-health` |

The containers run as user `node` (UID 1000), which must be able to write `/data/blobs`. `cli` runs the [user commands](#users).
