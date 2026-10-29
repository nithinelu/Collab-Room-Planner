# Adds "MeetSpace 3D" to the Start Menu and Desktop (current user only).
# Run:  powershell -ExecutionPolicy Bypass -File install_shortcuts.ps1
# Remove: delete the two "MeetSpace 3D.lnk" files.

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$pyw = Join-Path $env:LOCALAPPDATA "Python\bin\pythonw.exe"
if (-not (Test-Path $pyw)) { $pyw = Join-Path $env:LOCALAPPDATA "Python\pythoncore-3.14-64\pythonw.exe" }
if (-not (Test-Path $pyw)) { throw "pythonw.exe not found - install Python and run setup.bat first." }

$shell = New-Object -ComObject WScript.Shell
# remove shortcuts left from the tool's old name (Collab Room Planner)
foreach ($old in @((Join-Path ([Environment]::GetFolderPath("Programs")) "Collab Room Planner.lnk"),
                   (Join-Path ([Environment]::GetFolderPath("Desktop")) "Collab Room Planner.lnk"))) {
    if (Test-Path $old) { Remove-Item $old -Force; "Removed old shortcut $old" }
}
$targets = @(
    (Join-Path ([Environment]::GetFolderPath("Programs")) "MeetSpace 3D.lnk"),
    (Join-Path ([Environment]::GetFolderPath("Desktop")) "MeetSpace 3D.lnk")
)
foreach ($lnk in $targets) {
    $s = $shell.CreateShortcut($lnk)
    $s.TargetPath = $pyw
    $s.Arguments = '"' + (Join-Path $here "planner_app.py") + '"'
    $s.WorkingDirectory = $here
    $s.IconLocation = (Join-Path $here "app.ico") + ",0"
    $s.Description = "MeetSpace 3D - meeting room camera, audio, display and cabling planner"
    $s.Save()
    "Created $lnk"
}
