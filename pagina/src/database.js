import mongoose from "mongoose";

mongoose.connect("mongodb+srv://neriarmijomiranda530:coderhouse@codercluster0.xujf2.mongodb.net/MiPagina?retryWrites=true&w=majority&appName=CoderCluster0")
    .then(() => console.log("Conectados a la BD"))
    .catch( (error) => console.log("Tenemos un error ", error ))