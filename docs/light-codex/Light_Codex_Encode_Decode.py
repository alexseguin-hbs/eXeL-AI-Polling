#!/usr/bin/env python3
"""
Light Codex Signature + Decode  (updated alphabet — eXeL AI / Drone-2525 canonical set)

WHAT CHANGED vs the older file (2026-09-18 export from frontend/lib/light-codex.ts):
  1. SPACE no longer collides with the digit 0.
     Old:  ' ' -> 'BBBB'  AND  '0' -> 'BBBB'  (identical → validate_no_duplicates() RAISES on start,
           and any space decodes back as "0").
     New:  ' ' -> 'WBWB'  (unused by any letter/number/frame, contains no green, reversal 'BWBW' is unused).
           '0' stays 'BBBB'.
  2. FOUR symbols added (2026-09-08): hyphen, underscore, bullet, colon. Each group is unused by every
     letter/digit/frame, contains no green (green is the frame colour), and its token-reversal is unused too,
     so a strand read backwards can never turn one of them into a taken character:
        -  = VCVC     _  = VRVR     •  = VYVY     :  = VBVB
  Everything else (A–Z, 0–9, period, the three helix styles, the green 4321/1234 transmission framing, the
  decode/auto-detect logic) is unchanged and byte-for-byte compatible with images made by the browser port.

Modes:
1. Encode
2. Decode

Signature Types:
1. Single Helix        — bottom-right only, reversed, transmission framing
2. Double Helix        — top-left forward + bottom-right reversed, transmission framing
3. Hidden Double Helix — top-right forward + bottom-right reversed, 1px, no framing

Color order:  B R Y G C V W  =  Black, Red, Yellow, Green, Cyan, Violet, White

Number Codex:  0=BBBB 1=WBBB 2=WWBB 3=WWWB 4=WWWW 5=VBBB 6=VWBB 7=VWWB 8=VWWW 9=VVVV
Symbols:       (space)=WBWB  .=BBBW  -=VCVC  _=VRVR  •=VYVY  :=VBVB
Transmission framing only:  4=GGGG 3=GGGR 2=GGRR 1=GRRR
"""

from pathlib import Path
from PIL import Image
import tkinter as tk
from tkinter import filedialog

ALPHA = {
    'A': 'WWCC','B': 'RRRR','C': 'CWRC','D': 'YCCY','E': 'CCRR','F': 'WRRW',
    'G': 'YCYC','H': 'WWRR','I': 'YBBY','J': 'CWWC','K': 'YYCC','L': 'YBYB',
    'M': 'WCWC','N': 'CWCW','O': 'RRYY','P': 'CCCW','Q': 'YYYY','R': 'RWWR',
    'S': 'WWWC','T': 'RWCC','U': 'RWRW','V': 'WRWR','W': 'CCRW','X': 'WCCW',
    'Y': 'YRYR','Z': 'YCRB',
    ' ': 'WBWB','.': 'BBBW',
    '-': 'VCVC','_': 'VRVR','•': 'VYVY',':': 'VBVB',
}
NUMBERS = {
    '0': 'BBBB','1': 'WBBB','2': 'WWBB','3': 'WWWB','4': 'WWWW',
    '5': 'VBBB','6': 'VWBB','7': 'VWWB','8': 'VWWW','9': 'VVVV',
}
TRANSMISSION = {'4': 'GGGG','3': 'GGGR','2': 'GGRR','1': 'GRRR'}
COLORS = {
    'B': (0, 0, 0),'R': (255, 0, 0),'Y': (255, 255, 0),
    'G': (0, 255, 0),'C': (0, 255, 255),'V': (255, 0, 255),'W': (255, 255, 255),
}

def validate_no_duplicates() -> None:
    combined = {}
    for name, mapping in (("ALPHA", ALPHA), ("NUMBERS", NUMBERS), ("TRANSMISSION", TRANSMISSION)):
        for ch, grp in mapping.items():
            combined.setdefault(grp, []).append(f"{name}:{ch}")
    duplicates = {grp: owners for grp, owners in combined.items() if len(owners) > 1}
    if duplicates:
        lines = ["Duplicate codex patterns detected:"]
        for grp, owners in sorted(duplicates.items()):
            lines.append(f"  {grp} -> {', '.join(owners)}")
        raise ValueError("\n".join(lines))

