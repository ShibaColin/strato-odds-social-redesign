# STRATO Newsdesk unattended operation

The active controller is the existing team Ubuntu server's `strato-newsdesk-refresh.timer`, once every calendar minute. It invokes the owner-private Site's POST `/api/jobs/tick` with a root-protected service credential, then POST `/api/jobs/activate` records the successful heartbeat. See `ops/SERVER.md`.

Do not create an hourly agent task, request a new Cloudflare account or start another independent scheduler. Do not change the BOOE service. No process on the user's Mac is required. Preserve the existing private Site access policy.

For an on-demand refresh, the connected hosted tool `refresh_newsdesk` uses the same collector; `newsdesk_status` reads its state. The collector owns source retrieval, copy formatting, the at-most-one-in-eight prediction-market reference, deduplication, retries and Telegram delivery. Do not publish on X, resend old articles or retry uncertain deliveries automatically. Do not send routine status messages to Codex; Telegram is the requested news destination.

A valid background state requires a heartbeat within the last three minutes. The one-time startup confirmation is gated behind two successful server runs. Never print, persist in source, or include runtime credentials in schedule prompts. Source configuration names only: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID and TELEGRAM_BOT_USERNAME. The Site service token is used only for https://strato-newsdesk-nvsa.blockapps-in-3549.chatgpt.site and is never forwarded through redirects.
