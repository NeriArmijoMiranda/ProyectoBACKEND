import express from "express"; 
import CartManager from "../managers/carts-manager.js";
const manager = new CartManager("src/data/carts.json");
const router = express.Router();


// Ruta para listar todos los productos
/*router.get("/", async (req, res) => {
    try {
        const productos = await manager.cargarArray(); 
        console.log("Productos (Carritos):", productos);
        res.render("carts", { productos });
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).send("Error interno del servidor");
    }
});*/
// Ruta para listar todos los carritos
router.get("/", async (req, res) => {
    try {
        const carrito = await manager.getCarts(); 
        res.render("carts", { carrito });
        console.log("Carritos:", JSON.stringify(carrito));
    } catch (error) {
        console.error("Error al obtener carritos:", error);
        res.status(500).send("Error interno del servidor");
    }
});

//2) La ruta GET /:pid deberá traer sólo el producto con el id proporcionado

router.get("/:pid", async (req, res) => {
    let id = req.params.pid; 

    try {
        const productoBuscado = await manager.getProductById(parseInt(id));

        if(!productoBuscado) {
            res.send("Producto no encontrado");
        } else {
            res.json(productoBuscado); 
        }
    } catch (error) {
        res.status(500).send("Error del servidor"); 
    }
})
// Obtener carrito por ID
router.get("/carts/:cid", async (req, res) => {
    const { cid } = req.params;
    console.log("Carrito ID: ", cid); // Añadir log

    try {
        const cart = await manager.getCarritoById(cid).populate('products.id'); // Usa populate para obtener los detalles del producto
        if (!cart) {
            return res.status(404).send("Carrito no encontrado");
        }

        res.json(cart);
    } catch (error) {
        console.error("Error al obtener el carrito:", error); 
        res.status(500).send("Error al obtener los productos del carrito");
    }
});

//3) La ruta raíz POST / deberá agregar un nuevo producto

router.post("/", async (req, res) => {
    const nuevoProducto = req.body; 

    try {
        await manager.addProduct(nuevoProducto); 
        res.status(201).send("Producto agregado exitosamente");
    } catch (error) {
        console.error("Error al agregar producto:", error);
        res.status(500).send("Error del servidor"); 
    }

})

// Crear un nuevo carrito vacío
router.post("/carts", async (req, res) => {
    try {
        const nuevoCarrito = new Carrito({ products: [] });
        const carritoCreado = await manager.createCart(nuevoCarrito);
        res.status(201).json(nuevoCarrito);
    } catch (error) {
        console.error("Error al crear el carrito:", error);
        res.status(500).send("Error interno del servidor");
    }
});
// Agregar producto al carrito
router.post("/carts/:cid/products/:pid", async (req, res) => {
    const carritoId = parseInt(req.params.cid);
    const productoId = parseInt(req.params.pid);
    const quantity = req.body.quantity || 1;  // Si no se especifica cantidad, se usa 1 por defecto
    const cart = await manager.getCarritoById(carritoId);
    const product = cart.products.find(product => product.id === productoId);

    if (product.quantity < quantity) {
        return res.status(400).send("No hay suficiente stock disponible.");
    }
    try {
        const carrito = await manager.agregarProductoAlCarrito(carritoId, productoId, quantity);
        res.redirect("/carts");  // Redirige a la página de carritos
    } catch (error) {
        res.status(500).send("Error al agregar el producto al carrito");
    }
});

//4) Actualizar 
router.put("/:pid", async (req, res) => {
    let id = req.params.pid;
    const productoActualizado = req.body;

    try {
        const producto = await manager.getProductById(parseInt(id));

        if (!producto) {
            return res.status(404).send("Producto no encontrado");
        }

        await manager.updateProduct(parseInt(id), productoActualizado); 
        res.send("Producto actualizado exitosamente");
    } catch (error) {
        res.status(500).send("Error al actualizar el producto");
    }
});

router.put("/carts/:cid", async (req, res) => {
    const { cid } = req.params;
    const newProducts = req.body.products;

    try {
        const cart = await manager.getCarritoById(cid);
        if (!cart) {
            return res.status(404).send("Carrito no encontrado");
        }

        cart.products = newProducts; // Reemplaza el arreglo de productos
        await manager.updateCart(cid, cart); // Actualiza el carrito en la base de datos
        res.send("Carrito actualizado exitosamente");
    } catch (error) {
        res.status(500).send("Error al actualizar el carrito");
    }
});

router.put("/carts/:cid/products/:pid", async (req, res) => {
    const { cid, pid } = req.params;
    const { quantity } = req.body; // Cantidad que se debe actualizar

    if (!quantity || quantity <= 0) {
        return res.status(400).send("Cantidad inválida");
    }

    try {
        const cart = await manager.getCarritoById(cid);
        if (!cart) {
            return res.status(404).send("Carrito no encontrado");
        }

        const product = cart.products.find(product => product.id === pid);
        if (!product) {
            return res.status(404).send("Producto no encontrado en el carrito");
        }

        product.quantity = quantity; // Actualiza la cantidad del producto
        await manager.updateCart(cid, cart); // Actualiza el carrito en la base de datos
        res.send("Cantidad de producto actualizada");
    } catch (error) {
        res.status(500).send("Error al actualizar la cantidad del producto");
    }
});

//5) La ruta DELETE /:pid deberá eliminar el producto con el pid indicado. 

router.delete("/:pid", async (req, res) => {
    let id = req.params.pid; 

    try {
        await manager.deleteProduct(parseInt(id)); 
        res.send("Producto eliminado")
    } catch (error) {
        res.status(500).send("Error al querer borrar un producto"); 
    }
})

router.delete("/:cid/products/:pid", async (req, res) => {
    const { cid, pid } = req.params;

    try {
        const cart = await manager.getCarritoById(cid);
        if (!cart) {
            return res.status(404).send("Carrito no encontrado");
        }

        const productIndex = cart.products.findIndex(product => product.id === pid);
        if (productIndex === -1) {
            return res.status(404).send("Producto no encontrado en el carrito");
        }

        cart.products.splice(productIndex, 1); // Elimina el producto del carrito
        await manager.updateCart(cid, cart); // Actualiza el carrito
        res.send("Producto eliminado del carrito");
    } catch (error) {
        res.status(500).send("Error al eliminar producto del carrito");
    }
});

router.delete("/:cid", async (req, res) => {
    const { cid } = req.params;

    try {
        const cart = await manager.getCarritoById(cid);
        if (!cart) {
            return res.status(404).send("Carrito no encontrado");
        }

        cart.products = []; // Vacía el carrito
        await manager.updateCart(cid, cart); // Actualiza el carrito vacío
        res.send("Todos los productos han sido eliminados del carrito");
    } catch (error) {
        res.status(500).send("Error al eliminar productos del carrito");
    }
});


export default router; 