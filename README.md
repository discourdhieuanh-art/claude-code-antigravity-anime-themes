# Claude Code & Antigravity Anime Themes

Anime live wallpaper / video background themes for **Google Antigravity** and pixel-art animated themes for **Claude Code desktop** (Claude desktop app, Code tab). Keywords: claude code theme, claude desktop theme, antigravity theme, antigravity custom theme, anime wallpaper, live background, pixel art.

## Tiếng Việt

Hai bộ theme:

- **Antigravity**: nền video động phía sau toàn bộ giao diện, 9 preset (5 preset mới), đổi bằng nút **Custom theme** ở thanh bên. Dựa trên [furinamikuvn/antigravity-custom-theme-mod](https://github.com/furinamikuvn/antigravity-custom-theme-mod) (MIT).
- **Claude desktop (tab Code)**: 4 theme pixel art có hiệu ứng pixel động (sao nhấp nháy, lấp lánh, quầng trăng dither, sao băng, đom đóm). Dựa trên plugin `theme-examples` của Anthropic (Apache-2.0).

Đã thử trên Ubuntu với Claude Code 2.1.330.

> **Ảnh và video không có trong repo.** Chúng là fan art có bản quyền của các tác giả bên dưới. Các script tải video từ kho gốc của tác giả về máy bạn, rồi tự tạo ảnh pixel từ đó.

## Cài đặt

Cần: `git`, `curl`, `ffmpeg`, `python3`, `python3-pil` (Pillow có libimagequant), Node.js 22+ cho Antigravity.

```bash
git clone https://github.com/<tài-khoản>/claude-code-antigravity-anime-themes.git && cd claude-code-antigravity-anime-themes
./antigravity/install.sh           # clone mod gốc, áp bản vá, thêm preset, tải video
bash ~/.local/share/antigravity-theme-mod/scripts/install-unix.sh   # daemon nền của mod gốc
./claude/install.sh                # cắt khung hình, tạo ảnh pixel, cài plugin vào Claude
```

Nếu lệnh `claude` chưa có trong PATH: `CLAUDE=~/.config/Claude/claude-code/<phiên bản>/<mã>/claude ./claude/install.sh`.

Chỉ muốn theme Claude: chạy `./antigravity/fetch-videos.sh <thư mục>` để có video, rồi `./claude/install.sh <thư mục>`. Hai video Gemini-chan và Furina lấy từ thư mục `themes/assets` của mod gốc.

### Dùng

- **Antigravity**: mở bằng `antigravity --remote-debugging-port=0 --remote-debugging-address=127.0.0.1`, bấm **Custom theme** ở thanh bên để chọn preset.
- **Claude**: mở phiên mới, gửi một tin nhắn, gõ `/custom-theme whale-moon-pixel` (hoặc `snow-moon-pixel`, `sea-dream-pixel`, `blade-duet-pixel`). `/custom-theme list` liệt kê tất cả. Thư mục chưa chọn theme sẽ tự dùng Moonlit Whale. Muốn đổi mặc định, sửa `DEFAULT_THEME` trong `claude/plugin/theme-examples-default/hooks/register.tsx`.

## Theme

| Antigravity preset | Video |
|---|---|
| Gemini-chan Live, Furina Live, WLOP Cosmic, Midnight Obsidian | có sẵn trong mod gốc |
| DeepSeek Whale Fantasy Live | [1745761934/dsh-skin-whale-fantasy](https://github.com/1745761934/dsh-skin-whale-fantasy) |
| DeepSeek Moonlit Whale Live, DeepSeek Underwater Maid Live | [kingOfSoySauce/dsh-boot-animation](https://github.com/kingOfSoySauce/dsh-boot-animation) |
| Claude Moonlit Blade Live, Gemini Twin Blades Live | [wynneceles/ai-boot-animations](https://github.com/wynneceles/ai-boot-animations) |

| Claude theme | Ảnh pixel làm từ |
|---|---|
| Moonlit Whale | DeepSeek Moonlit Whale |
| Snow & Moon | Gemini-chan + DeepSeek Moonlit Whale |
| Sea Dream | DeepSeek Underwater Maid + Furina |
| Blade Duet | Claude Moonlit Blade + Gemini Twin Blades |

## Thay đổi so với mod Antigravity gốc (`antigravity/antigravity-mod.patch`)

- Daemon chỉ nhận yêu cầu từ `127.0.0.1` / `localhost`; trang web khác gọi các API đọc/ghi file sẽ bị từ chối (403).
- Sửa lỗi nút Custom theme không hiện ở thanh bên của bản Antigravity mới.
- `antigravity/themes.json`: thêm 5 preset video (tổng 9 preset).

## Vì sao ảnh trên Claude không sắc nét như video trên Antigravity

Đây là giới hạn của API theme trong Claude Code, không phải do cách chuyển ảnh:

1. **Không được nhúng ảnh.** Antigravity cho chèn CSS và thẻ `<video>` thẳng vào giao diện. Theme Claude chỉ có `backdrop` dạng **SVG vector**, cấm `data:` URL, nên không nhúng được PNG, JPG hay video.
2. **SVG tối đa 131.072 ký tự.** Mỗi điểm ảnh phải vẽ bằng một đoạn path. Ở 160×90 điểm với 32 màu, ảnh đã dùng 116k–127k ký tự, gần chạm trần. Lên 320×180 cần khoảng gấp 4 lần, nên vượt giới hạn.
3. **Shader không đọc được texture ngoài.** Shader chỉ đọc lại backdrop (chính ảnh 160×90 đó) và chỉ thêm hiệu ứng lên trên, không tạo thêm chi tiết.
4. **Ảnh bị phóng to.** Cửa sổ 1920×1080 chia cho 160×90 nên mỗi điểm ảnh thành một ô 12×12. Gương mặt chỉ còn vài điểm ảnh, nên trông vỡ, nhất là theme ghép đôi (mỗi nhân vật chỉ có 80×90).

`make_stills.py` đã cố giữ nét nhất trong giới hạn: lọc nhiễu, tăng tương phản và màu, làm nét, thu nhỏ Lanczos, rồi giảm màu bằng libimagequant. Muốn đẹp hơn thì nên vẽ hoặc chọn ảnh pixel art thật ở 160×90, không cắt từ video. Phải chờ API cho phép ảnh bitmap thì mới đạt độ nét như Antigravity.

## Giấy phép

- Code của repo này: MIT (`LICENSE`).
- `claude/plugin/theme-examples-default`: bản sửa từ Anthropic `theme-examples`, Apache-2.0. Xem `LICENSE` và `CHANGES.md` trong đó.
- `antigravity/antigravity-mod.patch`: bản vá cho mod MIT của furinamikuvn (`antigravity/LICENSE-upstream-MIT`).
- Video, ảnh và nhân vật thuộc về tác giả và chủ sở hữu tương ứng, không phân phối kèm repo này.
