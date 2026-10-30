import { buildReplyFunction as R, sendReaction, msg } from "../function/global.js";

export const commands = {
    "ping": (s, m, o) => R(s, o.from, m)("🏓 PONG!"),
    "group": (s, m, o) => !o.isGroup ? R(s, o.from, m)(msg.onlyGroup) : R(s, o.from, m)(msg.success),
    "admin": (s, m, o) => !o.isGroup ? R(s, o.from, m)(msg.onlyGroup) : !o.isSenderAdmin && !o.isOwner ? R(s, o.from, m)(msg.onlyAdmin) : R(s, o.from, m)(msg.success),
    "botAdmin": (s, m, o) => !o.isGroup ? R(s, o.from, m)(msg.onlyGroup) : !o.isBotAdmin ? R(s, o.from, m)(msg.botNotAdmin) : R(s, o.from, m)(msg.success),
    "owner": (s, m, o) => !o.isOwner ? R(s, o.from, m)(msg.onlyOwner) : R(s, o.from, m)(msg.success),
    "private": (s, m, o) => o.isGroup ? R(s, o.from, m)(msg.onlyPrivate) : R(s, o.from, m)(msg.success),
    "fmt": (s, m, o) => !o.args[0] ? R(s, o.from, m)(msg.invalidFormat(".fmt", ".fmt <teks>")) : R(s, o.from, m)(`✅ ${o.args.join(" ")}`),
    "wait": (s, m, o) => { sendReaction(s, m.key, "⏳"); setTimeout(() => { sendReaction(s, m.key, "✅"); R(s, o.from, m)(msg.success); }, 2000); },
    "err": (s, m, o) => R(s, o.from, m)(msg.error),
    "no": (s, m, o) => R(s, o.from, m)(msg.notFound)
};