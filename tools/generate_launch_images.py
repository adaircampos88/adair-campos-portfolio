from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
META = ROOT / "assets" / "meta"
META.mkdir(parents=True, exist_ok=True)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        Path("/System/Library/Fonts/SFNS.ttf"),
        Path("/System/Library/Fonts/SFNSRounded.ttf"),
        Path("/System/Library/Fonts/Helvetica.ttc"),
    ]
    for candidate in candidates:
        if candidate.exists():
            try:
                return ImageFont.truetype(str(candidate), size=size, index=1 if bold else 0)
            except OSError:
                try:
                    return ImageFont.truetype(str(candidate), size=size)
                except OSError:
                    continue
    return ImageFont.load_default()


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *size), radius=radius, fill=255)
    return mask


canvas = Image.new("RGB", (1200, 630), "#eef8fb")
draw = ImageDraw.Draw(canvas)
for y in range(canvas.height):
    mix = y / canvas.height
    color = (
        int(238 * (1 - mix) + 222 * mix),
        int(248 * (1 - mix) + 240 * mix),
        int(251 * (1 - mix) + 246 * mix),
    )
    draw.line((0, y, canvas.width, y), fill=color)

glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
glow_draw.ellipse((710, -180, 1320, 430), fill=(95, 205, 224, 85))
glow_draw.ellipse((-170, 410, 390, 900), fill=(255, 98, 56, 38))
glow = glow.filter(ImageFilter.GaussianBlur(70))
canvas = Image.alpha_composite(canvas.convert("RGBA"), glow)
draw = ImageDraw.Draw(canvas)

draw.rounded_rectangle((54, 50, 1146, 580), radius=48, fill=(255, 255, 255, 212), outline="#c3dce3", width=2)
draw.rounded_rectangle((92, 88, 156, 152), radius=18, fill="#0e3744")
draw.text((115, 95), "A", anchor="ma", fill="white", font=font(37, True))
draw.ellipse((142, 82, 160, 100), fill="#ff6238")

portrait_path = ROOT / "assets" / "profile" / "adair-campos-portrait.jpg"
portrait = Image.open(portrait_path).convert("RGB")
portrait = ImageOps.fit(portrait, (335, 430), method=Image.Resampling.LANCZOS, centering=(0.5, 0.36))
portrait_layer = Image.new("RGBA", (335, 430), (0, 0, 0, 0))
portrait_layer.paste(portrait, (0, 0), rounded_mask((335, 430), 44))
canvas.alpha_composite(portrait_layer, (770, 100))

draw.text((94, 215), "ADAIR CAMPOS", fill="#ff6238", font=font(22, True), spacing=4)
draw.text((94, 258), "Senior Product\nDesigner", fill="#0e3744", font=font(62, True), spacing=-4)
draw.text((96, 410), "Making complex products feel\nsimple and intuitive.", fill="#456671", font=font(31), spacing=8)
draw.rounded_rectangle((94, 508, 392, 552), radius=22, fill="#0e3744")
draw.text((243, 530), "adaircampos.com", anchor="mm", fill="white", font=font(19, True))

canvas.convert("RGB").save(META / "og-portfolio.png", optimize=True)

for size, name in ((180, "apple-touch-icon.png"), (512, "icon-512.png")):
    icon = Image.new("RGB", (size, size), "#0e3744")
    icon_draw = ImageDraw.Draw(icon)
    icon_draw.text((size / 2, size * 0.53), "A", anchor="mm", fill="white", font=font(round(size * 0.54), True))
    radius = max(5, round(size * 0.08))
    icon_draw.ellipse((size * 0.72, size * 0.16, size * 0.72 + radius * 2, size * 0.16 + radius * 2), fill="#ff6238")
    icon.save(META / name, optimize=True)

print("Generated:", META / "og-portfolio.png")
print("Generated:", META / "apple-touch-icon.png")
print("Generated:", META / "icon-512.png")
