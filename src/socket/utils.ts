import axios from "axios";

export enum DiscordActivity {
    PLAYING = 0,
    STREAMING = 1,
    LISTENING = 2,
    WATCHING = 3,
    CUSTOM_STATUS = 4,
    COMPETING = 5
}

export const str2hex = (str: string) => {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
}

export type GatewayEvent 
= 'HELLO' | 'READY' | 'RESUMED' | 'RECONNECT' | 'INVALID_SESSION' 
| 'CHANNEL_CREATE' | 'CHANNEL_UPDATE' | 'CHANNEL_DELETE' | 'CHANNEL_PINS_UPDATE' 
| 'GUILD_CREATE' | 'GUILD_UPDATE' | 'GUILD_DELETE' 
| 'GUILD_BAN_ADD' | 'GUILD_BAN_REMOVE' | 'GUILD_EMOJIS_UPDATE' 
| 'GUILD_INTEGRATIONS_UPDATE' | 'GUILD_MEMBER_ADD' | 'GUILD_MEMBER_REMOVE' | 'GUILD_MEMBER_UPDATE' | 'GUILD_MEMBERS_CHUNK' 
| 'GUILD_ROLE_CREATE' | 'GUILD_ROLE_UPDATE' | 'GUILD_ROLE_DELETE' 
| 'GUILD_SCHEDULED_EVENT_CREATE' | 'GUILD_SCHEDULED_EVENT_UPDATE' | 'GUILD_SCHEDULED_EVENT_DELETE' | 'GUILD_SCHEDULED_EVENT_USER_ADD' | 'GUILD_SCHEDULED_EVENT_USER_REMOVE' 
| 'INTEGRATION_CREATE' | 'INTEGRATION_UPDATE' | 'INTEGRATION_DELETE' 
| 'INTERACTION_CREATE' |'INVITE_CREATE' | 'INVITE_DELETE' 
| 'MESSAGE_CREATE' | 'MESSAGE_UPDATE' | 'MESSAGE_DELETE' | 'MESSAGE_DELETE_BULK' | 'MESSAGE_REACTION_ADD' | 'MESSAGE_REACTION_REMOVE' | 'MESSAGE_REACTION_REMOVE_ALL' | 'MESSAGE_REACTION_REMOVE_EMOJI' 
| 'PRESENCE_UPDATE' | 'STAGE_INSTANCE_CREATE' | 'STAGE_INSTANCE_UPDATE' | 'STAGE_INSTANCE_DELETE' | 'PRESENCE_REPLACE' | 'TYPING_START' | 'USER_UPDATE'  | 'VOICE_STATE_UPDATE' | 'VOICE_SERVER_UPDATE' | 'WEBHOOKS_UPDATE';


export type socketData = {
    op: number,
    d: any,
    s: number | null,
    t: GatewayEvent
}

export type ConsoleMsgType = 'info' | 'warn' | 'error' | 'success' | 'debug';

export const addMsgToConsole = (type: ConsoleMsgType, msg: string) => {
    let shouldPrintDebug = (document.querySelector("input#debugToggle") as HTMLInputElement).checked;
    let consoleDiv = document.querySelector('#console') as HTMLDivElement;
    let newMsg = document.createElement('p');
    newMsg.innerHTML = `[${type.toUpperCase()}] [${new Date().toLocaleTimeString()}] | ${msg}`;
    newMsg.classList.add(type);
    // set color to     color: rgb(0, 0, 255)
    switch (type) {
        case 'info':
            newMsg.style.color = 'rgb(0, 0, 255)';
            break;
        case 'warn':
            newMsg.style.color = 'rgb(238, 255, 0)';
            break;
        case 'error':
            newMsg.style.color = 'rgb(255, 0, 0)';
            break;
        case 'success':
            newMsg.style.color = 'rgb(0, 255, 0)';
            break;
        case 'debug':
            newMsg.style.color = 'rgb(106, 245, 180)';
            break;
    }
    consoleDiv.appendChild(newMsg);

}

export enum gatewayError {
    UNKNOWN_ERROR = 4000,
    UNKNOWN_OPCODE = 4001,
    DECODE_ERROR = 4002,
    NOT_AUTHENTICATED = 4003,
    AUTHENTICATION_FAILED = 4004,
    ALREADY_AUTHENTICATED = 4005,
    INVALID_SEQUENCE = 4007,
    RATE_LIMIT = 4008,
    SESSION_TIMED_OUT = 4009,
    INVALID_SHARD = 4010,
    SHARDING_REQUIRED = 4011,
    INVALID_API_VERSION = 4012,
    INVALID_INTENTS = 4013,
    DISALLOWED_INTENTS = 4014,
}

export const UNRECOVERABLE_GATEWAY_ERRORS = [
    gatewayError.INVALID_SHARD,
    gatewayError.SHARDING_REQUIRED,
    gatewayError.INVALID_API_VERSION, 
    gatewayError.INVALID_INTENTS,
    gatewayError.DISALLOWED_INTENTS,
    gatewayError.AUTHENTICATION_FAILED,
]


export async function sendMessageOverHTTP(channel_id: string, message: string, token: string) {
    let options = {
        host: 'https://discord.com',
        path: '',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };
    try {
        await fetch(options.host + options.path, {
            method: options.method,
            headers: options.headers,
            body: JSON.stringify({
                content: message
            })
        });
    } catch (e) {
        console.log('Error sending message');
        addMsgToConsole('error', 'Error sending message');
    }
}

