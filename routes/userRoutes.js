import express from "express"
import { addUser } from "../controllers/userControllers.js"

const router = express.Router();

router.post("/", addUser)
router.get("/", addUser)

export default router