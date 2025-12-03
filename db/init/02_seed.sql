-- Seed data for Sinners Couture shop (minimal)
-- Assumes fresh database from 01_tablas.sql

-- Configurar charset UTF-8 para la sesión
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET character_set_connection = utf8mb4;

-- Tallas
INSERT INTO tallas (nombre) VALUES
  ('XS'),
  ('S'),
  ('M'),
  ('L'),
  ('XL');

-- Colecciones
INSERT INTO colecciones (nombre, fecha_lanzamiento, esta_activa) VALUES
  ('FW25', '2024-10-01 00:00:00', TRUE),
  ('SS26', '2025-03-15 00:00:00', TRUE);

-- Cache talla IDs
SET @t_xs := (SELECT talla_id FROM tallas WHERE nombre = 'XS' LIMIT 1);
SET @t_s  := (SELECT talla_id FROM tallas WHERE nombre = 'S'  LIMIT 1);
SET @t_m  := (SELECT talla_id FROM tallas WHERE nombre = 'M'  LIMIT 1);
SET @t_l  := (SELECT talla_id FROM tallas WHERE nombre = 'L'  LIMIT 1);
SET @t_xl := (SELECT talla_id FROM tallas WHERE nombre = 'XL' LIMIT 1);

-- Cache coleccion IDs
SET @c_fw25 := (SELECT coleccion_id FROM colecciones WHERE nombre = 'FW25' LIMIT 1);
SET @c_ss26 := (SELECT coleccion_id FROM colecciones WHERE nombre = 'SS26' LIMIT 1);

-- Productos para FW25
INSERT INTO productos (coleccion_id, nombre, precio) VALUES
  (@c_fw25, 'Camiseta Negra', 29.99),
  (@c_fw25, 'Sudadera Oversize', 59.90);

-- Productos para SS26
INSERT INTO productos (coleccion_id, nombre, precio) VALUES
  (@c_ss26, 'Camiseta Blanca', 24.99),
  (@c_ss26, 'Pantalón Cargo', 49.50);

-- Cache producto IDs por nombre
SET @p_cam_negra := (SELECT producto_id FROM productos WHERE nombre = 'Camiseta Negra' LIMIT 1);
SET @p_sud_overs := (SELECT producto_id FROM productos WHERE nombre = 'Sudadera Oversize' LIMIT 1);
SET @p_cam_blanca := (SELECT producto_id FROM productos WHERE nombre = 'Camiseta Blanca' LIMIT 1);
SET @p_pant_cargo := (SELECT producto_id FROM productos WHERE nombre = 'Pantalón Cargo' LIMIT 1);

-- Inventario básico (stock por talla)
-- Camiseta Negra
INSERT INTO inventario (producto_id, talla_id, cantidad_stock) VALUES
  (@p_cam_negra, @t_s, 20),
  (@p_cam_negra, @t_m, 30),
  (@p_cam_negra, @t_l, 25);

-- Sudadera Oversize
INSERT INTO inventario (producto_id, talla_id, cantidad_stock) VALUES
  (@p_sud_overs, @t_m, 15),
  (@p_sud_overs, @t_l, 10),
  (@p_sud_overs, @t_xl, 8);

-- Camiseta Blanca
INSERT INTO inventario (producto_id, talla_id, cantidad_stock) VALUES
  (@p_cam_blanca, @t_xs, 12),
  (@p_cam_blanca, @t_s, 22),
  (@p_cam_blanca, @t_m, 18);

-- Pantalón Cargo
INSERT INTO inventario (producto_id, talla_id, cantidad_stock) VALUES
  (@p_pant_cargo, @t_s, 10),
  (@p_pant_cargo, @t_m, 14),
  (@p_pant_cargo, @t_l, 9);

-- ============================================
-- Usuarios
-- NOTA: Los hashes de contraseña aquí son placeholders y NO funcionan para login.
-- Los usuarios de seed tienen hashes dummy que no coinciden con ninguna contraseña real.
-- Para pruebas reales, crea usuarios nuevos usando el endpoint POST /auth/register
-- o actualiza manualmente estos usuarios con hashes bcrypt válidos.
INSERT INTO usuarios (nombre, email, hash_contrasena, es_admin) VALUES
  ('Admin', 'admin@example.com', REPEAT('x', 60), TRUE),
  ('Carlos', 'carlos@example.com', REPEAT('y', 60), FALSE),
  ('Lucia', 'lucia@example.com', REPEAT('z', 60), FALSE);

-- Cache usuarios
SET @u_admin  := (SELECT usuario_id FROM usuarios WHERE email = 'admin@example.com'  LIMIT 1);
SET @u_carlos := (SELECT usuario_id FROM usuarios WHERE email = 'carlos@example.com' LIMIT 1);
SET @u_lucia  := (SELECT usuario_id FROM usuarios WHERE email = 'lucia@example.com'  LIMIT 1);

