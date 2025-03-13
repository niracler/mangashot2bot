# mangashot2bot

A Telegram bot that sends manga screenshots.

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
