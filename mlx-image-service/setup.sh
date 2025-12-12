#!/bin/bash

# MLX Image Service Setup Script
# For Apple Silicon Macs (M1/M2/M3/M4)

echo "🎨 Setting up MLX Image Service..."

cd "$(dirname "$0")"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the MLX image service:"
echo "  cd mlx-image-service"
echo "  source venv/bin/activate"
echo "  python server.py"
echo ""
echo "The service will run on http://localhost:8189"
echo ""
echo "First image generation will download the FLUX.1-schnell model (~12GB)"
echo "Subsequent generations will be fast (8-25 seconds on M4 Max)"
