// lib/06_handler.js
export async function execute(ctx) {
    const { sock, msg, text, btnId, isOnline, chatUpdate, pluginManager, currentHandler } = ctx;

    // Validasi awal
    if (!isOnline || chatUpdate.type !== 'notify') return "stop";
    if (!text && !btnId) return;

    const from = msg.key.remoteJid;
    let fullCommand = "";
    let handled = false; // Flag buat nandain udah diproses

    // ============================================
    // 1. HANDLE BUTTON/LIST
    // ============================================
    if (btnId) {
        fullCommand = btnId.startsWith(".") ? btnId.slice(1) : btnId;
        console.log(`🔘 BUTTON/LIST: ${fullCommand}`);
        
        const command = fullCommand.split(' ')[0].toLowerCase();
        const args = fullCommand.split(' ').slice(1);

        // Cek di plugin
        if (pluginManager?.hasCommand(command)) {
            try {
                await pluginManager.executeCommand(command, sock, msg, { 
                    ...ctx, 
                    command, 
                    args, 
                    text: args.join(' ') 
                });
            } catch (e) {
                console.error(`❌ Error execute button command "${command}":`, e);
            }
            handled = true;
        }

        // Kalo gak ada di plugin, lempar ke currentHandler
        if (!handled && currentHandler) {
            msg._realSender = ctx.realSender;
            msg._isOwner = ctx.isOwner;
            msg._isGroup = ctx.isGroup;
            msg._isChannel = ctx.isChannel;
            msg._isPrivate = ctx.isPrivate;
            msg._isBotAdmin = ctx.isBotAdmin;
            msg._isSenderAdmin = ctx.isSenderAdmin;
            msg.text = fullCommand;
            
            try {
                await currentHandler(sock, msg);
            } catch (e) {
                console.error(`❌ Error currentHandler (button):`, e);
            }
            handled = true;
        }

        return "stop";
    }

    // ============================================
    // 2. HANDLE PESAN TEKS
    // ============================================
    if (!text) return "stop";

    // ============================================
    // 3. HANDLE COMMAND $ (TERMINAL) - PRIORITAS TERTINGGI
    // ============================================
    if (text.startsWith("$") && ctx.isOwner && pluginManager?.hasCommand("$")) {
        const cmd = text.slice(1).trim();
        if (cmd) {
            console.log(`💻 TERMINAL: ${cmd}`);
            try {
                await pluginManager.executeCommand("$", sock, msg, {
                    ...ctx,
                    command: "$",
                    args: [cmd],
                    text: cmd
                });
            } catch (e) {
                console.error(`❌ Error execute terminal command:`, e);
            }
            handled = true;
        }
        return "stop";
    }

    // ============================================
    // 4. HANDLE COMMAND . (DOT)
    // ============================================
    if (text.startsWith(".")) {
        fullCommand = text.slice(1).trim();
        const command = fullCommand.split(' ')[0].toLowerCase();
        const args = fullCommand.split(' ').slice(1);

        // 4a. Cek command di plugin
        if (pluginManager?.hasCommand(command)) {
            console.log(`💬 COMMAND: .${fullCommand}`);
            try {
                await pluginManager.executeCommand(command, sock, msg, {
                    ...ctx,
                    command,
                    args,
                    text: args.join(' ')
                });
            } catch (e) {
                console.error(`❌ Error execute command "${command}":`, e);
            }
            handled = true;
            return "stop";
        }

        // 4b. Cek special: terminal dengan output ke file
        if (!handled && fullCommand.includes(" > ") && ctx.isOwner && pluginManager?.hasCommand("$")) {
            const parts = fullCommand.split(" > ");
            const cmd = parts[0].trim();
            const target = parts[1].trim();
            console.log(`💻 TERMINAL > FILE: ${cmd} → ${target}`);
            try {
                await pluginManager.executeCommand("$", sock, msg, {
                    ...ctx,
                    command: "$",
                    args: [cmd],
                    text: cmd,
                    sendAsFile: true,
                    fileName: target
                });
            } catch (e) {
                console.error(`❌ Error execute terminal (file output):`, e);
            }
            handled = true;
            return "stop";
        }

        // 4c. Fallback: kalo owner, coba jalankan sebagai terminal
        if (!handled && ctx.isOwner && pluginManager?.hasCommand("$")) {
            console.log(`💻 TERMINAL: ${fullCommand}`);
            try {
                await pluginManager.executeCommand("$", sock, msg, {
                    ...ctx,
                    command: "$",
                    args: [fullCommand],
                    text: fullCommand
                });
            } catch (e) {
                console.error(`❌ Error execute terminal (fallback):`, e);
            }
            handled = true;
            return "stop";
        }

        // 4d. Kalo gak ada yang handle, lempar ke currentHandler
        if (!handled && currentHandler) {
            msg._realSender = ctx.realSender;
            msg._isOwner = ctx.isOwner;
            msg._isGroup = ctx.isGroup;
            msg._isChannel = ctx.isChannel;
            msg._isPrivate = ctx.isPrivate;
            msg._isBotAdmin = ctx.isBotAdmin;
            msg._isSenderAdmin = ctx.isSenderAdmin;
            msg.text = fullCommand;
            
            try {
                await currentHandler(sock, msg);
            } catch (e) {
                console.error(`❌ Error currentHandler (text):`, e);
            }
            handled = true;
            return "stop";
        }

        // 4e. Kalo gak ada yang handle sama sekali, kasih reaksi ❌
        if (!handled) {
            try {
                await sock.sendMessage(from, { 
                    react: { text: "❌", key: msg.key } 
                });
            } catch (e) {
                console.error(`❌ Error send reaction:`, e);
            }
        }
        
        return "stop";
    }

    // ============================================
    // 5. PESAN BIASA (BUKAN COMMAND)
    // ============================================
    // Kalo ada currentHandler, terusin ke dia
    if (currentHandler) {
        try {
            await currentHandler(sock, msg);
        } catch (e) {
            console.error(`❌ Error currentHandler (normal message):`, e);
        }
        handled = true;
    }

    return "stop";
}