# EdLoop Study Hub

A comprehensive platform for students to share notes, create posts, and collaborate on academic content.

## 🏗️ Project Structure

```
edloop-study-hub/
├── frontend/           # React + Vite + TypeScript frontend
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   ├── package.json   # Frontend dependencies
│   └── vite.config.ts # Vite configuration
├── backend/           # Node.js + Express + MongoDB backend
│   ├── routes/        # API routes
│   ├── models/        # Mongoose models
│   ├── middleware/    # Custom middleware
│   ├── services/      # Business logic services
│   ├── config/        # Configuration files
│   └── package.json   # Backend dependencies
├── package.json       # Root package.json for scripts
└── README.md          # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- MongoDB Atlas account or local MongoDB installation

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/edloop-study-hub.git
   cd edloop-study-hub
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   **Backend `.env`:**
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/edloop
   JWT_SECRET=your-jwt-secret-key
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```
   
   This will start both frontend (http://localhost:5173) and backend (http://localhost:3001) servers.

## 🛠️ Available Scripts

### Root Level Scripts
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend development server
- `npm run dev:backend` - Start only the backend development server
- `npm run build` - Build the frontend for production
- `npm run install:all` - Install dependencies for root, frontend, and backend

## 🏭 Features

### Content Management
- **Rich Notes**: Create and share detailed study notes with file attachments
- **Post System**: Share text, links, images, and notes with the community
- **File Uploads**: Support for images, PDFs, and documents
- **Content Validation**: Automatic content sanitization and validation

### User Management
- **Authentication**: JWT-based secure authentication
- **User Profiles**: Complete user profiles with karma system
- **Registration**: Dynamic user registration with MongoDB storage

### Community Features
- **Communities**: Organize content by academic subjects and topics
- **Collaboration**: Multi-user note collaboration with permission system
- **Voting System**: Upvote/downvote posts and content
- **Search & Filter**: Advanced search and filtering capabilities

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5b46180c-49d6-4e33-b542-23b8cfcc1448) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

