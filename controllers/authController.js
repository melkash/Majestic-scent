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

        // 📌 Hasher le mot de passe AVANT de l'utiliser
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🔄 Création du nouvel utilisateur
        const newUser = new User({ 
            name, 
            email, 
            password: hashedPassword, 
            role,
            resetPasswordToken: null,
            resetPasswordExpires: null
         });
         console.log("✅ Hash généré avant stockage :", hashedPassword);

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

        // 🚨 Vérifier si le compte est bloqué
        if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.accountLockedUntil - Date.now()) / 60000);
            return res.status(403).json({
                message: `Votre compte est temporairement bloquée. Réessayez après ${minutesLeft} minutes`
            });
        }


        // 🔥 Debug : Afficher la situation avant de tenter la réinitialisation
        console.log("🔎 Vérification du blocage :");
        console.log("🔹 accountLockedUntil en BDD :", user.accountLockedUntil);
        console.log("🔹 Date actuelle :", new Date());
        console.log("🔹 Différence :", user.accountLockedUntil - Date.now());


        // ✅ Si la durée du blocage est dépassée, on remet à zéro
        if (user.accountLockedUntil && user.accountLockedUntil <= Date.now()) {
            console.log("🔓 Blocage expiré, réinitialisation du compte...");
            user.accountLockedUntil = null;
            user.failedLoginAttempts = 0; // 🔥 On réinitialise les tentatives échouées
            await user.save()
            console.log("✅ Réinitialisation réussie !");
        }

        // 🔑 Vérifier le mot de passe
        console.log("🔎 Password received:", password);
        console.log("🔐 Hashed password in DB:", user.password)
        const isMatch = await user.comparePassword(password);
        console.log("✅ Password match result:", isMatch)
        if (!isMatch){
            // ❌ Mauvais mot de passe → Incrémenter les tentatives échouées
            user.failedLoginAttempts += 1;

            // ❌ Mauvais mot de passe → Incrémenter les tentatives échouées
            if (user.failedLoginAttempts >= 5) {
                user.accountLockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 🔒 Bloquer pendant 10 minutes
                await user.save();
                return res.status(403).json({ message: "Compte bloqué après plusieurs échecs. Réessayez dans 10 minutes" })
            }
            await user.save()
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
        const resetToken = jwt.sign({ id: user._id}, process.env.JWT_SECRET, { expiresIn: "15m" });
        console.log("🔑 Nouveau token généré :", resetToken);
        console.log("🔍 JWT_SECRET utilisé pour signer :", process.env.JWT_SECRET);
        // 🔹 Encoder l'URL pour éviter tout problème d'encodage
        const encodedToken = encodeURIComponent(resetToken);
        console.log("🔹 URL Encodée :", `http://localhost:5005/api/auth/reset-password?token=${encodedToken}`);

        // 📌 Stocker le token et l'expiration en base de données
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000 // +15 minutes

        await user.save() // ✅ Sauvegarde dans MongoDB
        console.log("🗄️ Token réellement stocké dans MongoDB :", user.resetPasswordToken);


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

// Fonction pour vérifier si le token est valable
export const valideResetToken = async (req, res) => {
    try {
        const { token } = req.query; // 📌 Récupérer le token depuis l'URL
        console.log("🔎 Étape 1 : Requête reçue avec token :", token);
        console.log("📩 Token reçu dans l'URL :", token);



        if (!token) {
            console.log("❌ Erreur : Token manquant !");
           return res.status(400).json({ message: "Token manquant" });
        }

        // 🔍 Vérifier si le token est bien stocké en base
        const userFromDB = await User.findOne({ resetPasswordToken: token }, { resetPasswordToken: 1, _id: 1 })
        console.log("🗄️ Token stocké en base :", JSON.stringify(userFromDB?.resetPasswordToken, null, 2));

        console.log("🆔 ID stocké en base :", userFromDB?._id);


        // 📌 Vérifier si le token est valide dans la forme
        let decoded 
        try { 
            console.log("🔍 Vérification du JWT_SECRET :", process.env.JWT_SECRET);
            console.log("📩 Token reçu dans l'URL :", `"${token}"`);
            decoded = jwt.verify(token, process.env.JWT_SECRET); 
            console.log("✅ Étape 2 : Token décodé :", decoded);
        } catch (error) {
            console.log("❌ Erreur : Token invalide ou expiré !");
            return res.status(400).json({ message: "Token invalide ou expiré" });
        }

        
        
        console.log("🔎 Étape 3 : Recherche de l'utilisateur avec _id =", decoded.id, "et resetPasswordToken =", token);
        // 🚨 Vérifier si le token correspond et s'il est encore valide (ancien token)
        const user = await User.findById({ _id: decoded.id, resetPasswordToken: token });
        
    
        console.log("✅ Étape 4 : Utilisateur trouvé :", user);
        if (!user || user.resetPasswordToken !== token || user.resetPasswordExpires < Date.now()) {
            console.log("❌ Erreur : Token invalide ou expiré !")
            return res.status(400).json({ message: "Token invalide ou expiré" });
        }
        console.log("✅ Étape 5 : Token valide !");
        res.status(200).json({ message: "Token valide", userId: user._id });

    } catch (error) {
        console.log("❌ Erreur serveur :", error.message);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }

};

// Fonction pour renvoyer pour un nouveau password
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // 🔍 Vérifier si un token et un mot de passe sont fourni
        if (!token || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Token et mot de passe requis" })
        }

        // 📌 Vérifier si le token est valide dans la forme
        let decoded 
        try { 
            decoded = jwt.verify(token, process.env.JWT_SECRET); 
        } catch (error) {
            return res.status(400).json({ message: "Token invalide ou expiré" });
        }
        
        // Vérification du token dans le fond (faux token)
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(400).json({ message: "Token invalide ou utilisateur non trouvé" });
        }

        // 🚨 Vérifier si le token correspond et s'il est encore valide (ancien token)
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

        // 📧 Envoyer un email de confirmation après la réinitialisation du mot de passe
        console.log("📧 Tentative d'envoi de l'email de confirmation à :", user.email);
        await sendEmail(
        user.email,
        "Votre mot de passe a été modifié",
        `Bonjour ${user.name}, votre mot de passe a été réinitialisé avec succès.
        Si ce n'était pas vous contactez-nous immédiatement.`,
        `<p>Bonjour <strong>${user.name}</strong>,</p>
        <p>Votre mot de passe a été réinitialisé avec succès.</p>
        <p>Si ce n'est pas vous, veuillez <a href="mailto:support@majestic-scent.com">nous contacter immédiatement</a></p>`
        );

        res.json({ message: "Mot de passe réinitialisé avec succès",
                   redirect: "/auth/login"
         });
    
    } catch (error) {
        res.status(500).json({ message: "Token invalide ou expiré", error: error.message });
    }

};
