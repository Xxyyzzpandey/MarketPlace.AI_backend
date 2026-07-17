// routes/sellerRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Wholesaler from '../models/sellerModel.js';

const router = express.Router();

router.post('/signin', async (req, res) => {
  try {
    const { whatsappNumber, password } = req.body;

    const seller = await Wholesaler.findOne({ whatsappNumber });
    if (!seller) {
      return res.status(401).json({ success: false, message: "Wholesaler account not found" });
    }

    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: seller._id, role: 'seller' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: seller._id,
        businessName: seller.businessName, 
        whatsappNumber: seller.whatsappNumber,
        role: 'seller', 
        location: seller.location,
        description: seller.description
      },
      message: "Wholesaler login successful"
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;