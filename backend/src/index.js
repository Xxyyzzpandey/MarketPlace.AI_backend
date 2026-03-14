import express from "express"
import cors from "cors";
import dotenv from "dotenv";
import {connectDB} from "../database/db.js"
import searchProduct from "../routes/searchProduct.js"
import sellersignupRouter from "../routes/SellersignupRoute.js"
import { getEmbedder } from "../utils/aiHelper.js";
import addSellerRouter from "../routes/addSeller.js"
import whatsappWebhook from "../routes/whatsappWebhook.js"
import normalUsersignin from "../routes/normaluserSignin.js"
import Sellersignin from "../routes/Sellersignin.js";
import userSignup from "../routes/NormalUserSignup.js"
import leadRoute from "../routes/leadRoute.js"

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

connectDB();
try {
    await getEmbedder(); 
  } catch (err) {
    console.error("Failed to pre-warm AI model:", err.message);
  }

app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.url);
  next();
});

app.get("/", async(req , res)=>{console.log("working")});
app.use("/api",searchProduct);
app.use("/seller",sellersignupRouter);
app.use("/addseller",addSellerRouter);
app.use("/whatsappWebhook",whatsappWebhook);
app.use("/seller",Sellersignin);
app.use("/user",normalUsersignin)
app.use("/normalUser",userSignup);
app.use("/leads",leadRoute);


const port=process.env.PORT;
app.listen(port, () => console.log("Server running on port 5000"));