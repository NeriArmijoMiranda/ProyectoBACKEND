import fs from "fs"; 

class ProductManager {
    static ultId = 0;

    constructor(path) {
        this.products = [];
        this.path = path;

        this.cargarArray(); 
    }

    async cargarArray() {
        try {
            this.products = await this.leerArchivo();
        } catch (error) {
            console.log("Error al inicializar ProductManager", error);
        }
    }

    async addProduct({ title, description, price, img, code, stock }) {

        if (!title || !description || !price || !img || !code || !stock) {
            console.log("Todos los campos son obligatorios");
            return;
        }

        //2) Validacion: 

        if (this.products.some(item => item.code === code)) {
            console.log("El codigo debe ser unico");
            return;
        }

        const lastProductId = this.products.length > 0 ? this.products[this.products.length - 1].id : 0;
        const nuevoProducto = {
            id: lastProductId + 1,
            title,
            description,
            price,
            img,
            code,
            stock
        };

        //4) Metemos el producto al array. 
        this.products.push(nuevoProducto);

        //5) Lo guardamos en el archivo: 
        await this.guardarArchivo(this.products);
    }

    async getProducts({ limit = 10, page = 1, sort = 'asc', query = '',  category = '', available = '', sortBy = 'price' }) {
        try {
            const arrayProductos = await this.leerArchivo(); 
            return arrayProductos;
        } catch (error) {
            console.log("Error al leer el archivo", error); 
        }
         // Filtrar los productos si hay un query
        const productosFiltrados = arrayProductos.filter(product =>
            product.title.toLowerCase().includes(query.toLowerCase())
        );

           // Filtrar por categoría
            if (category) {
            productosFiltrados = productosFiltrados.filter(product =>
                product.category && product.category.toLowerCase().includes(category.toLowerCase())
            );
        }
        // Ordenar los productos por precio
        const productosOrdenados = productosFiltrados.sort((a, b) => {
            if (sort === 'asc') {
                return a.price - b.price;
            } else if (sort === 'desc') {
                return b.price - a.price;
            }
            return 0; // Sin orden si no es 'asc' ni 'desc'
        });
        // Implementar la paginación
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const productosPaginados = productosOrdenados.slice(startIndex, endIndex);

    }

    async getProductById(id) {
        try {
            const arrayProductos = await this.leerArchivo();
            const buscado = arrayProductos.find(item => item.id === id); 

            if (!buscado) {
                console.log("producto no encontrado"); 
                return null; 
            } else {
                console.log("Producto encontrado"); 
                return buscado; 
            }
        } catch (error) {
            console.log("Error al buscar por id", error); 
        }
    }

    //Métodos auxiliares: 
    async leerArchivo() {
        const respuesta = await fs.promises.readFile(this.path, "utf-8");
        const arrayProductos = JSON.parse(respuesta);
        return arrayProductos;
    }

    async guardarArchivo(arrayProductos) {
        await fs.promises.writeFile(this.path, JSON.stringify(arrayProductos, null, 2));
    }

    //Método para actualizar productos: 

    async updateProduct(id, productoActualizado) {
        try {
            const arrayProductos = await this.leerArchivo(); 

            const index = arrayProductos.findIndex( item => item.id === id); 

            if(index !== -1) {
                arrayProductos[index] = {...arrayProductos[index], ...productoActualizado} ; 
                await this.guardarArchivo(arrayProductos); 
                console.log("Producto actualizado"); 
            } else {
                console.log("No se encuentra el producto"); 
            }
        } catch (error) {
            console.log("Tenemos un error al actualizar productos"); 
        }
    }

    async deleteProduct(id) {
        try {
            const arrayProductos = await this.leerArchivo(); 

            const index = arrayProductos.findIndex( item => item.id === id); 

            if(index !== -1) {
                arrayProductos.splice(index, 1); 
                await this.guardarArchivo(arrayProductos); 
                console.log("Producto eliminado"); 
            } else {
                console.log("No se encuentra el producto"); 
            }
        } catch (error) {
            console.log("Tenemos un error al eliminar productos"); 
        }
    }

}

export default ProductManager; 