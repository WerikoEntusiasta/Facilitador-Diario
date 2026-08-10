# 📱 Facilitador Diário (KeepBoard)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker Image](https://img.shields.io/badge/docker-werikoliveira%2Ffacilitadordiario-blue?logo=docker)
![Android APK](https://img.shields.io/badge/Android-APK%20Dispon%C3%ADvel-brightgreen?logo=android)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20SQLite%20%7C%20Capacitor-informational)

O **Facilitador Diário** é uma plataforma web e móvel completa desenvolvida para organizar sua vida diária, rotinas de treino, tarefas, notas, calendários e documentos PDF em um só lugar.

---

## 🚀 Principais Funcionalidades

- 📝 **Notas estilo Google Keep**: Crie notas rápidas, marque com cores personalizadas, etiquetas, listas de checagem e fixe itens importantes.
- 🏋️ **Ficha de Treino Semanal de Academia**: Monte e acompanhe suas rotinas de treino por dia da semana (Segunda a Domingo), organizando séries, repetições, cargas em kg, observações de execução e marcação de progresso diário. Inclui fichas pré-configuradas (ABC Hipertrofia, Foco Glúteos/Pernas, etc.).
- 📋 **Quadros Kanban Interativos**: Gerencie projetos por colunas (*A Fazer*, *Em Progresso*, *Concluído*) com suporte a tags, prazos e movimentação de cartões.
- 📅 **Calendário & Lembretes**: Visualize compromissos e agende lembretes integrados.
- 📄 **Central de Documentos PDF**: Faça upload e armazene arquivos PDF com visualização integrada e organização por categorias.
- 📱 **Aplicativo Android Nativo (.APK)**: Instale diretamente no seu smartphone Android com suporte a sincronização offline/online.

---

## 📱 Download do App Android (.APK)

Você pode baixar e instalar o aplicativo nativo para Android de duas formas:

### 1. Download Direto via Web App
Acesse a aba **"App Android & Sync"** dentro do sistema rodando no seu navegador ou clique no botão de download direto:
- **URL de Download da APK**: `/api/android/download`

### 2. Download no GitHub Releases
Acesse a página de Releases do repositório para baixar a versão mais recente do arquivo `.apk`:
1. Acesse **[Releases](../../releases)** no GitHub.
2. Baixe o arquivo `facilitador-diario.apk`.
3. No seu dispositivo Android, permita a instalação de fontes desconhecidas se solicitado e abra o arquivo baixado.

---

## 🐳 Executando com Docker & Docker Compose

A aplicação pode ser rodada facilmente via Docker utilizando a imagem oficial publicada no Docker Hub: **`werikoliveira/facilitadordiario`**.

### Usando Docker Compose

1. Na raiz do projeto, execute:
   ```bash
   docker-compose up -d
   ```
2. Acesse a aplicação no seu navegador em: `http://localhost:3000`

### docker-compose.yml
```yaml
version: '3.8'

services:
  facilitador-diario:
    image: werikoliveira/facilitadordiario:latest
    container_name: facilitadordiario-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
    volumes:
      - keepboard_data:/app/data

volumes:
  keepboard_data:
    driver: local
```

---

## 📤 Como Compilar e Fazer Push para o Docker Hub

Para compilar a imagem localmente e enviá-la para o seu repositório no Docker Hub (`werikoliveira/facilitadordiario`):

### Comandos Manuais no Terminal:
```bash
# 1. Autenticar no Docker Hub
docker login

# 2. Compilar a imagem Docker especificando a sua tag desejada
docker build -t werikoliveira/facilitadordiario:latest -t werikoliveira/facilitadordiario:v1.0.0 .

# 3. Fazer o push da imagem
docker push werikoliveira/facilitadordiario:latest
docker push werikoliveira/facilitadordiario:v1.0.0
```

### Usando o Script Automatizado:
Execute o script em bash fornecido no repositório:
```bash
bash docker-push.sh
```

---

## ⚙️ Configuração das Variáveis no GitHub (GitHub Actions)

O repositório inclui um pipeline do GitHub Actions localizado em `.github/workflows/docker-publish.yml` que compila e faz o `docker push` automaticamente para o Docker Hub a cada novo *push* ou *tag*.

Para o pipeline funcionar, configure as seguintes **Secrets** no repositório no GitHub:

1. Acesse o seu repositório no GitHub.
2. Vá em **Settings** > **Secrets and variables** > **Actions**.
3. Clique em **New repository secret** e adicione as seguintes variáveis:

| Nome da Secret | Descrição / Valor |
| :--- | :--- |
| `DOCKERHUB_USERNAME` | O seu nome de usuário do Docker Hub (ex: `werikoliveira`). |
| `DOCKERHUB_TOKEN` | Um **Personal Access Token** gerado no Docker Hub em **Account Settings > Security > New Access Token**. |

---

## 🛠️ Desenvolvimento Local

Para rodar o projeto em modo de desenvolvimento localmente sem Docker:

### Pré-requisitos
- Node.js (v18 ou superior)
- npm ou yarn

### Passos:
```bash
# 1. Instalar as dependências do projeto
npm install

# 2. Iniciar o servidor de desenvolvimento (Frontend + Backend Express)
npm run dev
```

Acesse `http://localhost:3000` no seu navegador.

---

## 📄 Licença

Este projeto está sob a licença MIT. Sinta-se livre para utilizar, modificar e distribuir.
