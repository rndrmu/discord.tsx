// voice-handshake.mjs — the whole Discord voice handshake, step by step.
//
// Zero dependencies. Needs Node 22+ (for the built-in WebSocket).
//
//   DISCORD_TOKEN=... GUILD_ID=... CHANNEL_ID=... node examples/voice-handshake.mjs
//
// What happens:
//   [gateway] connect → HELLO → heartbeat + IDENTIFY → READY
//   [gateway] op 4 "join this voice channel"
//   [gateway] VOICE_STATE_UPDATE  → gives us session_id
//   [gateway] VOICE_SERVER_UPDATE → gives us voice token + endpoint
//   [voice]   connect → IDENTIFY → HELLO → READY (ssrc, ip, port, modes)
//   [udp]     IP discovery (the 74-byte packet)
//   [voice]   SELECT_PROTOCOL → SESSION_DESCRIPTION (secret_key)
//   [voice]   SPEAKING → 5 encrypted frames of Opus silence over UDP
//
// Heads-up: Discord now requires DAVE (end-to-end encryption) for voice.
// This script tells Discord it does NOT support DAVE, so Discord may close
// the voice socket with code 4017 right after IDENTIFY. If that happens,
// everything up to that point still worked, and the UDP code below is exactly
// what you'd use underneath a DAVE implementation.

import dgram from "node:dgram";
import crypto from "node:crypto";

const { DISCORD_TOKEN, GUILD_ID, CHANNEL_ID } = process.env;
if (!DISCORD_TOKEN || !GUILD_ID || !CHANNEL_ID) {
  console.error("Set DISCORD_TOKEN, GUILD_ID and CHANNEL_ID env vars first.");
  process.exit(1);
}

const log = (tag, ...msg) => console.log(`[${tag}]`.padEnd(9), ...msg);

// Shared state that both sockets fill in.
const state = {
  userId: null,     // from gateway READY
  sessionId: null,  // from VOICE_STATE_UPDATE
  voiceToken: null, // from VOICE_SERVER_UPDATE
  endpoint: null,   // from VOICE_SERVER_UPDATE
};

// ───────────────────────────── 1. main gateway ─────────────────────────────

const GUILDS = 1 << 0;
const GUILD_VOICE_STATES = 1 << 7;

const gw = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");
let gwSeq = null; // last sequence number we saw; heartbeats must send it back
let gwHeartbeat = null;

const gwSend = (op, d) => gw.send(JSON.stringify({ op, d }));

gw.onopen = () => log("gateway", "connected");

gw.onmessage = ({ data }) => {
  const { op, d, s, t } = JSON.parse(data);
  if (s !== null && s !== undefined) gwSeq = s;

  switch (op) {
    case 10: // HELLO
      log("gateway", `HELLO, heartbeat every ${d.heartbeat_interval}ms`);
      gwHeartbeat = setInterval(() => gwSend(1, gwSeq), d.heartbeat_interval);
      gwSend(2, {
        token: DISCORD_TOKEN,
        intents: GUILDS | GUILD_VOICE_STATES,
        properties: { os: "AmogOS", browser: "discord.tsx", device: "discord.tsx" },
      });
      break;

    case 1: // Discord wants a heartbeat right now
      gwSend(1, gwSeq);
      break;

    case 0: // DISPATCH
      onDispatch(t, d);
      break;
  }
};

gw.onclose = ({ code, reason }) => {
  log("gateway", `closed: ${code} ${reason}`);
  clearInterval(gwHeartbeat);
};

function onDispatch(t, d) {
  if (t === "READY") {
    state.userId = d.user.id;
    log("gateway", `READY as ${d.user.username} (${d.user.id})`);
    log("gateway", `asking to join channel ${CHANNEL_ID}...`);
    // op 4 = VOICE_STATE_UPDATE: "put me in this voice channel"
    gwSend(4, { guild_id: GUILD_ID, channel_id: CHANNEL_ID, self_mute: false, self_deaf: true });
  }

  // Discord answers op 4 with TWO events, in any order. We need both.
  if (t === "VOICE_STATE_UPDATE" && d.user_id === state.userId) {
    state.sessionId = d.session_id;
    log("gateway", `VOICE_STATE_UPDATE → session_id ${d.session_id}`);
    maybeStartVoice();
  }
  if (t === "VOICE_SERVER_UPDATE") {
    state.voiceToken = d.token;
    state.endpoint = d.endpoint; // can be null briefly while Discord picks a server
    log("gateway", `VOICE_SERVER_UPDATE → endpoint ${d.endpoint}`);
    maybeStartVoice();
  }
}

let voiceStarted = false;
function maybeStartVoice() {
  if (voiceStarted || !state.sessionId || !state.voiceToken || !state.endpoint) return;
  voiceStarted = true;
  startVoice();
}

// ───────────────────────────── 2. voice gateway ────────────────────────────

const VOICE_CLOSE_CODES = {
  4004: "authentication failed",
  4006: "session no longer valid",
  4014: "disconnected (kicked / channel deleted)",
  4015: "voice server crashed",
  4016: "unknown encryption mode",
  4017: "DAVE (E2EE) required, see the note at the top of this file",
};

