import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";

async function connectToWhatsapp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({ auth: state });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    console.log("creds.update");

    if (connection === "close") {
      const code = lastDisconnect?.error?.output?.statusCode;
      const reasonText = DisconnectReason[code] || "Unknown";

      console.log(`Connection closed [${reasonText}]`);
      console.log( 'code', code)
      if (code !== DisconnectReason.loggedOut) {
        console.log(`Attempting to reconnect...`);
        await connectToWhatsapp(); // retry
      }
    }

    if (qr) {
      console.log(await QRCode.toString(qr, { type: "terminal" }));
    }
  });

  sock.ev.on("creds.update", () => {
    console.log("creds.update");
    saveCreds();
  });

  sock.ev.on("messages.upsert", ({ type, messages }) => {
    console.log("messages.upsert");

    if (type == "notify") {
      for (const messageData of messages) {
        console.log(messageData.message.conversation);
      }
    } else {
      // old already seen / handled messages
      // handle them however you want to
    }
  });
}

connectToWhatsapp();
