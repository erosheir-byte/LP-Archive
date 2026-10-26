#!/usr/bin/env python3
"""확장프로그램 아이콘(PNG) 생성 스크립트. 외부 라이브러리 없이 동작한다.

사용법: python3 tools/make_icons.py
"""
import os
import struct
import zlib

SIZES = [16, 48, 128]
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "icons")

# 그라데이션 색상 (좌상단 -> 우하단)
C1 = (224, 36, 94)   # 핑크레드
C2 = (255, 140, 0)   # 오렌지


def png_chunk(tag: bytes, data: bytes) -> bytes:
    chunk = tag + data
    return struct.pack(">I", len(data)) + chunk + struct.pack(">I", zlib.crc32(chunk))


def write_png(path: str, size: int, pixels) -> None:
    raw = b"".join(b"\x00" + bytes(row) for row in pixels)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(raw, 9))
        + png_chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(png)


def in_triangle(px, py, a, b, c) -> bool:
    def sign(p1, p2, p3):
        return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])

    d1, d2, d3 = sign((px, py), a, b), sign((px, py), b, c), sign((px, py), c, a)
    has_neg = d1 < 0 or d2 < 0 or d3 < 0
    has_pos = d1 > 0 or d2 > 0 or d3 > 0
    return not (has_neg and has_pos)


def make_icon(size: int):
    radius = size * 0.22
    # 재생 버튼 모양 삼각형 꼭짓점
    tri = (
        (size * 0.40, size * 0.30),
        (size * 0.40, size * 0.70),
        (size * 0.74, size * 0.50),
    )
    rows = []
    for y in range(size):
        row = []
        for x in range(size):
            # 모서리 둥글리기 (알파 0 처리)
            cx = min(max(x + 0.5, radius), size - radius)
            cy = min(max(y + 0.5, radius), size - radius)
            dist = ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2) ** 0.5
            alpha = 255 if dist <= radius else 0

            if in_triangle(x + 0.5, y + 0.5, *tri):
                r, g, b = 255, 255, 255
            else:
                t = (x + y) / (2 * size)
                r = round(C1[0] + (C2[0] - C1[0]) * t)
                g = round(C1[1] + (C2[1] - C1[1]) * t)
                b = round(C1[2] + (C2[2] - C1[2]) * t)
            row += [r, g, b, alpha]
        rows.append(row)
    return rows


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for size in SIZES:
        path = os.path.join(OUT_DIR, f"icon{size}.png")
        write_png(path, size, make_icon(size))
        print("created", os.path.normpath(path))


if __name__ == "__main__":
    main()
