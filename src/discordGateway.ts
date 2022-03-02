export const blah = () => {
    console.log('blah');
}



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


    const gatewayConnect = new WebSocket(`wss://gateway.discord.gg/?v=10&encoding=json`);

    handleWebSocketConnection(gatewayConnect, token);
}


const handleWebSocketConnection = (socket: WebSocket, token: string) => {
    socket.onopen = () => {
        console.log('Connected to gateway');
        addMsgToConsole('Connected to gateway');
    }

    socket.onmessage = (event) => {
        let heartbeat_interval: number;
        const data = JSON.parse(event.data);
        
        switch (data.op) {
            case 0:
                console.log('[DISPATCH] Received Gateway Event');
                addMsgToConsole('[DISPATCH] Received Gateway Event');
                break;
            case 1:
                console.log('[HEARTBEAT] Received Heartbeat');
                addMsgToConsole('[HEARTBEAT] Received Heartbeat');
                break;
            case 2:
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
                break;
            case 6:
                console.log('[RESUME] Resumed!');
                addMsgToConsole('[RESUME] Resumed!');
                break;
            case 7:
                console.log('[RECONNECT] Reconnecting...');
                addMsgToConsole('[RECONNECT] Reconnecting...');
                break;
            case 9:
                console.log('[INVALID_SESSION] Invalid Session');
                addMsgToConsole('[INVALID_SESSION] Invalid Session');
                break;
            case 10:
                console.log('[HELLO] Received Hello');
                addMsgToConsole('[HELLO] Received Hello');
                heartbeat_interval = data.d.heartbeat_interval;
                socket.send(JSON.stringify(canYouHearMyHeart(heartbeat_interval)));
                setInterval(() => {
                    console.log('Sending heartbeat');
                    addMsgToConsole('Sending heartbeat');
                    socket.send(JSON.stringify(canYouHearMyHeart(heartbeat_interval)));
                }, heartbeat_interval);
                socket.send(JSON.stringify(identify(token)));
                break;
            case 11:
                console.log('[HEARTBEAT_ACK] Received Heartbeat ACK');
                addMsgToConsole('[HEARTBEAT_ACK] Received Heartbeat ACK');
                break;
            default: 
                console.log('[UNKNOWN] Received Unknown Event');
                addMsgToConsole('[UNKNOWN] Received Unknown Event');
                break;

                
        }

    }

    socket.onclose = () => {
        console.log('Disconnected from gateway');
        addMsgToConsole('Disconnected from gateway');
    }
}

const addMsgToConsole = (msg: string) => {
    let consoleDiv = document.querySelector('#console') as HTMLSpanElement;
    let newMsg = document.createElement('p');
    newMsg.innerText = msg;
    consoleDiv.appendChild(newMsg);
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

enum DiscordActivity {
    PLAYING = 0,
    STREAMING = 1,
    LISTENING = 2,
    WATCHING = 3,
    CUSTOM_STATUS = 4,
    COMPETING = 5
}