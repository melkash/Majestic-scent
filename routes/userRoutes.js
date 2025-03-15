import express from "express";
import { addUser } from "../controllers/userControllers.js";
import { getUserProfil } from "../controllers/userControllers.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";
import { updateUserProfile } from "../controllers/userControllers.js";
import { deleteUser } from "../controllers/userControllers.js";

const router = express.Router();

router.post("/", addUser);
router.get("/", addUser);
router.get("/:id", protect, getUserProfil);
router.put("/:id", protect, updateUserProfile);
router.delete("/:id", protect, deleteUser);

export default router