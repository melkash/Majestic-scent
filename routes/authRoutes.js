import express from "express";
import { requestPasswordReset, 
         resetPassword, 
         valideResetToken, 
         register, 
         login } from "../controllers/authController.js";

const router = express.Router();

// 🛠 Routes Auth
router.post("/register", register);
router.post("/login", login);

// 📌 Route pour demander la réinitialisation du mot de passe
router.post("/forgot-password", requestPasswordReset);

// 📌 Route pour valider le token
router.get("/reset-password", valideResetToken);

// 📌 Route pour réinitialiser le mot de passe avec un token valide
router.post("/reset-password", resetPassword);

export default router