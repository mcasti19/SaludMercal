# 🏥 SaludMercal

Sistema de gestión de salud para Mercal Venezuela. Plataforma web full-stack compuesta por un **frontend** en Next.js y un **backend** API en Laravel con PostgreSQL.

---

## 📁 Estructura del Proyecto

```
saludmercal/
├── frontend/          # Aplicación web — Next.js 16 + React 19 + TypeScript
└── backend/           # API REST — Laravel 12 + Sanctum + PostgreSQL
```

---

## 🧩 Stack Tecnológico

| Capa       | Tecnología                              |
|------------|------------------------------------------|
| Frontend   | Next.js 16, React 19, TypeScript         |
| Estilos    | TailwindCSS 4, shadcn/ui, Radix UI       |
| Backend    | Laravel 12, PHP 8.4                      |
| Auth       | Laravel Sanctum (SPA tokens)             |
| Base de datos | PostgreSQL                            |
| Gestor paquetes JS | pnpm                            |
| Gestor paquetes PHP | Composer                          |

---

## ⚙️ Requisitos Previos

- **Node.js** >= 20.x
- **pnpm** >= 9.x → `npm install -g pnpm`
- **PHP** >= 8.2
- **Composer** >= 2.x
- **PostgreSQL** >= 15

---

## 🚀 Instalación y Arranque

### 1. Clonar el repositorio

```bash
git clone https://github.com/mcasti19/SaludMercal.git
cd SaludMercal
```

---

### 2. Frontend (Next.js)

```bash
cd frontend

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.template .env.local
# Editar .env.local con los valores correspondientes

# Iniciar servidor de desarrollo
pnpm dev
```

El frontend estará disponible en: **http://localhost:3000**

---

### 3. Backend (Laravel + PostgreSQL)

```bash
cd backend

# Instalar dependencias PHP
composer install

# Configurar variables de entorno
cp .env.template .env

# Editar .env con tus credenciales de PostgreSQL:
#   DB_DATABASE=saludmercal
#   DB_USERNAME=tu_usuario
#   DB_PASSWORD=tu_contraseña

# Generar clave de aplicación
php artisan key:generate

# Crear la base de datos en PostgreSQL (si no existe)
# psql -U postgres -c "CREATE DATABASE saludmercal;"

# Ejecutar migraciones
php artisan migrate

# Iniciar servidor de desarrollo
php artisan serve
```

El backend estará disponible en: **http://localhost:8000**

---

## 🔐 Variables de Entorno

Cada subcarpeta contiene su propio `.env.template`. **Nunca subas archivos `.env` con valores reales** al repositorio.

| Archivo | Propósito |
|---------|-----------|
| `frontend/.env.template` | Variables del frontend (URLs, etc.) |
| `backend/.env.template` | Variables del backend (DB, Sanctum, etc.) |

---

## 🌿 Ramas Git

| Rama | Descripción |
|------|-------------|
| `main` | Código estable / producción |
| `developer` | Rama de desarrollo activa |

---

## 📄 Licencia

Proyecto interno — SaludMercal Venezuela. Todos los derechos reservados.
