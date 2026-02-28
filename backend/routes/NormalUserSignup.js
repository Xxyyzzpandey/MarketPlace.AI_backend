import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/users.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, whatsappNumber, password } = req.body;

    // ----------------------------
    // 1️⃣ Basic Validation
    // ----------------------------
    if (!whatsappNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp number and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT secret not configured",
      });
    }

    // ----------------------------
    // 2️⃣ Check Existing User
    // ----------------------------
    const existingUser = await User.findOne({ whatsappNumber });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this WhatsApp number",
      });
    }

    // ----------------------------
    // 3️⃣ Hash Password
    // ----------------------------
    const hashedPassword = await bcrypt.hash(password, 10);

    // ----------------------------
    // 4️⃣ Save User
    // ----------------------------
    const newUser = await User.create({
      firstName,
      lastName,
      whatsappNumber,
      password: hashedPassword,
    });

    // ----------------------------
    // 5️⃣ Generate JWT
    // ----------------------------
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // ----------------------------
    // 6️⃣ Send Response
    // ----------------------------
    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        whatsappNumber: newUser.whatsappNumber,
      },
    });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

export default router;
