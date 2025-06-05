let productos = {};
let carrito = [];
let historialVentas = [];
let movimientosCaja = [];

// Cargar datos almacenados

function mostrarInventario() {
    const inventario = JSON.parse(localStorage.getItem("inventario")) || [];

    const listaPollo = document.getElementById("listaInventarioPollo");
    const listaCarne = document.getElementById("listaInventarioCarne");
    const listaCajones = document.getElementById("listaInventarioCajones");

    listaPollo.innerHTML = "";
    listaCarne.innerHTML = "";
    listaCajones.innerHTML = "";

    inventario.forEach(producto => {
        const item = document.createElement("li");
        item.textContent = `${producto.nombre} - Código: ${producto.codigo} - Stock: ${producto.stock}kg - Precio: $${producto.precio}/kg`;

        if (producto.categoria === "pollo") {
            listaPollo.appendChild(item);
        } else if (producto.categoria === "carne") {
            listaCarne.appendChild(item);
        } else if (producto.categoria === "cajones") {
            listaCajones.appendChild(item);
        }
    });
}

function mostrarSubseccion(id) {
    document.querySelectorAll(".subseccion").forEach(s => s.style.display = "none");
    document.getElementById(id).style.display = "block";

    if (id === "verInventario") {
        mostrarInventario(); // <- refresca siempre
    }
}

function cargarDatos() {
    productos = JSON.parse(localStorage.getItem("productos") || "{}");
    historialVentas = JSON.parse(localStorage.getItem("historialVentas") || "[]");
    movimientosCaja = JSON.parse(localStorage.getItem("movimientosCaja") || "[]");
}

// Guardar datos
function guardarDatos() {
    localStorage.setItem("productos", JSON.stringify(productos));
    localStorage.setItem("historialVentas", JSON.stringify(historialVentas));
    localStorage.setItem("movimientosCaja", JSON.stringify(movimientosCaja));
}

// Navegación
function mostrarSeccion(nombre) {
    document.querySelectorAll(".seccion").forEach(sec => sec.style.display = "none");
    document.getElementById(nombre).style.display = "block";

    if (nombre === "inventario") mostrarSubseccion("verInventario");
    if (nombre === "ventas") mostrarSubseccion("facturar");
    if (nombre === "historial") actualizarHistorialVentas();
    if (nombre === "totalesCaja") actualizarTotalesCaja();
    actualizarTotalesYCaja();
}

function mostrarSubseccion(nombre) {
    document.querySelectorAll(".subseccion").forEach(sub => sub.style.display = "none");
    const sub = document.getElementById(nombre);
    if (sub) sub.style.display = "block";
    if (id === "ventasDelDia") mostrarVentasDelDia();

}

// Autocompletar producto
function autocompletarProducto() {
    const codigo = document.getElementById("codigoProducto").value.trim();
    const nombreDiv = document.getElementById("nombreProducto");
    const precioDiv = document.getElementById("precioAuto");

    if (productos[codigo]) {
        nombreDiv.textContent = `Producto: ${productos[codigo].nombre}`;
        precioDiv.textContent = `Precio/kg: $${productos[codigo].precio.toFixed(2)}`;
    } else {
        nombreDiv.textContent = "";
        precioDiv.textContent = "";
    }
}

