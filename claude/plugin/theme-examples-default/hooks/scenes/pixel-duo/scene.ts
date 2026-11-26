// Pixel Duo: the shader shared by the two-character pixel-art scenes (Snow & Moon, Sea Dream, Blade Duet).
// Only pixel-art effects, drawn on the art's own 160x90 grid, one art pixel at a time:
//  - stars blink on dark pixels in the upper part of the picture, the big ones with a four-point cross;
//  - sparkles flash on the brightest pixels (eyes, hair lights, blades, snow);
//  - a star falls down the seam between the two halves now and then, leaving a short pixel trail;
//  - fireflies step up the grid, drifting sideways, and fade out.
// Motion moves by whole art pixels; only brightness fades, so the picture never blurs.
import { PI, abs, fract, floor, int, max, min, mix, picture, scene, shader, sin, size, table, time, unsigned, vec2, vec3, vec4 } from 'claude-code/shader'

const COLS = 160
const ROWS = 90
const SEAM = 79.5

// Fireflies, fixed at build time: speed, phase, home column, drift rate.
const FLY = table([
  [0.021, 0.12, 12, 0.41],
  [0.017, 0.57, 27, 0.29],
  [0.026, 0.83, 44, 0.53],
  [0.019, 0.31, 63, 0.37],
  [0.023, 0.69, 98, 0.47],
  [0.016, 0.05, 115, 0.33],
  [0.028, 0.44, 133, 0.59],
  [0.02, 0.91, 149, 0.43],
  [0.025, 0.23, 6, 0.51],
  [0.018, 0.77, 156, 0.39],
  [0.022, 0.38, 72, 0.45],
  [0.024, 0.62, 88, 0.35],
])

const stir = (x: number, y: number, k: number) => {
  let h = int(int(x) * 0x2f6b4a9d + int(y) * 0x6d1c85e3 + int(k) * 0x19e4b7a5)
  h = int(h ^ (h >>> 15))
  h = int(h * 0x4b3d92c7)
  return int(h ^ (h >>> 13))
}
const rnd = (x: number, y: number, k: number) => unsigned(stir(x, y, k)) / 4294967296

// A pulse that rises and falls once per cycle, held at 0 the rest of it: a blink.
const blink = (t: number, duty: number) => {
  const phase = fract(t)
  return phase < duty ? sin((phase / duty) * PI) : 0
}

const pixels = picture(p => {
  const cell = max(size.x / COLS, size.y / ROWS)
  const left = (size.x - COLS * cell) * 0.5
  const top = (size.y - ROWS * cell) * 0.5
  const col = floor((p.point.x - left) / cell)
  const row = floor((size.y - p.point.y - top) / cell)
  const centre = vec2((col + 0.5) * cell + left, size.y - ((row + 0.5) * cell + top))
  let color = vec3(scene.sample(vec2(centre / size)).rgb)
  const luma = color.r * 0.3 + color.g * 0.59 + color.b * 0.11

  // Stars on dark pixels in the upper part, each blinking at its own pace; big ones flash a cross at their peak.
  const upper = row < 54 ? 1 : 0
  const clear = upper * (luma < 0.3 ? 1 : 0)
  let star = clear * (rnd(col, row, 3) < 0.03 ? 1 : 0) * blink(time * (0.15 + 0.35 * rnd(col, row, 4)) + rnd(col, row, 5), 0.6)
  for (const d of [vec2(1, 0), vec2(-1, 0), vec2(0, 1), vec2(0, -1)]) {
    const sx = col - d.x
    const sy = row - d.y
    const big = rnd(sx, sy, 3) < 0.03 && rnd(sx, sy, 6) < 0.3 ? 1 : 0
    const peak = blink(time * (0.15 + 0.35 * rnd(sx, sy, 4)) + rnd(sx, sy, 5), 0.6)
    star = max(star, clear * big * (peak > 0.75 ? (peak - 0.75) * 4 : 0) * 0.7)
  }
  color = vec3(mix(color, vec3(0.9, 0.93, 1), star))

  // Sparkles on the brightest pixels.
  const sparkle = (luma > 0.72 ? 1 : 0) * (rnd(col, row, 9) < 0.06 ? 1 : 0) *
    blink(time * (0.2 + 0.3 * rnd(col, row, 10)) + rnd(col, row, 11), 0.25)
  color = vec3(mix(color, vec3(1, 0.97, 1), sparkle * 0.85))

  // A star falls down the seam every 9 seconds, with a fading trail of four pixels above it.
  const fall = fract(time / 9)
  const headRow = floor(fall * 3 * ROWS) - 4
  const onSeam = abs(col - SEAM) < 1 ? 1 : 0
  const behind = headRow - row
  const trail = behind >= 0 && behind < 5 && fall < 0.36 ? 1 - behind / 5 : 0
  color = vec3(mix(color, vec3(1, 0.95, 0.85), onSeam * trail * 0.9))

  // Fireflies step up the grid one pixel at a time, drifting sideways, fading in and out.
  let fly = 0
  for (const k of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
    const f = FLY.at(k)
    const life = fract(time * f.x + f.y)
    const fx = floor(f.z + sin(time * f.w + k) * 3 + 0.5)
    const fy = floor(ROWS - 3 - life * (ROWS - 12))
    const dx = abs(col - fx)
    const dy = abs(row - fy)
    const core = dx < 0.5 && dy < 0.5 ? 1 : 0
    const halo = dx + dy < 1.5 && dx + dy > 0.5 ? 0.35 : 0
    fly = max(fly, (core + halo) * sin(life * PI))
  }
  color = vec3(mix(color, vec3(0.85, 0.97, 0.9), min(fly, 1) * 0.85))

  return vec4(min(color, vec3(1)), 1)
})

export default shader({ fps: 30, passes: [pixels] })
