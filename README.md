# E-Commerce Backend API - Venta de Libros en PDF

**Versión:** 1.0.0

Backend REST API para gestión de tienda de libros en PDF con pagos integrados a través de Payphone y administración completa de productos.

## 📋 Tabla de Contenidos

- [Requisitos](#requisitos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Variables de Entorno](#variables-de-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API REST - Rutas Públicas](#api-rest---rutas-públicas)
- [API REST - Rutas de Administrador](#api-rest---rutas-de-administrador)
- [Modelos de Datos](#modelos-de-datos)
- [Flujo de Compra](#flujo-de-compra)
- [Autenticación](#autenticación)
- [Docker](#docker)
- [Troubleshooting](#troubleshooting)

---

## 📦 Requisitos

- **Node.js** 20+
- **MongoDB** 5.0+
- **npm** o **pnpm**
- Cuenta de **Payphone** (para integración de pagos)

---

## 🚀 Instalación y Configuración

### Paso 1: Clonar e instalar dependencias

```bash
cd backend
npm install
```

### Paso 2: Configurar variables de entorno

Copie el archivo de ejemplo:

```bash
cp .env.example .env
```

Y complete los valores (ver sección [Variables de Entorno](#variables-de-entorno)).

### Paso 3: Ejecutar en desarrollo

```bash
npm run dev
```

La API estará disponible en `http://localhost:3001/api`

---

## 🔧 Variables de Entorno

Complete el archivo `.env` con los siguientes valores:

```env
# Base de Datos
MONGODB_URI=mongodb://localhost:27017/ecomerce

# Servidor
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=tu_clave_secreta_super_segura_aqui
JWT_EXPIRY=7d

# Payphone (Integración de Pagos)
PAYPHONE_API_KEY=tu_api_key_payphone
PAYPHONE_SECRET=tu_secret_payphone
PAYPHONE_WEBHOOK_SECRET=tu_webhook_secret

# Email (para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_app

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

---

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── app.js                 # Configuración de Express
│   ├── config/
│   │   ├── db.js             # Conexión a MongoDB
│   │   ├── mail.js           # Configuración de email
│   │   ├── multer.js         # Configuración de carga de archivos
│   │   └── payphone.js       # Configuración de Payphone
│   ├── controllers/
│   │   ├── admin.controller.js      # Lógica de administración
│   │   ├── auth.controller.js       # Autenticación y registro
│   │   ├── cart.controller.js       # Carrito de compras
│   │   ├── order.controller.js      # Órdenes
│   │   ├── payment.controller.js    # Pagos
│   │   ├── product.controller.js    # Productos (libros)
│   │   ├── support.controller.js    # Soporte
│   │   └── upload.controller.js     # Carga de archivos
│   ├── middlewares/
│   │   ├── auth.middleware.js       # Validación de JWT
│   │   └── role.middleware.js       # Validación de roles
│   ├── models/
│   │   ├── User.model.js            # Esquema de Usuario
│   │   ├── Product.model.js         # Esquema de Producto/Libro
│   │   ├── Order.model.js           # Esquema de Orden
│   │   └── Cart.model.js            # Esquema de Carrito
│   ├── routes/
│   │   ├── index.js                 # Agregador de rutas
│   │   ├── auth.routes.js           # Rutas de autenticación
│   │   ├── product.routes.js        # Rutas de productos
│   │   ├── admin.routes.js          # Rutas de administrador
│   │   ├── cart.routes.js           # Rutas de carrito
│   │   ├── order.routes.js          # Rutas de órdenes
│   │   ├── payment.routes.js        # Rutas de pagos
│   │   └── support.routes.js        # Rutas de soporte
│   └── services/
│       ├── email.service.js         # Servicio de emails
│       ├── payphone.service.js      # Servicio de Payphone
│       └── pdf.service.js           # Generación de PDFs
├── scripts/
│   ├── create_admin.js              # Script para crear admin
│   └── test_endpoints.js            # Script de prueba de endpoints
├── .env.example                     # Ejemplo de variables de entorno
├── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 📚 API REST - Rutas Públicas

### Autenticación

#### Registrar nuevo usuario
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "Segura123!",
  "name": "Juan Pérez"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "64a9f5d1e3c2b1a9d8e7f6g5",
      "email": "usuario@example.com",
      "name": "Juan Pérez",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Iniciar sesión
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "Segura123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "data": {
    "user": {
      "id": "64a9f5d1e3c2b1a9d8e7f6g5",
      "email": "usuario@example.com",
      "name": "Juan Pérez",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Catálogo de Libros

#### Obtener lista de libros (con búsqueda y paginación)
```http
GET /api/products?q=javascript&page=1&limit=20
```

**Query Parameters:**
- `q` (opcional): Búsqueda de texto en título, sinopsis y autores
- `page` (default: 1): Número de página
- `limit` (default: 20): Resultados por página

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64a9f5d1e3c2b1a9d8e7f6g5",
      "title": "Aprende JavaScript Moderno",
      "synopsis": "Una guía completa para dominar JavaScript ES6+",
      "authors": ["Kyle Simpson"],
      "year": 2023,
      "price": 29.99,
      "payPhoneLink": "https://payphone.com/pay/libro1",
      "coverImage": "https://cdn.example.com/covers/js-moderno.jpg",
      "category": "libros",
      "active": true,
      "createdAt": "2024-01-10T08:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### Obtener detalles de un libro
```http
GET /api/products/64a9f5d1e3c2b1a9d8e7f6g5
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "64a9f5d1e3c2b1a9d8e7f6g5",
    "title": "Aprende JavaScript Moderno",
    "synopsis": "Una guía completa para dominar JavaScript ES6+",
    "authors": ["Kyle Simpson"],
    "year": 2023,
    "price": 29.99,
    "payPhoneLink": "https://payphone.com/pay/libro1",
    "coverImage": "https://cdn.example.com/covers/js-moderno.jpg",
    "category": "libros",
    "active": true,
    "createdAt": "2024-01-10T08:30:00Z"
  }
}
```

---

## 🔐 API REST - Rutas de Administrador

**Nota:** Todas las rutas de admin requieren:
1. Header `Authorization: Bearer <token_jwt>`
2. Rol de usuario: `ADMIN`

### Gestión de Libros (Productos)

#### Listar todos los libros (incluyendo inactivos)
```http
GET /api/admin/products?page=1&limit=50&active=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (default: 1): Número de página
- `limit` (default: 50): Resultados por página
- `active` (optional): true|false para filtrar por estado

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "64a9f5d1e3c2b1a9d8e7f6g5",
      "title": "Aprende JavaScript Moderno",
      "synopsis": "Una guía completa...",
      "authors": ["Kyle Simpson"],
      "year": 2023,
      "price": 29.99,
      "payPhoneLink": "https://payphone.com/pay/libro1",
      "coverImage": "https://cdn.example.com/covers/js-moderno.jpg",
      "pdfUrl": "https://cdn.example.com/files/js-moderno.pdf",
      "active": true,
      "createdBy": {
        "id": "64a9f5d1e3c2b1a9d8e7f6g6",
        "email": "admin@example.com",
        "name": "Administrador"
      },
      "createdAt": "2024-01-10T08:30:00Z",
      "updatedAt": "2024-01-10T08:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 42,
    "pages": 1
  }
}
```

#### Crear un nuevo libro
```http
POST /api/admin/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Aprende Node.js",
  "synopsis": "Guía completa para dominar backend con Node.js y Express",
  "authors": ["Wes Bos", "Scott Tolinski"],
  "year": 2024,
  "price": 34.99,
  "payPhoneLink": "https://payphone.com/pay/node-js-2024",
  "coverImage": "https://cdn.example.com/covers/node-js.jpg",
  "pdfUrl": "https://cdn.example.com/files/node-js.pdf"
}
```

**Campos Requeridos:**
- `title` (string): Título del libro
- `synopsis` (string): Sinopsis o descripción del libro
- `authors` (array): Lista de autores, ej: ["Autor 1", "Autor 2"]
- `year` (number): Año de publicación
- `price` (number): Precio en dólares
- `payPhoneLink` (string): URL de pago en Payphone para este libro
- `coverImage` (string): URL de la portada
- `pdfUrl` (string, opcional): URL del archivo PDF

**Response (201):**
```json
{
  "success": true,
  "message": "Libro creado exitosamente",
  "data": {
    "id": "64a9f5d1e3c2b1a9d8e7f6h7",
    "title": "Aprende Node.js",
    "synopsis": "Guía completa...",
    "authors": ["Wes Bos", "Scott Tolinski"],
    "year": 2024,
    "price": 34.99,
    "payPhoneLink": "https://payphone.com/pay/node-js-2024",
    "coverImage": "https://cdn.example.com/covers/node-js.jpg",
    "category": "libros",
    "active": true,
    "createdBy": "64a9f5d1e3c2b1a9d8e7f6g6",
    "createdAt": "2024-01-14T10:15:00Z",
    "updatedAt": "2024-01-14T10:15:00Z"
  }
}
```

#### Actualizar un libro
```http
PUT /api/admin/products/64a9f5d1e3c2b1a9d8e7f6g5
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 39.99,
  "payPhoneLink": "https://payphone.com/pay/node-js-updated",
  "synopsis": "Guía completa actualizada para dominar Node.js"
}
```

**Campos actualizables (todos opcionales):**
- `title`
- `synopsis`
- `authors`
- `year`
- `price`
- `payPhoneLink`
- `coverImage`
- `pdfUrl`
- `active`

**Response (200):**
```json
{
  "success": true,
  "message": "Libro actualizado exitosamente",
  "data": {
    "id": "64a9f5d1e3c2b1a9d8e7f6g5",
    "title": "Aprende Node.js",
    "price": 39.99,
    "payPhoneLink": "https://payphone.com/pay/node-js-updated",
    "updatedAt": "2024-01-14T11:20:00Z"
  }
}
```

#### Obtener detalles de un libro (admin)
```http
GET /api/admin/products/64a9f5d1e3c2b1a9d8e7f6g5
Authorization: Bearer <token>
```

**Response (200):** Datos completos incluyendo `pdfUrl`

#### Eliminar (desactivar) un libro
```http
DELETE /api/admin/products/64a9f5d1e3c2b1a9d8e7f6g5
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Libro eliminado exitosamente",
  "data": {
    "id": "64a9f5d1e3c2b1a9d8e7f6g5",
    "title": "Aprende Node.js",
    "active": false
  }
}
```

### Dashboard de Administrador

#### Obtener estadísticas generales
```http
GET /api/admin/dashboard
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "usersCount": 245,
    "productsCount": 42,
    "ordersCount": 3120,
    "revenue": 95450.50
  }
}
```

### Gestión de Usuarios

#### Listar todos los usuarios
```http
GET /api/admin/users?page=1&limit=50
Authorization: Bearer <token>
```

#### Cambiar rol de usuario
```http
PUT /api/admin/users/64a9f5d1e3c2b1a9d8e7f6g5/role
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "ADMIN"
}
```

#### Eliminar usuario
```http
DELETE /api/admin/users/64a9f5d1e3c2b1a9d8e7f6g5
Authorization: Bearer <token>
```

### Gestión de Órdenes

#### Listar órdenes
```http
GET /api/admin/orders?page=1&limit=50&status=PENDING
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Número de página
- `limit`: Resultados por página
- `status` (opcional): PENDING|PAID|FAILED

