import express from "express";
import Product from "../models/productModel.js"

const router = express.Router();

// 📌 **1️⃣ Créer un produit (POST /api/products)**
router.post("/", async (req, res) => {
   try {
    const { name, brand, price, stock, description, image, category} = req.body
    
    // Vérifier que tous les champs sont bien fournis
    if(!name || !brand || !price || !stock || !description || !image || !category){
       return res.status(400).json({ message: "Tous les champs sont requis" })
    }
    
    
    // Créer un nouveau produit
      const newProduct = new Product({ name, brand, price, stock, description, image, category })
      await newProduct.save();

      res.status(201).json({ message: "Produit créer avec succès", product: newProduct});
    } catch (error){
       res.status(500).json({ message: "Erreur serveur", error: error.message })
    }
});

// 📌 **2️⃣ Obtenir tous les produits (GET /api/products)**
router.get("/", async (req, res) => {
  try { 
    const products = await Product.find();
    res.status(200).json(products);
  }catch (error) {
   res.status(500).json({ message: "Erreur serveur", error: error.message })
  }
});

// 📌 **3️⃣ Obtenir un seul produit par ID (GET /api/products/:id)**
router.get("/:id", async (req, res) => {
   try {
    const product = await Product.findById(req.params.id);

    if (!product) {
     return res.status(404).json({ message: "Produit non trouvé" })
    }

    res.status(200).json(product);
   } catch (error) {
     res.status(500).json({ message: "Erreur serveur", error: error.message })
   }
});

// 📌 **4️⃣ Mettre à jour un produit (PUT /api/products/:id)**
router.put("/:id", async (req, res) => {
   try {
    const { name, brand, price, stock, description, image, category } = req.body

    const updateProduct = await Product.findByIdAndUpdate(
       req.params.id,
       { name, brand, price, stock, description, image, category },
       { new: true, runValidators: true }
    );
      
      if (!updateProduct) {
        return res.status(404).json({ message : "Produit non trouvé" })
      }

      res.status(200).json({ message : "Produit mis à jour", product: updateProduct });
   }catch (error){
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
   }
});


// 📌 **5️⃣ Supprimer un produit (DELETE /api/products/:id)**
router.delete("/:id", async (req, res) => {
 try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct){
        return res.status(404).json({ message: "Produit non trouvé"})
    }

    res.status(200).json({ message: "Produit supprimé" })
 }catch (error){
    return res.status(500).json({ message: "Erreur serveur", error: error.message})
 }
});


export default router;

