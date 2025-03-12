import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

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
}