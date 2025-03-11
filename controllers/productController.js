import Product from "../models/productModel";

export const addProduct = async (req, res) => {

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
}