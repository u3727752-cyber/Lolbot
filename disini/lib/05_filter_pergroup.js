import fs from "fs";
import * as yaml from "js-yaml";
import settings from "../settings.js";

export async function execute(ctx) {
    const { sock, msg, from, text, userJid, senderName, isGroup, isSenderAdmin, isOwner } = ctx;

    console.log("📁 FILTER PER-GRUP RUNNING! text:", text);

    if (!text) return;
    if (!isGroup) return;

    const trimmed = text.trim();
    if (/^[.!\/#]/.test(trimmed)) return;

    const lowerText = trimmed.toLowerCase();
    const filterPath = `./db/filter/${from}.yaml`;
    if (!fs.existsSync(filterPath)) return;

    let config;
    try {
        config = yaml.load(fs.readFileSync(filterPath, 'utf8'));
        if (!config?.filters || !config.settings?.enabled) return;
    } catch (e) { return; }

    const senderNumber = userJid.split("@")[0];
    const time = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const date = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const replaceVars = (str) => str
        .replace(/{username}/g, senderName)
        .replace(/{first}/g, senderName.split(" ")[0])
        .replace(/{nomor}/g, senderNumber)
        .replace(/{time}/g, time)
        .replace(/{date}/g, date)
        .replace(/{group}/g, from.split("@")[0])
        .replace(/{botname}/g, settings.ownerName || "Bot")
        .replace(/{owner}/g, settings.ownerName || "Owner");

    const checkPermission = (permission) => {
        if (permission === "admin" && !isSenderAdmin && !isOwner) return false;
        if (permission === "user" && (isSenderAdmin || isOwner)) return false;
        if (permission === "owner" && !isOwner) return false;
        return true;
    };

    const send = async (response, protect) => {
        const finalText = replaceVars(response);
        const options = { quoted: msg, mentions: [userJid] };
        if (protect) {
            options.contextInfo = {
                forwardingScore: 999,
                isForwarded: false,
                mentionedJid: [userJid]
            };
        }
        await sock.sendMessage(from, { text: finalText, mentions: [userJid] }, options);
    };

    for (const [keyword, filter] of Object.entries(config.filters)) {
        if (!checkPermission(filter.permission || "all")) continue;

        const type = filter.type || "mengandung";
        let matched = false;

        if (type === "exact" && lowerText === keyword.toLowerCase()) matched = true;
        else if (type === "prefix" && lowerText.startsWith(keyword.toLowerCase())) matched = true;
        else if (type === "suffix" && lowerText.endsWith(keyword.toLowerCase())) matched = true;
        else if (type === "mengandung" && lowerText.includes(keyword.toLowerCase())) matched = true;
        else if (type === "regex") {
            try { if (new RegExp(keyword, "i").test(lowerText)) matched = true; } catch (e) {}
        }

        if (matched) {
            const responses = Array.isArray(filter.response) ? filter.response : [filter.response];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            await send(randomResponse, filter.protect || false);
            return "stop";
        }
    }
}