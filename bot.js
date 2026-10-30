import { 
    makeWASocket, 
    fetchLatestBaileysVersion, 
    useMultiFileAuthState, 
    DisconnectReason, 
    Browsers,
    getContentType,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    makeInMemoryStore,
    delay
} from "@itsliaaa/baileys";
import { Boom } from "@hapi/boom";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname } from "path";
import settings from "./settings.js";
import * as yaml from 'js-yaml';
import pino from "pino";
import moment from "moment-timezone";
import express from "express";
import pluginManager from "./main.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PHONE_NUMBER = settings.pairingNumber;
const SESSION_DIR = "./session";
const HANDLER_FILE = path.join(__dirname, "junn.js");
const LIB_DIR = "./lib";
const STORE_PATH = "./store.json";

// ===== RENDER KEEP-ALIVE SERVER =====
const app = express();
app.get('/', (req,res) => {
    res.send(`<h1>JUN-MD Bot Alive ✅</h1><p>Phone: ${PHONE_NUMBER}</p><p>${new Date().toISOString()}</p>`);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌐 Keep-alive server: http://0.0.0.0:${PORT}`));

// ===== GLOBAL DB =====
if (!global.db) {
    global.db = {
        users: {},
        data: { welcome: {}, groupStatus: {} },
        owners: [],
        config: { isSelf: false, botStatus: true, autoRead: false, autoTyping: true, autoReadSW: false },
        upswQueue: {}
    };
}

// ===== SETTINGS =====
if (!fs.existsSync("./db")) fs.mkdirSync("./db", { recursive: true });
const SETTINGS_FILE = "./db/settings.json";
if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({
        autoread: false, autotyping: false, autoreadsw: false, botStatus: true, isSelf: false
    }, null, 2));
}
try {
    const settingsData = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
    global.db.config.isSelf = settingsData.isSelf || false;
    global.db.config.botStatus = settingsData.botStatus !== false;
    global.db.config.autoRead = settingsData.autoread || false;
    global.db.config.autoTyping = settingsData.autotyping || false;
    global.db.config.autoReadSW = settingsData.autoreadsw || false;
} catch (e) {}

// ===== ANTILINK TEMPLATE =====
if (!fs.existsSync("./db/antilink/template.json")) {
    fs.mkdirSync("./db/antilink", { recursive: true });
    fs.writeFileSync("./db/antilink/template.json", JSON.stringify({ 
        gc: "chat.whatsapp.com", ch: "whatsapp.com/channel", tt: "tiktok.com", ig: "instagram.com", 
        yt: "youtube.com|youtu.be", dc: "discord.gg|discord.com", fb: "facebook.com|fb.me", 
        tw: "twitter.com|x.com", web: "https?://", bk: "bokep|sex|porn|xxx" 
    }, null, 2));
}

const color = {
    cyan: "\x1b[36m", green: "\x1b[32m", reset: "\x1b[0m", red: "\x1b[31m", yellow: "\x1b[33m"
};

let currentHandler = null;
let isOnline = false;
let reconnectAttempts = 0;
let isResetting = false;
let loadingInterval = null;
const firstTimeUsers = new Set();

const loadHandler = async () => {
    try {
        const { default: handler } = await import(`${pathToFileURL(HANDLER_FILE).href}?t=${Date.now()}`);
        currentHandler = handler;
    } catch (e) {}
};
if (fs.existsSync(HANDLER_FILE)) {
    loadHandler();
    let lastModified = fs.statSync(HANDLER_FILE).mtimeMs;
    setInterval(async () => {
        try {
            const stats = fs.statSync(HANDLER_FILE);
            if (stats.mtimeMs > lastModified) {
                lastModified = stats.mtimeMs;
                const modulePath = pathToFileURL(HANDLER_FILE).href;
                const { default: newHandler } = await import(`${modulePath}?t=${Date.now()}`);
                currentHandler = newHandler;
            }
        } catch (error) {}
    }, 2000);
}

