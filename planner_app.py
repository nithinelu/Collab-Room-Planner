"""MeetSpace 3D (formerly Collab Room Planner) - desktop app.

Hosts the planner UI (web/) in a native window via pywebview and gives it file access:
save/open projects, export the BOQ to Excel (with a 3D snapshot per option) and save images.
Run:  py planner_app.py      (or pythonw for no console)
"""
import base64
import json
import os
import sys
from pathlib import Path

import webbrowser

import webview

from catalog_check import CatalogChecker

APP_NAME = "MeetSpace 3D"
HERE = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
SETTINGS_DIR = Path(os.environ.get("APPDATA", Path.home())) / APP_NAME
OLD_SETTINGS_DIR = Path(os.environ.get("APPDATA", Path.home())) / "Collab Room Planner"  # name before 2026-10-28
if not SETTINGS_DIR.exists() and OLD_SETTINGS_DIR.exists():  # carry the last session and product check over
    import shutil
    shutil.copytree(OLD_SETTINGS_DIR, SETTINGS_DIR, ignore=shutil.ignore_patterns("webview"))
STATE_FILE = SETTINGS_DIR / "state.json"


def _first(result):
    """pywebview returns a str, a tuple/list of paths, or None depending on version/dialog."""
    if not result:
        return None
    if isinstance(result, (list, tuple)):
        return result[0] if result else None
    return result


class Api:
    def __init__(self):
        self._window = None
        self._last_dir = str(Path.home() / "Documents")
        self._checker = CatalogChecker(SETTINGS_DIR / "catalog_check.json")

    # ---- vendor product check (runs once per app start, in the background) ----
    def start_catalog_check(self, products):
        return self._checker.start(products)

    def catalog_status(self):
        return self._checker.status()

    def open_url(self, url):
        if isinstance(url, str) and url.startswith(("https://", "http://")):
            webbrowser.open(url)
            return True
        return False

    # ---- persisted UI state ----
    def load_state(self):
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return None

    def save_state(self, state):
        SETTINGS_DIR.mkdir(parents=True, exist_ok=True)
        STATE_FILE.write_text(json.dumps(state, indent=1), encoding="utf-8")
        return True

    # ---- dialogs ----
    def _save_dialog(self, filename, types):
        path = _first(self._window.create_file_dialog(
            webview.FileDialog.SAVE, directory=self._last_dir, save_filename=filename, file_types=types))
        if path:
            self._last_dir = str(Path(path).parent)
        return path

    def save_project(self, state, filename):
        path = self._save_dialog(filename, ("Room project (*.room.json)", "All files (*.*)"))
        if not path:
            return None
        if not path.lower().endswith(".json"):
            path += ".room.json"
        Path(path).write_text(json.dumps({"app": APP_NAME, "version": 1, "state": state}, indent=1), encoding="utf-8")
        return path

    def open_project(self):
        path = _first(self._window.create_file_dialog(
            webview.FileDialog.OPEN, directory=self._last_dir,
            file_types=("Room project (*.room.json;*.json)", "All files (*.*)")))
        if not path:
            return None
        self._last_dir = str(Path(path).parent)
        try:
            data = json.loads(Path(path).read_text(encoding="utf-8"))
        except (OSError, ValueError) as e:
            return {"error": f"Could not read {Path(path).name}: {e}"}
        state = data.get("state", data) if isinstance(data, dict) else None
        if not isinstance(state, dict) or "W" not in state:
            return {"error": f"{Path(path).name} is not a room project."}
        return {"path": path, "state": state}

    def save_png(self, data_url, filename):
        path = self._save_dialog(filename, ("PNG image (*.png)",))
        if not path:
            return None
        if not path.lower().endswith(".png"):
            path += ".png"
        Path(path).write_bytes(_decode(data_url))
        return path

    def open_vrc(self):
        path = _first(self._window.create_file_dialog(
            webview.FileDialog.OPEN, directory=self._last_dir,
            file_types=("Video Room Calculator (*.vrc.json;*.json)", "All files (*.*)")))
        if not path:
            return None
        self._last_dir = str(Path(path).parent)
        try:
            text = Path(path).read_text(encoding="utf-8-sig")
            data = json.loads(text)
        except (OSError, ValueError) as e:
            return {"error": f"Could not read {Path(path).name}: {e}"}
        if not isinstance(data, dict) or "room" not in data or "items" not in data:
            return {"error": f"{Path(path).name} is not a Video Room Calculator file (no room/items)."}
        return {"path": path, "text": text}

    def save_vrc(self, text, filename):
        path = self._save_dialog(filename, ("Video Room Calculator (*.vrc.json)", "JSON (*.json)"))
        if not path:
            return None
        if not path.lower().endswith(".json"):
            path += ".vrc.json"
        Path(path).write_text(text, encoding="utf-8")
        return path

    def export_boq(self, payload):
        name = (payload.get("name") or "Room").strip() or "Room"
        safe = "".join(ch for ch in name if ch not in '\\/:*?"<>|').strip() or "Room"
        path = self._save_dialog(f"{safe} - Room BOQ.xlsx", ("Excel workbook (*.xlsx)",))
        if not path:
            return None
        if not path.lower().endswith(".xlsx"):
            path += ".xlsx"
        from boq_export import write_workbook
        write_workbook(path, payload, _decode)
        os.startfile(path)
        return path


def _decode(data_url):
    return base64.b64decode(data_url.split(",", 1)[1])


def main():
    api = Api()
    window = webview.create_window(
        APP_NAME, str(HERE / "web" / "index.html"), js_api=api,
        width=1500, height=950, min_size=(900, 640), background_color="#eef2f8")
    api._window = window
    debug = "--debug" in sys.argv
    # private mode = no disk cache, so updated web files always load; app state lives in state.json
    webview.start(http_server=True, debug=debug, private_mode=True)


if __name__ == "__main__":
    main()
