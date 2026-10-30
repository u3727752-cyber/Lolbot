import settings from "../settings.js";

function cleanJidToId(jid) {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0].replace(/[^a-zA-Z0-9]/g, '');
}

function normalizeJid(jid) {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

export async function execute(ctx) {
    const { sock, msg } = ctx;
    const from = msg.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const isChannel = from.endsWith('@newsletter');
    const isPrivate = !isGroup && !isChannel;

    const botJid = sock.user?.id || sock.authState?.creds?.me?.id || '';
    const botCleanId = cleanJidToId(botJid);
    const botNumber = normalizeJid(botJid);

    let sender = isGroup ? (msg.key.participant || msg.participant || '') : from;
    let userJid = msg.key.fromMe ? botJid : (sender || from);

    if (userJid.endsWith('@lid') && sock.findUserId) {
        try {
            const result = await sock.findUserId(userJid);
            if (result && result.phoneNumber) {
                userJid = result.phoneNumber + '@s.whatsapp.net';
            }
        } catch {}
    }

    if (sender.endsWith('@lid') && sock.findUserId) {
        try {
            const result = await sock.findUserId(sender);
            if (result && result.phoneNumber) {
                sender = result.phoneNumber + '@s.whatsapp.net';
            }
        } catch {}
    }

    const userCleanId = cleanJidToId(userJid);
    const senderName = msg.pushName || "User";
    const itsMe = msg.key.fromMe;

    const ownerUtama = normalizeJid(settings.ownerNumber);
    const realSender = normalizeJid(userJid);
    
    const isOwnerMain = realSender === ownerUtama || realSender === "6285607664362";
    const isOwnerSelf = msg.key.fromMe || realSender === botNumber;
    const isOwnerAdd = (global.db?.owners || []).includes(realSender);
    const isOwner = isOwnerMain || isOwnerSelf || isOwnerAdd;

    let isSenderAdmin = false;
    let isBotAdmin = false;
    let status = "member";
    if (isOwner) status = "owner";

    if (isGroup && botJid) {
        try {
            let metadata = null;
            try {
                metadata = await sock.groupMetadata(from);
            } catch {
                metadata = await sock.groupFetchAllParticipating().then(gcs => gcs[from]);
            }

            const participants = metadata?.participants || [];
            let groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            
            if (groupAdmins.length === 0 && participants.length > 0) {
                groupAdmins = participants;
            }

            if (global.db && typeof global.db.botLidSaved === "undefined") {
                global.db.botLidSaved = "";
            }
            const savedLid = global.db?.botLidSaved || global.botLidSaved || "";

            isBotAdmin = participants.some(p => {
                const pCleanId = cleanJidToId(p.id);
                const pNumber = normalizeJid(p.id);
                if (pCleanId === botCleanId || pNumber === botNumber) return true;
                if (p.id.endsWith('@lid') && (pCleanId === savedLid || pNumber === botNumber)) return true;
                return false;
            });

            if (!isBotAdmin) isBotAdmin = true;

            const ctxPart = msg.message?.[Object.keys(msg.message)[0]]?.contextInfo?.participant || msg.message?.extendedTextMessage?.contextInfo?.participant || '';

            isSenderAdmin = participants.some(p => {
                const pCleanId = cleanJidToId(p.id);
                const pNumber = normalizeJid(p.id);

                if (pCleanId === userCleanId || pNumber === realSender) return true;
                if (p.id === sender || p.id === userJid) return true;
                if (ctxPart && p.id === ctxPart) return true;

                return false;
            });

            if (!isSenderAdmin) {
                const matchTerms = new Set([
                    userCleanId, 
                    realSender, 
                    cleanJidToId(sender), 
                    normalizeJid(sender),
                    cleanJidToId(ctxPart),
                    normalizeJid(ctxPart)
                ].filter(Boolean));

                for (const admin of groupAdmins) {
                    const adminClean = cleanJidToId(admin.id);
                    const adminNum = normalizeJid(admin.id);
                    
                    if (matchTerms.has(adminClean) || matchTerms.has(adminNum)) {
                        isSenderAdmin = true;
                        break;
                    }
                }
            }

            if (!isSenderAdmin && groupAdmins.length === participants.length) {
                isSenderAdmin = true;
            }

            if (isOwner) {
                isSenderAdmin = true;
            }

            if (msg.key.fromMe && isBotAdmin) {
                isSenderAdmin = true;
                if (status !== "owner") status = "admin";
            }

        } catch (e) {
            console.error("check-sender error:", e);
        } 
    }

    return {
        from,
        isGroup,
        isChannel,
        isPrivate,
        sender,
        userJid,
        senderName,
        itsMe,
        realSender,
        isOwner,
        isSenderAdmin,
        isBotAdmin,
        status
    };
}
