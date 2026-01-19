#!/bin/bash

###############################################################################
# Script de Deploy para E-Commerce Backend
# Autor: Auto-generado
# Fecha: 19 de enero de 2026
###############################################################################

set -e  # Salir si cualquier comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funciones de utilidad
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Banner
echo "================================================"
echo "  E-Commerce Backend - Script de Deployment"
echo "================================================"
echo ""

# 1. Verificar que estamos en un repositorio git
print_info "Verificando repositorio git..."
if [ ! -d .git ]; then
    print_error "Este directorio no es un repositorio git"
    exit 1
fi
print_success "Repositorio git detectado"

# 2. Guardar cambios locales si existen (stash)
print_info "Guardando cambios locales temporalmente..."
git stash save "Auto-stash antes de deploy $(date)"
print_success "Cambios guardados"

# 3. Obtener última versión del código
print_info "Descargando última versión del código..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_info "Branch actual: $BRANCH"
git pull origin $BRANCH
print_success "Código actualizado"

# 4. Instalar/actualizar dependencias
print_info "Instalando dependencias..."
npm install --production
print_success "Dependencias instaladas"

# 5. Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 no está instalado. Instalando globalmente..."
    npm install -g pm2
    print_success "PM2 instalado"
fi

# 6. Crear directorio de logs si no existe
mkdir -p logs
print_success "Directorio de logs verificado"

# 7. Crear directorio de archivos si no existe
mkdir -p files
print_success "Directorio de archivos verificado"

# 8. Verificar archivo .env
if [ ! -f .env ]; then
    print_error "Archivo .env no encontrado. Por favor créalo antes de continuar."
    exit 1
fi
print_success "Archivo .env encontrado"

# 9. Reiniciar aplicación con PM2
print_info "Reiniciando aplicación..."

if pm2 list | grep -q "e-comerce-backend"; then
    # La aplicación ya existe, hacer reload
    print_info "Aplicación detectada, haciendo reload..."
    pm2 reload ecosystem.config.js --env production
    print_success "Aplicación reiniciada"
else
    # Primera vez, iniciar la aplicación
    print_info "Primera vez, iniciando aplicación..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    print_success "Aplicación iniciada"
fi

# 10. Mostrar estado de la aplicación
echo ""
print_info "Estado de la aplicación:"
pm2 status e-comerce-backend

# 11. Mostrar logs recientes
echo ""
print_info "Últimas líneas del log:"
pm2 logs e-comerce-backend --lines 10 --nostream

echo ""
echo "================================================"
print_success "Deploy completado exitosamente!"
echo "================================================"
echo ""
print_info "Comandos útiles:"
echo "  - Ver logs:      pm2 logs e-comerce-backend"
echo "  - Ver estado:    pm2 status"
echo "  - Reiniciar:     pm2 restart e-comerce-backend"
echo "  - Detener:       pm2 stop e-comerce-backend"
echo ""
