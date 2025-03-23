import mongoose from "mongoose";

 
const orderSchema = new mongoose.Schema({ 
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User", // Référence au modèle User
        required: true
    },
    products: [
        {
            productId: {
                type: mongoose.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true, 
                min: [1, "La quantité ne peut pas etre inférieur à 1"]
            },
            price: {
                type: Number,
                required: true,
                min: [0, "Le prix ne peut pas etre négatif"]
            }

        }
    ],
    totalPrice: {
        type: Number,
        required: true,
        min: [0, "Le prix ne peut pas etre négatif"]
    },
    status: {
       type: String,
       enum: ["En attente", "Expédiée", "Livrée", "Annulée"],
       default: "En attente" 
    },
    
    // ✅ Ajout des champs pour la gestion du paiement
    paymentStatus: {
        type: String,
        enum: ["En attente", "Réussi", "Échoué", "Remboursé"],
        default: "En attente"
    },
    transactionId: {
        type: String,
        default: null // Identifiant de transaction fictif
    },
    paymentMethod: {
        type: String,
        default: null // Ex: "Carte", "PayPal", "Virement bancaire"
    },
    refundedAt: { // ✅ Ajout de la date de remboursement
     type: Date,
     default: null
    },
    createdAt : {
        type: Date,
        default: Date.now
    }


});

// 🛒 🔄 Middleware pour recalculer le total avant sauvegarde
orderSchema.pre('save', function (next) {
    if (this.products && this.products.length > 0) {
        this.totalPrice = this.products.reduce((sum, item) => sum + item.price * item.quantity, 0);
    } else {
        this.totalPrice = 0; // Sécurité si pas de produits
    }
    next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;