"""Regenerate list thumbnails and inline previews for the catalog's WebP covers."""

import base64
import hashlib
import io
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
THUMBS = PUBLIC / "cover-thumbs"
MANIFEST = ROOT / "data" / "cover-previews.json"


def resize_webp(image, edge, quality):
    resized = image.copy()
    resized.thumbnail((edge, edge), Image.Resampling.LANCZOS)
    output = io.BytesIO()
    resized.save(output, "WEBP", quality=quality, method=6)
    return output.getvalue()


def main():
    THUMBS.mkdir(exist_ok=True)
    entries = {}
    generated = set()

    for directory, edge in (("atlas-media", 360), ("samples", 480), ("motion-prompt/img", None)):
        for original in sorted((PUBLIC / directory).glob("*.webp")):
            with Image.open(original) as image:
                preview = resize_webp(image, 16, 38)
                thumbnail = resize_webp(image, edge, 76) if edge else None

            entry = {"preview": base64.b64encode(preview).decode("ascii")}
            if thumbnail and len(thumbnail) < original.stat().st_size * 0.9:
                digest = hashlib.sha256(thumbnail).hexdigest()[:12]
                target = THUMBS / f"{directory}-{original.stem}.{digest}.webp"
                target.write_bytes(thumbnail)
                generated.add(target)
                entry["thumb"] = "/" + target.relative_to(PUBLIC).as_posix()
            entries["/" + original.relative_to(PUBLIC).as_posix()] = entry

    MANIFEST.write_text(json.dumps(entries, indent=2) + "\n", encoding="utf-8")
    for stale in set(THUMBS.glob("*.webp")) - generated:
        stale.unlink()


if __name__ == "__main__":
    main()