// Agregar al ticket
function agregarAlTicket() {
    const codigo = document.getElementById('codigoProducto').value.trim();
    const kilos = parseFloat(document.getElementById('cantidadKilos').value);

    if (!codigo || isNaN(kilos) || kilos <= 0) {
        alert('Por favor ingrese un código y una cantidad válida.');
        return;
    }

    const inventario = JSON.parse(localStorage.getItem('inventario')) || [];
    const producto = inventario.find(p => p.codigo.trim().toLowerCase() === codigo.toLowerCase());

    if (!producto) {
        alert('Producto no encontrado.');
        return;
    }

    const precioPorKilo = producto.precio;
    const subtotal = kilos * precioPorKilo;

    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td>${producto.nombre}</td>
        <td>${kilos.toFixed(2)}</td>
        <td>$${precioPorKilo.toFixed(2)}</td>
        <td>$${subtotal.toFixed(2)}</td>
    `;

    document.querySelector('#tablaTicket tbody').appendChild(fila);

    let totalActual = parseFloat(document.getElementById('totalTicket').dataset.total || "0");
    totalActual += subtotal;
    document.getElementById('totalTicket').dataset.total = totalActual;
    document.getElementById('totalTicket').textContent = `Total: $${totalActual.toFixed(2)}`;

    // Guardar temporalmente el ticket para futura venta
    // Guardar temporalmente el ticket para futura venta
    const ticketActual = JSON.parse(localStorage.getItem('ticketActual')) || [];
    ticketActual.push({
        codigo: producto.codigo,
        nombre: producto.nombre,
        kilos,
        precioPorKilo,
        subtotal
    });
    localStorage.setItem('ticketActual', JSON.stringify(ticketActual));



    // Mostrar ticket
    function actualizarTicket() {
        const tbody = document.querySelector("#tablaTicket tbody");
        tbody.innerHTML = "";
        let total = 0;

        carrito.forEach(item => {
            total += item.subtotal;
            const fila = document.createElement("tr");
            fila.innerHTML = `
            <td>${item.nombre}</td>
            <td>${item.kilos.toFixed(2)} kg</td>
            <td>$${item.precio.toFixed(2)}</td>
            <td>$${item.subtotal.toFixed(2)}</td>
        `;
            tbody.appendChild(fila);
        });

        document.getElementById("totalTicket").textContent = `Total: $${total.toFixed(2)}`;
        carrito.push(producto);
        console.log(carrito);
    }

}

// Confirmar venta con ventana emergente
function mostrarVentanaPago(total) {
    const modal = document.createElement("div");
    modal.classList.add("modal");

    modal.innerHTML = `
        <div class="modal-contenido">
            <h3>Confirmar Pago</h3>
            <p>Total a pagar: $${total.toFixed(2)}</p>
            
            <label for="metodoPago">Método de pago:</label>
            <select id="metodoPago">
                <option value="efectivo">Efectivo</option>
                <option value="debito">Débito</option>
                <option value="transferencia">Transferencia</option>
            </select>

            <div id="montoRecibidoContainer">
                <label for="montoRecibido">Monto recibido:</label>
                <input type="number" id="montoRecibido" placeholder="Monto entregado" />
            </div>

            <p id="cambioTexto"></p>
            <button onclick="procesarPago()">Confirmar</button>
            <button onclick="cerrarVentana()">Cancelar</button>
        </div>
    `;

    document.body.appendChild(modal);

    const metodoPago = modal.querySelector("#metodoPago");
    const montoContainer = modal.querySelector("#montoRecibidoContainer");
    const montoInput = modal.querySelector("#montoRecibido");
    const cambioTexto = modal.querySelector("#cambioTexto");

    metodoPago.addEventListener("change", () => {
        if (metodoPago.value === "efectivo") {
            montoContainer.style.display = "block";
        } else {
            montoContainer.style.display = "none";
            cambioTexto.textContent = "";
        }
    });

    montoInput.addEventListener("input", () => {
        const monto = parseFloat(montoInput.value);
        if (!isNaN(monto)) {
            const cambio = monto - total;
            cambioTexto.textContent = cambio >= 0 ?
                `Cambio: $${cambio.toFixed(2)}` :
                `Faltan $${Math.abs(cambio).toFixed(2)}`;
        } else {
            cambioTexto.textContent = "";
        }
    });

    // Mostrar/ocultar según el valor por defecto
    metodoPago.dispatchEvent(new Event("change"));
}

function cerrarVentana() {
    const modal = document.querySelector(".modal");
    if (modal) modal.remove();
}

function procesarPago() {
    const metodoPago = document.getElementById("metodoPago").value;
    const montoRecibido = parseFloat(document.getElementById("montoRecibido").value);
    const total = carrito.reduce((sum, item) => sum + item.subtotal, 0);

    if (metodoPago === "efectivo") {
        if (isNaN(montoRecibido) || montoRecibido < total) {
            alert("El monto recibido es insuficiente.");
            return;
        }
    }

    cerrarVentana();
    finalizarVenta(metodoPago);
}
// Reemplazá toda tu función original por esta versión COMPLETA
function confirmarVenta() {
    console.log("Carrito al confirmar:", carrito);
    // A) Verificación de carrito
    if (carrito.length === 0) {
        alert("El ticket está vacío.");
        return;
    }

    // B) Total del ticket
    const total = carrito.reduce((s, i) => s + i.subtotal, 0);

    // C) Construcción del modal
    const modal = document.createElement("div");
    modal.classList.add("modal");
    modal.innerHTML = `
        <div class="modal-contenido">
            <h3>Confirmar Pago</h3>

            <p><strong>Total: $<span id="totalModal">${total.toFixed(2)}</span></strong></p>

            <label for="metodoPago">Método de pago:</label>
            <select id="metodoPago">
                <option value="efectivo">Efectivo</option>
                <option value="debito">Débito</option>
                <option value="transferencia">Transferencia</option>
            </select>

            <div id="montoRecibidoContainer" style="margin-top:10px;">
                <label for="montoRecibido">Monto recibido:</label>
                <input type="number" id="montoRecibido" placeholder="Ingrese monto">
                <p id="cambioTexto" style="margin-top:5px;font-weight:bold;"></p>
            </div>

            <div style="margin-top:15px;display:flex;flex-wrap:wrap;gap:8px;">
                <button id="btnImprimir">🖨️ Imprimir Ticket</button>
                <button id="btnConfirmar">✅ Facturar sin Imprimir</button>
                <button id="btnCancelar">❌ Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // D) Referencias rápidas
    const metodoPagoEl = modal.querySelector("#metodoPago");
    const montoInput = modal.querySelector("#montoRecibido");
    const montoBox = modal.querySelector("#montoRecibidoContainer");
    const cambioTexto = modal.querySelector("#cambioTexto");
    const btnImprimir = modal.querySelector("#btnImprimir");
    const btnConfirmar = modal.querySelector("#btnConfirmar");
    const btnCancelar = modal.querySelector("#btnCancelar");

    // E) Muestra / oculta campo “monto” según forma de pago
    metodoPagoEl.addEventListener("change", () => {
        if (metodoPagoEl.value === "efectivo") {
            montoBox.style.display = "block";
        } else {
            montoBox.style.display = "none";
            cambioTexto.textContent = "";
        }
    });
    metodoPagoEl.dispatchEvent(new Event("change"));

    // F) Cálculo de cambio en tiempo real
    montoInput.addEventListener("input", () => {
        const recibido = parseFloat(montoInput.value);
        if (!isNaN(recibido)) {
            const cambio = recibido - total;
            cambioTexto.textContent = cambio >= 0 ?
                `Cambio: $${cambio.toFixed(2)}` :
                `Faltan $${Math.abs(cambio).toFixed(2)}`;
        } else {
            cambioTexto.textContent = "";
        }
    });

    // G) Flag para evitar duplicados
    let ventaProcesada = false;
    actualizarTotalesCaja();
    console.log("Carrito tras agregar:", carrito);


    // H) Función compartida para registrar la venta
    function procesarVenta(imprimir) {
        if (ventaProcesada) return; // 🔒 bloqueo anti-doble-click
        ventaProcesada = true;

        const metodo = metodoPagoEl.value;
        let recibido = total;
        if (metodo === "efectivo") {
            recibido = parseFloat(montoInput.value);
            if (isNaN(recibido) || recibido < total) {
                alert("Monto recibido insuficiente.");
                ventaProcesada = false; // liberar bloqueo
                return;
            }
        }
        const cambio = metodo === "efectivo" ? (recibido - total) : 0;

        // 1) Registrar venta
        const venta = {
            fecha: new Date().toLocaleString(),
            productos: [...carrito],
            total: parseFloat(total.toFixed(2)),
            metodoPago: metodo,
            dineroRecibido: recibido,
            cambio: cambio,
            devuelta: false
        };
        historialVentas.push(venta);

        // 2) Vaciar carrito y refrescar UI
        carrito = [];
        actualizarTicket();
        actualizarHistorialVentas();
        actualizarTotalesCaja();
        guardarDatos();

        // 3) Cerrar modal
        modal.remove();

        // 4) Imprimir en caso de ser necesario
        if (imprimir) {
            imprimirTicket(venta);
        } else {
            alert("Venta confirmada con éxito.");
        }
    }

    // I) Listeners de botones
    btnImprimir.addEventListener("click", () => procesarVenta(true));
    btnConfirmar.addEventListener("click", () => procesarVenta(false));
    btnCancelar.addEventListener("click", () => modal.remove());
}

