import pkg from "@itsliaaa/baileys";
import crypto from "crypto";
import fs from "fs";
import { buildReplyFunction as R, msg } from "../function/global.js";

export const commands = {
    "eval": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);

        const code = o.args.join(" ");
        if (!code) return r(msg.invalidFormat(".eval", ".eval <kode>"));

        try {
            const sock = s;
            const from = o.from;
            const msgObj = m;
            const options = o;

            const generateWAMessageFromContent = pkg.generateWAMessageFromContent;
            const prepareWAMessageMedia = pkg.prepareWAMessageMedia;
            const downloadMediaMessage = pkg.downloadMediaMessage;
            const generateWAMessageContent = pkg.generateWAMessageContent;

            let result = await eval(`(async () => { ${code} })()`);

            if (result === undefined) result = "undefined";
            if (typeof result === "object") result = JSON.stringify(result, null, 2);
            if (typeof result === "string" && result.length > 10000) result = result.substring(0, 10000) + "\n...";

            r(`✅ *Eval*\n\`\`\`${result}\`\`\``);
        } catch (e) {
            r(`❌ *Error*\n\`\`\`${e.message}\`\`\``);
        }
    },

    "exec": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);

        const code = o.args.join(" ");
        if (!code) return r(msg.invalidFormat(".exec", ".exec <cmd>"));

        try {
            const { exec } = await import("child_process");
            const { promisify } = await import("util");
            const { stdout, stderr } = await promisify(exec)(code, { timeout: 30000, maxBuffer: 1024 * 1024 });
            let output = (stdout || "") + (stderr || "");
            if (!output.trim()) output = "(no output)";
            if (output.length > 10000) output = output.substring(0, 10000) + "\n...";

            r(`💻 *Exec*\n\`\`\`${output}\`\`\``);
        } catch (e) {
            r(`❌ *Error*\n\`\`\`${e.message}\`\`\``);
        }
    }
};