const loadLib = async () => {
    const handlers = [];
    if (fs.existsSync(LIB_DIR)) {
        const files = fs.readdirSync(LIB_DIR).filter(f => f.endsWith(".js")).sort();
        for (const file of files) {
            try {
                const mod = await import(`${pathToFileURL(path.join(LIB_DIR, file)).href}?t=${Date.now()}`);
                handlers.push({ name: file, ...mod });
            } catch (e) {}
        }
    }
    return handlers;
};

const clearInvalidSession = () => {
    try {
        if (fs.existsSync(SESSION_DIR)) {
            const files = fs.readdirSync(SESSION_DIR);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(SESSION_DIR, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    if (content === '{}' || content.includes('null')) fs.unlinkSync(filePath);
                }
            }
        }
    } catch (e) {}
};

const resetAllSession = () => {
    try {
        if (fs.existsSync(SESSION_DIR)) fs.rmSync(SESSION_DIR, { recursive: true, force: true });
        fs.mkdirSync(SESSION_DIR, { recursive: true });
        reconnectAttempts = 0; isResetting = false;
    } catch (e) {}
};

const startLoading = () => {
    if (loadingInterval) clearInterval(loadingInterval);
    const spinner = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
    let idx = 0;
    loadingInterval = setInterval(() => {
        process.stdout.write(`\r${color.cyan}${spinner[idx++ % spinner.length]} Menghubungkan ke WhatsApp...${color.reset}`);
    }, 100);
};
const stopLoading = () => {
    if (loadingInterval) {
        clearInterval(loadingInterval);
        loadingInterval = null;
        process.stdout.write('\r\x1b[2K');
    }
};

