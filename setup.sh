#!/bin/bash
# BookLeaf - Full Setup Script
# Run from the bookleaf/ root directory

echo "🍃 BookLeaf Setup"
echo "=================="

# Backend
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

echo ""
echo "🗃️  Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  Created .env from .env.example"
  echo "  ⚠️  IMPORTANT: Add your ANTHROPIC_API_KEY to backend/.env"
else
  echo "  .env already exists"
fi

echo ""
echo "🌱 Seeding database..."
npm run seed

cd ..

# Frontend
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the app:"
echo "  Terminal 1 (backend):  cd backend && npm run dev"
echo "  Terminal 2 (frontend): cd frontend && npm start"
echo ""
echo "Demo logins:"
echo "  Admin:    admin@bookleaf.com / admin123"
echo "  Author 1: arjun@example.com  / author123"
echo "  Author 2: kavya@example.com  / author123"
echo ""
echo "App: http://localhost:3000"
echo "API: http://localhost:5000/api"
