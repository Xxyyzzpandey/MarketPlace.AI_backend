import { Router } from "express";
import axios from "axios";
import Lead from "../models/leadSchema.js";
import Wholesaler from "../models/sellerModel.js";
import { sendWhatsApp } from "./searchProduct.js";

const router = Router();
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

router.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const value = entry?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    res.sendStatus(200);

    if (!message || message.type !== "text") return;

    const senderNumber = message.from; 
    const messageText = message.text.body.trim().toUpperCase();

    console.log(`Received message: "${messageText}" from ${senderNumber}`);

    if (messageText.startsWith("YES")) {
      const parts = messageText.split(" ");
      const code = parts[1];

      if (!code) {
        return sendWhatsApp(senderNumber, "Please provide the code, e.g., YES A1B2");
      }

      const lead = await Lead.findOne({ shortCode: code }).populate("wholesalerId");

      if (!lead) {
        return sendWhatsApp(senderNumber, "Invalid code or lead expired.");
      }
      const normalize = (n) => n.replace(/[^\d]/g, "");
      if (normalize(lead.wholesalerId.whatsappNumber) !== normalize(senderNumber)) {
        return sendWhatsApp(senderNumber, "Unauthorized. This lead belongs to another seller.");
      }

      lead.status = "accepted";
      lead.acceptedAt = new Date();
      await lead.save();

      const successMessage = `Lead Accepted!\n\nBuyer: ${lead.buyerInfo.name}\nPhone: ${lead.buyerInfo.phone}\nWhatsApp: https://wa.me/${lead.buyerInfo.phone.replace("+", "")}`;

      await sendWhatsApp(senderNumber, successMessage);
      return;
    }

    await sendWhatsApp(senderNumber, "Reply YES [CODE] to accept a lead.");
  } catch (error) {
    console.error("Webhook Error:", error);
  }
});

export default router;