-- ============================================
-- Carritos e items (para Carlos)
INSERT INTO carrito (usuario_id) VALUES (@u_carlos);
SET @carrito_carlos := LAST_INSERT_ID();

-- Elegimos algunos inventarios existentes
SET @inv_cam_negra_m := (SELECT inventario_id FROM inventario i INNER JOIN tallas t ON t.talla_id=i.talla_id WHERE producto_id=@p_cam_negra AND t.nombre='M' LIMIT 1);
SET @inv_pant_cargo_m := (SELECT inventario_id FROM inventario i INNER JOIN tallas t ON t.talla_id=i.talla_id WHERE producto_id=@p_pant_cargo AND t.nombre='M' LIMIT 1);

INSERT INTO carrito_items (carrito_id, inventario_id, cantidad) VALUES
  (@carrito_carlos, @inv_cam_negra_m, 2),
  (@carrito_carlos, @inv_pant_cargo_m, 1);

-- ============================================
-- Pedido de Lucia con items (simula checkout)
-- Calcular totales según precios en el momento
SET @inv_sud_overs_l := (SELECT inventario_id FROM inventario i INNER JOIN tallas t ON t.talla_id=i.talla_id WHERE producto_id=@p_sud_overs AND t.nombre='L' LIMIT 1);
SET @inv_cam_blanca_s := (SELECT inventario_id FROM inventario i INNER JOIN tallas t ON t.talla_id=i.talla_id WHERE producto_id=@p_cam_blanca AND t.nombre='S' LIMIT 1);

SET @precio_sud := (SELECT precio FROM productos WHERE producto_id=@p_sud_overs LIMIT 1);
SET @precio_cam := (SELECT precio FROM productos WHERE producto_id=@p_cam_blanca LIMIT 1);

SET @importe_total := (@precio_sud * 1) + (@precio_cam * 2);

INSERT INTO pedidos (usuario_id, importe_total, estado) VALUES
  (@u_lucia, @importe_total, 'pagado');
SET @pedido_lucia := LAST_INSERT_ID();

INSERT INTO pedido_items (pedido_id, inventario_id, cantidad, precio_compra) VALUES
  (@pedido_lucia, @inv_sud_overs_l, 1, @precio_sud),
  (@pedido_lucia, @inv_cam_blanca_s, 2, @precio_cam);

-- ============================================
-- Publicaciones y comentarios
INSERT INTO publicaciones (autor_id, titulo, contenido) VALUES
  (@u_admin,  'Bienvenida a Sinners Couture', 'Nos complace anunciar el lanzamiento de nuestra nueva colección FW25. Esta temporada trae diseños únicos que combinan estilo urbano con elementos de alta costura. Explora nuestras nuevas prendas y encuentra tu estilo perfecto.'),
  (@u_carlos, 'Making of FW25',              'Te invitamos a conocer el proceso creativo detrás de nuestra colección FW25. Desde el diseño inicial hasta la producción final, cada pieza ha sido cuidadosamente elaborada con atención al detalle y compromiso con la calidad.'),
  (@u_admin,  'Nueva colección SS26 disponible', 'La colección primavera-verano 2026 ya está disponible. Con colores frescos y diseños ligeros, perfectos para la temporada. No te pierdas nuestras ofertas de lanzamiento.'),
  (@u_lucia,  'Mi experiencia con Sinners Couture', 'Comparto mi experiencia como cliente de Sinners Couture. La calidad de las prendas es excepcional y el servicio al cliente es impecable. ¡Recomendado totalmente!');

SET @pub_bienvenida := (SELECT publicacion_id FROM publicaciones WHERE titulo='Bienvenida a Sinners Couture' LIMIT 1);
SET @pub_makingof   := (SELECT publicacion_id FROM publicaciones WHERE titulo='Making of FW25' LIMIT 1);
SET @pub_ss26       := (SELECT publicacion_id FROM publicaciones WHERE titulo='Nueva colección SS26 disponible' LIMIT 1);
SET @pub_experiencia := (SELECT publicacion_id FROM publicaciones WHERE titulo='Mi experiencia con Sinners Couture' LIMIT 1);

