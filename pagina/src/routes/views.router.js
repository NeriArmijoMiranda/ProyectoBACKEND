import { Router } from "express";
const router = Router(); 

//Importamos al ProductModel: 
import ProductModel from "../models/product.model.js";
router.get("/products", async (req, res) => {
    const productos = await ProductModel.find().lean(); 
    res.render("home", {productos}); 
})

router.get("/realtimeproducts", async (req, res) => {
    res.render("realtimeproducts"); 
})


router.get("/", async (req, res) => {
    try {
        const cartId = req.session.cartId || null; // Si ya tienes un carrito en sesión
        const productos = await manager.getProducts();

        res.render("home", { productos, cartId }); // Pasa cartId a la vista
    } catch (error) {
        res.status(500).send("Error interno del servidor");
    }
});

// Obtener todos los carritos
router.get("/api/carts", async (req, res) => {
    try {
        const carritos = await manager.carts;  // Obtén todos los carritos
        res.json(carritos);  // Devuelve los carritos al frontend
    } catch (error) {
        console.error("Error al obtener carritos:", error);
        res.status(500).send("Error al obtener los carritos");
    }
});

// Obtener un carrito específico por ID
router.get("/carts/:cid", async (req, res) => {
    const carritoId = parseInt(req.params.cid);
    try {
        const carrito = await manager.getCarritoById(carritoId);  // Obtén un carrito por su ID
        res.json(carrito);  // Devuelve el carrito con los productos desglosados
    } catch (error) {
        res.status(500).send("Error al obtener el carrito");
    }
});

router.post("/:cid/products/:pid", async (req, res) => {
    const carritoId = parseInt(req.params.cid);
    const productoId = parseInt(req.params.pid);
    const quantity = req.body.quantity || 1;

    try {
        const carrito = await manager.agregarProductoAlCarrito(carritoId, productoId, quantity);
        res.redirect("/carts");  
    } catch (error) {
        res.status(500).send("Error al agregar el producto al carrito");
    }
});

export default router; 