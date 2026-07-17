import axios from 'axios';

const WHATSAPP_URL = `https://graph.facebook.com/${process.env.WHATSAPP_VERSION}/${process.env.WHATSAPP_PHONE_ID}/messages`;

export const sendWhatsAppMessage = async (to, templateName, components = []) => {
  try {
    const response = await axios.post(
      WHATSAPP_URL,
      {
        messaging_product: "whatsapp",
        to: to, 
        type: "template",
        template: {
          name: templateName,
          language: { code: "en_US" },
          components: components, 
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("WhatsApp Error:", error.response?.data || error.message);
    throw error;
  }
};