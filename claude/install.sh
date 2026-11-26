#!/usr/bin/env bash
# Cai 4 theme pixel cho Claude desktop (tab Code).
# Can: video Antigravity (chay antigravity/install.sh truoc, hoac chi antigravity/fetch-videos.sh), ffmpeg, python3-pil.
# Usage: ./install.sh [thu muc video]   CLAUDE=<duong dan claude> neu lenh claude khong co trong PATH
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
VIDEOS="${1:-$HOME/.local/share/antigravity-theme-mod/themes/assets}"
CLAUDE="${CLAUDE:-claude}"
"$HERE/grab-frames.sh" "$VIDEOS"
python3 "$HERE/make_stills.py"
P="$HERE/plugin/theme-examples-default"
"$CLAUDE" plugin validate "$P"
"$CLAUDE" plugin marketplace add "$P" || "$CLAUDE" plugin marketplace update local-theme-default
"$CLAUDE" plugin install theme-examples-default@local-theme-default --scope user || "$CLAUDE" plugin update theme-examples-default@local-theme-default
echo "Tat ban chinh thuc neu dang bat (trung ten lenh):  $CLAUDE plugin disable theme-examples@anthropic-plugin-directory --scope user"
echo "Mo phien moi, gui 1 tin nhan, roi go:  /custom-theme whale-moon-pixel"
