#!/usr/bin/env python3
"""
MLX Image Generation Server

Fast Stable Diffusion inference using Apple MLX on M-series Macs.
Uses mflux for FLUX.1 model which is optimized for Apple Silicon.
"""

import os
import sys
import base64
import io
import subprocess
import tempfile
from flask import Flask, request, jsonify
from PIL import Image

app = Flask(__name__)

# Configuration
PORT = int(os.getenv("MLX_IMAGE_PORT", "8189"))
DEFAULT_STEPS = 4  # FLUX.1-schnell is optimized for 4 steps
DEFAULT_WIDTH = 512
DEFAULT_HEIGHT = 512

def generate_with_mflux(prompt: str, width: int, height: int, steps: int, seed: int = None) -> bytes:
    """Generate image using mflux CLI (FLUX.1 model)."""
    
    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = os.path.join(tmpdir, "output.png")
        
        cmd = [
            sys.executable, "-m", "mflux.generate",
            "--prompt", prompt,
            "--width", str(width),
            "--height", str(height),
            "--steps", str(steps),
            "--output", output_path,
            "--model", "schnell",  # FLUX.1-schnell is fastest
        ]
        
        if seed is not None:
            cmd.extend(["--seed", str(seed)])
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                raise Exception(f"mflux error: {result.stderr}")
            
            # Read the generated image
            with open(output_path, "rb") as f:
                return f.read()
                
        except subprocess.TimeoutExpired:
            raise Exception("Image generation timed out")
        except FileNotFoundError:
            raise Exception("mflux not installed. Run: pip install mflux")


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "engine": "mflux", "model": "FLUX.1-schnell"})


@app.route("/generate", methods=["POST"])
def generate():
    """Generate an image from a text prompt."""
    try:
        data = request.json or {}
        prompt = data.get("prompt", "")
        
        if not prompt:
            return jsonify({"error": "prompt is required"}), 400
        
        width = data.get("width", DEFAULT_WIDTH)
        height = data.get("height", DEFAULT_HEIGHT)
        steps = data.get("steps", DEFAULT_STEPS)
        seed = data.get("seed")
        
        print(f"[MLX] Generating: '{prompt[:50]}...' ({width}x{height}, {steps} steps)")
        
        # Generate image
        image_bytes = generate_with_mflux(prompt, width, height, steps, seed)
        
        # Convert to base64
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")
        
        return jsonify({
            "success": True,
            "image": image_base64,
            "mimeType": "image/png",
            "width": width,
            "height": height
        })
        
    except Exception as e:
        print(f"[MLX] Error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route("/models", methods=["GET"])
def list_models():
    """List available models."""
    return jsonify({
        "models": [
            {
                "id": "flux-schnell",
                "name": "FLUX.1-schnell",
                "description": "Fastest model, 4 steps",
                "recommended_steps": 4
            },
            {
                "id": "flux-dev",
                "name": "FLUX.1-dev",
                "description": "Higher quality, 20+ steps",
                "recommended_steps": 20
            }
        ]
    })


if __name__ == "__main__":
    print(f"[MLX Image Server] Starting on port {PORT}")
    print(f"[MLX Image Server] Using FLUX.1-schnell model (4 steps)")
    print(f"[MLX Image Server] M-series GPU acceleration enabled")
    
    app.run(host="0.0.0.0", port=PORT, debug=False)
