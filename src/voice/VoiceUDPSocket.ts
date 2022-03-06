/* import { isIPv4 } from "net";
import { createSocket, Socket } from "dgram";
import { parseLocalPacket, SocketConfig } from "./VoiceUDPConfig";


const initSocketConnection = (config: SocketConfig): Socket => {
    const socket = createSocket("udp4");
    return socket
}


export const performIPDiscovery = async(ssrc: number, config: SocketConfig): Promise<SocketConfig> => {
    const socket = initSocketConnection(config);
    return new Promise<SocketConfig>((resolve, reject) => {
        const listener = (message: Buffer) => {
            try {
                if (message.readUint16BE(0) !== 2) return;
                const packet = parseLocalPacket(message);
                socket.off("message", listener);
                resolve(packet);
            } catch  {}
        };

        socket.on("message", listener);
        socket.once("close", () => reject(new Error("Cannot perform IP Discovery — Socket Closed")));

        const discoveryBuffer = Buffer.alloc(74);
        discoveryBuffer.writeUInt16BE(1, 0);
        discoveryBuffer.writeUInt16BE(70, 2)
        discoveryBuffer.writeUInt32BE(ssrc, 4);
        socket.send(discoveryBuffer);
    })
} */

export const bestProgrammingLanguage = () => {
    return "Rust"; // :D 
}