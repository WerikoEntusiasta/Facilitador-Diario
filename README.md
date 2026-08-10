# 📱 KeepFlow

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker Image](https://img.shields.io/badge/docker-werikoliveira%2Fkeepflow-blue?logo=docker)
![Android APK](https://img.shields.io/badge/Android-APK%20Dispon%C3%ADvel-brightgreen?logo=android)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20SQLite%20%7C%20Capacitor-informational)

O **KeepFlow** é uma plataforma web e móvel completa desenvolvida para organizar sua vida diária, rotinas de treino, tarefas, notas, calendários, cofre de senhas e documentos PDF em um só lugar com armazenamento SQLite e sincronização rápida.

---

## 🚀 Principais Funcionalidades

- 📝 **Notas estilo Google Keep**: Crie notas rápidas, marque com cores personalizadas, etiquetas, listas de checagem e fixe itens importantes.
- 🏋️ **Ficha de Treino Semanal de Academia**: Monte e acompanhe suas rotinas de treino por dia da semana (Segunda a Domingo), organizando séries, repetições, cargas em kg, observações de execução e marcação de progresso diário. Inclui fichas pré-configuradas (ABC Hipertrofia, Foco Glúteos/Pernas, etc.).
- 🔐 **Cofre de Senhas Seguro**: Armazene com segurança logins, senhas, cartões de crédito e notas secretas com gerador automático de senhas fortes.
- 📋 **Quadros Kanban Interativos**: Gerencie projetos por colunas (*A Fazer*, *Em Progresso*, *Concluído*) com suporte a tags, prazos e movimentação de cartões.
- 📅 **Calendário & Lembretes**: Visualize compromissos e agende lembretes integrados.
- 📄 **Central de Documentos PDF**: Faça upload e armazene arquivos PDF com visualização integrada e organização por categorias.
- 📱 **Aplicativo Android Nativo (.APK / PWA)**: Suporte completo para uso em dispositivos móveis.

---

## 🐳 Executando com Docker & ZimaOS / CasaOS

A aplicação está pronta para ser executada via Docker e totalmente compatível com **ZimaOS**, **CasaOS** e **Portainer** utilizando a imagem do Docker Hub: **`werikoliveira/keepflow`**.

### 🖥️ Como instalar no ZimaOS / CasaOS

1. Abra o painel do **ZimaOS** ou **CasaOS**.
2. Clique no botão **+** e selecione **"Instalar aplicativo personalizado"** (Custom App).
3. No canto superior direito da tela de instalação, clique em **"Importar"** (Import / Docker Compose).
4. Cole o conteúdo do arquivo `docker-compose.yml` e confirme.
5. O ZimaOS preencherá automaticamente o nome (**KeepFlow**), ícone, porta `3000` e mapeamentos de volumes de dados e uploads!

---

## 🚀 Como fazer commit / exportar para o GitHub

Como o ambiente do **Google AI Studio** roda em uma máquina virtual gerenciada online (sem diretório `.git` local direto), você pode enviar o código para o GitHub de duas maneiras simples:

### Opção 1: Exportar direto pelo Google AI Studio (Mais Fácil)
1. No menu superior direito da interface do **Google AI Studio**, clique no botão de **Export / Settings**.
2. Selecione a opção **"Export to GitHub"** (ou **"Download ZIP"**).
3. Ao conectar sua conta do GitHub, escolha o repositório `werikoliveira/keepflow` para publicar todas as atualizações diretamente!

### Opção 2: Se você baixou o ZIP do projeto
Extraia o arquivo ZIP no seu computador e rode no terminal:
```bash
git init
git add .
git commit -m "feat: atualizado KeepFlow com suporte ZimaOS e Docker"
git branch -M main
git remote add origin https://github.com/werikoliveira/keepflow.git
git push -u origin main --force
```

---

---

## 📤 Como Compilar e Fazer Push para o Docker Hub

Para compilar a imagem localmente e enviá-la para o seu repositório no Docker Hub (`werikoliveira/keepflow`):

### Comandos Manuais no Terminal:
```bash
# 1. Autenticar no Docker Hub
docker login

# 2. Compilar a imagem Docker especificando a sua tag desejada
docker build -t werikoliveira/keepflow:latest -t werikoliveira/keepflow:v1.0.0 .

# 3. Fazer o push da imagem
docker push werikoliveira/keepflow:latest
docker push werikoliveira/keepflow:v1.0.0
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

