// Moonlit Whale (Pixel): a 160x90 pixel-art still of the whale girl standing in moonlit water, animated only with
// pixel-art effects. Every effect is drawn on the art's own grid, one art pixel at a time, the way sprites are:
//  - stars blink in the dark sky, some with a four-point twinkle;
//  - sparkles flash on the brightest pixels of the scene;
//  - the moon's halo pulses as an ordered (Bayer) dither, the classic pixel-art way to shade;
//  - fireflies step through the grid one pixel at a time, rising and fading out.
// Motion moves by whole art pixels; only brightness fades, so the picture never blurs.
import {
  PI, abs, clamp, floor, fract, int, length, max, min, mix, picture, scene, shader, sin, size, table, time,
  unsigned, vec2, vec3, vec4,
} from 'claude-code/shader'

// The still's grid, and where its parts lie on it, counted from its top left.
const COLS = 160
const ROWS = 90
const HORIZON = 61
const MOON = vec2(83, 19)
const MOON_R = 31

// A 4x4 Bayer matrix, the thresholds of ordered dithering.
const BAYER = table([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5])

// Fireflies, fixed at build time: speed, phase, home column, drift rate.
const FLY = table([
  [0.021, 0.12, 18, 0.41],
  [0.017, 0.57, 33, 0.29],
  [0.026, 0.83, 47, 0.53],
  [0.019, 0.31, 61, 0.37],
  [0.023, 0.69, 104, 0.47],
  [0.016, 0.05, 118, 0.33],
  [0.028, 0.44, 131, 0.59],
  [0.02, 0.91, 145, 0.43],
  [0.025, 0.23, 9, 0.51],
  [0.018, 0.77, 152, 0.39],
])

// An even integer stir of three numbers, then a number from 0 up to, not including, 1.
const stir = (x: number, y: number, k: number) => {
  let h = int(int(x) * 0x2f6b4a9d + int(y) * 0x6d1c85e3 + int(k) * 0x19e4b7a5)
  h = int(h ^ (h >>> 15))
  h = int(h * 0x4b3d92c7)
  return int(h ^ (h >>> 13))
}
const rnd = (x: number, y: number, k: number) => unsigned(stir(x, y, k)) / 4294967296

// A pulse that rises and falls once per cycle, held at 0 most of the time: a blink.
const blink = (t: number, duty: number) => {
  const phase = fract(t)
  return phase < duty ? sin((phase / duty) * PI) : 0
}

const pixels = picture(p => {
  // The art covers the window like `slice`: one art pixel is `cell` points, and the grid is centred.
  const cell = max(size.x / COLS, size.y / ROWS)
  const left = (size.x - COLS * cell) * 0.5
  const top = (size.y - ROWS * cell) * 0.5
  const col = floor((p.point.x - left) / cell)
  const row = floor((size.y - p.point.y - top) / cell)
  // Every effect reads the art pixel's own colour at its centre, so it stays crisp.
  const centre = vec2((col + 0.5) * cell + left, size.y - ((row + 0.5) * cell + top))
  let color = vec3(scene.sample(vec2(centre / size)).rgb)
  const luma = color.r * 0.3 + color.g * 0.59 + color.b * 0.11
  const fromMoon = length(vec2(vec2(col + 0.5, row + 0.5) - MOON))
  const sky = row < HORIZON - 8 ? 1 : 0

  // The moon's halo: a ring of dithered pink pixels that grows and shrinks with a slow breath.
  const breath = 0.5 + 0.5 * sin(time * 0.8)
  const reach = 3 + 3 * breath
  const halo = clamp(1 - (fromMoon - MOON_R) / reach, 0, 1) * (fromMoon > MOON_R ? 1 : 0)
  const threshold = (BAYER.at(floor(fract(col / 4) * 4 + 0.01) + floor(fract(row / 4) * 4 + 0.01) * 4) + 0.5) / 16
  const dithered = halo * 0.75 > threshold ? 1 : 0
  color = vec3(mix(color, vec3(0.93, 0.78, 0.86), dithered * 0.45 * sky))

  // Stars: some dark sky pixels blink; a few of the brightest also flash a four-point cross.
  const dark = luma < 0.32 ? 1 : 0
  const clear = sky * dark * (fromMoon > MOON_R + 7 ? 1 : 0)
  const isStar = rnd(col, row, 3) < 0.028 ? 1 : 0
  const starBlink = blink(time * (0.15 + 0.35 * rnd(col, row, 4)) + rnd(col, row, 5), 0.6)
  let star = clear * isStar * starBlink
  // The cross: the four neighbours of a big star light up at its peak.
  for (const d of [vec2(1, 0), vec2(-1, 0), vec2(0, 1), vec2(0, -1)]) {
    const sx = col - d.x
    const sy = row - d.y
    const big = rnd(sx, sy, 3) < 0.028 && rnd(sx, sy, 6) < 0.3 ? 1 : 0
    const peak = blink(time * (0.15 + 0.35 * rnd(sx, sy, 4)) + rnd(sx, sy, 5), 0.6)
    star = max(star, clear * big * (peak > 0.75 ? (peak - 0.75) * 4 : 0) * 0.7)
  }
  color = vec3(mix(color, vec3(0.9, 0.93, 1), star))

  // Sparkles on the brightest pixels: the moon's face, the lit hair, the glints in the water.
  const bright = luma > 0.72 ? 1 : 0
  const sparkleOn = rnd(col, row, 9) < 0.06 ? 1 : 0
  const sparkle = bright * sparkleOn * blink(time * (0.2 + 0.3 * rnd(col, row, 10)) + rnd(col, row, 11), 0.25)
  color = vec3(mix(color, vec3(1, 0.97, 1), sparkle * 0.85))

  // Fireflies: each steps up the grid one pixel at a time, drifting sideways, and fades out near the top.
  let fly = 0
  for (const k of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    const f = FLY.at(k)
    const life = fract(time * f.x + f.y)
    const fx = floor(f.z + sin(time * f.w + k) * 3 + 0.5)
    const fy = floor(ROWS - 3 - life * (ROWS - 12))
    const dx = abs(col - fx)
    const dy = abs(row - fy)
    const fade = sin(life * PI)
    const core = dx < 0.5 && dy < 0.5 ? 1 : 0
    const glowPx = dx + dy < 1.5 && dx + dy > 0.5 ? 0.35 : 0
    fly = max(fly, (core + glowPx) * fade)
  }
  color = vec3(mix(color, vec3(0.78, 0.95, 0.85), min(fly, 1) * 0.9))

  return vec4(min(color, vec3(1)), 1)
})

export default shader({ fps: 30, passes: [pixels] })
