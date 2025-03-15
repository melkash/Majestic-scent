import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../sendEmail.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config()

// 🔐 Inscription d'un utilisateur
export const register = async (req, res) => {
    try {
        const {name, email, password, role} = req.body;


        // 🚨 Vérifier si l'utilisateur existe déjà
        const userExists = await User.findOne({ email });
        if (userExists){
            return res.status(400).json({ message: "Cet email est déjà utilisé" });
        }

        // 🔄 Création du nouvel utilisateur
        const newUser = new User({ name, email, password, role});
        await newUser.save();

        res.status(201).json({ message: "Utilisateur créé avec succès", user: { name, email, role }});
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la création de l'utilisateur", error: error.message })
    }
};

// 🔑 Connexion d'un utilisateur
export const login = async (req, res) => {
    try {
        const { email, password} = req.body;

        // 🔎 Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });
        if (!user){
            return res.status(400).json({ message: "Utilisateur introuvable" });
        }

        // 🔑 Vérifier le mot de passe
        const isMatch = await user.comparePassword(password);
        if (!isMatch){
            return res.status(400).json({ message: "Mot de passe incorrect"});
        }

        // 🔥 Générer un token JWT
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });

        res.status(201).json({ message: "Connexion réussie", token, user: {name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la connexion", error: error.message });
    }
};

// 📌 Fonction pour envoyer un email de réinitialisation
export const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        // 📌 Vérifier si l'email est en base de données
        const user = await User.findOne({ email });
        if (!user){
             // 🔒 Ne pas révéler si l'email est en base de données
            return res.status(404).json({ message: "Si un compte existe avec cet email, un email de réinisialisation a été envoyé" })
        }

        // 📌 Générer un token de réinitialisation (valable 15 min)
        const resetToken = jwt.sign({ id: user._id}, process.env.JWT_SECRET, { expiresIn: "15m"});

        // 📌 Construire le lien de réinitialisation
        const resetLink = `https://majestic-scent.onrender.com/reset-password?token=${resetToken}`;


        // 📌 Contenu et envoi de l'email
        await sendEmail(
            email, // Destinataire
            "Réinitialisation du mot de passe", // Sujet
            `Vous avez demandé une réinitialisation de votre mot de passe. Cliquez ici : ${resetLink}`, // Texte brut
            `<p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
            <p>Cliquez sur le lien ci-dessous pour le réinitialiser :</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>Ce lien est valable 15 minutes</p>` // Version HTML
        );

        res.json({message: "Si un compte existe avec cet email, un email de réinisialisation a été envoyé" });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'envoi de l'email", error: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params
        const { newPassword } = req.body;

        // 🔍 Vérifier si un mot de passe est fourni
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caractères" })
        }

        // 📌 Vérifier si le token est valide
        let decoded 
        try { 
            decoded = jwt.verify(token, process.env.JWT_SECRET); 
        } catch (error) {
            return res.status(400).json({ message: "Token invalide ou expiré" });
        }
        
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(400).json({ message: "Token invalide ou utilisateur non trouvé" });
        }

        // 🚨 Vérifier si le token correspond et s'il est encore valide
        if (user.resetPasswordToken !== token || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: "Token invalide ou expiré" });
        }

        // 📌 Hasher le nouveau mot de passe
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

         // ❌ Supprimer le token après utilisation
         user.resetPasswordToken = null;
         user.resetPasswordExpires = null;

        // 📌 Sauvegarder le nouveau mot de passe
        await user.save();

        res.json({ message: "Mot de passe réinitialisé avec succès" });
    
    } catch (error) {
        res.status(500).json({ message: "Token invalide ou expiré", error: error.message });
    }

};
