const socket = io('http://localhost:8080'); 
//La instancia de Socket.io del lado del cliente. 


//Lo que tengo que hacer es escuchar al Backend, que este me va a mandar los productos: 

socket.on("updateProducts", (productos1) => {
    renderProductos(productos1);
})

// Función para renderizar nuestros productos

const renderProductos = (productos1) => {
    const contenedorProductos = document.getElementById("contenedorProductos"); 
    contenedorProductos.innerHTML ="";

    productos1.forEach( item => {
        const card = document.createElement("div"); 
        card.classList.add("card"); 

        card.innerHTML = `
                            <p> ${item.id} </p>
                            <p> ${item.title} </p>
                            <p> ${item.price} </p>
                            <button class="btnEliminar" data-id="${item.id}"> Eliminar </button>
                        `
        
        contenedorProductos.appendChild(card);
        //Evento para eliminar productos: 
        card.querySelector("button").addEventListener("click", () => {
            eliminarProductos(item.id); 
        })
    })
}

const eliminarProductos = (id) => {
    socket.emit("deleteProduct", id);
}

//Agregamos productos del formulario: 
document.getElementById("btnEnviar").addEventListener("click", () => {
    newProduct(); 
})

const newProduct = () => {
    const producto = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        price: document.getElementById("price").value,
        img: document.getElementById("img").value,
        code: document.getElementById("code").value,
        stock: document.getElementById("stock").value,
        category: document.getElementById("category").value,
        status: document.getElementById("status").value === "true",
    };
    
    if (producto.stock < 0 || producto.price < 0) {
        alert("El stock o precio no pueden ser negativos.");
        return;}
    console.log(producto); // Verificar los datos del producto
    socket.emit("newProduct", producto); 
}