// Inventario
function crearProducto() {
    const nombre = document.getElementById("nuevoNombre").value.trim();
    const codigo = document.getElementById("nuevoCodigo").value.trim();
    const precio = parseFloat(document.getElementById("nuevoPrecio").value);

    if (!nombre || !codigo || isNaN(precio) || precio <= 0) {
        return alert("Datos inválidos.");
    }

    productos[codigo] = { nombre, precio, stock: 0 };
    document.getElementById("nuevoNombre").value = "";
    document.getElementById("nuevoCodigo").value = "";
    document.getElementById("nuevoPrecio").value = "";

    actualizarInventarioUI();
    guardarDatos();
}

function actualizarInventarioUI() {
    const lista = document.getElementById("listaInventario");
    if (!lista) return;

    lista.innerHTML = "";

    Object.entries(productos).forEach(([codigo, prod]) => {
        const li = document.createElement("li");
        li.textContent = `${prod.nombre} - Código: ${codigo} - $${prod.precio.toFixed(2)} - Stock: ${prod.stock.toFixed(2)} kg`;
        lista.appendChild(li);
    });
}

function editarProductoInventario() {
    const codigoActual = document.getElementById("codigoEditar").value.trim();
    const nuevoCodigo = document.getElementById("nuevoCodigoEditar").value.trim();
    const nuevoStock = parseFloat(document.getElementById("nuevoStockEditar").value);

    if (!codigoActual) {
        alert("Ingrese el código actual del producto.");
        return;
    }

    if (isNaN(nuevoStock)) {
        alert("Ingrese un stock válido.");
        return;
    }

    // Cargar inventario actual
    const inventario = JSON.parse(localStorage.getItem("inventario")) || [];

    // Buscar producto por código actual
    const productoIndex = inventario.findIndex(p => p.codigo === codigoActual);

    if (productoIndex === -1) {
        alert("No se encontró el producto con ese código.");
        return;
    }

    // Actualizar datos del producto
    if (nuevoCodigo) {
        // Opcional: validar que el nuevo código no esté repetido
        const codigoDuplicado = inventario.some((p, idx) => p.codigo === nuevoCodigo && idx !== productoIndex);
        if (codigoDuplicado) {
            alert("El nuevo código ya existe en otro producto.");
            return;
        }
        inventario[productoIndex].codigo = nuevoCodigo;
    }

    inventario[productoIndex].stock = nuevoStock;

    // Guardar cambios
    localStorage.setItem("inventario", JSON.stringify(inventario));

    // Actualizar listas
    actualizarInventarioPollos();
    actualizarInventarioCarnes();
    actualizarInventarioCajones();

    alert("Producto actualizado correctamente.");

    // Limpiar campos
    document.getElementById("codigoEditar").value = "";
    document.getElementById("nuevoCodigoEditar").value = "";
    document.getElementById("nuevoStockEditar").value = "";
}

// Caja
function agregarMovimientoCaja() {
    const descripcion = document.getElementById("descripcionCaja").value.trim();
    const monto = parseFloat(document.getElementById("montoCaja").value);
    const tipo = document.getElementById("tipoCaja").value;

    if (!descripcion || isNaN(monto) || monto <= 0) {
        return alert("Datos inválidos.");
    }

    movimientosCaja.push({
        descripcion,
        monto,
        tipo,
        fecha: new Date().toLocaleString()
    });

    document.getElementById("descripcionCaja").value = "";
    document.getElementById("montoCaja").value = "";

    actualizarMovimientosCaja();
    actualizarTotalesCaja();
    guardarDatos();
}

function actualizarMovimientosCaja() {
    const lista = document.getElementById("listaMovimientosCaja");
    lista.innerHTML = "";

    movimientosCaja.slice().reverse().forEach(mov => {
        const li = document.createElement("li");
        li.textContent = `${mov.fecha} - ${mov.tipo.toUpperCase()}: ${mov.descripcion} - $${mov.monto.toFixed(2)}`;
        lista.appendChild(li);
    });
}

// Historial
function actualizarHistorialVentas() {
    const lista = document.getElementById("listaHistorialVentas");
    lista.innerHTML = "";

    historialVentas.slice().reverse().forEach(venta => {
        const li = document.createElement("li");
        const detalle = venta.productos.map(p =>
            `${p.nombre} (${p.kilos.toFixed(2)}kg x $${p.precio.toFixed(2)}) = $${p.subtotal.toFixed(2)}`
        ).join("<br>");
        li.innerHTML = `<strong>${venta.fecha}</strong><br>${detalle}<br><strong>Total: $${venta.total.toFixed(2)}</strong>`;
        lista.appendChild(li);
    });
}