validate_no_duplicates()

GROUP_TO_CHAR = {}
for ch, grp in ALPHA.items():
    GROUP_TO_CHAR[grp] = ch
for ch, grp in NUMBERS.items():
    GROUP_TO_CHAR[grp] = ch

TRANSMISSION_GROUPS = set(TRANSMISSION.values())
FWD_FRAME_PREFIX = [TRANSMISSION[c] for c in "4321"]
FWD_FRAME_SUFFIX = [TRANSMISSION[c] for c in "1234"]
REV_FRAME_PREFIX = [TRANSMISSION[c] for c in "1234"]
REV_FRAME_SUFFIX = [TRANSMISSION[c] for c in "4321"]

def encode_char(ch: str) -> str:
    if ch.isdigit():
        return NUMBERS[ch]
    up = ch.upper()
    if up in ALPHA:
        return ALPHA[up]
    if ch in ALPHA:                      # symbols/space are not affected by upper(), but be explicit
        return ALPHA[ch]
    raise ValueError(f"Unsupported character: {ch!r}. Supported: A-Z, 0-9, space, period, and - _ • :")

def encode_message(text: str) -> list[str]:
    return [encode_char(ch) for ch in text]

def transmission_groups(seq: str) -> list[str]:
    return [TRANSMISSION[ch] for ch in seq]

def draw_group(px, img_w: int, img_h: int, x: int, y: int, grp: str, block_size: int) -> None:
    for i, token in enumerate(grp):
        color = COLORS[token]
        x0 = x + i * block_size
        for yy in range(y, y + block_size):
            for xx in range(x0, x0 + block_size):
                if 0 <= xx < img_w and 0 <= yy < img_h:
                    px[xx, yy] = color

def draw_line_left(px, img_w: int, img_h: int, groups: list[str], x_start: int, y: int, block_size: int, gap: int) -> int:
    x = x_start
    for grp in groups:
        draw_group(px, img_w, img_h, x, y, grp, block_size)
        x += 4 * block_size + gap
    return len(groups) * (4 * block_size) + max(0, len(groups) - 1) * gap

def draw_line_right(px, img_w: int, img_h: int, groups: list[str], y: int, block_size: int, gap: int) -> int:
    total_width = len(groups) * (4 * block_size) + max(0, len(groups) - 1) * gap
    start_x = img_w - total_width
    x = start_x
    for grp in groups:
        draw_group(px, img_w, img_h, x, y, grp, block_size)
        x += 4 * block_size + gap
    return total_width

def place_signature(image: Image.Image, signature: str, block_size: int, style: str) -> Image.Image:
    img = image.convert("RGB")
    px = img.load()
    w, h = img.size
    gap = 0 if block_size == 1 else 1
    top_y = 0
    bottom_y = h - block_size
    if style == "1":
        reverse_groups = transmission_groups("1234") + encode_message(signature[::-1]) + transmission_groups("4321")
        draw_line_right(px, w, h, reverse_groups, bottom_y, block_size, gap)
    elif style == "2":
        forward_groups = transmission_groups("4321") + encode_message(signature) + transmission_groups("1234")
        reverse_groups = transmission_groups("1234") + encode_message(signature[::-1]) + transmission_groups("4321")
        draw_line_left(px, w, h, forward_groups, 0, top_y, block_size, gap)
        draw_line_right(px, w, h, reverse_groups, bottom_y, block_size, gap)
    elif style == "3":
        hidden_block_size = 1
        hidden_gap = 0
        forward_groups = encode_message(signature)
        reverse_groups = encode_message(signature[::-1])
        draw_line_right(px, w, h, forward_groups, 0, hidden_block_size, hidden_gap)
        draw_line_right(px, w, h, reverse_groups, h - 1, hidden_block_size, hidden_gap)
    else:
        raise ValueError("Invalid signature type.")
    return img

def prompt_mode() -> str:
    print("Mode:\n1. Encode\n2. Decode")
    while True:
        value = input("Choose 1 or 2: ").strip()
        if value in ("1", "2"):
            return value
        print("Please choose 1 or 2.")

