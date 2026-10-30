export function execute(ctx) {
    const { msg } = ctx;

    function getContentType(message) {
        if (!message) return null;
        return Object.keys(message)[0] || null;
    }

    function extractText() {
        const msgType = getContentType(msg.message);
        if (msgType === "conversation") return msg.message.conversation;
        if (msgType === "extendedTextMessage") return msg.message.extendedTextMessage.text;
        if (msgType === "imageMessage") return msg.message.imageMessage.caption || "";
        if (msgType === "videoMessage") return msg.message.videoMessage.caption || "";
        if (msgType === "documentMessage") return msg.message.documentMessage.caption || "";
        if (msgType === "audioMessage") return msg.message.audioMessage.caption || "";
        return "";
    }

    function extractButton() {
        if (msg.message?.interactiveResponseMessage) {
            const nativeFlow = msg.message.interactiveResponseMessage.nativeFlowResponseMessage;
            if (nativeFlow?.paramsJson) {
                try {
                    const parsed = JSON.parse(nativeFlow.paramsJson);
                    return parsed.id || nativeFlow.paramsJson || "";
                } catch(e) {
                    return nativeFlow.paramsJson || "";
                }
            }
            return nativeFlow?.name || "";
        }
        if (msg.message?.listResponseMessage) {
            return msg.message.listResponseMessage.singleSelectReply?.selectedRowId || "";
        }
        if (msg.message?.templateButtonReplyMessage) {
            return msg.message.templateButtonReplyMessage.selectedId || "";
        }
        if (msg.message?.buttonsResponseMessage) {
            return msg.message.buttonsResponseMessage.selectedButtonId || "";
        }
        return null;
    }

    const text = extractText();
    const btnId = extractButton();

    return { text, btnId, msgType: getContentType(msg.message) };
}