INSERT INTO comentarios (publicacion_id, usuario_id, contenido) VALUES
  (@pub_bienvenida, @u_lucia,  'Me encanta la nueva línea! Ya tengo varios productos en mi carrito.'),
  (@pub_bienvenida, @u_carlos, 'Excelente colección, especialmente la Sudadera Oversize.'),
  (@pub_makingof,   @u_admin,  'Gran trabajo del equipo. Es importante mostrar el proceso creativo.'),
  (@pub_makingof,   @u_lucia,  'Interesante ver cómo se crean las prendas. Aprecio la transparencia.'),
  (@pub_ss26,       @u_carlos, 'Los colores de la nueva colección son perfectos para primavera.'),
  (@pub_experiencia, @u_admin, 'Gracias por compartir tu experiencia. Nos alegra saber que estás satisfecha.');

-- ============================================
-- Encuestas, opciones y votos

-- Encuesta activa: Color favorito para camisetas
INSERT INTO encuestas (pregunta, creada_por_id, fecha_fin, esta_activa) VALUES
  ('¿Color favorito para camisetas?', @u_admin, DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE);

SET @encuesta_colores := LAST_INSERT_ID();

INSERT INTO opciones_encuesta (encuesta_id, texto_opcion) VALUES
  (@encuesta_colores, 'Negro'),
  (@encuesta_colores, 'Blanco'),
  (@encuesta_colores, 'Rojo'),
  (@encuesta_colores, 'Gris');

SET @op_negro := (SELECT opcion_id FROM opciones_encuesta WHERE encuesta_id=@encuesta_colores AND texto_opcion='Negro' LIMIT 1);
SET @op_blanco := (SELECT opcion_id FROM opciones_encuesta WHERE encuesta_id=@encuesta_colores AND texto_opcion='Blanco' LIMIT 1);
SET @op_rojo := (SELECT opcion_id FROM opciones_encuesta WHERE encuesta_id=@encuesta_colores AND texto_opcion='Rojo' LIMIT 1);

INSERT INTO votos (usuario_id, encuesta_id, opcion_id) VALUES
  (@u_carlos, @encuesta_colores, @op_negro),
  (@u_lucia,  @encuesta_colores, @op_blanco);

-- Encuesta activa: Preferencia de talla
INSERT INTO encuestas (pregunta, creada_por_id, fecha_fin, esta_activa) VALUES
  ('¿Qué talla prefieres para prendas oversize?', @u_admin, DATE_ADD(NOW(), INTERVAL 45 DAY), TRUE);

SET @encuesta_tallas := LAST_INSERT_ID();

INSERT INTO opciones_encuesta (encuesta_id, texto_opcion) VALUES
  (@encuesta_tallas, 'Talla normal'),
  (@encuesta_tallas, 'Una talla más grande'),
  (@encuesta_tallas, 'Dos tallas más grandes');

SET @op_talla_normal := (SELECT opcion_id FROM opciones_encuesta WHERE encuesta_id=@encuesta_tallas AND texto_opcion='Talla normal' LIMIT 1);
SET @op_talla_uno := (SELECT opcion_id FROM opciones_encuesta WHERE encuesta_id=@encuesta_tallas AND texto_opcion='Una talla más grande' LIMIT 1);

INSERT INTO votos (usuario_id, encuesta_id, opcion_id) VALUES
  (@u_carlos, @encuesta_tallas, @op_talla_uno),
  (@u_lucia,  @encuesta_tallas, @op_talla_normal);

-- Encuesta cerrada (para mostrar resultados históricos)
INSERT INTO encuestas (pregunta, creada_por_id, fecha_fin, esta_activa) VALUES
  ('¿Qué tipo de producto te interesa más?', @u_admin, DATE_SUB(NOW(), INTERVAL 7 DAY), FALSE);

SET @encuesta_cerrada := LAST_INSERT_ID();

INSERT INTO opciones_encuesta (encuesta_id, texto_opcion) VALUES
  (@encuesta_cerrada, 'Camisetas'),
  (@encuesta_cerrada, 'Sudaderas'),
  (@encuesta_cerrada, 'Pantalones'),
  (@encuesta_cerrada, 'Accesorios');

SET @op_camisetas := (SELECT opcion_id FROM opciones_encuesta WHERE encuesta_id=@encuesta_cerrada AND texto_opcion='Camisetas' LIMIT 1);
SET @op_sudaderas := (SELECT opcion_id FROM opciones_encuesta WHERE encuesta_id=@encuesta_cerrada AND texto_opcion='Sudaderas' LIMIT 1);
SET @op_pantalones := (SELECT opcion_id FROM opciones_encuesta WHERE encuesta_id=@encuesta_cerrada AND texto_opcion='Pantalones' LIMIT 1);

INSERT INTO votos (usuario_id, encuesta_id, opcion_id) VALUES
  (@u_carlos, @encuesta_cerrada, @op_camisetas),
  (@u_lucia,  @encuesta_cerrada, @op_sudaderas),
  (@u_admin,  @encuesta_cerrada, @op_pantalones);


