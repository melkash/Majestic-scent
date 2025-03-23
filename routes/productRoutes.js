import express from "express";
import { createProduct, 
         getAllproducts, 
         getProductById,
         updateProduct,
         deleteProduct } from "../controllers/productController.js";
import { protect, isAdmin } from "../middlewares/authMiddleware.js";


const router = express.Router();

// 📌 **1️⃣ Créer un produit (POST /api/products)**
router.post("/", protect, isAdmin, createProduct);
    

// 📌 **2️⃣ Obtenir tous les produits (GET /api/products)**
router.get("/", getAllproducts); 

// 📌 **3️⃣ Obtenir un seul produit par ID (GET /api/products/:id)**
router.get("/:id", getProductById); 

// 📌 **4️⃣ Mettre à jour un produit (PUT /api/products/:id)**
router.put("/:id", protect, isAdmin, updateProduct); 


// 📌 **5️⃣ Supprimer un produit (DELETE /api/products/:id)**
router.delete("/:id", protect, isAdmin, deleteProduct) 

export default router;

