#!/usr/bin/env python3
"""Build the demo GIFs of the README (a simulation, not a screen recording).

Claude themes: replays the pixel shaders of claude/plugin/.../scenes/{whale-moon-pixel,pixel-duo}/scene.ts in Python
on the 160x90 still (same hash, same timings), scaled 4x, with a mock frosted-glass chat panel.
Antigravity themes: 4 seconds of each background video with the same mock panel.

Usage: python3 docs/make_demos.py <videos dir> <pixel previews dir>
  videos dir:   antigravity-custom-theme-mod/themes/assets (after antigravity/fetch-videos.sh)
  previews dir: claude/preview (written by claude/make_stills.py)
Needs Pillow and ffmpeg. Writes docs/demo/*.gif."""
import math, os, shutil, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'demo')
COLS, ROWS, SCALE, FPS, SECONDS = 160, 90, 4, 15, 6
M = 0xffffffff


def stir(x, y, k):
    h = (x * 0x2f6b4a9d + y * 0x6d1c85e3 + k * 0x19e4b7a5) & M
    h ^= h >> 15
    h = (h * 0x4b3d92c7) & M
    return h ^ (h >> 13)


def rnd(x, y, k):
    return stir(x, y, k) / 4294967296


def blink(t, duty):
    p = t - math.floor(t)
    return math.sin(p / duty * math.pi) if p < duty else 0.0


def mix(c, d, a):
    return tuple(c[i] + (d[i] - c[i]) * a for i in range(3))


FLY_WHALE = [(0.021, 0.12, 18, 0.41), (0.017, 0.57, 33, 0.29), (0.026, 0.83, 47, 0.53), (0.019, 0.31, 61, 0.37),
             (0.023, 0.69, 104, 0.47), (0.016, 0.05, 118, 0.33), (0.028, 0.44, 131, 0.59), (0.02, 0.91, 145, 0.43),
             (0.025, 0.23, 9, 0.51), (0.018, 0.77, 152, 0.39)]
FLY_DUO = [(0.021, 0.12, 12, 0.41), (0.017, 0.57, 27, 0.29), (0.026, 0.83, 44, 0.53), (0.019, 0.31, 63, 0.37),
           (0.023, 0.69, 98, 0.47), (0.016, 0.05, 115, 0.33), (0.028, 0.44, 133, 0.59), (0.02, 0.91, 149, 0.43),
           (0.025, 0.23, 6, 0.51), (0.018, 0.77, 156, 0.39), (0.022, 0.38, 72, 0.45), (0.024, 0.62, 88, 0.35)]
BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]


class Pixel:
    """Per-pixel constants of the shader: they depend only on the grid, not on time."""
    def __init__(self, still, whale):
        px = still.load()
        self.whale = whale
        p = 0.028 if whale else 0.03
        self.cells = []
        for r in range(ROWS):
            for c in range(COLS):
                col = tuple(v / 255 for v in px[c, r])
                luma = col[0] * 0.3 + col[1] * 0.59 + col[2] * 0.11
                d = math.hypot(c + 0.5 - 83, r + 0.5 - 19)
                if whale:
                    sky = 1 if r < 53 else 0
                    clear = sky * (luma < 0.32) * (d > 38)
                else:
                    sky = 0
                    clear = (r < 54) * (luma < 0.3)
                star = (rnd(c, r, 3) < p, 0.15 + 0.35 * rnd(c, r, 4), rnd(c, r, 5))
                nb = []
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    sx, sy = c - dx, r - dy
                    if rnd(sx, sy, 3) < p and rnd(sx, sy, 6) < 0.3:
                        nb.append((0.15 + 0.35 * rnd(sx, sy, 4), rnd(sx, sy, 5)))
                spark = (luma > 0.72 and rnd(c, r, 9) < 0.06, 0.2 + 0.3 * rnd(c, r, 10), rnd(c, r, 11))
                thr = (BAYER[(c % 4) + (r % 4) * 4] + 0.5) / 16
                self.cells.append((c, r, col, d, sky, clear, star, nb, spark, thr))

    def frame(self, t):
        img = Image.new('RGB', (COLS, ROWS))
        out = img.load()
        flies = FLY_WHALE if self.whale else FLY_DUO
        fpos = []
        for k, (sp, ph, home, drift) in enumerate(flies):
            life = (t * sp + ph) % 1
            fpos.append((math.floor(home + math.sin(t * drift + k) * 3 + 0.5),
                         math.floor(ROWS - 3 - life * (ROWS - 12)), math.sin(life * math.pi)))
        reach = 3 + 3 * (0.5 + 0.5 * math.sin(t * 0.8))
        fall = (t / 9) % 1
        head = math.floor(fall * 3 * ROWS) - 4
        for c, r, col, d, sky, clear, star, nb, spark, thr in self.cells:
            if self.whale and sky and d > 31:
                halo = min(max(1 - (d - 31) / reach, 0), 1)
                if halo * 0.75 > thr:
                    col = mix(col, (0.93, 0.78, 0.86), 0.45)
            s = clear * star[0] * blink(t * star[1] + star[2], 0.6)
            for rate, off in nb:
                pk = blink(t * rate + off, 0.6)
                s = max(s, clear * ((pk - 0.75) * 4 if pk > 0.75 else 0) * 0.7)
            if s:
                col = mix(col, (0.9, 0.93, 1), s)
            if spark[0]:
                col = mix(col, (1, 0.97, 1), blink(t * spark[1] + spark[2], 0.25) * 0.85)
            if not self.whale and abs(c - 79.5) < 1 and fall < 0.36:
                behind = head - r
                if 0 <= behind < 5:
                    col = mix(col, (1, 0.95, 0.85), (1 - behind / 5) * 0.9)
            fly = 0
            for fx, fy, fade in fpos:
                dx, dy = abs(c - fx), abs(r - fy)
                core = 1 if dx < 0.5 and dy < 0.5 else 0
                glow = 0.35 if 0.5 < dx + dy < 1.5 else 0
                fly = max(fly, (core + glow) * fade)
            if fly:
                col = mix(col, (0.78, 0.95, 0.85) if self.whale else (0.85, 0.97, 0.9), min(fly, 1) * (0.9 if self.whale else 0.85))
            out[c, r] = tuple(int(min(v, 1) * 255 + 0.5) for v in col)
        return img


