import {
    emit
} from "process";
import { connectToVoice, establishVoiceWebSocketConnection } from "../voice/VoiceUtils";
import {
    GatewayEvent,
    socketData,
    addMsgToConsole,
    ConsoleMsgType,
    sendMessageOverHTTP
} from "./utils";


export const dispatchEventHandler = (socket: WebSocket, payload: socketData) => {
    console.log(payload);
    addMsgToConsole("debug", `[DISPATCH] Received Gateway Event: ${payload.t}`);
    if (payload.t === "READY") {
        addMsgToConsole("success", `[DISPATCH] Received Ready Event`);
        // only set session id once per session, we can retirieve later from localStorage if needed
        localStorage.setItem("session_id", payload.d.session_id);
    }
    else if (payload.t === "MESSAGE_CREATE") {
        console.log(payload.d);
        addMsgToConsole("debug", `[DISPATCH] Received Message: ${payload.d.content}`);
        let content = payload.d.content; // utility var to get content easier
        let token = (document.querySelector("input#tokenInput") as HTMLInputElement).value;
        switch (content) {
            case "!ping":
                // needs to be via WebHook since Discord block browsers request
                // and i dont want to use a proxy since ratelimit
                sendMessageOverHTTP(payload.d.channel_id, "Pong!", token);
               break;
            case "!join":
              let voiceChannel = (document.getElementById('voiceChannel') as HTMLInputElement ).value;
              let guildId = payload.d.guild_id;
                connectToVoice(socket, guildId, voiceChannel);
                break;
        }
    } else if (payload.t === "VOICE_STATE_UPDATE") {
        console.log(payload.d);
        addMsgToConsole("debug", `[DISPATCH] Received Voice State Update: ${payload.d.channel_id}`);
        // check if it was our client that connected
        if (payload.d.user_id == localStorage.getItem("discordBotId")) {
            // if so, store the session_id so we can use it in the "VOICE_SERVER_UPDATE" event
            // and establish a connection to the voice websocket
            localStorage.setItem("voice_session_id", payload.d.session_id);
            localStorage.setItem("voice_channel_id", payload.d.channel_id);
        }
    } else if (payload.t === "VOICE_SERVER_UPDATE") {
        addMsgToConsole("debug", `[DISPATCH] Received Voice Server Update for server ${payload.d.guild_id}`);
        console.log(payload);
        establishVoiceWebSocketConnection(
            localStorage.getItem("voice_session_id")!,
            localStorage.getItem("discordBotId")!,
            payload.d.guild_id,
            payload.d.endpoint,
            payload.d.token
        )
    }
}