
import Groq from "groq-sdk";
import { Router } from "express";
import Wholesaler from "../models/sellerModel.js";
import Lead from "../models/leadSchema.js";
import { generateVector } from "../utils/aiHelper.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import crypto from "crypto"; 
import SourcingRequest from "../models/sourcingModel.js"

dotenv.config();

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper to generate a code like "A7D2"
const generateShortCode = () => crypto.randomBytes(2).toString('hex').toUpperCase();

const sendWhatsApp = async (to, body) => {
  // Integrate your Twilio/AISensy/Meta API here
  console.log(`[WhatsApp Outgoing] To: ${to}, Message: ${body}`);
};

router.post("/searchProduct", async (req, res) => {
  try {
    const { userPrompt, buyerInfo } = req.body;
    console.log(req.body);
    if (!buyerInfo || !buyerInfo.id) {
        return res.status(400).json({ 
            success: false, 
            message: "Buyer information with a valid ID is required." 
        });
    }

    // 1. Parse + Embed
    const [parseResult, userVector] = await Promise.all([
      groq.chat.completions.create({
        messages: [{ role: "user", content: `Extract JSON: {"category": "string", "item": "string", "quantity": number, "specifications": "string"}. User request: "${userPrompt}"` }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      }),
      generateVector(userPrompt)
    ]);
     console.log("parsed result by llm ",parseResult.choices[0].message)
    const specs = JSON.parse(parseResult.choices[0].message.content);

    // 2. CREATE REQUEST (Source of Truth)
    // This allows me to track buyer history and request status easily
    const newRequest = await SourcingRequest.create({
      buyerId: buyerInfo.id,
      originalPrompt: userPrompt,
      structuredData: specs, // Stores the item, qty, and specs
      status: 'notified'
    });

    // 3. Vector Search
    const potentialSuppliers = await Wholesaler.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: userVector,
          numCandidates: 20,
          limit: 10,
        },
      },
    ]);

    if (!potentialSuppliers.length) return res.status(200).json({ success: false, message: "No match." });

    // 4. Groq Ranking
    const rankingPrompt = `Buyer needs: ${JSON.stringify(specs)}. Suppliers: ${JSON.stringify(potentialSuppliers.map(s => ({id: s._id, desc: s.description}))) }. Return ONLY a JSON array of top 3 supplier IDs.`;
    const rankingResult = await groq.chat.completions.create({
      messages: [{ role: "user", content: rankingPrompt }],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const finalIds = Object.values(JSON.parse(rankingResult.choices[0].message.content))[0];

    // 5. Create Leads referencing the newRequest._id
    await Promise.all(finalIds.map(async (id) => {
      const seller = await Wholesaler.findById(id);
      if (!seller) return;

      const shortCode = generateShortCode();

      await Lead.create({ 
        buyerInfo, 
        wholesalerId: id, 
        requestId: newRequest._id, // Link to the SourcingRequest
        shortCode, 
        status: "pending" 
      });

      const message = `*New Lead Alert!* 📦\n\nHello ${seller.businessName}, a buyer wants: *${specs.item}*.\n\nReply *YES ${shortCode}* to accept.`;
      await sendWhatsApp(seller.whatsappNumber, message);
    }));

    return res.json({ 
      success: true, 
      requestId: newRequest._id, 
      message: "Leads generated and sellers notified." 
    });

  } catch (error) {
    console.error("Route Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;