def glass(img, box, tint, radius):
    g = img.crop(box).filter(ImageFilter.GaussianBlur(img.size[0] / 80))
    g = Image.blend(g, Image.new('RGB', g.size, tint), 0.5)
    mask = Image.new('L', g.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, g.size[0] - 1, g.size[1] - 1), radius=radius, fill=255)
    img.paste(g, box[:2], mask)


def panel(img, tint):
    """Mock frosted-glass UI over the backdrop: a narrow sidebar on the left and the message box at the bottom."""
    w, h = img.size
    r = max(w // 90, 3)
    side = (int(w * 0.015), int(h * 0.03), int(w * 0.15), int(h * 0.97))
    glass(img, side, tint, r)
    d = ImageDraw.Draw(img)
    y = side[1] + h * 0.06
    for frac in (0.8, 0.6, 0.7, 0.5, 0.65):
        x0 = side[0] + (side[2] - side[0]) * 0.12
        d.rounded_rectangle(tuple(int(v) for v in (x0, y, x0 + (side[2] - side[0]) * 0.76 * frac, y + h * 0.02)),
                            radius=2, fill=(200, 205, 222))
        y += h * 0.06
    box = (int(w * 0.3), int(h * 0.82), int(w * 0.85), int(h * 0.95))
    glass(img, box, tint, r)
    d.rounded_rectangle(box, radius=r, outline=(190, 195, 215), width=max(w // 400, 1))
    return img


def gif(frames_dir, out, fps):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', str(fps), '-i', os.path.join(frames_dir, '%03d.png'),
                    '-vf', 'split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=4',
                    '-loop', '0', out], check=True)


def claude_demo(key, preview, whale):
    still = Image.open(preview).convert('RGB').resize((COLS, ROWS), Image.NEAREST)
    sim = Pixel(still, whale)
    with tempfile.TemporaryDirectory() as tmp:
        for i in range(FPS * SECONDS):
            f = sim.frame(0.5 + i / FPS).resize((COLS * SCALE, ROWS * SCALE), Image.NEAREST)
            panel(f, (16, 14, 30)).save(os.path.join(tmp, f'{i:03d}.png'))
        gif(tmp, os.path.join(OUT, f'claude-{key}.gif'), FPS)


def antigravity_demo(key, video):
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1', '-t', '4', '-i', video,
                        '-vf', 'fps=10,scale=560:-2:flags=lanczos', os.path.join(tmp, '%03d.png')], check=True)
        for n in sorted(os.listdir(tmp)):
            p = os.path.join(tmp, n)
            panel(Image.open(p).convert('RGB'), (10, 8, 20)).save(p)
        gif(tmp, os.path.join(OUT, f'antigravity-{key}.gif'), 10)


if __name__ == '__main__':
    videos, previews = sys.argv[1], sys.argv[2]
    os.makedirs(OUT, exist_ok=True)
    for key, whale in (() if os.environ.get('SKIP_CLAUDE') else (('whale', True), ('snow', False), ('sea', False), ('blade', False))):
        claude_demo(key, os.path.join(previews, f'{key}.png'), whale)
        print('claude', key)
    for key in ('whale-fantasy-loop', 'whale-moon-loop', 'whale-underwater-loop', 'boot-claude-loop',
                'boot-antigravity-loop', 'wallpapergeminichan', 'furina-bg'):
        antigravity_demo(key.replace('-loop', ''), os.path.join(videos, f'{key}.mp4'))
        print('antigravity', key)
    for f in sorted(os.listdir(OUT)):
        print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, 'KB')
