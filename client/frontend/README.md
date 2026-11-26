# PC-CRAFT React client

Use Node.js 22.12+ or 24+. Set up the [Express API](../../server/README.md)
and [MySQL database](../../database/README.md) first. Then run from the repository root:

```sh
npm --prefix client/frontend ci
npm --prefix client/frontend run dev
```

Open http://localhost:3000. Vite proxies `/api` to `http://127.0.0.1:5000`.
For a different API port or host, set the public `VITE_API_ORIGIN` before starting
Vite and set the server's `FRONTEND_ORIGIN` to the browser's exact origin.
Run `npm --prefix client/frontend run build` to generate `client/frontend/dist`.
In production, serve that directory and forward `/api` to Express, or set
`VITE_API_ORIGIN` before building and configure CORS on Express.

## Routes and APIs

| React route | Express API under `/api` |
| --- | --- |
| `#/`, `#/login`, `#/register` | `/auth/login`, `/auth/register`, `/auth/me`, `/auth/logout` |
| `#/privacy` and the sign-in acknowledgment | `/auth/privacy`, `/auth/privacy/consent` |
| `#/dashboard`, `#/progress` | `/progress`, `/progress/lessons`, `/quizzes/attempts`, `/feedback` |
| `#/modules/:moduleId/:lessonId` | `/modules`, `/modules/:id/lessons`, `/modules/lessons/:id`, `/progress/lessons`, `/progress/lessons/:id`, `/quizzes?module_id=:moduleId` |
| `#/quizzes/:quizId/:attemptId` | `/quizzes`, `/quizzes/:id`, `/quizzes/:id/attempts`, `/quizzes/attempts/:id`, `/quizzes/attempts/:id/submit` |
| `#/admin` and subpages | `/admin/dashboard`, `/admin/users`, `/admin/users/:id/activity`, `/admin/modules`, `/admin/lessons`, `/admin/quizzes` and their item/status routes |
| `#/admin/logs`, `#/admin/feedback` | `/admin/logs`, `/admin/feedback`, `/admin/feedback/:id` (super admin) |
| `#/simulation` | Guided 3D assembly and disassembly. Progress is local to the tab. |
| `#/troubleshooting` | Five Module 6 troubleshooting cases, including TS-004 on either build. |

The client uses the API's bearer sessions, response envelopes, and paginated
lists. Remember me stores the bearer token across browser sessions. Quiz answer
drafts stay in the current tab until submission. Learner profiles are read-only
because the API has no profile update endpoint. The API supports learner, admin,
and super admin roles. Admin accounts require provisioning by a database operator.

## Manage curriculum

