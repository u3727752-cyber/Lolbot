import fs from "fs";
import * as yaml from "js-yaml";
import settings from "../settings.js";

export async function execute(ctx) {
    const { sock, msg, from, text, userJid, senderName, isGroup } = ctx;
    
    console.log("🌍 RESPON GLOBAL RUNNING! text:", text);
    
    if (!text) return;
    if (msg.key.fromMe) return;

    const lowerText = text.toLowerCase().trim();

    let config;
    try {
        const raw = fs.readFileSync('./db/yaml/respon.yaml', 'utf8');
        config = yaml.load(raw);
        if (!config?.keywords) return;
    } catch (e) {
        console.error("❌ YAML Error:", e.message);
        return;
    }

    if (isGroup && !config.settings?.reply_in_group && lowerText !== "bot") return;

    const senderNumber = userJid.split("@")[0];
    const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const date = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const replaceVars = (str) => str
        .replace(/{username}/g, senderName)
        .replace(/{nomor}/g, senderNumber) 
        .replace(/{time}/g, time)
        .replace(/{date}/g, date)
        .replace(/{group}/g, isGroup ? from.split("@")[0] : "Private Chat")
        .replace(/{botname}/g, settings.ownerName || "Bot")
        .replace(/{owner}/g, settings.ownerName || "Owner");

    const checkAndSend = async (keyword, response) => {
        const finalResponse = replaceVars(response);
        await sock.sendMessage(from, {
            text: finalResponse,
            mentions: [userJid]
        }, { quoted: msg });
    };

    // exact - sama persis
    const exacts = config.keywords?.exact || {};
    for (const [key, val] of Object.entries(exacts)) {
        if (lowerText === key.toLowerCase()) {
            await checkAndSend(key, val);
            return "stop";
        }
    }

    // partial - mengandung
    const partials = config.keywords?.partial || {};
    for (const [key, val] of Object.entries(partials)) {
        if (lowerText.includes(key.toLowerCase())) {
            await checkAndSend(key, val);
            return "stop";
        }
    }

    // prefix - diawali
    const prefixes = config.keywords?.prefix || {};
    for (const [key, val] of Object.entries(prefixes)) {
        if (lowerText.startsWith(key.toLowerCase())) {
            await checkAndSend(key, val);
            return "stop";
        }
    }

    // suffix - diakhiri
    const suffixes = config.keywords?.suffix || {};
    for (const [key, val] of Object.entries(suffixes)) {
        if (lowerText.endsWith(key.toLowerCase())) {
            await checkAndSend(key, val);
            return "stop";
        }
    }

    // regex
    const regexes = config.keywords?.regex || {};
    for (const [key, val] of Object.entries(regexes)) {
        try {
            const regex = new RegExp(key, "i");
            if (regex.test(lowerText)) {
                await checkAndSend(key, val);
                return "stop";
            }
        } catch (e) {}
    }
}