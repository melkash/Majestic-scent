import User from "../models/userModel.js"

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

     // Créer un nouvel utilisateur
     const newUser = new User({
        name,
        email,
        password, // Il sera hashé automatiquement grâce au `pre('save')`
        role: role || "client" // Par défaut, on met "client"
     })

     // Sauvegarder dans la base de données
     await newUser.save();

     res.status(201).json({ message: "utilisateur ajouté avec succès", user: newUser })
   }catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout de l'utilisateur", error: error.message })
   }
}