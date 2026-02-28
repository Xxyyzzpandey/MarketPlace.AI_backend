import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Wholesaler from "../models/sellerModel.js";
import { generateVector } from "../utils/aiHelper.js"; // Use your existing helper!

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { 
      businessName, 
      whatsappNumber, 
      password, 
      description, 
      country, 
      city 
    } = req.body;

    // 1. Basic Validation
    if (!businessName || !whatsappNumber || !password || !description) {
      return res.status(400).json({ success: false, message: "Required fields missing." });
    }

    // 2. Prevent Duplicates
    const existing = await Wholesaler.findOne({ whatsappNumber });
    if (existing) return res.status(409).json({ success: false, message: "Number already registered." });

    // 3. Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. GENERATE EMBEDDING (Using your specific utility)
    // We match the format you use in searchProduct
    const textToEmbed = `Wholesaler: ${businessName}. Location: ${city}, ${country}. Description: ${description}`;
    const vector = await generateVector(textToEmbed);

    // 5. Create Seller in Database
    const newSeller = await Wholesaler.create({
      businessName,
      whatsappNumber,
      password: hashedPassword,
      description,
      location: { country, city },
      embedding: vector, // Now searchable by your searchProduct route
      isVerified: false
    });

    // 6. Generate JWT for the Zustand Store
    const token = jwt.sign(
      { id: newSeller._id, role: 'seller' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newSeller._id,
        name: newSeller.businessName,
        role: 'seller',
        whatsappNumber: newSeller.whatsappNumber
      }
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;