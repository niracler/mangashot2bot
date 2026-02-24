# mangashot2bot

A Telegram bot that sends manga screenshots.

## preview

<img width="2514" height="2454" alt="CleanShot 2026-02-24 at 15 28 42@2x" src="https://github.com/user-attachments/assets/b8af0245-3766-4a41-a8f4-ed0081eb54e4" />

## Commands

```
delete - Delete the mangashot through the ID or reply.
```

## Some commands development

```bash
pnpm run deploy # Deploy the worker
pnpm run wrangler tail # Get the logs
pnpm run wrangler d1 execute manga --remote --command "SELECT * FROM mangashot ORDER BY created_at DESC LIMIT 10" # Get the last 10 results
git diff | x chat "git commit message angular like in one line" # Generate git commit message
```

## References

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [grammY Telegram bot framework](https://grammy.dev/)
- [Cloudflare Docs](https://developers.cloudflare.com/workers)