Seed the initial curriculum with the [database import instructions](../../database/README.md#import-the-curriculum).
Sign in as an admin or super admin and open **Modules**, **Lessons**, or
**Quizzes** in the administration navigation. Select an entry or use **Add**.
Save the draft, open **Preview saved draft**, then choose **Publish saved draft**
and confirm. Publish the parent module before publishing its lessons or quizzes.
Lessons accept Markdown, including tables and `> [!CAUTION]`-style callouts.

Use **Unpublish** to return a published item to draft. Use **Archive** to
retire it. Set each question and choice's publication status within its quiz
draft. A published question needs at least two published choices and exactly
one correct published choice. Once a quiz has learner attempts, use **Create
draft copy** to revise it. Review and publish the copy, then retire the old quiz.
Attempts stay attached to the original quiz and its answer key.

## Assembly lab

Open **Assembly lab**, choose a procedure, then open a build. Drag the current
component into the green target outline, or select it in the inventory, choose
the target, and confirm. **Inspect part** fits the selected component in view.
**Reset view** returns to the case and staging area.

| Asset | Size | Component groups | Mesh definitions | Triangles¹ | Materials / textures |
| --- | ---: | ---: | ---: | ---: | ---: |
| Basic | 21.6 MiB | 9 | 258 | 1,164,953 | 63 / 17 |
| Advanced | 24.7 MiB | 10 | 365 | 1,237,762 | 64 / 38 |

¹ File totals count each mesh definition once, including unused scenery. Both
GLBs import with nested meshes, offset pivots, and independent component
roots. The exporter’s separate `Root` group is hidden. Vite copies the optimized
GLBs from `public/assets/models/` and the local decoder files from `public/draco/`
into the production build. The original binaries are in `client/assets/model/`.
Build cards and inventory tiles use small rendered WebP previews. Three.js and
the selected GLB load when the workspace opens.

`src/simulation/catalog.ts` defines component IDs, example specifications,
step order, and target centers in GLB scene coordinates. Each part keeps its
authored orientation and scale. The order supplies the prerequisites and
reverses after the disassembly safety step. Both builds contain an HDD. Basic
uses its two DIMM slots. Advanced adds an M.2 SSD and uses the second and fourth
DIMM slots. The targets were checked against front and open-side model renders.

### Wiring and troubleshooting

Select a cable in the scene or in **Cables**. Connect or unplug its removable
end once its hardware is installed. For POWER SW, choose PWR_SW or RESET_SW on
the simulated F_PANEL header. Seating it on RESET_SW prevents the simulated
power button from starting the PC. Assembly starts with loose leads.
For external Ethernet, use **Inspect cable** to view both endpoints, then
choose **Router LAN jack** for the router end and **Rear LAN jack** for the PC
end. An incorrect port leaves that end where it was. Assembly finishes when
all components are installed and all required cables are connected, including
both Ethernet ends.

Disassembly starts with seated leads. The current step lists cables to
disconnect before the part can go to the tray, whether by dragging it or by
using **Remove component**. Optional leads and a misseated POWER SW plug
also block removal when attached. For Ethernet, unplug the PC end before
removing the motherboard. Cable settings save with procedure progress in the
current tab. Restart restores the procedure defaults.

TS-004 checks that the EPS connector is seated in the motherboard CPU_PWR
header. Run POST verification to confirm the system stays powered and starts
POST. A pass is saved for the current build in the browser tab. Changing a
power connection requires a fresh verification. The rear LAN-to-router check
is separate.

### Module 6 troubleshooting cases

The guided cases follow the canonical Module 6 appendix. TS-001 diagnoses a
dust-clogged heatsink. Remove the cooler, clean it on the workbench, click the
exposed CPU to apply paste, reinstall the cooler, and reconnect CPU_FAN before
verifying temperatures under load. TS-002 checks a correctly connected HDMI 1 monitor
before reseating a loose DIMM and verifying POST on the BIOS screen. TS-003
moves HDMI from the motherboard output to the dedicated GPU and verifies the
desktop. TS-005 reseats the unfastened M.2 SSD in the Advanced model and
verifies drive detection and startup. The other three guided cases use Basic.
Only TS-002 and TS-003 include the procedural monitor on the right and its
single HDMI lead. The unrelated Ethernet lead and router are hidden in these
two cases. In TS-003, the cable trace in the evidence log follows the current
HDMI connection. The rear video ports use virtual jacks aligned to the
Basic model's I/O and expansion bracket.

Run the available tests to collect evidence, choose a diagnosis, apply a fix,
and verify that the symptom is gone. The four guided cases keep evidence and
completion in the current browser tab. The case picker shows completed guided
cases. **Restart** clears the current case. Earlier TS-001 saves start fresh
with the step-by-step cooler repair.

### Cable inventory and calibration

Basic has seven leads. Both builds have ATX, EPS, CPU PWM, POWER SW, HDD SATA
data and power, and external RJ45. Advanced adds GPU PCIe power, Fan01–Fan03
PWM, front USB 3.0, and HD Audio for 13 leads. The Advanced SSD is M.2 and uses
its board socket for power and data. Assembly requires all seven Basic leads
and eight Advanced leads, including GPU power on Advanced.

The two served optimized binaries match the supplied downloads. Both contain
top-level `ram_1` and `ram_2` and three distinct case fan groups. Only Advanced
has an `ssd` group. Basic has the separately named USB 3.0 and audio headers.
Advanced combines its board sockets into larger meshes and uses virtual
header positions for those leads. The Basic fan and I/O meshes do not add
Advanced leads to Basic.

| Endpoint | Basic asset | Advanced asset |
| --- | --- | --- |
| Board ATX, SATA and LAN | `24_pin_connector_0`, `sata_port001_55`, `ethernet_and_usb_20_41` | Virtual faces aligned with the board edge, SATA stack, and rear I/O |
| HDD SATA power and data | `Object_17` and `Object_19` at the drive end | Same named meshes |
| Case fan leads | Basic tier omits the leads | `Fan01`, `Fan02`, `Fan03` frame-relative positions, with virtual SYS_FAN headers |
| PSU and GPU outputs | Virtual ATX, EPS and peripheral positions on the modular face | Same virtual outputs plus PCIe output and GPU input |
| Other endpoints | Virtual CPU_FAN, cooler lead, EPS, front switch lead and both F_PANEL pin pairs | Same virtual endpoints plus front USB and audio leads and their board headers |
| External router | Virtual prop outside rear I/O | Virtual prop outside rear I/O |

Three.js sanitizes the node names shown above. Both PSU meshes include
`modular_ports_7`, which represents the modular area without distinguishing
the individual output types. The Advanced GPU's generic `Socket` mesh is at
its PCIe slot edge. Its power input uses a virtual face on the edge accessible
from the open side.

Add `?cableDebug=1` before the route hash and select a cable to show its seated
anchor axes and node labels. Edit each `point`, `outward`, and `widthAxis` in
`src/simulation/cableConfig.ts` in installed scene coordinates. The cable
manager converts those poses to local offsets on the named node or owning
part. `via` defines the curve waypoints and `fixedVia` keeps shroud crossings
in place while parts move. `unplugClearance` adjusts where an unplugged end
rests. Radius and connector dimensions use Basic scene units, scaled by case
height. The routes were checked from the open side and
rear, including the shroud openings. Virtual faces and combined meshes still
need board-specific calibration for physical connector fit. Drag routes
interpolate and do not solve collisions with other hardware.

The existing `/api/simulation/attempts` version 1 accepts case, motherboard,
CPU, and one memory entry. Saving these procedures to accounts requires a
versioned contract for build ID, both DIMMs, cooler, PSU, drives, GPU, target
IDs, and step progress. Until then, the client restores progress from
`sessionStorage` for the current user, build, and procedure. Account dashboards
continue to report server-backed attempts.

Run the rule checks from the frontend directory:

```sh
node --experimental-strip-types --test src/simulation/*.test.mjs
```
