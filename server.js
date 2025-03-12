import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import productRoutes from "./routes/productRoutes.js"

import orderRoutes from "./routes/orderRoutes.js"
import "./models/userModel.js";
import userRoutes from "./routes/userRoutes.js"
import authRoutes from "./routes/authRoutes.js"

// charger les variables d'environnements
dotenv.config();

console.log(`🛠 Serveur redémarré automatiquement à ${new Date().toISOString()}`);


// initialiser l'application
const app = express();

// Middleware
app.use(express.json());  // Pour lire le JSON dans les requêtes
app.use(cors()); // Autoriser les requêtes depuis d'autres domaines
app.use(morgan("dev")); // Logger les requêtes HTTP



// Connexion à mongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => { 
console.log("MongoDB connecté avec succès !");
console.log("Modèles enregistrés :", mongoose.modelNames()); // ✅ Vérifie les modèles enregistrés
})
.catch((error) => console.error("Erreur de connexion à MongoDB !", error));

/*app.use((req, res, next) => {
    console.log(`🔄 Requête reçue : ${req.method} ${req.url} - Heure : ${new Date().toISOString()}`);
    next();
});*/

let lastRequest = "";

app.use((req, res, next) => {
    const currentRequest = `${req.method} ${req.url}`;
    if (currentRequest !== lastRequest) {
        console.log(`🔄 Requête reçue : ${currentRequest} - Heure : ${new Date().toISOString()}`);
    }
    lastRequest = currentRequest;
    next();
});




// Routes API
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

// Route de test
app.get("/", (req, res) => {
    res.send("Bienvenue sur l'API de Majestic Scent !")
});

// Port et démarrage du serveur
const PORT = process.env.PORT || 5005
app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`)
    console.log("🛠 Serveur redémarré !");
});