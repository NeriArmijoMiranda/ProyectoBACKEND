import fs from "fs";

class CartsManager {
    constructor(path) {
        this.carts = [];
        this.path = path;

        this.cargarArray();
    }
    async cargarArray() {
        try {
            this.carts = await this.leerArchivo();
        } catch (error) {
            console.log("Error al inicializar CartsManager", error);
        }
    }

    async createCart() {
        try {
            const newCart = {
                id: this.carts.length > 0 ? this.carts[this.carts.length - 1].id + 1 : 1,
                products: [],
            };

            this.carts.push(newCart);
            await this.guardarArchivo(this.carts);
            return newCart;
        } catch (error) {
            console.log("Error al crear el carrito", error);
        }
    }

    async getCarts() {
        try {
            return await this.leerArchivo();
        } catch (error) {
            console.log("Error al obtener los carritos", error);
        }
    }

    async getCartById(id) {
        try {
            const cart = this.carts.find((cart) => cart.id === id);

            if (!cart) {
                console.log("Carrito no encontrado");
                return null;
            }

            return cart;
        } catch (error) {
            console.log("Error al buscar carrito por ID", error);
        }
    }

    async addProductToCart(cartId, productId, quantity = 1) {
        try {
            const cart = await this.getCartById(cartId);

            if (!cart) return;

            const productIndex = cart.products.findIndex((p) => p.productId === productId);

            if (productIndex !== -1) {
                cart.products[productIndex].quantity += quantity;
            } else {
                cart.products.push({ productId, quantity });
            }

            await this.guardarArchivo(this.carts);
            console.log("Producto agregado al carrito");
        } catch (error) {
            console.log("Error al agregar producto al carrito", error);
        }
    }

    async updateProductInCart(cartId, productId, newQuantity) {
        try {
            const cart = await this.getCartById(cartId);

            if (!cart) return;

            const productIndex = cart.products.findIndex((p) => p.productId === productId);

            if (productIndex !== -1) {
                if (newQuantity > 0) {
                    cart.products[productIndex].quantity = newQuantity;
                } else {
                    cart.products.splice(productIndex, 1);
                }

                await this.guardarArchivo(this.carts);
                console.log("Producto actualizado en el carrito");
            } else {
                console.log("Producto no encontrado en el carrito");
            }
        } catch (error) {
            console.log("Error al actualizar producto en el carrito", error);
        }
    }

    async deleteCart(cartId) {
        try {
            const index = this.carts.findIndex((cart) => cart.id === cartId);

            if (index !== -1) {
                this.carts.splice(index, 1);
                await this.guardarArchivo(this.carts);
                console.log("Carrito eliminado");
            } else {
                console.log("Carrito no encontrado");
            }
        } catch (error) {
            console.log("Error al eliminar el carrito", error);
        }
    }

    async deleteProductFromCart(cartId, productId) {
        try {
            const cart = await this.getCartById(cartId);

            if (!cart) return;

            const productIndex = cart.products.findIndex((p) => p.productId === productId);

            if (productIndex !== -1) {
                cart.products.splice(productIndex, 1);
                await this.guardarArchivo(this.carts);
                console.log("Producto eliminado del carrito");
            } else {
                console.log("Producto no encontrado en el carrito");
            }
        } catch (error) {
            console.log("Error al eliminar producto del carrito", error);
        }
    }

    // Métodos auxiliares
    async leerArchivo() {
        try {
            const data = await fs.promises.readFile(this.path, "utf-8");
            return JSON.parse(data);
        } catch (error) {
            console.log("Error al leer el archivo", error);
            return [];
        }
    }

    async guardarArchivo(data) {
        try {
            await fs.promises.writeFile(this.path, JSON.stringify(data, null, 2));
        } catch (error) {
            console.log("Error al guardar el archivo", error);
        }
    }
}

export default CartsManager;
