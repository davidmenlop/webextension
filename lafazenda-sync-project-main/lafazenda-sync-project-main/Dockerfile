# Etapa 1: Construcción
FROM node:20-alpine AS builder

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar nest cli
RUN npm i -g @nestjs/cli

# Copiar los archivos package.json y package-lock.json al contenedor
COPY package*.json ./

# Instalar las dependencias (incluyendo dependencias de desarrollo)
RUN npm install

# Copiar el resto del código de la aplicación al contenedor
COPY . .

# Construir la aplicación para producción
RUN npm run build

# Etapa 2: Imagen final
FROM node:20-alpine

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar solo las dependencias de producción desde la etapa de construcción
COPY --from=builder /app/package*.json ./
RUN npm install --production

# Copiar el directorio de construcción desde la etapa de construcción
COPY --from=builder /app/dist ./dist

# Exponer el puerto en el que se ejecutará la aplicación
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["node", "dist/main"]