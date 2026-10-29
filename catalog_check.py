"""Startup product check: open each catalog product's official page in hidden WebView2 windows and classify it.

Vendor sites (Cisco, Huawei, Neat ...) reject scripted HTTP clients, so pages are loaded by the same browser
engine the app uses. Runs in the background; results go to %APPDATA%/MeetSpace 3D/catalog_check.json.

Status per product:
  ok       page loads and names the product
  changed  page loads but now shows another model (e.g. G3 instead of G2, MXA925 instead of MXA920)
  eol      end-of-sale / end-of-life / discontinued wording next to the product name
  missing  page not found, or the product name is not on it
  error    page did not load (offline, blocked, timeout)
"""
import json
import queue
import re
import threading
import time
from datetime import datetime

import webview

EOL_RE = re.compile(r"end[- ]of[- ](sale|life)|discontinued|no longer (available|sold|offered)", re.I)
MATERIAL_RE = re.compile(r"plastic|recycl|material|batter|electronics|packaging|e-waste|take-back", re.I)
NOTFOUND_RE = re.compile(r"\b404\b|not found|page not found|cannot be found", re.I)
WORKERS = 3
LOAD_TIMEOUT = 25
SETTLE = 2.5  # seconds for client-side rendering after the load event

READ_JS = ("JSON.stringify({t:document.title||'',u:location.href,"
           "b:(document.body&&document.body.innerText||'').slice(0,400000)})")


def classify(p, page):
    title, url, body = page.get("t", ""), page.get("u", ""), page.get("b", "")
    text = f"{title}\n{body}"
    low = text.lower()
    kws = [k.lower() for k in p.get("kw", [])]
    if NOTFOUND_RE.search(title) or not body.strip():
        return "missing", f"Page not found ({title or 'empty page'})"
    if kws and not all(k in low for k in kws):
        return "missing", f"Product name not on the page (page title: {title})"
    if kws:
        first = kws[0]
        for m in re.finditer(re.escape(first), low):
            near = low[max(0, m.start() - 250): m.end() + 250]
            for e in EOL_RE.finditer(near):
                around = near[max(0, e.start() - 60): e.end() + 60]
                if not MATERIAL_RE.search(around):  # "end-of-life plastic" etc. is about recycling, not the product
                    return "eol", f"End-of-sale / discontinued wording near '{p['kw'][0]}'"
    model = p.get("model")
    if model and model.lower() not in (title + " " + url).lower():
        return "changed", f"Page now shows: {title}"
    return "ok", title


class CatalogChecker:
    def __init__(self, results_file):
        self.file = results_file
        self.lock = threading.Lock()
        self.state = {"running": False, "done": 0, "total": 0, "results": {}, "started": None, "finished": None}
        try:
            prev = json.loads(results_file.read_text(encoding="utf-8"))
            self.state["previous"] = prev
        except (OSError, ValueError):
            self.state["previous"] = None

    def status(self):
        with self.lock:
            return json.loads(json.dumps(self.state))

    def start(self, products):
        with self.lock:
            if self.state["running"] or self.state["finished"]:
                return False  # once per app run
            self.state.update(running=True, done=0, total=len(products), results={},
                              started=datetime.now().isoformat(timespec="seconds"))
        q = queue.Queue()
        for p in products:
            q.put(p)
        threads = [threading.Thread(target=self._worker, args=(q, i), daemon=True) for i in range(min(WORKERS, len(products)))]
        for t in threads:
            t.start()
        threading.Thread(target=self._finish, args=(threads,), daemon=True).start()
        return True

    @staticmethod
    def _new_window(n):
        win = webview.create_window(f"product-check-{n}", hidden=True)
        time.sleep(1.5)
        return win

    @staticmethod
    def _close(win):
        try:
            win.destroy()
        except Exception:  # noqa: BLE001
            pass

    def _worker(self, q, n):
        try:
            win = self._new_window(n)
        except Exception as e:  # noqa: BLE001 - no window: report every item as error
            win, err = None, f"Could not open a checker window: {e}"
        while True:
            try:
                p = q.get_nowait()
            except queue.Empty:
                break
            if win is None:
                res = ("error", err)
            else:
                res = self._check_once(win, p)
                if res[0] == "error":  # a stalled window fails everything after it: start a fresh one and retry
                    self._close(win)
                    try:
                        win = self._new_window(n)
                        res = self._check_once(win, p)
                    except Exception as e:  # noqa: BLE001
                        win, err = None, f"Could not open a checker window: {e}"
            with self.lock:
                self.state["results"][p["id"]] = {"status": res[0], "note": res[1], "url": p["url"], "name": p["name"]}
                self.state["done"] += 1
        if win is not None:
            self._close(win)

    @staticmethod
    def _check_once(win, p):
        """Load the page and wait until the browser reports it complete (the loaded event is unreliable on reuse)."""
        try:
            try:
                before = win.evaluate_js("location.href") or ""
            except Exception:  # noqa: BLE001 - blank window not ready yet
                before = ""
            win.load_url(p["url"])
            t0 = time.time()
            ready = False
            while time.time() - t0 < LOAD_TIMEOUT:
                time.sleep(1)
                try:
                    state = win.evaluate_js("document.readyState+'|'+location.href") or ""
                except Exception:  # noqa: BLE001 - navigation in progress
                    continue
                rs, _, href = state.partition("|")
                if rs == "complete" and href and href != before and not href.startswith("about:"):
                    ready = True
                    break
            if not ready:
                return "error", "Page did not load (timeout or offline)"
            time.sleep(SETTLE)
            page = json.loads(win.evaluate_js(READ_JS) or "{}")
            if not page.get("b", "").strip():  # client-rendered page not drawn yet
                time.sleep(4)
                page = json.loads(win.evaluate_js(READ_JS) or "{}")
            if not page.get("b", "").strip() and not NOTFOUND_RE.search(page.get("t", "")):
                return "error", f"Page loaded but showed no text ({page.get('t', '')})"
            return classify(p, page)
        except Exception as e:  # noqa: BLE001
            return "error", f"Could not load the page: {e}"

    def _finish(self, threads):
        for t in threads:
            t.join()
        with self.lock:
            self.state["running"] = False
            self.state["finished"] = datetime.now().isoformat(timespec="seconds")
            snap = {k: v for k, v in self.state.items() if k != "previous"}
        try:
            self.file.parent.mkdir(parents=True, exist_ok=True)
            self.file.write_text(json.dumps(snap, indent=1), encoding="utf-8")
        except OSError:
            pass
