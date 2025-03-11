import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";

// 📌 CREER UNE COMMANDE
export const createOrder = async (req, res) => {
    try {
        console.log("Données reçues dans req.body :", req.body);
        const { userId, products } = req.body;

        // 🚨 Vérification des données requises
        if (!userId || !products || products.length === 0) {
            return res.status(400).json({ message: "Les informations de commande sont incomplètes." });
        }

        console.log("UserID:", userId);
        console.log("Products:", products);

        // 🚨 Vérifier si `userId` est valide
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: "L'ID utilisateur n'est pas valide." });
        }

        // ✅ Convertir userId en ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // ✅ Regrouper les quantités si un même produit est commandé plusieurs fois
        const productMap = new Map();
        for (const item of products) {
            if (!mongoose.isValidObjectId(item.productId)) {
                return res.status(400).json({ message: `L'ID produit ${item.productId} n'est pas valide.` });
            }

            if (productMap.has(item.productId)) {
                productMap.get(item.productId).quantity += item.quantity;
            } else {
                productMap.set(item.productId, {
                    productId: new mongoose.Types.ObjectId(item.productId),
                    quantity: item.quantity,
                    price: item.price
                });
            }
        }
        const formattedProducts = Array.from(productMap.values());

        // 🚨 Vérifier la disponibilité des produits en stock
        for (const item of formattedProducts) {
            const product = await Product.findById(item.productId);

            if (!product) {
                return res.status(404).json({ message: `Produit ID ${item.productId} introuvable.` });
            }

            // 🚫 Bloquer si le stock est insuffisant
            if (product.stock === 0 || item.quantity > product.stock) {
                return res.status(400).json({
                    message: `Stock insuffisant pour ${product.name}. Disponible : ${product.stock}`
                });
            }
        }

        // 🛒 Mettre à jour le stock des produits commandés
        for (const item of formattedProducts) {
            console.log(`🛠 Mise à jour du stock pour le produit ${item.productId} : décrémentation de ${item.quantity}`);
          const updatedProduct = await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } }, // Diminue le stock
                { new: true }
            );
            console.log(`✅ Stock mis à jour pour ${updatedProduct.name} : Nouveau stock ${updatedProduct.stock}`);
        }

        // 🧮 Calcul automatique du totalPrice
        const totalPrice = formattedProducts.reduce((acc, item) => acc + (item.quantity * item.price), 0);

        // 📌 Création de la commande
        const newOrder = new Order({
            userId: userObjectId,
            products: formattedProducts,
            totalPrice,
            status: "En attente"
        });

        // Sauvegarde de la commande
        await newOrder.save();

        res.status(201).json({ message: "Commande créée avec succès", order: newOrder });

    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la commande", error: error.message });
    }
};


