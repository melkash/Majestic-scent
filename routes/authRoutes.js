import express from "express";
import { register, login } from "../controllers/authController.js"
import { requestPasswordReset, resetPassword } from "../controllers/authController.js";

const router = express.Router();

// 🛠 Routes Auth
router.post("/register", register);
router.post("/login", login);

// 📌 Route pour demander la réinitialisation du mot de passe
router.post("/forgot-password", requestPasswordReset);

// 📌 Route pour réinitialiser le mot de passe avec un token valide
router.post("/reset-password/:token", resetPassword);

export default router