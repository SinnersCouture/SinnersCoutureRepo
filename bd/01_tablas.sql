-- Tabla: usuarios
CREATE TABLE usuarios (
    usuario_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hash_contrasena VARCHAR(255) NOT NULL,
    es_admin BOOLEAN DEFAULT FALSE
);

-- Tabla: colecciones
CREATE TABLE colecciones (
    coleccion_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    fecha_lanzamiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hash_contrasena_acceso VARCHAR(255),
    esta_activa BOOLEAN DEFAULT TRUE
);

-- Tabla: productos
CREATE TABLE productos (
    producto_id INT PRIMARY KEY AUTO_INCREMENT,
    coleccion_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (coleccion_id) REFERENCES colecciones(coleccion_id)
        ON DELETE CASCADE
);

-- Tabla: tallas
CREATE TABLE tallas (
    talla_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(20) NOT NULL
);

-- Tabla: inventario (producto + talla + stock)
CREATE TABLE inventario (
    inventario_id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    talla_id INT NOT NULL,
    cantidad_stock INT NOT NULL DEFAULT 0,
    FOREIGN KEY (producto_id) REFERENCES productos(producto_id)
        ON DELETE CASCADE,
    FOREIGN KEY (talla_id) REFERENCES tallas(talla_id)
        ON DELETE CASCADE,
    UNIQUE (producto_id, talla_id)  -- evito crear duplicados de combinaciones producto+talla
);

-- Tabla: carrito
CREATE TABLE carrito (
    carrito_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL UNIQUE,  -- 1:1 con usuario
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE
);

-- Tabla: carrito_items
CREATE TABLE carrito_items (
    item_carrito_id INT PRIMARY KEY AUTO_INCREMENT,
    carrito_id INT NOT NULL,
    inventario_id INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    FOREIGN KEY (carrito_id) REFERENCES carrito(carrito_id)
        ON DELETE CASCADE,
    FOREIGN KEY (inventario_id) REFERENCES inventario(inventario_id)
        ON DELETE CASCADE
);

-- Tabla: pedidos
CREATE TABLE pedidos (
    pedido_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    importe_total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'pagado', 'enviado', 'cancelado', 'completado') NOT NULL DEFAULT 'pendiente',
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE
);

-- Tabla: pedido_items
CREATE TABLE pedido_items (
    item_pedido_id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NOT NULL,
    inventario_id INT NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_compra DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(pedido_id)
        ON DELETE CASCADE,
    FOREIGN KEY (inventario_id) REFERENCES inventario(inventario_id)
        ON DELETE CASCADE
);

-- Tabla: publicaciones
CREATE TABLE publicaciones (
    publicacion_id INT PRIMARY KEY AUTO_INCREMENT,
    autor_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (autor_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE
);

-- Tabla: comentarios
CREATE TABLE comentarios (
    comentario_id INT PRIMARY KEY AUTO_INCREMENT,
    publicacion_id INT NOT NULL,
    usuario_id INT NOT NULL,
    contenido TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publicacion_id) REFERENCES publicaciones(publicacion_id)
        ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE
);

-- Tabla: encuestas
CREATE TABLE encuestas (
    encuesta_id INT PRIMARY KEY AUTO_INCREMENT,
    pregunta TEXT NOT NULL,
    creada_por_id INT NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    esta_activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (creada_por_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE
);

-- Tabla: opciones_encuesta
CREATE TABLE opciones_encuesta (
    opcion_id INT PRIMARY KEY AUTO_INCREMENT,
    encuesta_id INT NOT NULL,
    texto_opcion VARCHAR(255) NOT NULL,
    FOREIGN KEY (encuesta_id) REFERENCES encuestas(encuesta_id)
        ON DELETE CASCADE
);

-- Tabla: votos
CREATE TABLE votos (
    voto_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    encuesta_id INT NOT NULL,
    opcion_id INT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON DELETE CASCADE,
    FOREIGN KEY (encuesta_id) REFERENCES encuestas(encuesta_id)
        ON DELETE CASCADE,
    FOREIGN KEY (opcion_id) REFERENCES opciones_encuesta(opcion_id)
        ON DELETE CASCADE,
    UNIQUE (usuario_id, encuesta_id) -- un usuario vota una vez por encuesta
);