def prompt_signature_type() -> str:
    print("\nSignature Type:\n1. Single Helix\n2. Double Helix\n3. Hidden Double Helix")
    while True:
        value = input("Choose 1, 2, or 3: ").strip()
        if value in ("1", "2", "3"):
            return value
        print("Please choose 1, 2, or 3.")

def prompt_block_size() -> int:
    while True:
        value = input("Choose pixel block size (1, 2, or 4): ").strip()
        try:
            size = int(value)
            if size in (1, 2, 4):
                return size
            print("Please enter 1, 2, or 4.")
        except ValueError:
            print("Please enter 1, 2, or 4.")

def style_name(style: str) -> str:
    return {"1": "single_helix", "2": "double_helix", "3": "hidden_double_helix"}[style]

def pick_image_file() -> Path:
    root = tk.Tk()
    root.withdraw()
    root.update()
    file_path = filedialog.askopenfilename(title="Choose image", filetypes=[("Image files", "*.png *.jpg *.jpeg *.webp *.bmp *.tif *.tiff"), ("All files", "*.*")])
    root.destroy()
    if not file_path:
        raise FileNotFoundError("No image selected.")
    return Path(file_path)

def nearest_token(rgb: tuple[int, int, int]) -> str:
    best_token = None
    best_dist = None
    for token, color in COLORS.items():
        dist = sum((rgb[i] - color[i]) ** 2 for i in range(3))
        if best_dist is None or dist < best_dist:
            best_dist = dist
            best_token = token
    return best_token

