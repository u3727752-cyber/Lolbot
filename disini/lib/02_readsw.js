export async function execute(ctx) {
    const { sock, msg } = ctx;
    const itsMe = msg.key.fromMe;
    const from = msg.key.remoteJid;
    const isStatus = from === 'status@broadcast';

    if (global.db.config?.botStatus === false) return;

    if (!itsMe && !isStatus && global.db.config?.autoTyping) {
        try { await sock.sendPresenceUpdate("composing", from); } catch (e) {}
    }
    if (!itsMe && !isStatus && global.db.config?.autoRead) {
        try { await sock.readMessages([msg.key]); } catch (e) {}
    }
    if (!itsMe && isStatus && global.db.config?.autoReadSW) {
        try { await sock.readMessages([msg.key]); } catch (e) {}
    }
}