// Totales
function actualizarTotalesCaja() {
    const totalFacturas = historialVentas.reduce((acc, v) => acc + v.total, 0);
    const totalEntradas = movimientosCaja.filter(m => m.tipo === "entrada").reduce((acc, m) => acc + m.monto, 0);
    const totalSalidas = movimientosCaja.filter(m => m.tipo === "salida").reduce((acc, m) => acc + m.monto, 0);
    const saldoFinal = totalFacturas + totalEntradas - totalSalidas;

    document.getElementById("totalFacturas").textContent = `Total facturas: $${totalFacturas.toFixed(2)}`;
    document.getElementById("totalEntradas").textContent = `Total entradas: $${totalEntradas.toFixed(2)}`;
    document.getElementById("totalSalidas").textContent = `Total salidas: $${totalSalidas.toFixed(2)}`;
    document.getElementById("saldoFinal").textContent = `Saldo final: $${saldoFinal.toFixed(2)}`;
}

// Inicializar
cargarDatos();
mostrarSeccion("ventas");
mostrarSubseccion("facturar");
actualizarInventarioUI();
actualizarHistorialVentas();
actualizarMovimientosCaja();
actualizarTotalesCaja();


function filtrarVentasDelDia() {
    const hoy = new Date().toLocaleDateString();
    return historialVentas.filter(v => new Date(v.fecha).toLocaleDateString() === hoy && !v.devuelta);
}

function mostrarVentasDelDia() {
    const lista = document.getElementById("listaVentasDelDia");
    const ventas = filtrarVentasDelDia();
    lista.innerHTML = "";

    ventas.forEach((venta, index) => {
        const li = document.createElement("li");
        li.textContent = `${venta.fecha} - Total: $${venta.total.toFixed(2)} - Pago: ${venta.metodoPago}`;
        li.style.cursor = "pointer";
        li.onclick = () => mostrarDetalleVenta(venta, index);
        lista.appendChild(li);
    });
}

function mostrarDetalleVenta(venta, index) {
    ventaSeleccionada = { venta, index };
    const div = document.getElementById("detalleVenta");
    const contenido = document.getElementById("detalleVentaContenido");

    const productosHtml = venta.productos.map(p => `
        <p>${p.nombre} - ${p.kilos.toFixed(2)} kg x $${p.precio.toFixed(2)} = $${p.subtotal.toFixed(2)}</p>
    `).join("");

    contenido.innerHTML = `
        ${productosHtml}
        <p><strong>Total: $${venta.total.toFixed(2)}</strong></p>
        <p>Método de pago: ${venta.metodoPago}</p>
    `;

    div.style.display = "block";
}


ventas.forEach((venta, index) => {
    const li = document.createElement("li");
    li.textContent = `${venta.fecha} - Total: $${venta.total.toFixed(2)} - Pago: ${venta.metodoPago}`;
    li.style.cursor = "pointer";
    li.onclick = () => mostrarDetalleVenta(venta, index);
    lista.appendChild(li);
});

document.getElementById("ventasDelDia").style.display = "block";

function mostrarDetalleVenta(venta, index) {
    ventaSeleccionada = { venta, index };
    const div = document.getElementById("detalleVenta");
    const contenido = document.getElementById("detalleVentaContenido");

    const productosHtml = venta.productos.map(p => `
        <p>${p.nombre} - ${p.kilos.toFixed(2)} kg x $${p.precio.toFixed(2)} = $${p.subtotal.toFixed(2)}</p>
    `).join("");

    contenido.innerHTML = `
        ${productosHtml}
        <p><strong>Total: $${venta.total.toFixed(2)}</strong></p>
        <p>Método de pago: ${venta.metodoPago}</p>
    `;

    div.style.display = "block";
}



ventaSeleccionada = null;
document.getElementById("detalleVenta").style.display = "none";

actualizarInventarioUI();
actualizarMovimientosCaja();
actualizarTotalesCaja();
guardarDatos();
mostrarVentasDelDia();

historialVentas.push({
    fecha: new Date().toLocaleString(),
    productos: [...carrito],
    total: parseFloat(total.toFixed(2)),
    metodoPago: metodo,
    devuelta: false // Asegúrate de agregar esta propiedad
});

function imprimirTicket(venta) {
    let contenido = "";
    contenido += "      *** POLLERÍA LA ESQUINA ***\n";
    contenido += "        Av. Principal 123 - Lima\n";
    contenido += "--------------------------------------\n";
    contenido += `Fecha: ${venta.fecha}\n`;
    contenido += `Método de pago: ${venta.metodoPago}\n`;
    contenido += "--------------------------------------\n";

    venta.items.forEach(item => {
        contenido += `${item.nombre}\n`;
        contenido += `${item.kilos} kg x $${item.precioUnitario} = $${item.subtotal}\n`;
    });

    contenido += "--------------------------------------\n";
    contenido += `TOTAL: $${venta.total}\n`;
    contenido += `Recibido: $${venta.dineroRecibido}\n`;
    contenido += `Cambio: $${venta.dineroRecibido - venta.total}\n`;
    contenido += "--------------------------------------\n";
    contenido += "       ¡Gracias por su compra!\n\n";

    // Crear una nueva ventana para imprimir
    const win = window.open('', '', 'width=300,height=600');
    win.document.write(`<pre>${contenido}</pre>`);
    win.document.close();
    win.print();
}

function imprimirTicket(venta) {
    // Generar texto plano
    let txt = "      *** POLLERÍA ***\n";
    txt += "     Av. Principal 123\n";
    txt += "-----------------------------\n";
    txt += `Fecha: ${venta.fecha}\n`;
    txt += `Pago : ${venta.metodoPago}\n`;
    txt += "-----------------------------\n";
    venta.productos.forEach(p => {
        txt += `${p.nombre}\n`;
        txt += `${p.kilos.toFixed(2)} kg x $${p.precio.toFixed(2)} = $${p.subtotal.toFixed(2)}\n`;
    });
    txt += "-----------------------------\n";
    txt += `TOTAL     : $${venta.total.toFixed(2)}\n`;
    if (venta.metodoPago === "efectivo") {
        txt += `Recibido  : $${venta.dineroRecibido.toFixed(2)}\n`;
        txt += `Cambio    : $${venta.cambio.toFixed(2)}\n`;
    }
    txt += "-----------------------------\n";
    txt += " ¡Gracias por su compra! \n\n";

    // Abrir ventana para imprimir
    const pop = window.open("", "_blank", "width=260,height=600");
    if (!pop) {
        alert("El navegador bloqueó la ventana emergente. Por favor habilítela para imprimir el ticket.");
        return;
    }
    pop.document.write(`<pre style="font-family: monospace; white-space: pre;">${txt}</pre>`);
    pop.document.close();
    pop.focus();
    pop.print();
    // Cerrar la ventana después de imprimir (algunos navegadores requieren onafterprint)
    pop.onafterprint = () => pop.close();
}

