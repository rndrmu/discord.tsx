# Discord.tsx

## A Wrapper for the Discord API written in ReactJS

## What works?

* [x] Connecting to the Gateway
* [ ] Sending Messages (Partially via Webhooks)
* [ ] Voice Gateway
* [ ] Session Resuming 

## What does not work?
- Most of the HTTP APIs as Discord blocks them with a 403
## Voice handshake demo (Node)
Browsers can't send raw UDP, so voice can't work in the web app. `examples/voice-handshake.mjs` does the full
voice handshake (gateway → voice gateway → UDP IP discovery → encryption key → a few encrypted silent frames)
in plain Node 22+, no dependencies:

```sh
DISCORD_TOKEN=... GUILD_ID=... CHANNEL_ID=... node examples/voice-handshake.mjs
```
