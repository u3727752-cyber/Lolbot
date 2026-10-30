import { buildReplyFunction as R, msg } from "../function/global.js";

export const commands = {
    "leave": async (s, m, o) => {
        const r = R(s, o.from, m);
        if (!o.isOwner) return r(msg.onlyOwner);
        if (!o.isGroup) return r(msg.onlyGroup);

        try {
            const meta = await s.groupMetadata(o.from);
            const name = meta?.subject || "Grup ini";
            r(`👋 *Keluar dari grup*\n\nBot akan keluar dari *${name}*`);
            setTimeout(async () => { try { await s.groupLeave(o.from); } catch (e) {} }, 2000);
        } catch (e) { console.error(e); r(msg.error); }
    }
};