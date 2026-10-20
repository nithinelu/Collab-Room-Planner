@echo off
rem One-time setup: install Python packages, then add Start Menu + Desktop shortcuts.
py -m pip install -r "%~dp0requirements.txt"
powershell -ExecutionPolicy Bypass -File "%~dp0install_shortcuts.ps1"
pause