// 📌 Récupérer toutes les commandes
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.aggregate([
            {
                $lookup: {
                    from: "users",  // 🔥 Correspond à ta collection dans MongoDB
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: { path: "$user", preserveNullAndEmptyArrays: true } // Permet d'éviter d'afficher null si userId n'existe pas
            },
            {
                $lookup: {
                    from: "products",  // 🔥 Correspond à ta collection dans MongoDB
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,  // 🔥 Garde juste le nom et l'email du user
                    "user.name": 1, // ✅ Maintenant ça va afficher le nom
                    "user.email": 1, // ✅ Maintenant ça va afficher l'email
                    products: {
                        quantity: 1,
                        price: 1,
                        product: "$productDetails.name" // 🔥 Ajoute le nom du produit au lieu de juste son ID
                    },
                    totalPrice: 1,
                    status: 1,
                    createdAt: 1
                }
            }
        ]);

        

        console.log("📌 Commandes après aggregate :", JSON.stringify(orders, null, 2));

        res.status(200).json(orders);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des commandes :", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};


// 📌 Récupérer une commande par ID
export const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;

        // 🚨 Vérifier si `orderId` est valide
        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({ message: "L'ID de la commande n'est pas valide." });
        }

        // 📌 Utilisation d'aggregate pour récupérer la commande avec les détails
        const order = await Order.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(orderId) } }, // Filtrer par ID

            // 🔗 Joindre la collection `users`
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } }, // Éviter les `null`

            // 🔗 Joindre la collection `products`
            {
                $lookup: {
                    from: "products",
                    localField: "products.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },

            // 🛠️ Remplacer `productId` par les détails du produit
            {
                $addFields: {
                    products: {
                        $map: {
                            input: "$products",
                            as: "p",
                            in: {
                                productId: "$$p.productId",
                                quantity: "$$p.quantity",
                                price: "$$p.price",
                                product: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: "$productDetails",
                                                as: "prod",
                                                cond: { $eq: ["$$prod._id", "$$p.productId"] }
                                            }
                                        },
                                        0
                                    ]
                                }
                            }
                        }
                    }
                }
            },

            // 📌 Sélectionner les champs finaux et AFFICHER `userId`
            {
                $project: {
                    _id: 1,
                    userId: 1,  // ✅ Garde userId
                    userName: "$user.name",
                    userEmail: "$user.email",
                    products: {
                        productId: 1,
                        quantity: 1,
                        price: 1,
                        "product.name": 1,
                        "product.price": 1
                    },
                    totalPrice: 1,
                    status: 1,
                    createdAt: 1
                }
            }
        ]);

        // ✅ Vérifier si la commande existe
        if (!order || order.length === 0) {
            return res.status(404).json({ message: "Commande non trouvée" });
        }

        // 📌 Renvoyer la commande
        res.status(200).json(order[0]); // `aggregate` renvoie un tableau, on prend le premier élément

    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération de la commande", error: error.message });
    }
};



// Récupérer toutes les commandes d'un utilisateur
export const getUserOrders = async (req, res) => {
    try {

        const { userId } = req.params;

        // 🚨 Vérifier si `userId` est un ObjectId valide
        if(!mongoose.isValidObjectId(userId)){
            return res.status(400).json({ message: "L'ID utilisateur n'est pas valide" });
          }

         // 📌 Récupérer toutes les commandes de cet utilisateur
         const userOrders = await Order.find({ userId }).sort({ createdAt: -1 });

          // ✅ Vérifier si des commandes existent
          if(userOrders.length === 0){
            return res.status(404).json({ message: "Aucune commande trouvée pour cet utilisateur" });
            }

           // 📌 Retourner les commandes en JSON
           res.status(200).json({ orders: userOrders})
    
        }catch (error) {
            res.status(500).json({ message: "Erreur lors de la récupération de la commande", error: error.message})
        }

};

// 📌 Mettre à jour le statut d'une commande
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body;

        // 📌 Vérifier si l'ID est valide
        if(!mongoose.isValidObjectId(id)){
            return res.status(400).json({ message: "ID de la commande invalide" })
        }

         // 🔎 Vérifier si la commande existe
         const order = await Order.findById(id);
         if(!order){
             return res.status(404).json({ message: "Commande non trouvée" });
         };

        // ✅ Vérifier si le statut est valide
        const validStatuses = ["En attente", "Expédiée", "Livrée", "Annulée"];
        if(!validStatuses.includes(status)){
            return res.status(400).json({ message: "Statut invalide. statuts acceptés: En attente, Expédiée, Livrée, Annulée" });
        }

         
        order.status = status;
        await order.save()

        res.status(200).json({ message: "Statut mis à jour", order});
    }catch (error){
        res.status(500).json({ message : "Erreur lors de la mise à jour", error: error.message });
    }
};

// 📌 Supprimer une commande
export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        // 📌 Vérifier si l'ID est valide
        if(!mongoose.isValidObjectId(id)){
            return res.status(400).json({ message: "ID de la commande invalide" });
        }

        // 🔎 Vérifier si la commande existe
        const order = await Order.findById(id);
        if(!order){
            return res.status(404).json({ message: "Commande non trouvée" });
        }

        // 🔄 Remettre les produits en stock AVANT de supprimer la commande
        for (const item of order.products) {
            await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: item.quantity } }, // 🔄 Rendre le stock disponible à nouveau
                { new: true }
            );
        }
        await Order.findByIdAndDelete(id);

        res.status(200).json({ message: "Commande annulée et stock mis à jour" })
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'annulation de la commande", error: error.message });
    }
};

