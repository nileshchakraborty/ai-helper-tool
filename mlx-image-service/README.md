# MLX Image Generation Service

Fast Stable Diffusion inference using Apple MLX on M-series Macs.

## Requirements
- macOS 14+ (Sonoma)
- M1/M2/M3/M4 Mac
- Python 3.10+

## Setup
```bash
cd mlx-image-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run
```bash
python server.py
# Server starts on http://localhost:8189
```

## Performance
| Device | Resolution | Time |
|--------|------------|------|
| M4 Max | 512x512 | ~8 sec |
| M4 Max | 1024x1024 | ~25 sec |

## API
```bash
curl -X POST http://localhost:8189/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "binary tree diagram"}'
```