#### Actualizar estado de orden
```http
PUT /api/admin/orders/64a9f5d1e3c2b1a9d8e7f6g5/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "PAID"
}
```

### Estadísticas

#### Ventas por día
```http
GET /api/admin/stats/sales-by-day?from=2024-01-01&to=2024-01-14
Authorization: Bearer <token>
```

#### Productos más vendidos
```http
GET /api/admin/stats/top-products?limit=10
Authorization: Bearer <token>
```

---

## 📊 Modelos de Datos

### Product (Libro)

```javascript
{
  id: ObjectId,
  title: String,           // Título del libro
  synopsis: String,        // Sinopsis/descripción
  authors: [String],       // Array de autores
  year: Number,            // Año de publicación
  price: Number,           // Precio en dólares
  payPhoneLink: String,    // URL de pago Payphone
  coverImage: String,      // URL de portada
  pdfUrl: String,          // URL del PDF (opcional)
  category: String,        // Siempre "libros"
  active: Boolean,         // Si está disponible
  createdBy: ObjectId,     // ID del admin que creó
  createdAt: Date,
  updatedAt: Date
}
```

### User

```javascript
{
  id: ObjectId,
  email: String,           // Email único
  password: String,        // Hash seguro
  name: String,
  role: String,            // "USER" o "ADMIN"
  createdAt: Date
}
```

