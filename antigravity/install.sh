#!/usr/bin/env bash
# Cai theme Antigravity: lay antigravity-custom-theme-mod (MIT, furinamikuvn), va ban va, them 5 preset video.
# Usage: ./install.sh [thu muc cai, mac dinh ~/.local/share/antigravity-theme-mod]
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
DEST="${1:-$HOME/.local/share/antigravity-theme-mod}"
UPSTREAM=https://github.com/furinamikuvn/antigravity-custom-theme-mod.git
COMMIT=b74ac04
if [ ! -d "$DEST/.git" ]; then git clone "$UPSTREAM" "$DEST"; fi
cd "$DEST"
git checkout -q "$COMMIT"
git apply --check "$HERE/antigravity-mod.patch" 2>/dev/null && git apply "$HERE/antigravity-mod.patch" || echo "Ban va da co (hoac khong khop) - bo qua"
cp "$HERE/themes.json" themes/themes.json
"$HERE/fetch-videos.sh" "$DEST/themes/assets"
python3 scripts/build_payload.py
echo
echo "Buoc cuoi: chay trinh cai daemon cua ban goc:  bash $DEST/scripts/install-unix.sh"
echo "Roi mo Antigravity voi cong debug:  antigravity --remote-debugging-port=0 --remote-debugging-address=127.0.0.1"
