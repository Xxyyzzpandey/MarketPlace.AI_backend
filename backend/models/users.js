import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  whatsappNumber: { type: String, required: true, unique: true }, 
  password: { type: String, required: true },
  role: { type: String, default: 'buyer' }, 
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);