### Order

```javascript
{
  id: ObjectId,
  userId: ObjectId,
  products: [{
    productId: ObjectId,
    title: String,
    price: Number,
    qty: Number
  }],
  amount: Number,
  paymentStatus: String,   // "PENDING", "PAID", "FAILED"
  payphoneTransactionId: String,
  createdAt: Date
}
```

### Cart

```javascript
{
  id: ObjectId,
  userId: ObjectId,
  products: [{
    productId: ObjectId,
    title: String,
    price: Number,
    qty: Number
  }],
  total: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 💳 Flujo de Compra

### Paso 1: Consultar Catálogo
Usuario accede a `/api/products` para ver lista de libros disponibles.

### Paso 2: Agregar al Carrito
```http
POST /api/cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "64a9f5d1e3c2b1a9d8e7f6g5",
  "qty": 1
}
```

### Paso 3: Ver Carrito
```http
GET /api/cart
Authorization: Bearer <token>
```

### Paso 4: Proceder al Pago
```http
POST /api/payment/payphone
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 29.99,
  "orderId": "64a9f5d1e3c2b1a9d8e7f6i8"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "64a9f5d1e3c2b1a9d8e7f6i8",
    "paymentUrl": "https://payphone.com/checkout?session=..."
  }
}
```

### Paso 5: Usuario paga en Payphone
El usuario es redirigido a Payphone para completar el pago.

### Paso 6: Confirmación y Descarga
Después del pago exitoso:
- La orden se marca como `PAID`
- El usuario recibe un email con el link de descarga del PDF
- Puede descargar el PDF desde su cuenta

---

## 🔐 Autenticación

### Método: JWT (JSON Web Token)

**Header requerido para rutas protegidas:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Validez del token:** 7 días

**Roles disponibles:**
- `USER`: Usuario regular (puede comprar)
- `ADMIN`: Administrador (puede gestionar libros)

---

## 🐳 Docker

### Levantar en desarrollo con Docker Compose

```bash
cd backend
docker compose up --build
```

Esto inicia:
- **API**: http://localhost:3001
- **MongoDB**: localhost:27017

### Construir imagen de producción

```bash
docker build -t ecom-backend:latest .
```

---

## 👨‍💼 Crear Usuario Administrador

Para crear un usuario administrador de prueba:

```bash
node scripts/create_admin.js
```

**Credenciales por defecto:**
- Email: `admin@example.com`
- Password: `Admin123!`

---

## 🧪 Probar Endpoints

Script de prueba disponible:

```bash
node scripts/test_endpoints.js
```

---

## 📄 Documentación Completa API

Ver archivo: [API_DOCUMENTATION.json](./API_DOCUMENTATION.json)

Este archivo contiene documentación detallada de todos los endpoints, parámetros, respuestas y modelos de datos en formato JSON.

---

## ❓ Troubleshooting

### MongoDB no conecta
```bash
# Verificar que MongoDB está corriendo
mongosh

