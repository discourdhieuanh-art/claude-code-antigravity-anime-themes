# Changes from Anthropic theme-examples (Apache-2.0)

This folder is a modified copy of Anthropic's `theme-examples` plugin. Changes:

- Renamed the plugin to `theme-examples-default` with a local marketplace `local-theme-default`.
- `hooks/register.tsx`: a `DEFAULT_THEME` (`whale-moon-pixel`) applies to every project with no theme of its own; `/custom-theme off` stores an explicit "off".
- `hooks/themes.ts`, `hooks/interactive.tsx`: four pixel-art themes (Moonlit Whale, Snow & Moon, Sea Dream, Blade Duet).
- `hooks/scenes/whale-moon-pixel/scene.ts`, `hooks/scenes/pixel-duo/scene.ts`: new pixel-only shaders (blinking stars, sparkles, Bayer-dithered moon halo, a falling star, fireflies).
- `still.ts` / `stills.ts` are not included; `claude/make_stills.py` generates them from video frames you download yourself.
