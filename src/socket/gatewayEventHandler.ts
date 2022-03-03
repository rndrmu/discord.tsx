import {
    emit
} from "process";
import {
    GatewayEvent,
    socketData,
    addMsgToConsole,
    ConsoleMsgType,
    sendMessageOverHTTP /*  */
} from "./utils";

export const dispatchEventHandler = (socket: WebSocket, payload: socketData) => {
    console.log(payload);
    localStorage.setItem("session_id", payload.d.session_id);
    addMsgToConsole("debug", `[DISPATCH] Received Gateway Event: ${payload.t}`);

    if (payload.t === "MESSAGE_CREATE") {
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
        }
    }
}