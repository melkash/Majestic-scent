import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
   name: {
    type: String,
    required: true,
    trim: true // Supprime les espaces inutiles au début/fin
   },
   brand: {
    type: String,
    required: true,
    trim: true
   },
   price: {
    type: Number,
    required: true,
    min: 0 // Empeche les prix négatifs
   },
   stock: {
    type: Number,
    required: true,
    min: 0 
   },
   description: {
    type: String,
    required: true,
   },
   image: {
    type: String, // URL de l'image du parfum
    required: true
   },
   category: {
    type: String,
    required: true,
    enum: ["Homme", "Femme", "Mixte", "Parfum"]
   },
   createdAt: {
    type: Date,
    default: Date.now,
   },
},
{timestamps: true}
);

const Product = mongoose.model('Product', productSchema);

export default Product;


