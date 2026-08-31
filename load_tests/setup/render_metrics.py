import sys
from PIL import Image, ImageDraw, ImageFont

text_path, out_path = sys.argv[1], sys.argv[2]

with open(text_path, "r") as f:
    lines = f.read().splitlines()

font_candidates = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
]
font = None
for path in font_candidates:
    try:
        font = ImageFont.truetype(path, 16)
        break
    except OSError:
        continue
if font is None:
    font = ImageFont.load_default()

line_height = 22
padding = 20
width = max(len(line) for line in lines) * 10 + padding * 2
height = len(lines) * line_height + padding * 2

img = Image.new("RGB", (width, height), color=(30, 30, 30))
draw = ImageDraw.Draw(img)

for i, line in enumerate(lines):
    y = padding + i * line_height
    color = (200, 200, 200)
    if "✓" in line:
        color = (100, 220, 100)
    elif "✗" in line:
        color = (220, 100, 100)
    draw.text((padding, y), line, font=font, fill=color)

img.save(out_path)
