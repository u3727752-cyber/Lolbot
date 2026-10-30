import { Button, ButtonV2, Carousel, AIRich, Toolkit } from "../lib/MessageButton.js";

export const commands = {
    "allbtn": async (s, m, o) => {
        const { from } = o;

        // 1. Quick Reply
        const b1 = new Button(s);
        b1.setBody("Quick Reply").addReply("🚀 Klik", "id_1");
        await b1.send(from, { quoted: m });

        // 2. URL + Copy
        const b2 = new Button(s);
        b2.setBody("URL & Copy").addUrl("🌐 Web", "https://junofficial354.my.id").addCopy("📋 Copy", "Nixcode");
        await b2.send(from);

        // 3. Call + Reminder
        const b3 = new Button(s);
        b3.setBody("Call & Reminder").addCall("📞 Call", "6285808630057").addReminder("⏰ Remind", "r1");
        await b3.send(from);

        // 4. Cancel Reminder + Address
        const b4 = new Button(s);
        b4.setBody("Cancel Reminder & Address").addCancelReminder("❌ Batal", "c1").addAddress("📍 Alamat", "a1");
        await b4.send(from);

        // 5. Location
        const b5 = new Button(s);
        b5.setBody("Location").addLocation({ degreesLatitude: -7.9839, degreesLongitude: 112.6214, name: "Malang" });
        await b5.send(from);

        // 6. Single Select
        const b6 = new Button(s);
        b6.setBody("List Menu").addSelection("📋 Pilih").makeSection("Menu").makeRow("", "Item 1", "Desk 1", "i1").makeRow("", "Item 2", "Desk 2", "i2").makeRow("", "Item 3", "Desk 3", "i3");
        await b6.send(from);

        // 7. Limited Time Offer
        const b7 = new Button(s);
        b7.setBody("Flash Sale").setImage("./logo.png").setParams({ limited_time_offer: { text: "Sisa Waktu:", url: "https://junofficial354.my.id", copy_code: "FLASH", expiration_time: Math.floor(Date.now()/1000)+3600 } }).addUrl("⚡ Ambil", "https://junofficial354.my.id", true);
        await b7.send(from);

        // 8. Bottom Sheet
        const b8 = new Button(s);
        b8.setBody("Bottom Sheet").addSelection("📋 Buka").makeSection("Opsi").makeRow("", "A", "", "a").makeRow("", "B", "", "b").setParams({ bottom_sheet: { in_thread_buttons_limit: 3, list_title: "Menu", button_title: "Buka" } });
        await b8.send(from);

        // 9. Tap Target
        const b9 = new Button(s);
        b9.setBody("Tap Target").addUrl("🔗 Link", "https://junofficial354.my.id", false, { tap_target_configuration: { title: "Jun Store", description: "Topup", canonical_url: "https://junofficial354.my.id", domain: "junofficial354.my.id", buttonIndex: 0 } });
        await b9.send(from);

        // 10. Button V2
        const bv2 = new ButtonV2(s);
        bv2.setBody("Button V2").addButton("Klik V2", "v2_1");
        await bv2.send(from);

        // 11. Carousel
        const logoUrl = await Toolkit.toUrl(s, "./logo.png", "image");
        const car = new Carousel(s);
        car.setBody("Carousel").addCard([
            { header: { imageMessage: logoUrl, hasMediaAttachment: true }, body: { text: "Card 1" }, nativeFlowMessage: { buttons: [{ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "Klik", id: "c1" }) }] } },
            { header: { imageMessage: logoUrl, hasMediaAttachment: true }, body: { text: "Card 2" }, nativeFlowMessage: { buttons: [{ name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "Web", url: "https://junofficial354.my.id" }) }] } }
        ]);
        await car.send(from);

        // 12. AI Rich Text
        const ai1 = new AIRich(s);
        ai1.setTitle("AI Text").addText("Teks dengan **bold**");
        await ai1.send(from);

        // 13. AI Code + Suggest
        const ai2 = new AIRich(s);
        ai2.setTitle("AI Code").addCode("js", "console.log(1)").addSuggest(["🔥 Keren", "📋 Menu"]);
        await ai2.send(from);

        // 14. AI Image + Video
        const vtUrl = await Toolkit.toUrl(s, "./vt.mp4", "video");
        const ai3 = new AIRich(s);
        ai3.setTitle("AI Media").addImage(logoUrl).addVideo(vtUrl);
        await ai3.send(from);

        // 15. AI Reels + Product + Post
        const ai4 = new AIRich(s);
        ai4.setTitle("AI Social").addReels([{ username: "junbot", videoUrl: vtUrl, profileIconUrl: logoUrl, thumbnailUrl: logoUrl, likes_count: 5200, view_count: 120000, is_verified: true }]).addProduct([{ title: "Diamond", brand: "JunStore", price: "50k", product_url: "https://junofficial354.my.id", image_url: logoUrl, icon_url: logoUrl }]).addPost([{ title: "Post", username: "jun", profile_url: logoUrl, thumbnail: logoUrl, post_url: "https://instagram.com", is_verified: true }]);
        await ai4.send(from);

        await s.sendMessage(from, { text: "✅ *Semua fitur Nixcode v4.6 terkirim!*" }, { quoted: m });
    }
};