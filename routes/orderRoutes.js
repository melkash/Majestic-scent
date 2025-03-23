import express from "express";
import {createOrder,
        getAllOrders,
        getOrderById,
        cancelOrderByUser,
        updateOrderStatus,
        deleteOrder,
        getUserOrders,
        simulatePayment,
        refundOrder
} from "../controllers/orderControllers.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js"


const router = express.Router();

// 🛒 Route pour créer une commande
router.post("/", protect, createOrder); // ✅ Création d'une commande
router.get("/", protect, isAdmin, getAllOrders); // ✅ Récupérer toutes les commandes
router.get("/user/:userId", protect, getUserOrders) // ✅ Récupérer toutes les commandes d'un utilisateur
router.get("/:id", protect, getOrderById); // ✅ Récupérer une commande par ID
router.put("/:id/cancel", protect, cancelOrderByUser); // ✅ Annuler sa commande par le client
router.put("/:id", protect, isAdmin, updateOrderStatus); // ✅ Modifier le statut d'une commande
router.delete("/:id", protect, isAdmin, deleteOrder); // ✅ Supprimer une commande
router.post("/:id/pay", protect, simulatePayment); // ✅ Simuler un paiement
router.post("/:id/refund", protect, isAdmin, refundOrder) // ✅ Procéder à un remboursement

export default router