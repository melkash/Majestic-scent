import SibApiV3Sdk from "sib-api-v3-sdk";
import dotenv from "dotenv";

dotenv.config();

// 🔥 Configurer Brevo avec l'API Key
const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

// 📩 Fonction pour envoyer un email
export const sendEmail = async (to, subject, text, html) => {
       const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

       const emailData = {
       sender : { email: process.env.EMAIL_FROM},
       to: [{ email: to }],
       subject: subject,
       textContent: text,
       htmlContent: html,
    };

    try {

    await apiInstance.sendTransacEmail(emailData);
        console.log("✅ Email envoyé avec succès ! ");
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'email :", error.response ? error.response.body : error.message);
    }
};