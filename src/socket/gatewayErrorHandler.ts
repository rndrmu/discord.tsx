import {
    GatewayEvent,
    socketData,
    addMsgToConsole,
    ConsoleMsgType,
    gatewayError,
    UNRECOVERABLE_GATEWAY_ERRORS
} from "./utils";

export const gatewayErrorHandler = (socket: WebSocket, error: gatewayError) => {
    // resolve error
    addMsgToConsole("error", `[GATEWAY] Gateway Error: ${gatewayError[error]}`);

    // if unrecoverable error, close socket
    if (UNRECOVERABLE_GATEWAY_ERRORS.includes(error)) {
        socket.close();
        addMsgToConsole("error", `Socket closed due to unrecoverable error`);
        addMsgToConsole("error", `Please reload the page and use a correct token this time!`);
    }
}