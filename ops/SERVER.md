# STRATO Newsdesk server timer

Current architecture, 5 November 2026: the existing team Ubuntu server calls the owner-private Sites collector once per minute. News, drafts, settings and delivery records remain in Sites D1. The Telegram bot token and recipient remain Sites runtime secrets. This server receives only a restricted file containing the Site's private service credential.

Host access uses the same documented SSH identity as the BOOE project. The Newsdesk is independent of BOOE; do not start, stop, modify or restart the BOOE service as part of Newsdesk maintenance.

Files:
- `/opt/strato-newsdesk/newsdesk_refresh.py`: standard-library Python updater, root-owned and read-only to the dynamic service user.
- `/etc/strato-newsdesk/sites-service-token`: root-only mode 600. Never print or copy it into chat, logs, source or exports.
- `/etc/systemd/system/strato-newsdesk-refresh.service`: isolated oneshot, with systemd LoadCredential and a dynamic user.
- `/etc/systemd/system/strato-newsdesk-refresh.timer`: every calendar minute, enabled at boot, persistent after downtime.
- `/var/lib/strato-newsdesk/last_run.json`: successful-run timestamps and counts, not credentials.

Operations:
```
sudo systemctl status strato-newsdesk-refresh.timer
sudo systemctl list-timers strato-newsdesk-refresh.timer
sudo journalctl -u strato-newsdesk-refresh.service -n 20 --no-pager
sudo cat /var/lib/strato-newsdesk/last_run.json
sudo systemctl start strato-newsdesk-refresh.service
```

Stopping or restarting only the named Newsdesk timer does not change BOOE. The timer retries on the next minute after a failed run. An overlapping update is skipped by the collector's lease; delivery IDs and event keys suppress duplicates. Unknown Telegram delivery outcomes are retained for review rather than automatically repeated.

The cloud status records each successful server heartbeat. It shows background inactive after three minutes without a heartbeat, and the open web app can continue polling as a fallback. The startup Telegram confirmation requires at least two successful heartbeats and is sent once. No public server port is opened. Requests refuse redirects so the Site service credential cannot be forwarded to another origin.

The earlier native hosting timer declaration is cleared and no hourly agent task is enabled. A Cloudflare account, a paid hosting plan and local Mac execution are not needed for this setup.


## Local editorial worker

Ollama runs on127.0.0.1:11434 with qwen3:8b, no cloud inference, one loaded model, an8GB memory limit and250% CPU cap. strato-newsdesk-editorial.timer runs a separate DynamicUser service15 seconds after the previous batch. It reuses the root-only Sites service credential via LoadCredential. The original refresh timer remains separate and active. The editorial worker fetches up to8 candidates and processes up to6 with a130-second soft budget; outputs must pass factual/originality checks before cloud delivery. Failed drafts wait3minutes before retry. Images use Pillow and genuine pinned Commons assets, Coinbase candles or STRATO oracle series. StateDirectory caches reusable media assets. No Telegram token is present on this server.