// ✅ Simuler un paiement


export const simulatePayment = async (req, res) => {
    console.log(`🚀 Début du paiement pour la commande ${req.params.id} à ${new Date().toISOString()}`);

    console.log(`🕵️‍♂️ Requête PAY reçue de : ${req.headers["user-agent"]} à ${new Date().toISOString()}`);
    console.log("🔥 simulatePayment appelé pour la commande:", req.params.id);
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Commande non trouvée " });
        }

         if (order.paymentStatus === "Réussi") {
            console.log("⚠️ Paiement déjà effectué, sortie de la fonction.");
            return res.status(400).json({ message: "Cette commande a déjà été payée." });
        }

        const paymentSuccess = req.body.failPayment ? false : true;
        let updatedProducts = []; // ✅ Défini au début pour éviter l'erreur

        if (paymentSuccess) {
            order.paymentStatus = "Réussi";
            order.transactionId = "TXN" + Date.now();
            order.paymentMethod = req.body.paymentMethod || "Carte";

            // ✅ Vérifier le stock AVANT modification
            for (let item of order.products) {
                const product = await Product.findById(item.productId);
                if (product) { 
                    console.log(`✅ Vérification du stock pour : ${product.name}, Quantité: ${item.quantity}`);
                    if (product.stock < item.quantity) {
                        return res.status(400).json({ message: `Stock insuffisant pour ${product.name}` });
                    }
                } else {
                    console.log(`❌ Produit non trouvé : ${item.productId}`);
                }
            } 

            // ✅ Si tout est bon, on met à jour le stock
            for (let item of order.products) {
                const product = await Product.findById(item.productId);
                if (product) {
                    console.log(`✅ Mise à jour du stock pour ${product.name} (ID: ${product._id})`);
                    console.log(`Stock avant: ${product.stock}, Quantité achetée: ${item.quantity}`);
                    product.stock -= item.quantity;
                    await product.save();

                    console.log(`Stock après: ${product.stock}`);
                    updatedProducts.push({
                        productId: product._id,
                        name: product.name,
                        newStock: product.stock
                    });
                } else {
                    console.log(`❌ Impossible de mettre à jour, produit introuvable: ${item.productId}`);
                }
            }

        } else {
            order.paymentStatus = "Échoué";
        }

        await order.save();

        console.log("✅ Réponse envoyée au client, fin de simulatePayment.");
        console.log(`✅ Fin du paiement pour la commande ${req.params.id} à ${new Date().toISOString()}`);

        res.json({ 
            message: paymentSuccess ? "Paiement simulé avec succès" : "Le paiement a échoué",
            order,
            updatedProducts
        });

    } catch (error) {
        console.error("❌ Erreur dans simulatePayment:", error.message);
        res.status(500).json({ message: "Erreur lors du paiement", error: error.message });
    }
};


// Procéder à un remboursement
export const refundOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if(!order){
            return res.status(404).json({ message: "Commande non trouvéé" });
        }

        // Vérifier si la commande a bien été payée avant remboursement
        if(order.paymentStatus !== "Réussi"){
            return res.status(400).json({ message: "Seules les commandes payées peuvent êtres remboursées" });
        }

        // ✅ Remettre les produits en stock
        let updatedProducts = [];
        for (let item of order.products) {
            const product = await Product.findById(item.productId);
            if(product) {
                product.stock += item.quantity;
                await product.save();
                updatedProducts.push({
                    productId: product._id,
                    name: product.name,
                    newStock: product.stock
                })
            }
        }

        // Mettre à jour le statut du paiement
        order.paymentStatus = "Remboursé";
        order.refundedAt = new Date(); // Enregistre la date du remboursement

        await order.save();

        res.json({
            message: "Commande remboursée avec succès et stock mis à jour",
            order,
            updatedProducts
        })

    } catch (error) {
        res.status(500).json({ message: "Erreur lors du remboursement de la commande", error: error.message });
    }
};