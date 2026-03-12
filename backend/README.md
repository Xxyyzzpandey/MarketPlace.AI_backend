# ⚙️ Marketplace.ai - Backend API
### The Intelligence Engine for AI Matching & WhatsApp Automation

This is the core API for Marketplace.ai. It handles vector-based supplier matching, JWT authentication for multiple user roles, and real-time lead delivery via the WhatsApp Business API.

---

## 🚀 Core Technologies

- **Runtime:** Node.js & Express
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JSON Web Tokens (JWT) & Bcrypt.js
- **Messaging:** Meta WhatsApp Business API
- **AI Logic:** Natural Language Processing for product-wholesaler matching

---

## 🛠️ Installation & Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance
- Meta Developer Account (for WhatsApp Business API)

### 2. Clone and Install
```bash
git clone [https://github.com/yourusername/marketplace-ai-backend.git](https://github.com/yourusername/marketplace-ai-backend.git)
cd marketplace-ai-backend
npm install

# --- Server Settings ---
PORT=5000
NODE_ENV=development

# --- Security ---
# Secret key used to sign JWT tokens (make this long and complex)
JWT_SECRET=your_jwt_random_secret_string_here

# --- Database ---
# Your MongoDB connection string (Atlas or Local)
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/marketplace

# --- WhatsApp Business API ---
# The Permanent Access Token from Meta Developer Console
WHATSAPP_TOKEN=your_meta_access_token

# The Phone Number ID (Found in WhatsApp > Getting Started)
WHATSAPP_PHONE_ID=your_phone_id

# Current API Version (e.g., v20.0)
WHATSAPP_VERSION=v20.0

# A custom string you create to verify your Webhook with Meta
WHATSAPP_VERIFY_TOKEN=my_secure_verify_token_123