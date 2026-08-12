#!/usr/bin/env python3
"""
Local-only image curation server for the Genius Creative site.

Serves the static site exactly like `python3 -m http.server`, but injects
a small delete-button overlay (tools/curate.js) into every HTML page, and
handles POST /__curate/delete to permanently remove an image: the file(s)
on disk, and every reference to it across every HTML file in the project.

This tool is never wired into the shipped site — no production HTML
references curate.js, so none of this exists for a live visitor.

Usage:
    python3 tools/curate_server.py [port]

Then open http://127.0.0.1:<port>/gallery.html (or any page) in a browser.
Binds to 127.0.0.1 only — not reachable from the network.
"""

import glob
import http.server
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS_DIR = os.path.join(ROOT, "tools")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8850

# real-photo paintings (Dylan) — slug -> assets/dylan-assets basename.
# paintings not listed here are gradient placeholders with no image file to delete.
SLUG_TO_IMG = {
    "desert-bloom-no-3": "work-01",
    "afterglow": "work-02",
    "bloodstone": "work-03",
    "saguaro-static": "work-04",
    "halo-drift": "work-05",
    "second-sight": "work-06",
    "ember-coil": "work-07",
    "night-bloom": "work-08",
}

SLUG_RE = re.compile(r"^[a-z0-9-]+$")


def all_html_files():
    return glob.glob(os.path.join(ROOT, "**", "*.html"), recursive=True)


def rewrite(path, pattern):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    new_content = pattern.sub("", content)
    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        return True
    return False


def delete_photo(photo_id):
    if not re.match(r"^\d{1,3}$", photo_id or ""):
        return False, "invalid photo id"
    id2 = f"{int(photo_id):02d}"
    changed = False

    for size in ("900", "2200"):
        p = os.path.join(ROOT, "assets", "gregory-photography", f"photo-{id2}-{size}.jpg")
        if os.path.exists(p):
            os.remove(p)
            changed = True

    wrapped_pat = re.compile(
        r'<a class="piece"[^>]*>\s*<div class="artwork">\s*<img[^>]*photo-'
        + id2 + r'-[^>]*/?>\s*</div>\s*</a>\n?'
    )
    bare_pat = re.compile(
        r'<div class="artwork"[^>]*>\s*<img[^>]*photo-' + id2 + r'-[^>]*/?>\s*</div>\n?'
    )
    hero_bg_pat = re.compile(
        r'background-image:\s*url\([^)]*photo-' + id2 + r'-[^)]*\);?\s*'
    )

    for path in all_html_files():
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        new_content = wrapped_pat.sub("", content)
        new_content = bare_pat.sub("", new_content)
        new_content = hero_bg_pat.sub("", new_content)
        if new_content != content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_content)
            changed = True

    return changed, None


def delete_painting(slug):
    if not slug or not SLUG_RE.match(slug):
        return False, "invalid slug"
    changed = False

    detail_path = os.path.join(ROOT, "paintings", f"{slug}.html")
    if os.path.exists(detail_path):
        os.remove(detail_path)
        changed = True

    img_base = SLUG_TO_IMG.get(slug)
    if img_base:
        for size in ("800", "1600"):
            p = os.path.join(ROOT, "assets", "dylan-assets", f"{img_base}-{size}.jpg")
            if os.path.exists(p):
                os.remove(p)
                changed = True

    pat = re.compile(
        r'<a class="piece"[^>]*href="[^"]*' + re.escape(slug) + r'\.html"[^>]*>[\s\S]*?</a>\n?'
    )
    for path in all_html_files():
        if os.path.abspath(path) == os.path.abspath(detail_path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        new_content = pat.sub("", content)
        if new_content != content:
            with open(path, "w", encoding="utf-8") as f:
                f.write(new_content)
            changed = True

    return changed, None


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        sys.stderr.write("[curate] " + (fmt % args) + "\n")

    def do_GET(self):
        if self.path == "/__curate.js":
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript")
            self.end_headers()
            with open(os.path.join(TOOLS_DIR, "curate.js"), "rb") as f:
                self.wfile.write(f.read())
            return

        clean_path = self.path.split("?")[0].split("#")[0]
        if clean_path.endswith(".html") or clean_path.endswith("/"):
            fs_path = self.translate_path(self.path)
            if clean_path.endswith("/"):
                fs_path = os.path.join(fs_path, "index.html")
            if os.path.isfile(fs_path):
                with open(fs_path, "r", encoding="utf-8") as f:
                    content = f.read()
                injected = content.replace(
                    "</body>", '<script src="/__curate.js"></script>\n</body>'
                )
                body = injected.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return

        super().do_GET()

    def do_POST(self):
        if self.path != "/__curate/delete":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            payload = {}

        kind = payload.get("type")
        item_id = payload.get("id")

        if kind == "photo":
            ok, err = delete_photo(item_id)
        elif kind == "painting":
            ok, err = delete_painting(item_id)
        else:
            ok, err = False, "unknown type"

        result = {"ok": bool(ok)}
        if err:
            result["error"] = err
        body = json.dumps(result).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    server = http.server.HTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Curation server running at http://127.0.0.1:{PORT}/gallery.html")
    print("Local only (127.0.0.1) — not reachable from your network. Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
