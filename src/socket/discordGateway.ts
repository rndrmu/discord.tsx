import {
    DiscordActivity,
    addMsgToConsole,
    ConsoleMsgType
} from "./utils";
import {
    dispatchEventHandler
} from "./gatewayEventHandler";
import {
    gatewayErrorHandler
} from "./gatewayErrorHandler";
import { emit } from "process";
import EventEmitter from "events";


export const connectToGateway = () => {
    let tokenInput = (document.querySelector("input#tokenInput") as HTMLInputElement).value
    let botId = (document.querySelector("input#botId") as HTMLInputElement).value
    let token: string;
    if (!tokenInput || !botId) {
        alert('Please enter a token and bot id');
        return;
    } else {
        token = tokenInput;
    }

    localStorage.setItem('discordToken', token);
    localStorage.setItem('discordBotId', botId);

    const gatewayConnect = new WebSocket(`wss://gateway.discord.gg/?v=9&encoding=json`);

    handleWebSocketConnection(gatewayConnect, token);
}


const handleWebSocketConnection = (socket: WebSocket, token: string) => {
    socket.onopen = () => {
        console.log('Connected to gateway');
        addMsgToConsole("success", 'Connected to gateway');
    }

    socket.onmessage = (event) => {
        let heartbeat_interval: number;
        const data = JSON.parse(event.data);

        switch (data.op) {
            case 0: // Dispatch aka Gateway Event
                dispatchEventHandler(socket, data);
                break;
            case 1:
                console.log('[HEARTBEAT] Received Heartbeat');
                addMsgToConsole("debug", '[HEARTBEAT] Received Heartbeat');
                break;
                // these events _should_ be send only and received in dispatchEventHandler
                /*             case 2:
                                console.log('[IDENTIFY] Received Identify');
                                addMsgToConsole('[IDENTIFY] Received Identify');
                                break;
                            case 3:
                                console.log('[PRESENCE_UPDATE] Received Presence Update Event');
                                addMsgToConsole('[PRESENCE_UPDATE] Received Presence Update Event');
                                break;
                            case 4:
                                console.log('[VOICE_STATE_UPDATE] Received Voice State Update Event');
                                addMsgToConsole('[VOICE_STATE_UPDATE] Received Voice State Update Event');
                                break; */
            case 6:
                console.log('[RESUME] Resumed!');
                addMsgToConsole("debug", '[RESUME] Resumed!');
                break;
            case 7:
                console.log('[RECONNECT] Reconnecting...');
                addMsgToConsole("debug", '[RECONNECT] Reconnecting...');
                break;
            case 9:
                console.log('[INVALID_SESSION] Invalid Session');
                addMsgToConsole("debug", '[INVALID_SESSION] Invalid Session');
                break;
            case 10:
                console.log('[HELLO] Received Hello');
                addMsgToConsole("debug", '[HELLO] Received Hello');
                heartbeat_interval = data.d.heartbeat_interval;
                socket.send(JSON.stringify(canYouHearMyHeart(heartbeat_interval)));
                let heartBeat = setInterval(() => {
                    // if the socket is not open, don't send heartbeat
                    if (socket.readyState === WebSocket.OPEN) {
                        console.log('[HEARTBEAT] Sending heartbeat');
                        addMsgToConsole("debug", '[HEARTBEAT] Sending heartbeat');
                        socket.send(JSON.stringify(canYouHearMyHeart(heartbeat_interval)));
                    } else {
                        console.log('[HEARTBEAT] Socket not open');
                        addMsgToConsole("error", '[HEARTBEAT] Socket not open');
                        // close interval
                        clearInterval(heartBeat);
                    }
                }, heartbeat_interval);
                socket.send(JSON.stringify(identify(token)));
                break;
            case 11:
                console.log('[HEARTBEAT] Received Heartbeat ACK');
                addMsgToConsole("debug", '[HEARTBEAT] Received Heartbeat ACK');
                break;
            default:
                console.log('[UNKNOWN] Received Unknown Event');
                addMsgToConsole("error", '[UNKNOWN] Received Unknown Event : op: ' + data.op);
                break;


        }

    }

    socket.onclose = (event) => {
        console.log('Disconnected from gateway');
        addMsgToConsole("error", 'Disconnected from gateway');
        gatewayErrorHandler(socket, event.code);
    }

}



const canYouHearMyHeart = (timeout: number) => {
    return {
        "op": 1,
        "d": null,
        "s": 42,
        "t": "HEARTBEAT"
    }
}

const identify = (token: string) => {
    return {
        "op": 2,
        "d": {
            "token": token,
            "properties": {
                "$os": "AmogOS",
                "$browser": "disco",
                "$device": "disco"
            },
            "compress": false,
            "large_threshold": 250,
            "shard": [0, 1],
            "presence": {
                "activities": [{
                    "name": "with discord.tsx",
                    "type": DiscordActivity.PLAYING
                }],
                "status": "online",
                "since": 91879201,
                "afk": false
            },
            // This intent represents 1 << 0 for GUILDS, 1 << 1 for GUILD_MEMBERS, and 1 << 2 for GUILD_BANS
            // This connection will only receive the events defined in those three intents
            "intents": 1 << 7 | 1 << 9 | 1 << 10 | 1 << 11 | 1 << 12
        },
        "s": 42,
        "t": "IDENTIFY"
    }
}

const resume = (token: string, session_id: string, seq_num: number) => {
    return {
        "op": 6,
        "d": {
            "token": token,
            "session_id": session_id,
            "seq": seq_num
        },
        "s": 42,
        "t": "RESUME"
    }
}

const joinVoiceChannel = () => {
    return {
        "op": 4,
        "d": {
            "guild_id": "740492918367846481",
            "channel_id": "740492918875488320",
            "self_mute": false,
            "self_deaf": true,
        },
        "s": 42,
        "t": "VOICE_STATE_UPDATE"
    }
}

const dp = new EventEmitter()