function startVoice() {
  const vs = new WebSocket(`wss://${state.endpoint}?v=8`);
  let vsSeq = -1; // v8 voice gateway also wants seq acks in heartbeats
  let vsHeartbeat = null;
  let udp = null;
  let ready = null; // { ssrc, ip, port, modes }

  const vsSend = (op, d) => vs.send(JSON.stringify({ op, d }));

  vs.onopen = () => {
    log("voice", "connected, sending IDENTIFY");
    vsSend(0, {
      server_id: GUILD_ID,
      user_id: state.userId,
      session_id: state.sessionId,
      token: state.voiceToken,
      max_dave_protocol_version: 0, // "I don't speak DAVE"
    });
  };

  vs.onmessage = async ({ data }) => {
    if (typeof data !== "string") return; // binary frames are DAVE-only; ignore
    const msg = JSON.parse(data);
    if (typeof msg.seq === "number") vsSeq = msg.seq;
    const { op, d } = msg;

    switch (op) {
      case 8: // HELLO
        log("voice", `HELLO, heartbeat every ${d.heartbeat_interval}ms`);
        vsHeartbeat = setInterval(
          () => vsSend(3, { t: Date.now(), seq_ack: vsSeq }),
          d.heartbeat_interval,
        );
        break;

      case 2: { // READY: here's your ssrc and where to send UDP
        ready = d;
        log("voice", `READY → ssrc ${d.ssrc}, server ${d.ip}:${d.port}`);
        log("voice", `supported modes: ${d.modes.join(", ")}`);

        udp = dgram.createSocket("udp4");
        const me = await ipDiscovery(udp, d.ssrc, d.ip, d.port);
        log("udp", `IP discovery → Discord sees us as ${me.ip}:${me.port}`);

        const mode = d.modes.includes("aead_aes256_gcm_rtpsize")
          ? "aead_aes256_gcm_rtpsize"
          : "aead_xchacha20_poly1305_rtpsize";
        log("voice", `SELECT_PROTOCOL with mode ${mode}`);
        vsSend(1, { protocol: "udp", data: { address: me.ip, port: me.port, mode } });
        break;
      }

      case 4: { // SESSION_DESCRIPTION: here's your encryption key
        const key = Buffer.from(d.secret_key);
        log("voice", `SESSION_DESCRIPTION → mode ${d.mode}, ${key.length}-byte key`);
        log("voice", "🎉 handshake complete, we could send audio now");

        if (d.mode !== "aead_aes256_gcm_rtpsize") {
          log("voice", "(skipping audio demo: Node has no built-in XChaCha20)");
          break;
        }
        vsSend(5, { speaking: 1, delay: 0, ssrc: ready.ssrc }); // SPEAKING on
        await sendSilence(udp, key, ready);
        vsSend(5, { speaking: 0, delay: 0, ssrc: ready.ssrc }); // SPEAKING off
        log("udp", "sent 5 frames of silence. Done! Ctrl+C to quit.");
        break;
      }

      case 6: // HEARTBEAT_ACK
        break;
    }
  };

  vs.onclose = ({ code, reason }) => {
    log("voice", `closed: ${code} ${VOICE_CLOSE_CODES[code] ?? reason ?? ""}`);
    clearInterval(vsHeartbeat);
    udp?.close();
  };
}

// ───────────────────────────── 3. UDP stuff ────────────────────────────────

// IP discovery: we tell Discord our ssrc, it tells us our public IP + port.
//
//   request/response layout (74 bytes, big-endian):
//   ┌──────┬────────┬────────┬───────────────────────────┬──────┐
//   │ type │ length │  ssrc  │ address (null-padded str) │ port │
//   │  2B  │   2B   │   4B   │           64B             │  2B  │
//   └──────┴────────┴────────┴───────────────────────────┴──────┘
//   0      2        4        8                          72     74
//   type = 1 for request, 2 for response; length = 70 (everything after it)
function ipDiscovery(socket, ssrc, ip, port) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("IP discovery timed out")), 5000);

    socket.once("message", (msg) => {
      clearTimeout(timer);
      if (msg.readUInt16BE(0) !== 2) return reject(new Error("not a discovery response"));
      resolve({
        ip: msg.subarray(8, 72).toString("utf8").replace(/\0+$/, ""),
        port: msg.readUInt16BE(72),
      });
    });

    const req = Buffer.alloc(74);
    req.writeUInt16BE(1, 0);
    req.writeUInt16BE(70, 2);
    req.writeUInt32BE(ssrc, 4);
    socket.send(req, port, ip);
  });
}

// One Opus frame of silence. Real audio would come from an Opus encoder.
const OPUS_SILENCE = Buffer.from([0xf8, 0xff, 0xfe]);

// Voice packet layout for aead_aes256_gcm_rtpsize:
//
//   [ RTP header 12B ][ encrypted opus ][ GCM tag 16B ][ nonce counter 4B ]
//
//   RTP header: 0x80 0x78 | seq u16 | timestamp u32 | ssrc u32
//   The header is not encrypted, but it IS authenticated (passed as AAD).
//   The nonce is a 4-byte counter; AES-GCM wants 12 bytes, so we pad with zeros.
async function sendSilence(socket, key, { ssrc, ip, port }) {
  let seq = 0;
  let timestamp = 0;
  let nonce = 0;

  for (let i = 0; i < 5; i++) {
    const header = Buffer.alloc(12);
    header[0] = 0x80; // RTP version 2
    header[1] = 0x78; // payload type 120 = Opus
    header.writeUInt16BE(seq, 2);
    header.writeUInt32BE(timestamp, 4);
    header.writeUInt32BE(ssrc, 8);

    const nonceBytes = Buffer.alloc(4);
    nonceBytes.writeUInt32BE(nonce, 0);
    const iv = Buffer.concat([nonceBytes, Buffer.alloc(8)]);

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    cipher.setAAD(header);
    const encrypted = Buffer.concat([cipher.update(OPUS_SILENCE), cipher.final()]);

    socket.send(Buffer.concat([header, encrypted, cipher.getAuthTag(), nonceBytes]), port, ip);

    seq = (seq + 1) & 0xffff;
    timestamp = (timestamp + 960) >>> 0; // 20ms at 48kHz = 960 samples
    nonce = (nonce + 1) >>> 0;
    await new Promise((r) => setTimeout(r, 20));
  }
}
