#!/usr/bin/env bash

# Script para compilar e fazer push da imagem Docker para o Docker Hub
# Substitua 'werikplaystore' pelo seu nome de usuário do Docker Hub se necessário.

DOCKER_USER="werikplaystore"
IMAGE_NAME="keepboard"
TAG="latest"
VERSION="v1.0.0"

FULL_IMAGE="${DOCKER_USER}/${IMAGE_NAME}"

echo "========================================================"
echo "🚀 Compilando e Enviando Imagem Docker para o Docker Hub"
echo "   Imagem Target: ${FULL_IMAGE}:${TAG}"
echo "========================================================"

# 1. Build da imagem Docker usando o Dockerfile otimizado
echo "📦 [1/4] Compilando a imagem Docker..."
docker build -t ${FULL_IMAGE}:${TAG} -t ${FULL_IMAGE}:${VERSION} .

if [ $? -ne 0 ]; then
    echo "❌ Erro durante o 'docker build'. Verifique as mensagens acima."
    exit 1
fi

echo "✅ Build concluído com sucesso!"

# 2. Instrução de Login
echo "🔑 [2/4] Verificando autenticação no Docker Hub..."
echo "Se ainda não estiver logado, execute: docker login"

# 3. Push da imagem com tag latest
echo "📤 [3/4] Enviando tag :${TAG} para o Docker Hub..."
docker push ${FULL_IMAGE}:${TAG}

# 4. Push da imagem com tag de versão
echo "📤 [4/4] Enviando tag :${VERSION} para o Docker Hub..."
docker push ${FULL_IMAGE}:${VERSION}

echo "========================================================"
echo "🎉 Sucesso! Imagem publicada no Docker Hub:"
echo "👉 ${FULL_IMAGE}:${TAG}"
echo "👉 ${FULL_IMAGE}:${VERSION}"
echo "========================================================"
