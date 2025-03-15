import express from "express";
import {createOrder,
        getAllOrders,
        getOrderById,
        updateOrderStatus,
        deleteOrder,
        getUserOrders,
        simulatePayment,
        refundOrder
} from "../controllers/orderControllers.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js"


const router = express.Router();

// 🛒 Route pour créer une commande
router.post("/", createOrder); // ✅ Création d'une commande
router.get("/", protect, isAdmin, getAllOrders); // ✅ Récupérer toutes les commandes
router.get("/user/:userId", getUserOrders) // ✅ Récupérer toutes les commandes d'un utilisateur
router.get("/:id", getOrderById); // ✅ Récupérer une commande par ID
router.put("/:id", updateOrderStatus); // ✅ Modifier le statut d'une commande
router.delete("/:id", deleteOrder); // ✅ Supprimer une commande
router.post("/:id/pay", simulatePayment); // ✅ Simuler un paiement
router.post("/:id/refund", refundOrder) // ✅ Procéder à un remboursement

export default router