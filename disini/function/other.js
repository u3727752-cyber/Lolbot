import pkg from "@itsliaaa/baileys";
const { 
    makeWASocket, 
    fetchLatestBaileysVersion, 
    makeInMemoryStore, 
    useMultiFileAuthState, 
    DisconnectReason, 
    Browsers, 
    makeCacheableSignalKeyStore,
    downloadMediaMessage, 
    downloadContentFromMessage, 
    generateWAMessageContent, 
    generateWAMessageFromContent, 
    prepareWAMessageMedia, 
    generateWAMessage, 
    generateForwardMessageContent,
    getAggregateVotesInPollMessage,
    decodeJid, 
    jidDecode, 
    jidNormalizedUser, 
    areJidsSameUser, 
    extractMessageContent, 
    getContentType, 
    getDevice, 
    isJidGroup, 
    isJidStatusBroadcast, 
    isJidUser,
    proto, 
    WA_DEFAULT_EPHEMERAL, 
    delay, 
    WA_PROTO_VERSION, 
    S_WHATSAPP_NET, 
    WAMessageStatus, 
    WAMessageStubType,
    updateMessageWithReceipt,
    updateMessageWithReaction,
    parseInternalMessage,
    encryptSignalProto,
    decryptSignalProto,
    computeMessageYourself,
    generateMessageID,
    WA_MESSAGE_STUB_TYPES,
    readMessageHistory,
    historyReceipt,
    onUnexpectedError,
    unixTimestampSeconds,
    getHistoryMsg,
    transformCiphertext,
    useSingleFileAuthState
} = pkg;

const createWAMsg = generateWAMessageFromContent;
const getDeviceType = getDevice;

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from 'url';
import pino from "pino";
import { Boom } from "@hapi/boom";
import settings from "../settings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLONES_DIR = path.join(__dirname, "../clones");
const DB_PATH = path.join(__dirname, "../db.json");

if (!fs.existsSync(CLONES_DIR)) fs.mkdirSync(CLONES_DIR, { recursive: true });

if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ bots: {}, global: { prefix: ".", ownerNumber: settings.ownerNumber, routerNumber: settings.routerNumber } }, null, 2));
}

export const clones = new Map();

const color = {
    green: (text) => `\x1b[1;32m${text}\x1b[0m`,
    red: (text) => `\x1b[1;31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[1;33m${text}\x1b[0m`,
    blue: (text) => `\x1b[1;34m${text}\x1b[0m`,
    cyan: (text) => `\x1b[1;36m${text}\x1b[0m`,
    magenta: (text) => `\x1b[1;35m${text}\x1b[0m`,
    white: (text) => `\x1b[1;37m${text}\x1b[0m`
};