function agregarProducto() {
    const codigo = document.getElementById("codigoProducto").value;
    const nombre = document.getElementById("nombreProducto").value;
    const stock = parseInt(document.getElementById("stockProducto").value);
    const precio = parseFloat(document.getElementById("precioProducto").value);
    const categoria = document.getElementById("categoriaProducto").value;

    if (!codigo || !nombre || isNaN(stock) || isNaN(precio) || !categoria) {
        alert("Por favor, completá todos los campos.");
        return;
    }

    const inventario = JSON.parse(localStorage.getItem("inventario")) || [];

    // Verificar si el código ya existe
    const existente = inventario.find(p => p.codigo === codigo);
    if (existente) {
        alert("Ya existe un producto con ese código.");
        return;
    }

    const nuevoProducto = {
        codigo,
        nombre,
        stock,
        precio,
        categoria
    };

    inventario.push(nuevoProducto);
    localStorage.setItem("inventario", JSON.stringify(inventario));

    // Actualizar la tabla correspondiente
    if (categoria === "pollos") {
        actualizarTablaPollos();
    } else if (categoria === "carnes") {
        actualizarTablaCarnes();
    } else if (categoria === "cajones") {
        actualizarTablaCajones();
    }

    // Limpiar formulario
    document.getElementById("codigoProducto").value = "";
    document.getElementById("nombreProducto").value = "";
    document.getElementById("stockProducto").value = "";
    document.getElementById("precioProducto").value = "";
    document.getElementById("categoriaProducto").value = "";
}

function actualizarTablaPollos() {
    const inventario = JSON.parse(localStorage.getItem("inventario")) || [];
    const pollos = inventario.filter(p => p.categoria === "pollos");
    const tabla = document.getElementById("tablaPollos");
    tabla.innerHTML = "";

    pollos.forEach(prod => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${prod.codigo}</td>
      <td>${prod.nombre}</td>
      <td>${prod.stock}</td>
      <td>$${prod.precio.toFixed(2)}</td>
    `;
        tabla.appendChild(row);
    });
}

function actualizarTablaCarnes() {
    const inventario = JSON.parse(localStorage.getItem("inventario")) || [];
    const carnes = inventario.filter(p => p.categoria === "carnes");
    const tabla = document.getElementById("tablaCarnes");
    tabla.innerHTML = "";

    carnes.forEach(prod => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${prod.codigo}</td>
      <td>${prod.nombre}</td>
      <td>${prod.stock}</td>
      <td>$${prod.precio.toFixed(2)}</td>
    `;
        tabla.appendChild(row);
    });
}

