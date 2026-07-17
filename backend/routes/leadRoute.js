
import express from "express";
import Lead from "../models/leadSchema.js";
import Wholesaler from "../models/sellerModel.js";
import { authenticateToken } from "../middleware/authmiddleware.js";
import User from "../models/users.js";
import SourcingRequest from "../models/sourcingModel.js"


const router = express.Router();


router.get("/seller", authenticateToken, async (req, res) => {
  try {
    const leads = await Lead.find({ wholesalerId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    if (leads.length === 0) {
      return res.json({ success: true, leads: [] });
    }

    const requestIds = leads.map(lead => lead.requestId);
    const requests = await SourcingRequest.find({ _id: { $in: requestIds } }).lean();

    const requestMap = requests.reduce((acc, req) => {
      acc[req._id.toString()] = req;
      return acc;
    }, {});

    const combinedLeads = leads.map(lead => {
      const request = requestMap[lead.requestId.toString()];
      return {
        ...lead,
        details: request ? {
          item: request.structuredData.item,
          specs: request.structuredData.specifications,
          qty: request.structuredData.quantity
        } : { item: "N/A", specs: "N/A", qty: 0 }
      };
    });
     console.log(combinedLeads)
    res.json({ success: true, leads: combinedLeads });

  } catch (error) {
    console.error("Dashboard Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server error occurred." });
  }
});


router.patch("/:leadId/accept", authenticateToken, async (req, res) => {
  try {

    if (req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Only sellers can accept leads."
      });
    }

    const { leadId } = req.params;

    const lead = await Lead.findOne({
      _id: leadId,
      wholesalerId: req.user.id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found."
      });
    }

    if (lead.status === "accepted") {
      return res.status(400).json({
        success: false,
        message: "Lead already accepted."
      });
    }

    lead.status = "accepted";

    await lead.save();

    res.json({
      success: true,
      message: "Lead accepted. Buyer contact revealed.",
      buyerInfo: lead.buyerInfo
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



router.get("/buyer", authenticateToken, async (req, res) => {
  try {

    const user = await User.findById(req.user.id);

    const leads = await Lead.find({
      "buyerInfo.phone": user.whatsappNumber
    })
      .populate("wholesalerId", "businessName location")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      leads
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
export default router;