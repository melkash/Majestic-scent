import User from "../models/userModel.js"
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// ✅ Ajouter un utilisateur (uniquement pour un admin)
export const addUser = async (req, res) => {
    try  {
        const { name, email, password, role } = req.body
    

    // Vérifier que les champs requis sont présents
    if(!name || !email || !password){
      return res.status(400).json({ message: "Tous les champs sont requis" });
     }

     // Vérifier si l'utilisateur existe déjà
     const existingUser = await User.findOne({ email });
     if(existingUser) {
        return res.status(400).json({ message: "Cet email est déjà utilisé"});
     }

     // 📌 Hasher le mot de passe AVANT de l'utiliser
     const hashedPassword = await bcrypt.hash(password, 10);

     // Créer un nouvel utilisateur
     const newUser = new User({
        name,
        email,
        password : hashedPassword, 
        role: role || "client" // Par défaut, on met "client"
     })

     // Sauvegarder dans la base de données
     await newUser.save();

     res.status(201).json({ message: "utilisateur ajouté avec succès", user: newUser })
   }catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout de l'utilisateur", error: error.message })
   }
};

export const getAllUser = async (req, res) => {
   try {
        const users = await User.find().select("-password"); // ❌ Ne pas envoyer les mots de passe
        res.status(200).json(users);
      } catch (error) {
      res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs", error: error.message })
   }
};

export const getUserProfil = async (req, res) => {
   try {
       const { id } = req.params;

       // 🛡 Vérifier si l'utilisateur est bien connecté
       if (req.user.id !== id && req.user.role !== "admin"){
         return res.status(403).json({ message: "accès refusé. Vous ne pouvez voir que votre propre profil."});
       }

       // 🛠 Vérifier si l'ID est valide
       if(!mongoose.isValidObjectId(id)) {
         return res.status(400).json({ message: "ID utilisateur invalide" });
       }

       // 🔍 Trouver l'utilisateur en base de données
       const user = await User.findById(id).select("-password");
       if (!user){
         return res.status(400).json({ message: "Utilisateur non trouvé" });
       }

       res.status(200).json(user)
   } catch (error) {
      res.status(500).json({ message: "Erreur de lors de la récupération du profil", error: error.message });
   }
};

export const updateUserProfile = async (req, res) => {
   try {
      const { id } = req.params;
      const { name, email } = req.body;
      
      // 🛡 Vérifier si l'utilisateur est bien connecté
      if( req.user.id !== id && req.user.role !== "admin" ){
         return res.status(403).json({ message: "Accès refusé. Vous ne pouvez modifier que votre propre profil." });
      }

      // 🔍 Trouver l'utilisateur
      const user = await User.findById(id);
      if (!user) {
         return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

       // ✅ Mettre à jour les champs
       if (name) user.name = name;
       if (email) user.email = email;

       // 🚫 Empêcher la mise à jour du mot de passe ici
       if (req.body.password) {
         return res.status(403).json({ message: "Vous ne pouvez pas modifier le mot de passe d'un autre utilisateur." })
       }

       

       await user.save()
       res.status(200).json({ message: "Profil mis à jour avec succès", user: { name: user.name, email: user.email, role: user.role } })
   } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour du profil", error: error.message });
   }
};

// ✅ Supprimer un utilisateur
 export const deleteUser = async (req, res) => {
   try {
      const { id } = req.params;

      // 🛡 Vérifier si l'utilisateur est bien connecté
      if (req.user.id !== id && req.user.role !== "admin") {
          return res.status(403).json({ message: "Accès refusé. Vous ne pouvez supprimer que votre propre compte. "})
      }

      // 🔍 Vérifier si l'utilisateur existe
      const user = await User.findById(id);

      if (!user) {
         return res.status(404).json({ message: "Utisateur non trouvé" });
      }

      await User.findByIdAndDelete(id);
      res.status(200).json({ message: "Utilisateur supprimé avec succès" })
      } catch (error) {
         res.status(500).json({ message: "Erreur lors de la suppression du compte", error: error.message });
      }
   }
 
