import express from "express"; 
import { Server as SocketServer } from "socket.io";
import { createServer } from "http"; // Para crear el servidor HTTP
import { engine } from "express-handlebars";
import {existsSync, readFileSync } from 'fs';
import path from "path";
import { fileURLToPath } from "url"; // Para manejar las rutas de archivos
import productRouter from "./routes/products.router.js";
import cartsRouter from "./routes/carts.router.js";
import "./database.js";
import ProductModel from "./models/product.model.js";
import CartModel from "./models/cart.model.js";
import ProductManager from "./managers/products-manager.js";

// Definir la ruta del archivo products.json
const productsFilePath = path.join(process.cwd(),'src',  'data',  'products.json');


/*if (existsSync(productsFilePath)) {
    try {
        const data = readFileSync(productsFilePath, 'utf-8');
        const products = JSON.parse(data);
        console.log(products);
    } catch (error) {
        console.error('Error al leer el archivo products.json:', error);
    }
} else {
    console.error('El archivo products.json no existe en la ruta:', productsFilePath);
} */

const app = express(); 
const PUERTO = 8080;


// Obtener la ruta actual del archivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configura la carpeta 'public' para servir archivos estáticos
app.use('/public', express.static(path.join(process.cwd(), 'src', 'public')));

//Middleware: 
app.use(express.json()); 
//Le decimos al servidor que vamos a trabajar con JSON. 

//Rutas
app.use("/api/products", productRouter);
app.use("/api/carts", cartsRouter);

// Configurar el motor de plantillas Handlebars
app.engine('handlebars', engine({
    helpers: {
        // Definimos el helper 'eq' para comparar dos valores
        eq: (a, b) => a === b }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Crear el servidor HTTP y conectar con socket.ios
const server = createServer(app);
const io = new SocketServer(server);

// Llamar a los productos del JSON 
let products;
try {
    const data = readFileSync(productsFilePath, "utf-8");
    products = JSON.parse(data); // Convertir el JSON en un array de productos
} catch (error) {
    console.error("Error al leer el archivo products.json", error);
    products = []; // Si hay un error, inicializar con un array vacío
}


// Ruta para la vista estática de Handlebars
app.get("/", async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const sort = req.query.sort || 'asc';  // Orden (por defecto ascendente)
    const query = req.query.query || '';  // Filtro de búsqueda (por defecto vacío)
    const categoryFilter = req.query.category || '';  // Filtro por categoría (por defecto vacío)
    const sortBy = 'price'; // Solo soportamos ordenar por precio

        // Filtrar los productos si 'category' está presente en los parámetros de consulta
        let filter = {};
        if (categoryFilter) {
            filter.category = categoryFilter;  // Filtrar productos por categoría
        }
            // Si se pasa un filtro de búsqueda (query), lo agregamos al filtro
    if (query) {
        filter.$text = { $search: query };  // Realizar búsqueda por texto en MongoDB
    }
    try {
        const productsListado1 = await ProductModel.paginate(filter, {
            limit,
            page,
            sort: { price: sort === 'asc' ? 1 : -1 }, // Ordenar por precio
        });
        
 //       console.log("Resultado de la consulta de productos:", productsListado1);

        //Recuperamos el array de datos que esta en docs: 
        const productos = productsListado1.docs.map( (producto) => {
            const {_id, ...rest} = producto.toObject(); 
            return rest; 
        })

        res.render("home", {
            productos: productos, 
            category: categoryFilter,
            hasPrevPage: productsListado1.hasPrevPage,
            hasNextPage: productsListado1.hasNextPage,
            prevPage: productsListado1.prevPage, 
            nextPage: productsListado1.nextPage,
            currentPage: productsListado1.page, 
            totalPages: productsListado1.totalPages
        })
        console.log({
            hasPrevPage: productsListado1.hasPrevPage,
            hasNextPage: productsListado1.hasNextPage,
            prevPage: productsListado1.prevPage,
            nextPage: productsListado1.nextPage,
            currentPage: productsListado1.page,
            totalPages: productsListado1.totalPages,
        });
    } catch (error) {
        res.status(500).send("Error interno del servidor")
    }
})




// Ruta para la vista en tiempo real con WebSockets
app.get("/realtimeproducts", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 3;  // Número de productos por página
        // Paginación con 'page' y 'limit'
        const productsListado = await ProductModel.paginate({}, { page, limit });
        console.log("Productos paginados:", productsListado.docs);  // Muestra los productos de la página actual
        const productos1 = productsListado.docs.map(doc => doc.toObject());


        // Enviar los productos a la vista
        res.render("realtimeproducts", {
            productos1: productos1,
            hasPrevPage: productsListado.hasPrevPage,
            hasNextPage: productsListado.hasNextPage,
            prevPage: productsListado.prevPage, 
            nextPage: productsListado.nextPage,
            currentPage: productsListado.page, 
            totalPages: productsListado.totalPages
        });
        console.log("Productos a pasar a la vista:", productos1);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).send("Error interno del servidor");
    }
});
// Configuración de WebSockets
io.on("connection", async (socket) => {
    console.log("Cliente conectado");

// Emitir productos iniciales al conectar un cliente
ProductModel.find().then(productos => {
    socket.emit("updateProducts", productos); // Enviar los productos actuales al cliente
});
//Debo traer el array de productos: 
/* const manager = new ProductManager("./src/data/products.json"); */

    // Escuchar cuando se agrega un nuevo producto
    socket.on("newProduct", async (product) => {
        // Aquí agregar el producto a la base de datos y luego emitir la lista actualizada
        await ProductModel.create(product).then(() => {
            ProductModel.find().then(products => {
                io.emit("updateProducts", products); // Actualizar a todos los clientes
            });
        });
    });



    // Escuchar cuando se elimina un producto
    socket.on("deleteProduct", async (productId) => {
        console.log("Producto eliminado:", productId);
        await ProductModel.findByIdAndDelete(productId).then(() => {
            ProductModel.find().then(products => {
                io.emit("updateProducts", products); // Enviar productos actualizados a todos los clientes
            });
        });
    });
});
// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Ruta para ver los carritos en el frontend
app.get("/api/carts", async (req, res) => {
    try {
        const carritos = await manager.carts;  // Obtén todos los carritos
        res.render("carts", { carrito });  // Pasa los carritos a la vista
    } catch (error) {
        res.status(500).send("Error al obtener los carritos");
    }
});




app.listen(PUERTO, () => {
    console.log(`Escuchando en el http://localhost:${PUERTO}`); 
})


// Paginación 

const resultado1 = await ProductModel.paginate({}, {limit: 2, page: 4})
//console.log(resultado1);

const resultado2 = await CartModel.paginate({}, {limit: 1, page: 5})
//console.log(resultado2);
