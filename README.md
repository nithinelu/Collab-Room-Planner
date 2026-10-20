# Collab Room Planner

Desktop app for planning meeting rooms: room size, seats and table, then a Cisco / Logitech / MAXHUB / Huawei
device (Neat included), with camera coverage, mic pickup and minimum display size per seat, in 2D or 3D. Two devices can be compared side by side.

## Run
- Start Menu or Desktop shortcut **Collab Room Planner**, or double-click `Collab Room Planner.bat`.
- First time on a new PC: run `setup.bat` (installs `pywebview` + `openpyxl` and adds the shortcuts).

## Features
- **Room types**: Boardroom, Classroom (desks for two, centre aisle) and Auditorium (theatre rows, max 7 seats either
  side of the aisle), each with a presenter at a lectern for classroom/auditorium. Presets for each. Cisco codecs
  (Room Kit EQ / EQX / **Pro G2**) switch to Ceiling Microphone Pro in classrooms and auditoriums.
- **Audio system** per device: ceiling speakers (Shure MXN5W-C, Cisco Ceiling Speaker Pro, passive ceiling speaker)
  with a count (0 = automatic from coverage), ceiling mics (Cisco Ceiling Mic Pro, Shure MXA920, Sennheiser TeamConnect
  Ceiling 2 / Medium) and an external DSP (Auto, Shure P300 / IntelliMix Room, Biamp TesiraFORTÉ X 400, QSC Core Nano).
  Speakers show as S1, S2… in 2D/3D with coverage rings; they feed the BOQ (mounts, DSP, amp, PoE ports) and cable schedule.
- **Mounting & cabling** panel: display bottom height, video bar above/below, wall/corner camera heights, side-camera
  distance; equipment location, cable route (ceiling / floor / wall trunking), floor box, uplink, slack and service loops.
- **Installation section**: mounting checks (camera tilt, front-row viewing angle, 6× rule, ceiling clearance, sightlines)
  and a cable schedule (every run, cable type, length incl. slack). CAT6 boxes, connectors, HDMI lengths, HDBaseT,
  containment and floor box go straight into the BOQ; the Excel export adds an "Install A/B" sheet per option.
- **Extra cameras** per device (up to 4): Cisco Room Vision PTZ / Quad Camera, Logitech Sight, Neat Center, or a generic
  PTZ for MAXHUB/Huawei, placed on a side/rear wall, front corner or the table. Each gets a "C2 view" etc. in 3D.
- **Cisco cross-view** (Room Kit EQ / EQX / Pro G2): Off / Cross-view (2 × Room Vision PTZ, one per side wall) /
  Dual cross-view (4 × PTZ, front + rear half of each side wall, for long tables). **Extended Speaker View** adds a PTZ
  above the screen for close-ups of far seats (its C-view shows the zoomed shot). The
  "face-on across table" pill counts seats some camera sees face-on when people turn to talk across the table.
- **3D view** per device: drag to orbit, right-drag to pan, scroll to zoom. Views: Perspective, Top, Side, and
  **Camera view** (the room seen through the device lens at its HFOV). "Link the two 3D views" moves A and B together.
- People are coloured by coverage (green covered, amber marginal, red not covered). The blue fan is the camera at seated
  eye height; the orange floor discs are mic pickup (solid = planning radius, dashed = rated).
- **Export BOQ to Excel** (Ctrl+E): one `BOQ A/B` sheet per option (S/N, Item, Description, Qty, which the BOQ Costing
  Tool reads as a plain hardware BOQ), plus a Summary sheet with room data, coverage and the 3D snapshots.
- **Save / Open** projects as `.room.json` (Ctrl+S / Ctrl+O). Edited HFOV / reach / mic values are saved with the project.
- **Export to Video Room Calculator** (button under each BOQ, or "VRC file…" in the 3D toolbar): saves the option as a
  `.vrc.json` for collabexperience.com — room size, Cisco endpoint / displays, table or desks, chairs, presenter,
  Navigator, mics, ceiling speakers and Room Vision PTZ with their Cross-View / Extended Speaker View roles.
  Non-Cisco devices export as "Unknown Video Device" / "Unknown Camera".
- **Import VRC…** (Ctrl+I): opens a Video Room Calculator `.vrc.json` as the "Imported (VRC)" room type, keeping its
  exact geometry: room size, chairs/presenter, tables (any angle), columns/doors, the Cisco endpoint's position and angle,
  displays (size, height, dual), Room Vision PTZ with Cross-View / Extended Speaker View roles, table/ceiling mics and
  ceiling speakers. It loads into option A; option B can be compared on the same room. Re-export round-trips the layout.
- **Save image…** writes a 1600×900 PNG of the 3D view.

## Files
- `planner_app.py`: pywebview window and file dialogs. `boq_export.py`: Excel writer.
- `web/`: UI (`app.js` = catalog, layout, analysis, 2D, BOQ; `view3d.js` = three.js scene). three.js r160 is bundled
  in `web/vendor`, so no internet is needed.
- Last session state: `%APPDATA%\Collab Room Planner\state.json`.
