import express from "express";
import { addUser } from "../controllers/userControllers.js";
import { getAllUser } from "../controllers/userControllers.js";
import { getUserProfil } from "../controllers/userControllers.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";
import { updateUserProfile } from "../controllers/userControllers.js";
import { deleteUser } from "../controllers/userControllers.js";

const router = express.Router();

// ✅ Seul un admin peut voir tous les utilisateurs
router.get("/", protect, isAdmin, getAllUser);

// ✅ Seul un admin peut ajouter un utilisateur
router.post("/", protect, isAdmin, addUser);

// ✅ Un utilisateur peut voir son propre profil, un admin peut voir tous les profils
router.get("/:id", protect, getUserProfil);

// ✅ Un utilisateur peut mettre à jour son propre profil, un admin peut modifier n'importe quel utilisateur
router.put("/:id", protect, updateUserProfile);

// ✅ Un utilisateur peut supprimer son propre compte, un admin peut supprimer n'importe quel utilisateur
router.delete("/:id", protect, deleteUser);

export default router