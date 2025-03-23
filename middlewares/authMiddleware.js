import jwt from "jsonwebtoken";

export const protect = async (req, res, next) => {
    try {
         // 🔍 Vérifier si le token est présent
         const token = req.headers.authorization?.split(" ")[1];
         if (!token){
            return res.status(401).json({ message: "Accès refusé. Aucun token fourni." });
         }

         // 🔑 Vérifier le token
         const decoded = jwt.verify(token, process.env.JWT_SECRET);
         req.user = decoded; // Ajoute l'utilisateur décodé à `req.user`

         next();
    } catch (error) {
        res.status(401).json({ message: "Token invalide ou expiré", error: error.message })
    }
};

// 🛡 Middleware pour vérifier si l'utilisateur est admin
export const isAdmin = (req, res, next ) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Accès refusé. Admin requis." });
    }
    next()
};