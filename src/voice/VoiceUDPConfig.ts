import { Buffer } from "buffer";


export const isIPv4 = (ip: string): boolean => {
    return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip);
}

export interface SocketConfig {
    ip: string;
    port: number;
};

interface KeepAlive {
    value: number;
    timestamp: number;
};

export const parseLocalPacket = (message: Buffer): SocketConfig => {
    const packet = Buffer.from(message);

    const ip = packet.slice(0, 8).toString('utf-8');

    if (!isIPv4(ip)) {
        throw new Error('IP Seems fucked');
    }

    const port = packet.readUInt16BE(packet.length - 2);

    return { ip, port };
}


const KEEP_ALIVE_INTERVAL = 5e3;

const KEEP_ALIVE_LIMIT = 12;

const MAX_KA_COUNTER_VALUE = 2 ** 32 - 1;

const performIPDiscovery = async (ssrc: number): Promise<SocketConfig> => {
    return new Promise((resolve, reject) => {
        const listener = (message: Buffer) => {
            try {
                if (message.readUInt16BE(0) !== 2) {
                    const packet = parseLocalPacket(message);
                    resolve(packet);
                }
            } catch {}

            const discoveryBuffer = Buffer.alloc(74);

            discoveryBuffer.writeUInt16BE(1, 0); 
            discoveryBuffer.writeUInt16BE(70, 2);
            discoveryBuffer.writeUInt32BE(ssrc, 4);

        }
    })
}