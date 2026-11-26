# AGENTS.md

Guide for AI coding agents (Claude Code, Codex, Gemini, Cursor...) working with this repository.

## What this is
- `antigravity/`: anime video-background themes for the Google Antigravity IDE. A patch + presets for
  [furinamikuvn/antigravity-custom-theme-mod](https://github.com/furinamikuvn/antigravity-custom-theme-mod) (MIT),
  which injects CSS/JS through Chrome DevTools Protocol from a local daemon.
- `claude/`: pixel-art animated themes for the Claude Code desktop app, as a modified copy of Anthropic's
  `theme-examples` plugin (Apache-2.0). Themes use `$.theme.set({ backdrop: { scene, glass } })` with a vector SVG
  still plus a shader from `claude-code/shader`.

## Install (Linux / macOS)
```bash
./antigravity/install.sh                 # clone upstream mod at b74ac04, apply patch, add presets, download videos
bash ~/.local/share/antigravity-theme-mod/scripts/install-unix.sh
./claude/install.sh                      # grab frames, build pixel stills, validate + install the plugin
```
Requires git, curl, ffmpeg, python3 with Pillow (libimagequant), Node.js 22+. Set `CLAUDE=/path/to/claude` if
`claude` is not on PATH. Themes in Claude show in a new session after the first message: `/custom-theme whale-moon-pixel`.

## Rules
- Do not commit videos, images, frames, previews or the generated `still.ts` / `stills.ts` of the pixel themes:
  they derive from fan art owned by others. Scripts download them from the original authors (see README).
- Claude backdrop SVG: at most 131,072 characters, no `data:` URLs. Shader `fps` must be 30 or 60; do not mix
  `int` and `number`. After editing the plugin, bump `version` in `.claude-plugin/plugin.json`, then
  `claude plugin validate`, `claude plugin marketplace update local-theme-default`,
  `claude plugin update theme-examples-default@local-theme-default`.
- Antigravity daemon must only accept requests from `127.0.0.1` / `localhost` (see the patch).

## Key files
- `claude/make_stills.py`: frames -> 160x90, 32-colour pixel SVG stills (`FRAMES`, `SCENES` env overrides).
- `claude/plugin/theme-examples-default/hooks/themes.ts`, `register.tsx` (`DEFAULT_THEME`), `scenes/whale-moon-pixel/scene.ts`, `scenes/pixel-duo/scene.ts`.
- `antigravity/themes.json`, `antigravity/fetch-videos.sh`, `antigravity/antigravity-mod.patch`.
