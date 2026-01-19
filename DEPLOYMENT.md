# Guía de Despliegue con PM2 en Ubuntu

## Requisitos Previos

- Ubuntu Server 20.04 o superior
- Node.js 18+ instalado
- MongoDB instalado y corriendo
- PM2 instalado globalmente

## Instalación de Dependencias

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18 (si no está instalado)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar MongoDB (si no está instalado)
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

## Configuración del Proyecto

```bash
# Clonar o subir el proyecto al servidor
cd /home/ubuntu
git clone <tu-repositorio> e-comerce
cd e-comerce/backend

# Instalar dependencias
npm install --production

# Crear directorio de logs
mkdir -p logs

# Configurar variables de entorno
cp .env.production .env
nano .env  # Editar con valores reales de producción
```

## Variables de Entorno a Configurar

Edita `.env` y actualiza:

- `MONGO_URI`: URL de MongoDB de producción
- `PAYPHONE_RESPONSE_URL`: URL pública de tu dominio (ej: https://tudominio.com/order-confirmation)
- `SMTP_USER` y `SMTP_PASS`: Credenciales de email reales

## Iniciar con PM2

```bash
# Iniciar la aplicación
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs
pm2 logs e-comerce-backend

# Monitorear en tiempo real
pm2 monit
```

## Comandos Útiles de PM2

```bash
# Reiniciar la app
pm2 restart e-comerce-backend

# Detener la app
pm2 stop e-comerce-backend

# Ver logs de errores
pm2 logs e-comerce-backend --err

# Limpiar logs
pm2 flush

# Guardar configuración actual
pm2 save

# Configurar PM2 para iniciar al arrancar el sistema
pm2 startup
# Ejecutar el comando que PM2 muestre
pm2 save
```

## Configurar Nginx como Proxy Reverso

```bash
# Instalar Nginx
sudo apt install -y nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/e-comerce
```

Contenido del archivo:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/e-comerce /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## Configurar SSL con Let's Encrypt (Opcional pero Recomendado)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado SSL
sudo certbot --nginx -d tu-dominio.com

# Renovación automática ya está configurada
```

## Configurar Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir MongoDB (solo localhost)
sudo ufw allow from 127.0.0.1 to any port 27017

# Ver estado
sudo ufw status
```

## Monitoreo y Mantenimiento

```bash
# Ver uso de recursos
pm2 monit

# Ver métricas
pm2 describe e-comerce-backend

# Actualizar la aplicación
cd /home/ubuntu/e-comerce/backend
git pull
npm install --production
pm2 restart e-comerce-backend

# Backup de MongoDB
mongodump --db e-comerce --out /backup/mongodb-$(date +%Y%m%d)

# Ver logs del sistema
journalctl -u nginx -f
```

## Solución de Problemas

### La app no inicia
```bash
# Ver logs detallados
pm2 logs e-comerce-backend --lines 100

# Ver errores
pm2 logs e-comerce-backend --err

# Reiniciar desde cero
pm2 delete e-comerce-backend
pm2 start ecosystem.config.js
```

### MongoDB no conecta
```bash
# Verificar que MongoDB esté corriendo
sudo systemctl status mongodb

# Reiniciar MongoDB
sudo systemctl restart mongodb

# Ver logs de MongoDB
sudo tail -f /var/log/mongodb/mongodb.log
```

### Puerto 3001 ya en uso
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :3001

# Matar proceso
sudo kill -9 <PID>
```

## Seguridad Adicional

1. **No exponer MongoDB al exterior**: Asegúrate de que MongoDB solo escuche en localhost
2. **Usar variables de entorno**: Nunca commitear `.env` al repositorio
3. **Actualizar regularmente**: Mantener Node.js, MongoDB y dependencias actualizadas
4. **Configurar fail2ban**: Proteger contra ataques de fuerza bruta SSH
5. **Limitar tasa de peticiones**: Configurar rate limiting en Nginx

## Estructura de Logs

Los logs se guardan en:
- `/home/ubuntu/e-comerce/backend/logs/out.log` - Logs estándar
- `/home/ubuntu/e-comerce/backend/logs/err.log` - Logs de errores
- `/home/ubuntu/e-comerce/backend/logs/combined.log` - Logs combinados

Rotar logs automáticamente:

```bash
# Instalar logrotate config
sudo nano /etc/logrotate.d/e-comerce
```

Contenido:
```
/home/ubuntu/e-comerce/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
```