# Si usas Docker:
docker compose up mongo
```

### Puerto 3001 en uso
```bash
# Cambiar puerto en .env
PORT=3002
```

### JWT inválido
- Verificar que el token no ha expirado (7 días)
- Verificar que el header es: `Authorization: Bearer <token>`
- Regenerar token haciendo login de nuevo

### Payphone falla
- Verificar credenciales en `.env` (`PAYPHONE_API_KEY`, `PAYPHONE_SECRET`)
- Comprobar que `PAYPHONE_WEBHOOK_SECRET` está configurado
- Revisar logs del servidor

---

## 🤝 Integración con Frontend

El equipo de frontend puede usar el archivo `API_DOCUMENTATION.json` para integrar la API.

**Pasos recomendados:**
1. Leer `API_DOCUMENTATION.json`
2. Usar endpoints de `/api/auth` para login/registro
3. Guardar token JWT en localStorage
4. Enviar token en header `Authorization` para rutas protegidas
5. Usar endpoints de `/api/products` para mostrar catálogo
6. Usar endpoints de `/api/admin/products` para panel de administrador
7. Integrar flujo de pago de Payphone

---

## 📝 Notas Importantes

- ✅ Los libros se deshabilitan (soft delete) en lugar de eliminarse
- ✅ El historial de órdenes se mantiene para reporting
- ✅ Cada libro tiene su propio link de pago en Payphone
- ✅ Los PDFs pueden ser hospedados en CDN externo o en servidor
- ✅ Búsqueda de texto habilitada en título, sinopsis y autores
- ✅ Todas las respuestas incluyen campo `success` y `message`

---

**Última actualización:** 14 de enero de 2024, versión 1.0.0

