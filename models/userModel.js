import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema ({
 name : {
    type: String,
    required: [true, "le nom est requis"],
    trim: true
 },
 email : {
    type: String,
    required: [true, "L'email est requis"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "L'email est invalide"]
 },
 password : {
    type: String, 
    required: [true, "Le mot de passe est requis"],
    minlength: [6, "Le mot doit contenir au moins 6 caractères"]
 },
 role : {
    type: String,
    enum: ["client", "admin"],
    default: "client"
 },
 createdAt : {
    type: Date,
    default: Date.now
 }
});

// 🔐 Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function (next) {
   if(!this.isModified('password')) return next();
   this.password = await bcrypt.hash(this.password, 10);
   next();
});

// 🔑 Vérification du mot de passe
userSchema.methods.comparePassword = async function (password) {
   return await bcrypt.compare(password, this.password) 
};

const User = mongoose.model('User', userSchema);

export default User;