def sample_group(image: Image.Image, x: int, y: int, block_size: int):
    w, h = image.size
    px = image.load()
    tokens = []
    for i in range(4):
        x0 = x + i * block_size
        if x0 < 0 or y < 0 or x0 + block_size > w or y + block_size > h:
            return None
        samples = [px[xx, yy] for yy in range(y, y + block_size) for xx in range(x0, x0 + block_size)]
        avg = tuple(sum(p[c] for p in samples) // len(samples) for c in range(3))
        tokens.append(nearest_token(avg))
    return ''.join(tokens)

def parse_line(image: Image.Image, start_x: int, y: int, block_size: int, gap: int, max_groups: int = 500) -> list[str]:
    groups = []
    x = start_x
    w, _ = image.size
    group_width = 4 * block_size
    for _ in range(max_groups):
        if x < 0 or x + group_width > w:
            break
        grp = sample_group(image, x, y, block_size)
        if grp is None:
            break
        if grp not in GROUP_TO_CHAR and grp not in TRANSMISSION_GROUPS:
            break
        groups.append(grp)
        x += group_width + gap
    return groups

def starts_with_sequence(groups: list[str], seq: list[str]) -> bool:
    return len(groups) >= len(seq) and groups[:len(seq)] == seq

def ends_with_sequence(groups: list[str], seq: list[str]) -> bool:
    return len(groups) >= len(seq) and groups[-len(seq):] == seq

def groups_to_text(groups: list[str]) -> str:
    return ''.join(GROUP_TO_CHAR.get(grp, '?') for grp in groups)

def detect_single(image: Image.Image, block_size: int):
    w, h = image.size
    gap = 0 if block_size == 1 else 1
    y = h - block_size
    for start_x in range(0, max(1, min(16, w))):
        groups = parse_line(image, start_x, y, block_size, gap)
        if starts_with_sequence(groups, REV_FRAME_PREFIX) and ends_with_sequence(groups, REV_FRAME_SUFFIX):
            core = groups[4:-4]
            reversed_message = groups_to_text(core)
            return {"style": "Single Helix", "block_size": block_size, "line_height": block_size, "bottom_decoded": groups_to_text(groups), "message_reversed": reversed_message, "message_forward_verify": reversed_message[::-1]}
    return None

def detect_double(image: Image.Image, block_size: int):
    w, h = image.size
    gap = 0 if block_size == 1 else 1
    top_y = 0
    bottom_y = h - block_size
    top_groups = parse_line(image, 0, top_y, block_size, gap)
    if not (starts_with_sequence(top_groups, FWD_FRAME_PREFIX) and ends_with_sequence(top_groups, FWD_FRAME_SUFFIX)):
        return None
    forward_message = groups_to_text(top_groups[4:-4])
    for start_x in range(0, max(1, min(16, w))):
        bottom_groups = parse_line(image, start_x, bottom_y, block_size, gap)
        if starts_with_sequence(bottom_groups, REV_FRAME_PREFIX) and ends_with_sequence(bottom_groups, REV_FRAME_SUFFIX):
            reverse_message = groups_to_text(bottom_groups[4:-4])
            if reverse_message == forward_message[::-1]:
                return {"style": "Double Helix", "block_size": block_size, "line_height": block_size, "top_decoded": groups_to_text(top_groups), "bottom_decoded": groups_to_text(bottom_groups), "message_forward": forward_message, "message_reversed_verify": reverse_message}
    return None

def detect_hidden_double(image: Image.Image):
    w, h = image.size
    top_candidates = []
    for start_x in range(max(0, w - 500), w):
        groups = parse_line(image, start_x, 0, 1, 0)
        if groups:
            text = groups_to_text(groups)
            if '?' not in text and text.strip():
                top_candidates.append((groups, text))
    bottom_candidates = []
    for start_x in range(max(0, w - 500), w):
        groups = parse_line(image, start_x, h - 1, 1, 0)
        if groups:
            text = groups_to_text(groups)
            if '?' not in text and text.strip():
                bottom_candidates.append((groups, text))
    if not top_candidates or not bottom_candidates:
        return None
    top_groups, top_text = max(top_candidates, key=lambda x: len(x[0]))
    for bottom_groups, bottom_text in sorted(bottom_candidates, key=lambda x: len(x[0]), reverse=True):
        if bottom_text == top_text[::-1]:
            return {"style": "Hidden Double Helix", "block_size": 1, "line_height": 1, "top_decoded": top_text, "bottom_decoded": bottom_text, "message_forward": top_text, "message_reversed_verify": bottom_text}
    return None

def decode_image(image: Image.Image):
    image = image.convert('RGB')
    hidden = detect_hidden_double(image)
    if hidden:
        return hidden
    for block_size in (1, 2, 4):
        result = detect_double(image, block_size)
        if result:
            return result
        result = detect_single(image, block_size)
        if result:
            return result
    return None

def main() -> None:
    print('=== Light Codex Signature ===')
    mode = prompt_mode()
    if mode == '1':
        signature = input('Digital Signature: ').strip()
        if not signature:
            print('Digital Signature cannot be empty.')
            return
        style = prompt_signature_type()
        if style in ('1', '2'):
            block_size = prompt_block_size()
        else:
            block_size = 1
            print('Hidden Double Helix uses 1x1 pixels automatically.')
            print('No transmission framing is added for Hidden Double Helix.')
        image_path = pick_image_file()
        image = Image.open(image_path)
        width, height = image.size
        print(f'\nImage size: {width} x {height} pixels')
        print(f'Signature Type: {style_name(style)}')
        print(f'Pixel block size: {block_size}')
        if style == '3':
            print(f'Hidden signature phrase width: {len(signature) * 4} pixels')
            print('Hidden signature phrase height: 1 pixel')
        signed = place_signature(image, signature, block_size, style)
        output_path = image_path.with_name(f'{image_path.stem}_light_codex_{style_name(style)}_{block_size}x{block_size}.png')
        signed.save(output_path)
        print(f'Saved: {output_path}')
        print(f'Output size: {width} x {height} pixels')
        print('Tip: PNG is best for clean decoding. JPEG may shift colors.')
    else:
        image_path = pick_image_file()
        image = Image.open(image_path)
        width, height = image.size
        print(f'\nImage size: {width} x {height} pixels')
        result = decode_image(image)
        if not result:
            print('No Light Codex signature detected.')
            print('Tip: Decoding works best with PNG or other lossless images.')
            return
        print(f"Detected style: {result['style']}")
        print(f"Detected block size: {result['block_size']}")
        print(f"Detected line height: {result['line_height']} pixel(s)")
        if result['style'] == 'Single Helix':
            print(f"Bottom line decoded: {result['bottom_decoded']}")
            print(f"Message reversed in image: {result['message_reversed']}")
            print(f"Forward verification: {result['message_forward_verify']}")
        else:
            print(f"Top line decoded: {result['top_decoded']}")
            print(f"Bottom line decoded: {result['bottom_decoded']}")
            print(f"Forward message: {result['message_forward']}")
            print(f"Reverse verification: {result['message_reversed_verify']}")
if __name__ == '__main__':
    main()