function readDB() {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function logEvent(number, action, status, type = 'blue') {
    const time = new Date().toLocaleTimeString();
    console.log(`${color.cyan(`[${time}]`)} ${color.magenta(`[${number}]`)} ${color[type](action.padEnd(12))} ${status ? color.white(`-> ${status}`) : ""}`);
}

function deleteSession(number) {
    const cloneDir = path.join(CLONES_DIR, number);
    if (fs.existsSync(cloneDir)) {
        const sessionDir = path.join(cloneDir, "session");
        if (fs.existsSync(sessionDir)) {
            const files = fs.readdirSync(sessionDir);
            for (const file of files) {
                if (file !== 'creds.json') {
                    fs.unlinkSync(path.join(sessionDir, file));
                }
            }
        }
        logEvent(number, "FS_SYSTEM", "TRASH PURGED", "red");
        return true;
    }
    return false;
}

const DEFAULT_CONFIG = {
    autoRead: false,
    autoTyping: false,
    botStatus: true,
    isSelf: false,
    online: false,
    status: "pending",
    createdAt: null,
    connectedAt: null
};

function getDefaultConfig(number) {
    return {
        number: number,
        ...DEFAULT_CONFIG,
        createdAt: Date.now()
    };
}

export const updateCloneConfig = (number, newData) => {
    try {
        const db = readDB();
        let existing = db.bots[number] || getDefaultConfig(number);
        const updated = { ...existing, ...newData };
        db.bots[number] = updated;
        writeDB(db);
        if (clones.has(number)) {
            clones.get(number).config = updated;
        }
        return true;
    } catch (err) {
        return false;
    }
};

export async function startClone(number, mainSock, from) {
    const cloneDir = path.join(CLONES_DIR, number);
    const authDir = path.join(cloneDir, "session");
    
    if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
    
    let config = getDefaultConfig(number);
    const db = readDB();
    if (db.bots[number]) {
        config = { ...config, ...db.bots[number] };
    }
    config.status = "starting";
    updateCloneConfig(number, { status: "starting", createdAt: config.createdAt });
    
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();
    
    logEvent(number, "CORE_START", "STABILIZING ENGINE", "yellow");

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
        },
        printQRInTerminal: false,
        browser: Browsers.ubuntu("Chrome"),
        logger: pino({ level: "fatal" }),
        markOnlineOnConnect: config.online,
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        generateHighQualityLinkPreview: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        const error = lastDisconnect?.error;
        const msg = String(error || "");

        if (msg.includes('Bad MAC') || msg.includes('Session error') || msg.includes('Stream error')) {
            deleteSession(number);
            setTimeout(() => startClone(number, mainSock, from), 2000);
            return;
        }

        if (connection === "open") {
            config.status = "connected";
            config.connectedAt = Date.now();
            updateCloneConfig(number, { status: "connected", connectedAt: config.connectedAt });
            clones.set(number, { sock, config });
            logEvent(number, "NETWORK", "ESTABLISHED", "green");
            sock.sendPresenceUpdate("available");
            if (from) await mainSock.sendMessage(from, { text: `✅ *CLONE ONLINE*\nNumber: ${number}\nPing: Stable` });
        }

        if (connection === "close") {
            const reason = new Boom(error)?.output?.statusCode;
            clones.delete(number);
            if (reason === DisconnectReason.loggedOut) {
                const clonePath = path.join(CLONES_DIR, number);
                if (fs.existsSync(clonePath)) fs.rmSync(clonePath, { recursive: true, force: true });
                const db = readDB();
                delete db.bots[number];
                writeDB(db);
                if (from) await mainSock.sendMessage(from, { text: `⚠️ *SESSION LOGOUT*\nNumber: ${number}` });
            } else {
                logEvent(number, "RECONNECT", "RETRYING CONNECTION", "yellow");
                setTimeout(() => startClone(number, mainSock, from), 5000);
            }
        }
    });

    sock.ev.on("messages.upsert", async (chatUpdate) => {
        if (chatUpdate.type !== 'notify') return;
        try {
            const handlerPath = path.join(__dirname, "../junn.js");
            const { default: handler } = await import(`${pathToFileURL(handlerPath).href}?update=${Date.now()}`);
            
            for (const m of chatUpdate.messages) {
                if (!m.message) continue;
                
                const botNum = number;
                const cloneData = clones.get(botNum);
                if (!cloneData) continue;
                
                if (cloneData.config.autoRead && !m.key.fromMe) await sock.readMessages([m.key]);

                const sender = m.key.fromMe ? botNum : (m.key.participant || m.key.remoteJid || "").replace(/[^0-9]/g, "");
                const isOwner = sender === settings.ownerNumber || sender === settings.routerNumber;
                
                if (cloneData.config.isSelf && !isOwner && !m.key.fromMe) continue;
                if (!cloneData.config.botStatus && !isOwner) continue;

                if (typeof handler === 'function') {
                    handler(sock, m).catch(err => logEvent(number, "HANDLER_ERR", err.message, "red"));
                } else if (handler.handler) {
                    handler.handler(sock, m).catch(err => logEvent(number, "HANDLER_ERR", err.message, "red"));
                }
            }
        } catch (err) {
            logEvent(number, "RUNTIME_ERR", err.message, "red");
        }
    });

    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(number.replace(/[^0-9]/g, ""));
                const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
                logEvent(number, "SECURITY", `PAIRING_CODE: ${formattedCode}`, "cyan");
                if (from) await mainSock.sendMessage(from, { text: `🔐 *PAIRING CODE*\n\nNumber: ${number}\nCode: *${formattedCode}*` });
            } catch (err) {}
        }, 5000);
    }
    return sock;
}

export async function logoutClone(number, from, mainSock) {
    const clone = clones.get(number);
    if (clone) {
        try {
            await clone.sock.logout();
            clones.delete(number);
            const clonePath = path.join(CLONES_DIR, number);
            if (fs.existsSync(clonePath)) fs.rmSync(clonePath, { recursive: true, force: true });
            const db = readDB();
            delete db.bots[number];
            writeDB(db);
            return true;
        } catch (err) { return false; }
    }
    return false;
}

export function getAllClones() {
    return Array.from(clones).map(([number, data]) => ({
        number,
        status: data.config?.status,
        uptime: data.config?.connectedAt ? Date.now() - data.config.connectedAt : 0
    }));
}
