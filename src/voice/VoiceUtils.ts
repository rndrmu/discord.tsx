import { VoiceGatewayOpCodes, VoiceGatewayError } from "../socket/utils";
import { addMsgToConsole } from "../socket/utils";

export const connectToVoice = (socket: WebSocket, guildId: string, voiceChannelId: string) => {
    console.log(`Connecting to voice channel ${voiceChannelId}`);
    socket.send(JSON.stringify({
        "op": 4,
        "d": {
            "guild_id": guildId,
            "channel_id": voiceChannelId,
            "self_mute": false,
            "self_deaf": true
        },
        "s": 42,
        "t": "VOICE_STATE_UPDATE"
    }));
}


export function establishVoiceWebSocketConnection
    (
        session_id: string,
        user_id: string,
        server_id: string,
        endpoint: string,
        token: string,
    ) {
        let socket = new WebSocket("wss://" + endpoint);
        socket.onopen = () => {
            console.log("[VOICE] Connected to voice websocket");
            socket.send(JSON.stringify({
                "op": 0,
                "d": {
                    "server_id": server_id,
                    "user_id": user_id,
                    "session_id": session_id,
                    "token": token
                }
            }));
        }

        socket.onmessage = (message) => {
            handleVoiceWebSocketMessage(socket, message);
        }
    }

const handleVoiceWebSocketMessage = (socket: WebSocket, message: MessageEvent<any>) => {
    let data = JSON.parse(message.data);
    let heartbeat_interval: number;
    switch (data.op) {
        case VoiceGatewayOpCodes.IDENTIFY:
            console.log("[VOICE] Received Identify");
            addMsgToConsole("debug", "[VOICE] Received Identify");
            break;
        case VoiceGatewayOpCodes.READY:
            console.log("[VOICE] Received Ready");
            addMsgToConsole("debug", "[VOICE] Received Ready");
            console.log(data);
            let ip = data.d.ip;
            let port = data.d.port;
           // performIPDiscovery(data.d.ssrc, {ip, port});
            break;
        case VoiceGatewayOpCodes.HELLO:
            console.log("[VOICE] Received Hello");
            addMsgToConsole("debug", "[VOICE] Received Hello");
            heartbeat_interval = data.d.heartbeat_interval;
            addMsgToConsole("debug", "[VOICE] Sending heartbeat");
            socket.send(JSON.stringify(canYouHearMyHeart(heartbeat_interval)));
            let voiceHeartbeat = setInterval(() => {
                // if the socket is not open, don't send heartbeat
                if (socket.readyState === WebSocket.OPEN) {
                    console.log("[VOICE] Sending heartbeat");
                    addMsgToConsole("debug", "[VOICE] Sending heartbeat");
                    socket.send(JSON.stringify(canYouHearMyHeart(heartbeat_interval)));
                } else {
                    console.log("[VOICE] Socket not open");
                    // close socket
                    socket.close();
                    // clear heartbeat
                    clearInterval(voiceHeartbeat);
                }
            }, heartbeat_interval);
            break;
        case VoiceGatewayOpCodes.HEARTBEAT_ACK:
            console.log("[VOICE] Received Heartbeat ACK");
            addMsgToConsole("debug", "[VOICE] Received Heartbeat ACK");
            break;
        
    }
}

const canYouHearMyHeart = (heartbeat_interval: number) => {
    return {
        "op": VoiceGatewayOpCodes.HEARTBEAT,
        "d": heartbeat_interval,
        "s": 42,
        "t": "HEARTBEAT"
    }
}


