import { Router } from "express";
import Wholesaler from "../models/sellerModel.js";
import { generateVector } from "../utils/aiHelper.js"; 

const router = Router();

router.post("/add", async (req, res) => {
  try {
    const { businessName, description, whatsappNumber } = req.body;

    const vectorArray = await generateVector(description);

    const newWholesaler = await Wholesaler.create({
      businessName,
      description,
      whatsappNumber,
      embedding: vectorArray,
    });

    res.status(201).json({ success: true, id: newWholesaler._id });
  } catch (error) {
    console.log("error in addseller.js",error.message)
    res.status(500).json({ error: error.message });
  }
});

export default  router;