function actualizarTablaCajones() {
    const inventario = JSON.parse(localStorage.getItem("inventario")) || [];
    const cajones = inventario.filter(p => p.categoria === "cajones");
    const tabla = document.getElementById("tablaCajones");
    tabla.innerHTML = "";

    cajones.forEach(prod => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${prod.codigo}</td>
      <td>${prod.nombre}</td>
      <td>${prod.stock}</td>
      <td>$${prod.precio.toFixed(2)}</td>
    `;
        tabla.appendChild(row);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    actualizarTablaPollos();
    actualizarTablaCarnes();
    actualizarTablaCajones();
});

// Mostrar solo la categoría seleccionada en inventario
function mostrarCategoria(categoria) {
    document.getElementById("listaInventarioPollo").style.display = categoria === "pollo" ? "block" : "none";
    document.getElementById("listaInventarioCarne").style.display = categoria === "carne" ? "block" : "none";
    document.getElementById("listaInventarioCajones").style.display = categoria === "cajones" ? "block" : "none";
}

// Funciones para actualizar cada lista de inventario
function actualizarInventarioPollos() {
    const inventario = JSON.parse(localStorage.getItem("inventario")) || [];
    const lista = document.getElementById("listaInventarioPollo");
    lista.innerHTML = "";

    inventario.filter(p => p.categoria === "pollo").forEach(producto => {
        const li = document.createElement("li");
        li.textContent = `${producto.codigo} - ${producto.nombre} - Stock: ${producto.stock} kg - $${producto.precio.toFixed(2)}/kg`;
        lista.appendChild(li);
    });
}

function actualizarInventarioCarnes() {
    const inventario = JSON.parse(localStorage.getItem("inventario")) || [];
    const lista = document.getElementById("listaInventarioCarne");
    lista.innerHTML = "";

    inventario.filter(p => p.categoria === "carne").forEach(producto => {
        const li = document.createElement("li");
        li.textContent = `${producto.codigo} - ${producto.nombre} - Stock: ${producto.stock} kg - $${producto.precio.toFixed(2)}/kg`;
        lista.appendChild(li);
    });
}

function actualizarInventarioCajones() {
    const inventario = JSON.parse(localStorage.getItem("inventario")) || [];
    const lista = document.getElementById("listaInventarioCajones");
    lista.innerHTML = "";

    inventario.filter(p => p.categoria === "cajones").forEach(producto => {
        const li = document.createElement("li");
        li.textContent = `${producto.codigo} - ${producto.nombre} - Stock: ${producto.stock} kg - $${producto.precio.toFixed(2)}/kg`;
        lista.appendChild(li);
    });
}

// Función para agregar un nuevo producto al inventario
function crearProducto() {
    const nombre = document.getElementById("nuevoNombre").value.trim();
    const codigo = document.getElementById("nuevoCodigo").value.trim();
    const precio = parseFloat(document.getElementById("nuevoPrecio").value);
    const stock = parseFloat(document.getElementById("nuevoStock").value);
    const categoria = document.getElementById("nuevoCategoria").value;

    if (!nombre || !codigo || isNaN(precio) || isNaN(stock) || !categoria) {
        alert("Por favor, complete todos los campos correctamente.");
        return;
    }

    let inventario = JSON.parse(localStorage.getItem("inventario")) || [];

    // Verifica que el código no exista ya
    if (inventario.some(p => p.codigo === codigo)) {
        alert("Ya existe un producto con ese código.");
        return;
    }

    const nuevoProducto = {
        nombre,
        codigo,
        precio,
        stock,
        categoria
    };

    inventario.push(nuevoProducto);
    localStorage.setItem("inventario", JSON.stringify(inventario));
    alert("Producto agregado correctamente.");

    // Limpiar campos
    document.getElementById("nuevoNombre").value = "";
    document.getElementById("nuevoCodigo").value = "";
    document.getElementById("nuevoPrecio").value = "";
    document.getElementById("nuevoStock").value = "";
    document.getElementById("nuevoCategoria").value = "";

    mostrarInventario(); // refrescar lista visual
}


// Al cargar la página, mostrar inventario de pollos por defecto y actualizar todas las listas
window.onload = function() {
    mostrarCategoria("pollo");
    actualizarInventarioPollos();
    actualizarInventarioCarnes();
    actualizarInventarioCajones();
};

// Variables globales para los gráficos
let chartIngresos = null;
let chartGastos = null;

function actualizarTotalesYCaja() {
    const ventas = JSON.parse(localStorage.getItem("historialVentas")) || [];
    const movimientosCaja = JSON.parse(localStorage.getItem("movimientosCaja")) || [];

    // Totales ventas
    let totalFacturas = ventas.length;
    let totalGenerado = 0;
    let totalEfectivo = 0;
    let totalDebito = 0;
    let totalTransferencia = 0;

    ventas.forEach(v => {
        totalGenerado += v.total;

        switch (v.metodoPago) {
            case "efectivo":
                totalEfectivo += v.total;
                break;
            case "debito":
                totalDebito += v.total;
                break;
            case "transferencia":
                totalTransferencia += v.total;
                break;
        }
    });

    // Totales caja (entradas y salidas)
    let totalEntradas = 0;
    let totalSalidas = 0;
    movimientosCaja.forEach(mov => {
        if (mov.tipo === "entrada") {
            totalEntradas += mov.monto;
        } else if (mov.tipo === "salida") {
            totalSalidas += mov.monto;
        }
    });

    // Saldo final efectivo en caja = total efectivo en ventas + entradas - salidas
    const saldoFinal = totalEfectivo + totalEntradas - totalSalidas;

    // Actualizar texto en HTML
    document.getElementById("totalFacturas").textContent = `Total facturas: ${totalFacturas}`;
    document.getElementById("totalGenerado").textContent = `Total generado: $${totalGenerado.toFixed(2)}`;
    document.getElementById("totalEfectivo").textContent = `Total efectivo: $${totalEfectivo.toFixed(2)}`;
    document.getElementById("totalDebito").textContent = `Total débito: $${totalDebito.toFixed(2)}`;
    document.getElementById("totalTransferencia").textContent = `Total transferencia: $${totalTransferencia.toFixed(2)}`;
    document.getElementById("totalEntradas").textContent = `Total entradas: $${totalEntradas.toFixed(2)}`;
    document.getElementById("totalSalidas").textContent = `Total salidas: $${totalSalidas.toFixed(2)}`;
    document.getElementById("saldoFinal").innerHTML = `<strong>Saldo final en caja: $${saldoFinal.toFixed(2)}</strong>`;

    // Actualizar gráficos
    actualizarGraficoIngresos(totalGenerado, totalEntradas);
    actualizarGraficoGastos(totalSalidas);
}

function actualizarGraficoIngresos(totalVentas, totalEntradas) {
    const ctx = document.getElementById('graficoIngresos').getContext('2d');
    const data = {
        labels: ['Ventas', 'Entradas'],
        datasets: [{
            label: 'Ingresos',
            data: [totalVentas, totalEntradas],
            backgroundColor: ['#4caf50', '#2196f3'],
        }]
    };

    if (chartIngresos) {
        chartIngresos.data = data;
        chartIngresos.update();
    } else {
        chartIngresos = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

function actualizarGraficoGastos(totalSalidas) {
    const ctx = document.getElementById('graficoGastos').getContext('2d');
    const data = {
        labels: ['Gastos'],
        datasets: [{
            label: 'Egresos',
            data: [totalSalidas],
            backgroundColor: ['#f44336'],
        }]
    };

    if (chartGastos) {
        chartGastos.data = data;
        chartGastos.update();
    } else {
        chartGastos = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}



function actualizarTotalesyCaja() {
    const ventas = JSON.parse(localStorage.getItem("historialVentas")) || [];
    const movimientosCaja = JSON.parse(localStorage.getItem("movimientosCaja")) || [];

    let totalFacturas = ventas.length;
    let totalGenerado = 0;
    let totalEfectivo = 0;
    let totalDebito = 0;
    let totalTransferencia = 0;

    ventas.forEach(v => {
        totalGenerado += v.total;
        switch (v.metodoPago) {
            case "efectivo":
                totalEfectivo += v.total;
                break;
            case "debito":
                totalDebito += v.total;
                break;
            case "transferencia":
                totalTransferencia += v.total;
                break;
        }
    });

    let totalEntradas = 0;
    let totalSalidas = 0;
    movimientosCaja.forEach(mov => {
        if (mov.tipo === "entrada") totalEntradas += mov.monto;
        else if (mov.tipo === "salida") totalSalidas += mov.monto;
    });

    const saldoFinal = totalEfectivo + totalEntradas - totalSalidas;

    document.getElementById("totalFacturas").textContent = `Total facturas: ${totalFacturas}`;
    document.getElementById("totalGenerado").textContent = `Total generado: $${totalGenerado.toFixed(2)}`;
    document.getElementById("totalEfectivo").textContent = `Total efectivo: $${totalEfectivo.toFixed(2)}`;
    document.getElementById("totalDebito").textContent = `Total débito: $${totalDebito.toFixed(2)}`;
    document.getElementById("totalTransferencia").textContent = `Total transferencia: $${totalTransferencia.toFixed(2)}`;
    document.getElementById("totalEntradas").textContent = `Total entradas: $${totalEntradas.toFixed(2)}`;
    document.getElementById("totalSalidas").textContent = `Total salidas: $${totalSalidas.toFixed(2)}`;
    document.getElementById("saldoFinal").innerHTML = `<strong>Saldo final en caja: $${saldoFinal.toFixed(2)}</strong>`;

    // Actualizar gráficos
    actualizarGraficoIngresos(totalGenerado, totalEntradas);
    actualizarGraficoGastos(totalSalidas);
}

function actualizarGraficoIngresos(totalVentas, totalEntradas) {
    const ctx = document.getElementById('graficoIngresos').getContext('2d');
    const data = {
        labels: ['Ventas', 'Entradas'],
        datasets: [{
            label: 'Ingresos',
            data: [totalVentas, totalEntradas],
            backgroundColor: ['#4caf50', '#2196f3'],
        }]
    };

    if (chartIngresos) {
        chartIngresos.data = data;
        chartIngresos.update();
    } else {
        chartIngresos = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

function actualizarGraficoGastos(totalSalidas) {
    const ctx = document.getElementById('graficoGastos').getContext('2d');
    const data = {
        labels: ['Gastos'],
        datasets: [{
            label: 'Egresos',
            data: [totalSalidas],
            backgroundColor: ['#f44336'],
        }]
    };

    if (chartGastos) {
        chartGastos.data = data;
        chartGastos.update();
    } else {
        chartGastos = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

function imprimirTotales() {
    const totalFacturas = document.getElementById('totalFacturas').textContent;
    const totalEntradas = document.getElementById('totalEntradas').textContent;
    const totalSalidas = document.getElementById('totalSalidas').textContent;
    const saldoFinal = document.getElementById('saldoFinal').textContent;

    // Estos elementos deben existir en tu HTML y actualizarse correctamente:
    const totalDebito = document.getElementById('totalDebito') ? document.getElementById('totalDebito').textContent : 'Débito: $0.00';
    const totalTransferencia = document.getElementById('totalTransferencia') ? document.getElementById('totalTransferencia').textContent : 'Transferencia: $0.00';
    const totalEfectivo = document.getElementById('totalEfectivo') ? document.getElementById('totalEfectivo').textContent : 'Efectivo: $0.00';
    const totalGeneral = document.getElementById('totalGeneral') ? document.getElementById('totalGeneral').textContent : 'Total general: $0.00';

    const estilosImpresion = `
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #333;
            }
            h2 {
                text-align: center;
                color: #007BFF;
                margin-bottom: 20px;
                border-bottom: 2px solid #007BFF;
                padding-bottom: 5px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 12px 15px;
                text-align: left;
            }
            th {
                background-color: #007BFF;
                color: white;
            }
            tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .saldo-final {
                font-weight: bold;
                font-size: 1.1em;
                color: #28a745;
                margin-top: 20px;
                text-align: right;
            }
        </style>
    `;

    const contenido = `
        <h2>Resumen Totales y Caja</h2>
        <table>
            <tr><th>Concepto</th><th>Monto</th></tr>
            <tr><td>Total facturas</td><td>${totalFacturas.replace('Total facturas: ', '')}</td></tr>
            <tr><td>Total débito</td><td>${totalDebito.replace('Débito: ', '')}</td></tr>
            <tr><td>Total transferencia</td><td>${totalTransferencia.replace('Transferencia: ', '')}</td></tr>
            <tr><td>Total efectivo</td><td>${totalEfectivo.replace('Efectivo: ', '')}</td></tr>
            <tr><td>Total entradas</td><td>${totalEntradas.replace('Total entradas: ', '')}</td></tr>
            <tr><td>Total salidas</td><td>${totalSalidas.replace('Total salidas: ', '')}</td></tr>
        </table>
        <p class="saldo-final">${saldoFinal}</p>
        <p class="saldo-final" style="text-align: left; margin-top: 10px;">${totalGeneral}</p>
    `;

    const ventanaImpresion = window.open('', '', 'width=700,height=600');
    ventanaImpresion.document.write('<html><head><title>Imprimir Totales</title>');
    ventanaImpresion.document.write(estilosImpresion);
    ventanaImpresion.document.write('</head><body>');
    ventanaImpresion.document.write(contenido);
    ventanaImpresion.document.write('</body></html>');
    ventanaImpresion.document.close();
    ventanaImpresion.focus();
    ventanaImpresion.print();
    ventanaImpresion.close();
}

function buscarProductoPorCodigo(codigo) {
    const inventario = JSON.parse(localStorage.getItem("inventario")) || [];
    // asegurarse de comparar como texto siempre
    return inventario.find(p => String(p.codigo).trim() === String(codigo).trim());
}
const nuevoProducto = {
    nombre,
    codigo: String(codigo), // <- esto
    precio,
    stock,
    categoria
};


function autocompletarProducto() {
    const codigo = document.getElementById("codigoProducto").value;
    const producto = buscarProductoPorCodigo(codigo);

    if (producto) {
        document.getElementById("nombreProducto").textContent = producto.nombre;
        document.getElementById("precioAuto").textContent = `$${producto.precio.toFixed(2)} por kg`;
    } else {
        document.getElementById("nombreProducto").textContent = "Producto no encontrado";
        document.getElementById("precioAuto").textContent = "";
    }
}

// Cargar ajustes al iniciar
window.onload = function() {
    document.getElementById('nombreNegocio').value = localStorage.getItem('nombreNegocio') || '';
    document.getElementById('direccionLocal').value = localStorage.getItem('direccionLocal') || '';
    document.getElementById('nombreCajero').value = localStorage.getItem('cajero') || '';
    document.getElementById('imprimirAuto').checked = localStorage.getItem('imprimirAuto') === 'true';

    // Inicializar categorías dinámicas si existen
    const categoriasGuardadas = JSON.parse(localStorage.getItem('categoriasExtras') || '[]');
    categoriasGuardadas.forEach(cat => agregarCategoriaAHTML(cat));
};

// Guardar nombre del negocio
function guardarNombreNegocio() {
    const nombre = document.getElementById('nombreNegocio').value.trim();
    if (nombre) {
        localStorage.setItem('nombreNegocio', nombre);
        alert('Nombre del negocio guardado.');
    }
}

// Guardar dirección
function guardarDireccionLocal() {
    const direccion = document.getElementById('direccionLocal').value.trim();
    if (direccion) {
        localStorage.setItem('direccionLocal', direccion);
        alert('Dirección guardada.');
    }
}

// Guardar nombre del cajero
function guardarCajero() {
    const cajero = document.getElementById('nombreCajero').value.trim();
    if (cajero) {
        localStorage.setItem('cajero', cajero);
        alert('Nombre del cajero guardado.');
    }
}

// Agregar nueva categoría de inventario
function agregarCategoria() {
    const nueva = document.getElementById('nuevaCategoria').value.trim().toLowerCase();
    if (!nueva) return;

    const categorias = JSON.parse(localStorage.getItem('categoriasExtras') || '[]');
    if (categorias.includes(nueva)) {
        alert('Esa categoría ya existe.');
        return;
    }

    categorias.push(nueva);
    localStorage.setItem('categoriasExtras', JSON.stringify(categorias));
    agregarCategoriaAHTML(nueva);
    alert('Categoría agregada. Recargá la página si no aparece en otras secciones.');
}

// Agregar visualmente la nueva categoría al HTML (ver inventario)
function agregarCategoriaAHTML(nombre) {
    const lista = document.createElement('ul');
    lista.id = `listaInventario${nombre}`;
    lista.className = 'listaInventarioCategoria';
    lista.style.display = 'none';
    document.getElementById('verInventario').appendChild(lista);

    const btn = document.createElement('button');
    btn.textContent = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    btn.onclick = () => mostrarCategoria(nombre);
    document.querySelector('#verInventario .tabs').appendChild(btn);

    const opcion = document.createElement('option');
    opcion.value = nombre;
    opcion.textContent = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    document.getElementById('nuevoCategoria').appendChild(opcion);
}

// Exportar todos los datos
function exportarDatos() {
    const datos = {
        productos: JSON.parse(localStorage.getItem('productos') || '[]'),
        historialVentas: JSON.parse(localStorage.getItem('historialVentas') || '[]'),
        movimientosCaja: JSON.parse(localStorage.getItem('movimientosCaja') || '[]'),
        categoriasExtras: JSON.parse(localStorage.getItem('categoriasExtras') || '[]'),
        nombreNegocio: localStorage.getItem('nombreNegocio') || '',
        direccionLocal: localStorage.getItem('direccionLocal') || '',
        cajero: localStorage.getItem('cajero') || '',
        imprimirAuto: localStorage.getItem('imprimirAuto') || 'false'
    };

    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'datos_polleria.json';
    a.click();
}

// Importar datos
function importarDatos(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();
    lector.onload = function(e) {
        const contenido = JSON.parse(e.target.result);
        localStorage.setItem('productos', JSON.stringify(contenido.productos || []));
        localStorage.setItem('historialVentas', JSON.stringify(contenido.historialVentas || []));
        localStorage.setItem('movimientosCaja', JSON.stringify(contenido.movimientosCaja || []));
        localStorage.setItem('categoriasExtras', JSON.stringify(contenido.categoriasExtras || []));
        localStorage.setItem('nombreNegocio', contenido.nombreNegocio || '');
        localStorage.setItem('direccionLocal', contenido.direccionLocal || '');
        localStorage.setItem('cajero', contenido.cajero || '');
        localStorage.setItem('imprimirAuto', contenido.imprimirAuto || 'false');
        alert('Datos importados correctamente. Recargá la página.');
    };
    lector.readAsText(archivo);
}

// Guardar configuración de impresión
function guardarConfiguracionImpresion() {
    localStorage.setItem('imprimirAuto', document.getElementById('imprimirAuto').checked);
}

// Restablecer todo el sistema
function restablecerSistema() {
    if (confirm('¿Estás seguro de que querés borrar todos los datos? Esta acción no se puede deshacer.')) {
        localStorage.clear();
        alert('Sistema restablecido. Se reiniciará la página.');
        location.reload();
    }
}

function agregarCategoriaAHTML(nombre) {
    const lista = document.createElement('ul');
    lista.id = `listaInventario${nombre}`;
    lista.className = 'listaInventarioCategoria';
    lista.style.display = 'none';
    document.getElementById('verInventario').appendChild(lista);

    const btn = document.createElement('button');
    btn.textContent = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    btn.onclick = () => mostrarCategoria(nombre);
    document.querySelector('#verInventario .tabs').appendChild(btn);

    const opcion = document.createElement('option');
    opcion.value = nombre;
    opcion.textContent = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    document.getElementById('nuevoCategoria').appendChild(opcion);
}
const categoriasGuardadas = JSON.parse(localStorage.getItem('categoriasExtras') || '[]');
categoriasGuardadas.forEach(cat => agregarCategoriaAHTML(cat));

document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();
});