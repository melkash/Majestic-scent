import Product from "../models/productModel.js";

// 📌 **1️⃣ Créer un produit (POST /api/products)**
export const createProduct = async (req, res) => {

    try {
        const { name, brand, price, stock, description, image, category } = req.body
        
            // 🚨 Vérifier que le nom est bien renseigné
            if (!name?.trim()) {
            return res.status(400).json({ message: "Le nom du produit est obligatoire." });
            }
            

            // Vérifier que les champs requis sont présents
            if(!brand?.trim() || !description?.trim() || !image?.trim() || !category?.trim()){
              return res.status(400).json({ message: "Tous les champs sont requis" }); 
            }

            if(price === undefined || isNaN(price) || price <= 0){
                return res.status(400).json({ message: "Le prix doit être un nombre positif" });
            }

            if(stock === undefined || isNaN(stock) || stock < 0 ){
                return res.status(400).json({ message: "Le stock doit être un nombre positif" });
            }

            const existingProduct = await Product.findOne( { name: name.trim() })
                if(existingProduct){
                    return res.status(400).json({ message: " Le produit existe dèjà !" })
                }
            

            // Créer un nouveau Produit
            const newProduct = new Product ({
               name: name.trim(),
               brand: brand.trim(),
               price,
               stock,
               description: description.trim(),
               image: image.trim(),
               category: category.trim()
            });

             // Sauvegarder dans la base de données
             await newProduct.save() 

             res.status(201).json({ message: "Produit ajouté avec succès", product: newProduct});
            } catch(error) {
              res.status(500).json({ message: "Erreur lors de l'ajout du produit", error: error.message });
            }
};


 // 📌 **2️⃣ Obtenir tous les produits (GET /api/products)**
   export const getAllproducts = async (req, res) => {
     try { 
            const products = await Product.find();
            res.status(200).json(products);
            } catch (error) {
            res.status(500).json({ message: "Erreur serveur", error: error.message })
            }
  };

  // 📌 **3️⃣ Obtenir un seul produit par ID (GET /api/products/:id)**
  export const getProductById = async (req, res) => {
    try {
            const product = await Product.findById(req.params.id);
 
            if (!product) {
            return res.status(404).json({ message: "Produit non trouvé" })
            }
 
            res.status(200).json(product);
            } catch (error) {
            res.status(500).json({ message: "Erreur serveur", error: error.message })
            }
 };

 // 📌 **4️⃣ Mettre à jour un produit (PUT /api/products/:id)**
 export const updateProduct = async (req, res) => {
   try {
     
           const { name, brand, price, stock, description, image, category } = req.body
     
           const updatedProduct = await Product.findByIdAndUpdate(
           req.params.id,
           { name, brand, price, stock, description, image, category },
           { new: true, runValidators: true }
           );
       
           if (!updatedProduct) {
           return res.status(404).json({ message : "Produit non trouvé" })
           }
 
           res.status(200).json({ message : "Produit mis à jour", product: updatedProduct });
           } catch (error){
           return res.status(500).json({ message: "Erreur serveur", error: error.message });
           }
 };

 // 📌 **5️⃣ Supprimer un produit (DELETE /api/products/:id)**
 export const deleteProduct = async (req, res) => {
    try {

            const deletedProduct = await Product.findByIdAndDelete(req.params.id);
   
            if (!deletedProduct){
            return res.status(404).json({ message: "Produit non trouvé" })
            }
   
            res.status(200).json({ message: "Produit supprimé" })
            } catch (error) {
            return res.status(500).json({ message: "Erreur serveur", error: error.message})
            }
};
   
   
   
   
 
 
 