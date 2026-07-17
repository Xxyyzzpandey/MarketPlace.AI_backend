import mongoose from "mongoose";


const SourcingRequestSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalPrompt: { type: String, required: true }, 
    structuredData: {
    item: String,
    category: String,
    quantity: Number,
    specifications: String,
    urgency: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
  },
  
  status: { 
    type: String, 
    enum: ['searching', 'notified', 'completed', 'expired'], 
    default: 'searching' 
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("SourcingRequest", SourcingRequestSchema);