async function startBot() {
    if (isResetting) return;
    if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
    clearInvalidSession();
    let libHandlers = [];
    try { libHandlers = await loadLib(); } catch (e) {}
    let state, saveCreds, version, sock;
    try {
        const authResult = await useMultiFileAuthState(SESSION_DIR);
        state = authResult.state; saveCreds = authResult.saveCreds;
        const versionResult = await fetchLatestBaileysVersion();
        version = versionResult.version;
    } catch (err) {
        if (err.message && (err.message.includes("Bad MAC") || err.message.includes("corrupt"))) {
            resetAllSession(); setTimeout(() => startBot(), 2000);
        }
        return;
    }
    const store = makeInMemoryStore({ logger: pino({ level: 'silent' }) });
    try {
        sock = makeWASocket({
            version, auth: state, logger: pino({ level: 'silent' }),
            printQRInTerminal: false, browser: Browsers.ubuntu("Chrome"),
            markOnlineOnConnect: true, generateHighQualityLinkPreview: false, syncFullHistory: false,
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || { conversation: '' };
                }
                return { conversation: '' };
            },
            retryRequest: async (err, attempt) => {
                if (err.message && err.message.includes('Bad MAC')) return attempt < 2;
                return attempt < 1;
            }
        });
        store.bind(sock.ev);
        if (fs.existsSync(STORE_PATH)) store.readFromFile(STORE_PATH);
        setInterval(() => { store.writeToFile(STORE_PATH); }, 180000);
    } catch (err) {
        console.error("❌ Error creating socket:", err.message);
        setTimeout(() => startBot(), 3000); return;
    }

    const isRegistered = sock.authState.creds.registered;
    console.log(`📱 Registered: ${isRegistered}`);
    if (!isRegistered) {
        const phoneNumber = PHONE_NUMBER.replace(/\D/g, "");
        if (phoneNumber) {
            console.log(`📱 Requesting pairing code for: ${phoneNumber}`);
            try {
                await delay(2000);
                let code = await sock.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                console.log(`\n${color.yellow}📱 Pairing Code: ${color.reset}${color.cyan}${code}${color.reset}`);
                console.log(`📱 Masukkan kode di WhatsApp → Perangkat tertaut → Tautkan perangkat\n`);
            } catch (err) { console.error(`❌ Gagal request pairing code:`, err.message); }
        } else { console.error(`❌ Nomor HP tidak valid di settings.js`); }
    } else { console.log(`✅ Sudah terdaftar, langsung connect...`); }

    sock.ev.on("decryption.error", () => {});
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        const errorMsg = lastDisconnect?.error?.message || "";
        if (connection === "close") {
            stopLoading(); isOnline = false;
            const statusCode = lastDisconnect?.error instanceof Boom ? lastDisconnect.error.output?.statusCode : 0;
            console.log(`❌ Disconnected: ${errorMsg || statusCode}`);
            if (errorMsg.includes("Bad MAC") || errorMsg.includes("corrupt") || errorMsg.includes("MAC")) {
                isResetting = true; resetAllSession();
                setTimeout(() => { isResetting = false; startBot(); }, 2000); return;
            }
            if (statusCode !== DisconnectReason.loggedOut) {
                reconnectAttempts++;
                const delayTime = Math.min(3000 * reconnectAttempts, 15000);
                console.log(`🔄 Reconnecting in ${delayTime/1000}s (attempt ${reconnectAttempts})...`);
                setTimeout(() => { startLoading(); startBot(); }, delayTime);
            } else {
                console.log(`🔑 Logged out, resetting session...`); resetAllSession(); startBot();
            }
        } else if (connection === "open") {
            stopLoading(); reconnectAttempts = 0; isOnline = true;
            console.log(`\n${color.green}✅ Bot Online${color.reset}`);
            console.log(`${color.green}✅ Siap menerima pesan!${color.reset}\n`);
        } else if (connection === "connecting") {
            if (!isOnline && !loadingInterval) startLoading();
        }
    });

    sock.ev.on("creds.update", () => { saveCreds(); console.log(`💾 Creds saved`); });

    sock.ev.on("messages.upsert", async (chatUpdate) => {
        if (!isOnline || chatUpdate.type !== 'notify') return;
        try {
            const msg = chatUpdate.messages[0];
            if (!msg.message) return;
            const from = msg.key.remoteJid;
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderName = msg.pushName || "Unknown";
            const isGroup = from.endsWith("@g.us");
            const chatType = isGroup ? "GROUP" : "PRIVATE";
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || "";
            const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            const c = { r: "\x1b[0m", c: "\x1b[36m", y: "\x1b[33m", g: "\x1b[32m", m: "\x1b[35m", w: "\x1b[37m", d: "\x1b[2m" };
            const logBox = `\n${c.c}╔══════════════════════════════════╗\n${c.c}║${c.y}  📨 INCOMING${c.c}                       ║\n${c.c}╠══════════════════════════════════╣\n${c.c}║${c.r}  🕐 ${c.g}${time}${c.c}                    ║\n${c.c}║${c.r}  📱 ${c.m}${chatType.padEnd(28)}${c.c}║\n${c.c}║${c.r}  👤 ${c.y}${senderName.substring(0, 22).padEnd(22)}${c.c}║\n${c.c}║${c.r}  🆔 ${c.d}${sender.substring(0, 22).padEnd(22)}${c.c}║\n` + (text ? `${c.c}║${c.r}  💬 ${c.w}${text.substring(0, 24).padEnd(24)}${c.c}║\n` : "") + `${c.c}╚══════════════════════════════════╝${c.r}\n`;
            process.stdout.write(logBox);
            if (global.db.config.autoRead) await sock.readMessages([msg.key]);
            if (global.db.config.autoTyping) {
                sock.sendPresenceUpdate('composing', from);
                setTimeout(() => { sock.sendPresenceUpdate('paused', from); }, 2000);
            }
            let ctx = { sock, msg, chatUpdate, isOnline, pluginManager, currentHandler, firstTimeUsers, store, text, from, sender, senderName, isGroup, chatType };
            for (const handler of libHandlers) {
                if (handler.execute) {
                    try {
                        const result = await handler.execute(ctx);
                        if (result === "stop") break;
                        if (result && typeof result === "object") ctx = { ...ctx, ...result };
                    } catch (e) {}
                }
            }
            if (currentHandler && currentHandler.execute) {
                try { await currentHandler.execute(ctx); } catch (e) {}
            }
        } catch (e) {}
    });
}

console.log(`\n${color.cyan}🚀 Starting JUN-MD Bot...${color.reset}`);
console.log(`📱 Phone: ${PHONE_NUMBER}\n`);
startBot();
