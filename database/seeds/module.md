# PC-CRAFT · Learning Modules Curriculum & Lab Specification

> **Official Curriculum & Reference**: Complete 6-Module, 25-Lesson PC Hardware, Best Practices, and Troubleshooting Curriculum, plus Canonical Troubleshooting Lab Scenarios (#TS-001 to #TS-005), Three.js Simulation Integration, and Frontend Blueprint for **PC-CRAFT: Interactive 3D PC Building Simulation & Troubleshooting Platform**.

---

## 1. Curriculum Scope & Module Page Architecture

The PC-CRAFT core curriculum encompasses **6 foundational modules** totaling **25 full-length lessons**.

- **Modules 01–02**: Workshop safety, ESD protection, tools, and core PC hardware literacy.
- **Module 03**: Step-by-step mechanical assembly, directly paired with the **Assembly Lab** (`client/pages/simulation.html`).
- **Modules 04–05**: Firmware (UEFI/BIOS), operating system deployment, and local networking.
- **Module 06**: Preventive maintenance, diagnostic methodology, and hardware/OS fault isolation, which exclusively powers the **Troubleshooting Lab** (`client/pages/troubleshooting.html`) and its **5 canonical 3D scenarios (#TS-001 to #TS-005)**.

### Summary Table of Modules and Lesson Counts

| Module # | Module Title | Lesson Count | Practical Lab / Interactive Activity |
| :---: | :--- | :---: | :--- |
| **01** | Occupational Health & Safety (OHS) | **3 Lessons** | Virtual Safety Drill & ESD Checklist |
| **02** | Computer Hardware Basics | **4 Lessons** | 3D Component Identification |
| **03** | System Unit Assembly | **5 Lessons** | **Assembly Lab** (Interactive 3D Assembly) |
| **04** | BIOS & Operating Systems | **4 Lessons** | Virtual BIOS Configuration Simulator |
| **05** | Networking Fundamentals | **4 Lessons** | Virtual Cable Crimping & IP Configuration |
| **06** | **Maintenance & Diagnostics** | **5 Lessons** | **Troubleshooting Lab (5 Guided Scenarios: TS-001 to TS-005)** |
| **TOTAL** | **6 Modules** | **25 Lessons** | **5 Troubleshooting Lab Scenarios + Assembly Lab** |

---

## 2. Module 01: Occupational Health & Safety (OHS)

### Lesson 01.1 · Workplace Safety Regulations, Hazard Identification & 5S Principles
* **Module**: `Module 01 · Occupational Health & Safety`
* **Reading Time**: `6 minutes`
* **Learning Objective**: Identify common PC workshop hazards and organize a safe, efficient workspace using the 5S methodology.

#### Why Workspace Safety Comes First
Before you ever touch a motherboard or open a PC case, your workspace determines whether a build goes smoothly or ends in a damaged part—or an injury. Computer repair involves electricity, sharp sheet-metal case edges, tiny screws that vanish in carpet, and heavy power supplies. Good technicians don't rely on luck; they build habits that eliminate hazards before work begins.

#### Common Workshop Hazards to Watch For
| Hazard Type | Real-World Example | How to Prevent It |
| :--- | :--- | :--- |
| **Electrical** | Working on a PC that is still plugged into the wall outlet | Unplug the AC power cord, flip the PSU switch to `O`, and press the front power button for 3 seconds to drain residual charge. |
| **Physical / Sharp Edges** | Slicing fingers on stamped metal inside budget PC cases or I/O shields | Keep a pair of work gloves nearby for rough chassis work, and never force your hand blindly into tight metal cutouts. |
| **Tripping & Clutter** | Loose power strips, tangled cables, or drinks on the workbench | Route cables away from walkways and enforce a strict **no liquids on the workbench** rule. |
| **Ergonomic** | Hunching over a low table for hours while routing cables | Work at waist-to-elbow height with bright overhead lighting so you aren't straining your neck or squinting at tiny header labels. |

#### The 5S Principles for a PC Workbench
Originating in manufacturing, **5S** keeps your repair bench fast, clean, and mistake-free:
1. **Sort (Seiri)**: Keep only the tools and parts you need for the current PC on the desk. Put spare boxes and unrelated parts away.
2. **Set in Order (Seiton)**: Use a magnetic parts tray or labeled pill organizer for screws. Keep motherboard screws separate from case fan and SSD screws—mixing them up can strip threads or crack a board.
3. **Shine (Seiso)**: Wipe down your mat and sweep away stray copper wire clippings, zip-tie ends, and dust before opening a client's PC.
4. **Standardize (Seiketsu)**: Follow the same repeatable setup every time: mat down, magnetic tray on the right, ESD strap clipped, power cord unplugged.
5. **Sustain (Shitsuke)**: Clean up and put tools back in their spots after every session so the bench is ready for the next build.

#### Quick Self-Check
1. **True or False**: Flipping the power supply switch to `O` is enough; you can leave the power cord plugged into the wall while installing RAM.
   * **Answer**: **False.** Always unplug the AC cord from the wall and press the front power button to discharge leftover capacitor energy.
2. **Which 5S step** involves separating motherboard standoffs, M.2 screws, and case screws into a magnetic tray?
   * **Answer**: **Set in Order (Seiton).**

---

### Lesson 01.2 · Electrostatic Discharge (ESD) Prevention, Grounding Straps & Anti-Static Work Surfaces
* **Module**: `Module 01 · Occupational Health & Safety`
* **Reading Time**: `6 minutes`
* **Learning Objective**: Explain how static electricity damages computer chips and apply proper ESD grounding techniques.

#### What is ESD? (The Invisible Chip Killer)
Have you ever walked across a carpet in socks and felt a tiny zap when touching a metal doorknob? That spark is **Electrostatic Discharge (ESD)**—a sudden transfer of static electricity between two objects.

To feel a static shock, the voltage has to be around **3,000 volts**. However, modern computer processors, RAM, and graphics cards contain microscopic transistors that can be permanently damaged—or weakened so they fail months later—by as little as **30 to 100 volts**. You won't see a spark, hear a pop, or feel anything at all, yet the component can be ruined.

#### Best Practices for ESD Protection
1. **Work on the Right Surface**:
   - **Good**: Bare wood, laminate, tile, or a dedicated **anti-static ESD mat** connected to ground.
   - **Avoid**: Carpeted floors, fuzzy blankets, beds, or styrofoam—all of these generate massive static charges.
2. **Use an Anti-Static Wrist Strap**:
   - Wrap the strap snugly around your bare wrist so the metal plate touches your skin.
   - Clip the alligator end to an **unpainted metal part** of the PC chassis (or the grounding snap on an ESD mat).
3. **The "Touch Metal First" Habit**:
   - Even without a strap, touch an unpainted metal surface on the PC case before picking up any circuit board, and avoid shuffling your feet on carpet while holding parts.
4. **Hold Components by the Edges**:
   - Hold RAM sticks, GPUs, and motherboards by their **plastic edges or heatsink shrouds**. Never touch gold contact pins or exposed solder joints—skin oils can also corrode contacts over time.
5. **Use Anti-Static Bags Properly**:
   - Store spare parts *inside* silver/pink anti-static bags. Never set a powered motherboard *on top* of the outside of a metallic anti-static bag, because the outer layer of some shielding bags is slightly conductive.

#### Quick Self-Check
1. **Why is ESD dangerous even when you don't feel a shock?**
   * **Answer**: Humans only feel static at ~3,000V, whereas delicate PC microchips can be damaged by 30V–100V.
2. **Where should you hold a stick of RAM when removing it?**
   * **Answer**: By its outer edges or heatspreader—never by the gold bottom pins.

---

### Lesson 01.3 · Safe Hand Tool Handling, Chemical Safety (Thermal Paste/IPA) & Emergency First Aid
* **Module**: `Module 01 · Occupational Health & Safety`
* **Reading Time**: `5 minutes`
* **Learning Objective**: Select the right hand tools for PC assembly, handle cleaning chemicals safely, and respond to minor workshop emergencies.

#### Choosing and Using the Right Tools
Using the wrong tool is the #1 cause of stripped screws and scratched motherboards:
- **Magnetic-Tip Phillips #2 Screwdriver**: Your main tool for 90% of PC screws (motherboard, PSU, drive cages, PCIe brackets). The magnetic tip keeps screws from falling onto the motherboard—and no, a small screwdriver magnet will not harm modern SSDs or motherboards.
- **Phillips #1 / #0 Precision Screwdriver**: Essential for tiny **M.2 NVMe SSD screws** and laptop panels. Using a #2 driver on an M.2 screw easily strips the head.
- **Plastic Spudger / Pry Tool**: Safely pops open tight cable clips or laptop bezels without scratching metal or snapping plastic.
- **Never Use Power Drills**: Electric drills have too much torque; one slip can smash straight through a motherboard trace. Always turn PC screws by hand until snug, never over-tightened.

#### Chemical & Compressed Air Safety
- **90%+ Isopropyl Alcohol (IPA)**: Used with lint-free microfiber cloths or coffee filters to wipe old thermal paste off a CPU. Use in a ventilated area and **wait until it evaporates completely** (usually 30–60 seconds) before powering on. Never use household glass cleaner or tap water.
- **Thermal Paste**: Most modern pastes (like Arctic MX-4/MX-6 or Noctua NT-H1) are non-conductive, but **liquid metal** pastes *are* electrically conductive and can short-circuit a board if spilled. Wash hands after applying paste and keep it away from eyes and food.
- **Compressed Air Cans**: Always hold the can **upright**. Tilting or shaking it sprays freezing liquid propellant onto components, which can cause condensation or frostbite on skin.

#### Workshop Emergency First Aid
- **Small Cuts (from case metal)**: Wash immediately with clean water and mild soap, apply antiseptic, and cover with a bandage so blood doesn't contaminate electronics.
- **Electrical Shock**: **Never touch a person who is still in contact with a live electrical source.** Cut power at the breaker or unplug the cord with a dry non-conductive object first, then seek medical attention.
- **Chemical Splashes (IPA in eyes)**: Flush gently with clean running water for 15 minutes and seek medical advice if irritation persists.

#### Quick Self-Check
1. **Why should you hold a compressed air duster upright?**
   * **Answer**: Tilting it sprays freezing liquid propellant instead of dry air, risking component condensation and skin frostbite.
2. **Which screwdriver size fits tiny M.2 SSD screws?**
   * **Answer**: A small precision **Phillips #1 or #0** (not a standard #2).

---

## 3. Module 02: Computer Hardware Basics

### Lesson 02.1 · System Architecture & The Information Processing Cycle
* **Module**: `Module 02 · Computer Hardware Basics`
* **Reading Time**: `6 minutes`
* **Learning Objective**: Trace how data flows through a computer using the Input–Processing–Output–Storage cycle and identify the motherboard's role.

#### The 4-Step Information Processing Cycle
Every computer—from a $300 office desktop to a high-end gaming rig—runs on the same four-stage loop:

| Stage | What It Does | Everyday PC Hardware Examples |
| :--- | :--- | :--- |
| **1. Input** | Captures your commands and raw data | Keyboard, mouse, microphone, webcam, game controller |
| **2. Processing** | Executes calculations and instructions | **CPU** (general logic), **GPU** (graphics & parallel math), **RAM** (active workspace) |
| **3. Output** | Delivers results back to you | Monitor, speakers, headphones, printer |
| **4. Storage** | Saves data permanently when power is off | **NVMe SSD**, **SATA SSD**, **Hard Disk Drive (HDD)** |

#### The Motherboard: The Central Nervous System
None of those parts can talk to each other on their own. The **motherboard** is the large printed circuit board (PCB) that connects everything together using copper pathways called **buses**:
- **CPU Socket**: Holds the processor.
- **DIMM Slots**: Hold the RAM sticks right next to the CPU for ultra-fast access.
- **Chipset**: A traffic controller chip (covered by a small heatsink) that manages USB ports, SATA drives, audio, and network adapters.
- **PCIe Expansion Slots**: High-speed lanes primarily used for dedicated graphics cards (x16 slot) and capture/network cards (x1/x4 slots).
- **VRM (Voltage Regulator Module)**: The row of square blocks and heatsinks around the CPU socket that step down 12V PSU power into the ~1.1V–1.3V the CPU needs.

#### Quick Self-Check
1. **Which component acts as the traffic controller for USB ports, SATA drives, and expansion slots on the motherboard?**
   * **Answer**: The **Chipset**.
2. **Where does a computer keep data permanently after you shut it down?**
   * **Answer**: **Storage** (SSD or HDD), not RAM.

---

### Lesson 02.2 · Central Processing Units (Architecture, Sockets, Cores, Threads & Heat Spreaders)
* **Module**: `Module 02 · Computer Hardware Basics`
* **Reading Time**: `7 minutes`
* **Learning Objective**: Understand CPU cores, threads, clock speed, socket compatibility, and why thermal cooling is mandatory.

#### Cores, Threads, and Clock Speed (The Kitchen Analogy)
Imagine a restaurant kitchen:
- **Cores** are the **chefs**. A 6-core CPU has 6 independent chefs who can each cook a different dish (task) at the exact same time.
- **Threads** (via Hyper-Threading / SMT) let each chef **juggle two dishes at once**—while waiting for water to boil on dish A, they chop vegetables for dish B. A 6-core, 12-thread CPU handles 12 simultaneous task streams.
- **Clock Speed (GHz)** is how fast each chef chops. A 4.5 GHz CPU executes 4.5 billion clock cycles per second.
- **Cache (L1/L2/L3)** is the **spice rack right beside the chef**—tiny, ultra-fast memory built directly onto the CPU so it doesn't have to walk over to RAM for frequently used data.

#### Sockets & Compatibility
A CPU only fits a matching motherboard socket:
- **LGA (Land Grid Array)** — Used by modern **Intel** (e.g., LGA 1700, LGA 1851) and **AMD AM5**. The delicate, spring-loaded gold pins live on the *motherboard*, while the bottom of the CPU has flat gold pads.
- **PGA (Pin Grid Array)** — Used by older **AMD AM4** processors. The delicate pins live on the *bottom of the CPU* itself.

> [!CAUTION]
> Never touch the pins inside an LGA motherboard socket! Even a single bent pin can prevent RAM channels from working or stop the PC from booting.

#### Integrated Heat Spreader (IHS) & Cooling
Inside the CPU package is a tiny, fragile silicon die that generates intense heat in seconds. The shiny metal cap on top is the **Integrated Heat Spreader (IHS)**. Because neither the IHS nor a cooler's copper base is microscopically flat, **thermal paste** fills the microscopic air gaps so heat transfers efficiently into the cooler's heatsink and fans. Without a cooler mounted, a modern CPU will overheat and shut down in seconds.

#### Quick Self-Check
1. **In an LGA socket, where are the fragile pins located?**
   * **Answer**: On the **motherboard socket**, not on the CPU.
2. **Why do we apply thermal paste between the CPU and the cooler?**
   * **Answer**: To fill microscopic air gaps between the two metal surfaces and maximize heat transfer.

---

### Lesson 02.3 · Memory Subsystems (DDR4/DDR5 Form Factors, DIMM Channels & Memory Latency)
* **Module**: `Module 02 · Computer Hardware Basics`
* **Reading Time**: `6 minutes`
* **Learning Objective**: Distinguish RAM from storage, compare DDR4 and DDR5, and configure dual-channel memory properly.

#### RAM vs. Storage: The Desk Analogy
- **Storage (SSD/HDD)** is your **filing cabinet**: huge capacity, keeps files safe when the power is off, but slower to open.
- **RAM (Random Access Memory)** is your **physical desk surface**: everything you are actively using right now (Windows, browser tabs, a game) is copied onto the desk so the CPU can grab it instantly. When you turn off the PC, the desk is cleared.

#### Form Factors & Generations (DDR4 vs. DDR5)
- **DIMM**: Full-size sticks for desktop PCs.
- **SO-DIMM**: Shorter sticks for laptops and mini-PCs.
- **DDR4 vs. DDR5**: Each generation has a **different voltage, pin count, and physical notch position** along the bottom edge. You cannot plug DDR4 RAM into a DDR5 motherboard (or vice versa). Never force a stick that doesn't line up with the slot's key bump!

#### Dual-Channel Mode (Why 2 Sticks Beat 1)
Most desktop motherboards have 4 RAM slots (labeled `A1, A2, B1, B2` from left to right). Using **two identical sticks** in the primary dual-channel slots—almost always **`A2` and `B2`** (the 2nd and 4th slots)—doubles the memory bandwidth compared to using a single stick. Think of it as opening a two-lane highway instead of a one-lane road.

#### Speed vs. Latency
RAM specs list two main numbers, such as `DDR5-6000 CL30`:
- **6000 MT/s**: How many million data transfers per second the memory can handle.
- **CL30 (CAS Latency)**: How many clock cycles it takes to respond to a request (lower is faster).

#### Quick Self-Check
1. **If you have two sticks of RAM and a 4-slot motherboard, which two slots do manufacturers almost always recommend?**
   * **Answer**: Slots **A2 and B2** (2nd and 4th slots from the CPU) to enable dual-channel mode.
2. **Can you install DDR4 RAM into a DDR5 motherboard?**
   * **Answer**: **No.** The notch position and electrical specs are incompatible.

---

### Lesson 02.4 · Storage Technologies & Power Delivery
* **Module**: `Module 02 · Computer Hardware Basics`
* **Reading Time**: `7 minutes`
* **Learning Objective**: Compare HDD, SATA SSD, and M.2 NVMe drives, and identify essential ATX power connectors.

#### Storage Technologies Compared
| Storage Type | How It Works | Typical Speed | Best Use Case |
| :--- | :--- | :--- | :--- |
| **3.5" / 2.5" HDD** | Spinning magnetic platters + moving read/write arm | ~100–200 MB/s | Cheap bulk storage (backups, movies, photos) |
| **2.5" SATA SSD** | Flash memory chips; uses SATA data + power cables | ~500–550 MB/s | Budget OS upgrades, secondary game library |
| **M.2 NVMe SSD** | Plugs directly into the motherboard via PCIe lanes (no cables!) | ~3,500–7,000+ MB/s | Primary OS drive, apps, and modern games |

#### Power Supply Unit (PSU) & Essential Connectors
Your **PSU** converts high-voltage wall AC power into clean, regulated **+12V, +5V, and +3.3V DC** power for your components. Look for **80 Plus** efficiency ratings (Bronze, Gold, Platinum) and enough wattage headroom (e.g., 550W–850W depending on GPU).

Every builder must recognize these four key power cables:
1. **24-Pin ATX Cable**: The largest cable; powers the motherboard, chipset, and PCIe slots.
2. **8-Pin (or 4+4 Pin) EPS CPU Cable**: Plugs into the **top-left** of the motherboard to power the CPU. *Do not confuse this with PCIe GPU cables—they are keyed differently!*
3. **6+2 Pin PCIe / 12VHPWR Cable**: Powers dedicated graphics cards.
4. **SATA Power Cable**: Flat L-shaped connector for 2.5" SSDs, 3.5" HDDs, and RGB/fan controllers.

> [!CAUTION]
> **Golden PSU Rule**: **NEVER** mix modular power cables from different PSU brands or even different models from the same brand! While the motherboard ends are standardized, the **PSU-side pinouts are not**—mixing cables can send 12V into a 5V or ground pin and instantly fry drives or the motherboard.

#### Quick Self-Check
1. **Which storage drive requires zero power or data cables because it plugs straight into the motherboard?**
   * **Answer**: An **M.2 NVMe (or M.2 SATA) SSD**.
2. **Why should you never reuse modular PSU cables from a different power supply brand?**
   * **Answer**: The PSU-side pinouts are not standardized and can short-circuit or destroy components.

---

## 4. Module 03: System Unit Assembly

### Lesson 03.1 · Chassis Preparation, I/O Shield Installation & Motherboard Standoff Positioning
* **Module**: `Module 03 · System Unit Assembly`
* **Reading Time**: `6 minutes`
* **Learning Objective**: Prepare a PC case for assembly, install the I/O shield, and verify standoff placement to prevent short circuits.

#### Step 1: Open the Case & Plan Airflow
Remove both side panels (glass front/side panel and rear metal cable-management panel) and place screws in your magnetic tray. Plan your fan airflow before mounting parts:
- **Intake (Cool Air In)**: Front and bottom fans.
- **Exhaust (Hot Air Out)**: Rear and top fans.
- *Tip*: Fans usually blow air toward the side with the plastic **X-shaped support grille** (the back of the fan frame).

#### Step 2: Install the I/O Shield (If Not Integrated)
Many modern motherboards have a built-in I/O shield. If yours came with a separate thin metal plate in the motherboard box:
1. Push it into the rectangular cutout at the back of the case **from the inside**, pressing all four corners until it snaps firmly into place.
2. Make sure any tiny metal grounding tabs don't bend *inside* the USB or Ethernet ports later when you install the board.

#### Step 3: Check Motherboard Standoffs (Crucial!)
**Standoffs** are small brass or black hex pillars screwed into the case tray. They lift the motherboard off the bare metal wall so solder points on the back don't touch the case.
- Match the standoff pattern to your motherboard form factor (**ATX**, **Micro-ATX**, or **Mini-ITX**).
- **Remove any extra standoff** that doesn't line up with a mounting hole on your motherboard! Leaving an unused standoff pressing against the back of the PCB can cause a **dead short** when you power on.

#### Quick Self-Check
1. **What happens if an extra brass standoff is left touching the back of the motherboard where there is no screw hole?**
   * **Answer**: It can cause an electrical **short circuit**, preventing the PC from booting or damaging the board.
2. **Which direction do you install a separate metal I/O shield?**
   * **Answer**: From the **inside** of the case outward until all corners click in.

---

### Lesson 03.2 · Processor & Memory Installation
* **Module**: `Module 03 · System Unit Assembly`
* **Reading Time**: `7 minutes`
* **Learning Objective**: Install a CPU, M.2 SSD, CPU cooler, and dual-channel RAM on the motherboard safely before mounting it in the case.

#### Why "Bench Build" First?
It is much easier to install the CPU, M.2 SSD, RAM, and CPU cooler while the motherboard is resting flat on top of its **cardboard motherboard box** (not on the outside of the anti-static bag!). You get clear lighting, flat support, and plenty of room for your hands.

#### Installing the CPU (Zero Insertion Force)
1. **Lift the Retention Arm**: Push the metal lever next to the socket down slightly, slide it sideways, and lift it open.
2. **Find the Alignment Triangle**: Look for the tiny **gold/printed triangle** on one corner of the CPU and match it to the matching triangle on the socket corner.
3. **Drop Gently—Never Push**: Hold the CPU by its edges and lower it straight down. It should sit completely flat with **zero force** (Zero Insertion Force / ZIF).
4. **Lock the Arm**: Lower the metal plate and latch the lever back down. (On Intel LGA sockets, the black plastic protective cover will pop off automatically as you close it—save that cover in case you ever need to return the board!).

#### Installing M.2 SSD & CPU Cooler
- **M.2 SSD**: Insert the drive into the M.2 slot at a **20–30° angle**, push it flat against the standoff, and secure it with the tiny M.2 screw (or tool-less latch). Don't forget to peel the **plastic protective film** off any M.2 heatsink thermal pad!
- **CPU Cooler**: Apply a **pea-sized dot** of thermal paste in the center of the CPU IHS (unless your cooler already has pre-applied paste). **Peel off the clear plastic sticker** on the bottom of the cooler heatsink! Tighten mounting screws in an **X-pattern** (a few turns each) for even pressure. Plug the cooler fan into the **`CPU_FAN`** header.

#### Installing RAM (Dual-Channel)
1. Open the plastic latches on slots **`A2` and `B2`**.
2. Line up the notch in the RAM stick's gold pins with the bump in the slot.
3. Press straight down evenly with **both thumbs** until both side latches **snap shut with a crisp click**.

#### Quick Self-Check
1. **What two protective plastic films must you always remember to peel off during assembly?**
   * **Answer**: The sticker on the **bottom of the CPU cooler cold plate** and the film on any **M.2 heatsink thermal pad**.
2. **How much force should it take to drop a CPU into its socket?**
   * **Answer**: **Zero force**—if it doesn't sit completely flat on its own, check the triangle alignment.

---

### Lesson 03.3 · Storage Drive Mounting & Expansion Card Installation
* **Module**: `Module 03 · System Unit Assembly`
* **Reading Time**: `6 minutes`
* **Learning Objective**: Mount the motherboard into the chassis, install SATA storage drives, and seat a graphics card in the primary PCIe slot.

#### Mounting the Motherboard into the Case
1. Gently lower the assembled motherboard at a slight angle so the rear ports slide cleanly into the I/O shield.
2. Align the motherboard holes over the brass standoffs.
3. Insert all mounting screws (usually 6–9 screws) and tighten them snug—never crank down so hard that the PCB flexes.

#### Mounting 2.5" SSDs & 3.5" HDDs
- **2.5" SATA SSDs**: Mount onto rear motherboard-tray brackets or PSU shroud sleds using fine-thread M3 screws. They have no moving parts, so orientation doesn't matter.
- **3.5" HDDs**: Slide into the lower drive cage using tool-less trays or coarse #6-32 screws with rubber vibration grommets.
- Connect a **SATA data cable** from each drive to the motherboard's SATA ports (avoid ports disabled by M.2 sharing—check your manual).

#### Installing the Graphics Card (GPU)
1. **Target the Top PCIe x16 Slot**: Always use the **topmost full-length PCIe x16 slot** (closest to the CPU); it has full x16 bandwidth wired directly to the CPU.
2. **Remove Case Expansion Covers**: Unscrew 2 (or 3) metal slot covers on the back of the case matching the GPU's thickness.
3. **Open the PCIe Latch**: Push the retention tab at the right end of the PCIe x16 slot open.
4. **Seat & Screw**: Align the GPU's gold PCIe fingers and rear bracket tabs, then press straight down evenly until the **slot latch clicks locked**. Immediately secure the GPU's metal bracket to the case with screws so it doesn't sag or pull out.

#### Quick Self-Check
1. **Why should a dedicated graphics card be installed in the top PCIe x16 slot?**
   * **Answer**: It connects directly to the CPU with full x16 lanes for maximum speed.
2. **What secures a heavy graphics card besides the motherboard slot latch?**
   * **Answer**: Screws fastening its metal rear I/O bracket to the PC case.

---

### Lesson 03.4 · Power Supply Unit Mounting & Cable Management
* **Module**: `Module 03 · System Unit Assembly`
* **Reading Time**: `7 minutes`
* **Learning Objective**: Mount the PSU correctly, connect core internal power cables, and manage cables for clean airflow.

#### Mounting the PSU
1. Check your case's PSU compartment at the bottom: if there is a **perforated vent with a dust filter**, mount the PSU with its **fan facing DOWN** so it pulls cool outside air and exhausts it out the back. (Only mount fan-up if the case has a solid floor with no vent.)
2. Secure the PSU to the rear of the case using the four coarse #6-32 PSU screws.

#### Connecting Power Cables in the Right Order
Always route tight cables *before* bulky ones:
1. **8-Pin (4+4) EPS CPU Power**: Route behind the motherboard tray up to the **top-left corner** of the motherboard. Plug it in firmly until the plastic clip locks. *(Forgetting this is a classic beginner error—see Troubleshooting Case #TS-004!)*
2. **24-Pin ATX Motherboard Power**: Route through the main right-side grommet and press firmly into the right edge of the board until the clip clicks. Support the underside of the board slightly if it flexes.
3. **PCIe GPU Power (6+2 Pin or 12VHPWR)**: Plug into the side/top of the graphics card until fully seated with **zero gap** between the plug and socket.
4. **SATA Power**: Connect to any 2.5" SSDs, 3.5" HDDs, or fan/RGB hubs.

#### Cable Management Best Practices
- Route excess slack behind the motherboard tray using the case's tie-down loops and velcro straps.
- Keep cables clear of **spinning fan blades** (CPU cooler, GPU fans, case fans).
- Leave a little slack at sharp bends so connectors aren't pulled sideways out of their sockets.

#### Quick Self-Check
1. **If your PC case has a bottom dust filter under the PSU, which way should the PSU fan face?**
   * **Answer**: **Downward**, so it draws cool outside air through the filter.
2. **Where does the 8-pin (4+4) EPS CPU power cable plug in?**
   * **Answer**: The **top-left corner** of the motherboard.

---

### Lesson 03.5 · Front Panel Header Wiring & Pre-Boot Verification
* **Module**: `Module 03 · System Unit Assembly`
* **Reading Time**: `6 minutes`
* **Learning Objective**: Wire front panel case buttons, LEDs, and USB/audio headers accurately, and run a 5-point pre-boot check.

#### Wiring the Front Panel (`F_PANEL` / `JFP1`)
The tiny single-pin connectors from your case's front buttons plug into the **bottom-right corner** of the motherboard. Always check your motherboard's manual or the tiny text printed right below the pins:
- **`POWER SW` (Power Switch)**: Non-polarized (either orientation works)—turns the PC on.
- **`RESET SW` (Reset Switch)**: Non-polarized—restarts the PC.
- **`POWER LED +` / `POWER LED -`**: Polarized (`+` must match `+`). Lights up the case power button.
- **`HDD LED +` / `-`**: Polarized (`+` must match `+`). Blinks when storage is active.

#### Other Front-Case Headers
- **USB 3.0 (19-Pin Blue Header)**: Has a **notched key**—align carefully! The pins are fragile and bend easily if forced at an angle.
- **USB-C (Type-E Key-A)**: Small silver rectangular header; clicks in smoothly.
- **HD Audio (`JAUD1`)**: Bottom-left corner of the motherboard; has one blocked pin hole so it only fits one way.

#### The 5-Point Pre-Boot Verification Checklist
Before plugging the PC into the wall:
1. **24-Pin ATX & 8-Pin EPS CPU** cables fully clicked in?
2. **RAM sticks** latched cleanly on both ends?
3. **CPU cooler fan** plugged into `CPU_FAN` and plastic sticker removed?
4. **GPU** seated, screwed to case, and PCIe power plugged in?
5. **No loose screws or stray cables** touching fan blades or resting on the motherboard?

Now plug in the AC cord, flip the PSU switch to **`I`**, press the front power button, and watch your build come to life!

#### Quick Self-Check
1. **Which front panel connectors care about `+` and `-` polarity?**
   * **Answer**: **`POWER LED`** and **`HDD LED`** (switches like `POWER SW` and `RESET SW` do not).
2. **Where is the `HD Audio` header usually located on a standard ATX/mATX motherboard?**
   * **Answer**: The **bottom-left corner**.

---

## 5. Module 04: BIOS & Operating Systems

### Lesson 04.1 · UEFI/BIOS Firmware Architecture, Access Keys & Configuration Navigation
* **Module**: `Module 04 · BIOS & Operating Systems`
* **Reading Time**: `6 minutes`
* **Learning Objective**: Enter UEFI/BIOS setup, interpret system health telemetry, and enable XMP/EXPO memory profiles.

#### What is UEFI/BIOS?
Before Windows or Linux ever starts, your motherboard runs a tiny built-in operating system stored on a chip called **UEFI** (Unified Extensible Firmware Interface—often still called **BIOS**). It wakes up hardware, runs **POST (Power-On Self-Test)**, checks temperatures, and hands control over to your OS drive.

#### How to Enter UEFI/BIOS
Immediately after pressing the power button, tap the setup key repeatedly until the BIOS screen appears:
- **Desktop Motherboards (ASUS, MSI, Gigabyte, ASRock)**: Usually **`Delete`** or **`F2`**.
- **Laptops / Pre-builts (HP, Dell, Lenovo)**: Often **`F2`**, **`F10`**, **`F12`**, or a dedicated Novo/Esc key.

#### Essential First-Boot BIOS Checks
1. **EZ Mode Overview**: Confirm your exact **CPU model**, total **RAM capacity**, and **storage drives** are detected.
2. **CPU Temperature**: Should sit comfortably around **30°C–45°C** at idle in BIOS. If it climbs past 80°C+ immediately, shut down and check your cooler mount!
3. **Enable XMP (Intel) or EXPO/DOCP (AMD)**: By default, new DDR4/DDR5 RAM runs at a slow base speed (like 2133 or 4800 MT/s). Turning on **XMP/EXPO** safely applies the stick's rated advertised speed (e.g., 3200 or 6000 MT/s).
4. **Save & Exit (`F10`)**: Always save changes before rebooting.

#### Quick Self-Check
1. **Why does newly installed DDR5-6000 RAM often show up at 4800 MT/s on first boot?**
   * **Answer**: Because **XMP or EXPO** is disabled by default in BIOS until you turn it on.
2. **What is a healthy idle CPU temperature inside the BIOS screen?**
   * **Answer**: Around **30°C–45°C**.

---

### Lesson 04.2 · Security Settings (Secure Boot, TPM 2.0, CSM) & Hardware Virtualization
* **Module**: `Module 04 · BIOS & Operating Systems`
* **Reading Time**: `5 minutes`
* **Learning Objective**: Configure modern firmware security features (TPM 2.0, Secure Boot, UEFI mode) and virtualization extensions.

#### Modern Security Features Explained
- **TPM 2.0 (Trusted Platform Module)**: A hardware security chip (Intel **PTT** or AMD **fTPM**) that stores encryption keys and verifies system integrity. **Required by Windows 11.**
- **Secure Boot**: Ensures only digitally signed, trusted bootloaders and OS kernels can start—blocking rootkits and boot-level malware. Must be enabled in pure UEFI mode.
- **CSM (Compatibility Support Module)**: Emulates old Legacy BIOS so ancient drives or operating systems can boot. **Best Practice**: Keep CSM **Disabled** (pure UEFI mode) on modern builds; disabling CSM is also required for **Resizable BAR** (extra GPU performance) and **Secure Boot**.

#### Hardware Virtualization (`Intel VT-x` / `AMD-V` / `SVM`)
If you plan to run **VirtualBox, VMware, Docker, WSL2, or Android emulators**, enable **Intel Virtualization Technology (VT-x)** or **AMD SVM Mode** inside the CPU Configuration menu. Enabling it has zero downside for everyday use.

#### Quick Self-Check
1. **Which two firmware security features are mandatory for a standard Windows 11 installation?**
   * **Answer**: **TPM 2.0** (PTT/fTPM) and **Secure Boot** capability (UEFI mode).
2. **What should CSM (Compatibility Support Module) be set to on a modern Windows 11 PC?**
   * **Answer**: **Disabled** (so the system runs in pure UEFI mode).

---

### Lesson 04.3 · Storage Initialization, Partition Schemes (GPT vs. MBR) & Boot Priority Setup
* **Module**: `Module 04 · BIOS & Operating Systems`
* **Reading Time**: `6 minutes`
* **Learning Objective**: Contrast GPT and MBR partition schemes and configure boot order to install an operating system from USB.

#### GPT vs. MBR Partition Schemes
Before a drive can hold an operating system, it is initialized with a partition table:

| Feature | MBR (Master Boot Record) — Legacy | GPT (GUID Partition Table) — Modern |
| :--- | :--- | :--- |
| **Firmware Mode** | Legacy BIOS / CSM | **UEFI** |
| **Max Drive Size** | 2 TB limit | Virtually unlimited (zettabytes) |
| **Max Primary Partitions** | 4 primary partitions | 128+ partitions |
| **Reliability** | Single partition table at start of drive | Redundant backup header + CRC error checking |

**Best Practice**: Always use **GPT** with **UEFI** for modern SSDs and Windows 10/11 or modern Linux installations.

#### Setting Boot Priority Safely
1. Create a bootable OS USB flash drive (8 GB+, e.g., using the official Microsoft Media Creation Tool or Rufus).
2. Plug the USB into a rear motherboard port, power on, and either:
   - Press the **One-Time Boot Menu key** (`F8`, `F11`, or `F12` depending on brand) and pick **`UEFI: [Your USB Drive]`**, **OR**
   - Set the USB drive to **Boot Option #1** in BIOS, install the OS, and remove the USB when the installer restarts so it doesn't loop back into setup.

#### Quick Self-Check
1. **Why can't an MBR-formatted drive use all 4 TB of a new 4 TB hard drive?**
   * **Answer**: MBR has a hard **2 TB maximum capacity limit**; 4 TB drives require **GPT**.
2. **Which boot entry should you select when installing Windows 11 from a flash drive?**
   * **Answer**: The **`UEFI:`** prefixed USB entry.

---

### Lesson 04.4 · Clean Operating System Installation, Driver Deployment & Post-Installation Updates
* **Module**: `Module 04 · BIOS & Operating Systems`
* **Reading Time**: `6 minutes`
* **Learning Objective**: Perform a clean OS installation, deploy official hardware drivers in the right order, and verify device health.

#### Clean OS Installation Workflow
1. Boot from your UEFI USB installer.
2. Choose **Custom: Install Windows only (advanced)**.
3. If installing on a brand-new SSD, select **Unallocated Space** and click **Next** (the installer automatically creates the EFI, Recovery, and primary NTFS partitions). *Tip: If you have multiple drives installed, temporarily unplug secondary drives during OS install so the EFI boot partition doesn't accidentally land on the wrong drive!*
4. Complete the out-of-box setup (region, keyboard, user account).

#### Driver Deployment Order (Best Practices)
Windows Update installs basic generic drivers, but for peak stability and speed, install these in order:
1. **Chipset Driver** (from your motherboard manufacturer's support page—lets Windows manage CPU power states, USB, and PCIe properly).
2. **Network / Wi-Fi / Audio Drivers** (from the motherboard support page).
3. **Graphics Driver** (directly from **NVIDIA**, **AMD**, or **Intel**—never rely on the outdated driver Windows installs by default).
4. **Windows Update**: Run until all security patches and cumulative updates complete, then restart.

#### Verifying Everything Worked
Open **Device Manager** (`Win + X` → Device Manager). Every category should look clean with **zero yellow exclamation triangles** (`!`) or "Unknown Device" entries. Also check **Display Settings → Advanced Display** to set your monitor's true refresh rate (e.g., 144Hz or 165Hz instead of 60Hz!).

#### Quick Self-Check
1. **Why is it helpful to leave only your target OS drive connected during a clean Windows install?**
   * **Answer**: It prevents the installer from accidentally placing the hidden EFI boot partition on a secondary drive.
2. **Where should you check after installing drivers to confirm no hardware is missing a driver?**
   * **Answer**: **Device Manager** (look for zero yellow warning triangles).

---

## 6. Module 05: Networking Fundamentals

### Lesson 05.1 · Network Topologies, Hardware Devices & The Physical Layer
* **Module**: `Module 05 · Networking Fundamentals`
* **Reading Time**: `5 minutes`
* **Learning Objective**: Identify the roles of NICs, switches, routers, and modems in a Star topology local network.

#### How Local Networks Are Shaped (Star Topology)
Modern homes, schools, and offices use a **Star Topology**: every PC, printer, and access point connects back to a central **switch** or **router**. If one PC's cable is unplugged, only that PC goes offline—the rest of the network keeps running smoothly.

#### Key Networking Hardware Devices
| Device | What It Does | Real-World Analogy |
| :--- | :--- | :--- |
| **NIC (Network Interface Card)** | Built-in Ethernet/Wi-Fi chip inside your PC; has a unique **MAC address** | Your house's mailbox |
| **Switch** | Connects multiple wired devices *inside* the same local network (LAN) using MAC addresses | An internal office mailroom sorting letters between desks |
| **Router** | Connects your local network (LAN) to the internet (WAN) using **IP addresses**; usually includes DHCP & Wi-Fi | The post office gateway sending mail outside your building |
| **Modem** | Translates your ISP's coax/fiber/DSL signal into Ethernet | The translator at the border |

#### Quick Self-Check
1. **Which device connects multiple wired computers together within the same local network?**
   * **Answer**: A **Switch**.
2. **In a Star topology, what happens to the rest of the network if one computer's Ethernet cable is cut?**
   * **Answer**: Only that single computer loses connection; all other devices stay online.

---

### Lesson 05.2 · Twisted-Pair Ethernet Standards, T568A/B Wiring & RJ45 Crimping
* **Module**: `Module 05 · Networking Fundamentals`
* **Reading Time**: `7 minutes`
* **Learning Objective**: Compare Ethernet cable categories, memorize the T568B pinout, and follow proper RJ45 crimping technique.

#### Ethernet Cable Categories
Inside every Ethernet cable are **8 copper wires twisted into 4 pairs**. Twisting the pairs cancels out electromagnetic interference (crosstalk):
- **Cat5e**: Supports **1 Gbps** up to 100 meters (common in older homes/offices).
- **Cat6**: Supports **1 Gbps** (100m) and **10 Gbps** up to 55 meters; tighter twists and often a plastic spline inside.
- **Cat6a**: Supports **10 Gbps** up to the full 100 meters with thicker shielding.

#### T568B vs. T568A Wiring Standard
**T568B** is the most common standard in commercial and residential setups. Both ends of a **straight-through** cable (PC to Switch/Router) use the exact same order:

| Pin # | T568B Wire Color | T568A Wire Color |
| :---: | :--- | :--- |
| **1** | **Orange / White** | Green / White |
| **2** | **Orange** | Green |
| **3** | **Green / White** | Orange / White |
| **4** | **Blue** | Blue |
| **5** | **Blue / White** | Blue / White |
| **6** | **Green** | Orange |
| **7** | **Brown / White** | Brown / White |
| **8** | **Brown** | Brown |

#### 5-Step RJ45 Crimping Best Practices
1. Strip about **1 inch (2.5 cm)** of outer jacket without nicking the inner copper insulation.
2. Untwist, straighten, and arrange wires flat in **T568B order** (left to right, Pin 1 to 8).
3. Trim all 8 tips **perfectly flush** at ~0.5 inches (1.2 cm) from the jacket.
4. Slide into the RJ45 plug (clip facing *away* from you) until every copper tip hits the front wall **and the outer jacket sits inside the strain-relief clamp**.
5. Crimp firmly, then verify with an **Ethernet cable tester** (lights 1–8 should flash in sequence on both ends).

#### Quick Self-Check
1. **Why are the 8 wires inside an Ethernet cable twisted in pairs?**
   * **Answer**: To cancel out electromagnetic interference and crosstalk.
2. **Which two pins are the first two wires (Pin 1 & Pin 2) in the T568B standard?**
   * **Answer**: **Orange/White** (Pin 1) and **Orange** (Pin 2).

---

### Lesson 05.3 · IPv4 Addressing, Subnet Masks, Default Gateways & DHCP vs. Static Setup
* **Module**: `Module 05 · Networking Fundamentals`
* **Reading Time**: `6 minutes`
* **Learning Objective**: Explain IPv4 addresses, subnet masks, gateways, and DNS, and choose between DHCP and Static IP.

#### The 4 Essential Network Settings (Street Address Analogy)
1. **IPv4 Address** (e.g., `192.168.1.45`): Your PC's **unique house number** on the local network.
2. **Subnet Mask** (e.g., `255.255.255.0`): Defines the **neighborhood boundary**—tells your PC which addresses are local (`192.168.1.x`) and which require going out to the router.
3. **Default Gateway** (e.g., `192.168.1.1`): Your **router's address**—the exit gate to reach the internet.
4. **DNS Server** (e.g., `8.8.8.8` or `1.1.1.1`): The **internet's phonebook**—translates human names like `google.com` into numeric IP addresses.

#### DHCP vs. Static IP
- **DHCP (Dynamic Host Configuration Protocol)**: Automatic! Your router hands out an IP, subnet mask, gateway, and DNS automatically when you plug in. Best for laptops, phones, and everyday desktops.
- **Static IP**: Manually typed address that never changes. Best for **network printers, NAS servers, or lab servers** so other devices can always find them at the same address. *(Tip: Pick a static IP outside your router's DHCP pool—or use a DHCP reservation—to avoid IP conflicts!)*

#### Quick Self-Check
1. **What happens if your PC has a valid IP and gateway, but its DNS server is broken or missing?**
   * **Answer**: You can reach websites by raw IP address (like `8.8.8.8`), but domain names (like `google.com`) won't load.
2. **Which protocol automatically assigns IP addresses to devices when they join a network?**
   * **Answer**: **DHCP**.

---

### Lesson 05.4 · Command-Line Network Diagnostic Utilities
* **Module**: `Module 05 · Networking Fundamentals`
* **Reading Time**: `6 minutes`
* **Learning Objective**: Diagnose connectivity failures step-by-step using `ipconfig`, `ping`, and `tracert`.

#### The 4-Step Command-Line Network Triage
Open Command Prompt (`cmd`) or Terminal and test from the inside out:

1. **Check Your Own Address (`ipconfig` on Windows / `ip addr` on Linux)**:
   - Look for a valid LAN IP (like `192.168.1.x` or `10.0.0.x`).
   - **Red Flag (`169.254.x.x`)**: This is an **APIPA** self-assigned address—it means your PC could **not** reach the DHCP server (check your cable, Wi-Fi password, or router).
2. **Test Your Local Network Card (`ping 127.0.0.1`)**:
   - Pings your own PC's loopback address. If this fails, the OS network stack or driver is broken.
3. **Test Your Router (`ping 192.168.1.1` — your Default Gateway)**:
   - Confirms your cable/Wi-Fi link to the router is healthy. If this fails, the issue is inside your building (bad cable, unplugged switch, wrong Wi-Fi).
4. **Test the Internet vs. DNS (`ping 8.8.8.8` then `ping google.com`)**:
   - If `8.8.8.8` replies but `google.com` fails, your internet works and **DNS is the culprit**.
   - Use **`tracert 8.8.8.8`** (or `traceroute` on Linux/macOS) to see the exact router hop where packets drop.

#### Quick Self-Check
1. **If `ipconfig` shows an IP address starting with `169.254.x.x`, what does that tell you?**
   * **Answer**: Your PC failed to get an IP from the **DHCP server** (router) and assigned itself an APIPA fallback address.
2. **If `ping 8.8.8.8` succeeds, but `ping google.com` fails with "Ping request could not find host", what is broken?**
   * **Answer**: **DNS** (Domain Name System) resolution.

---

## 7. Module 06: Maintenance & Diagnostics / Troubleshooting Lab

> **Lab Ownership**: Module 06 is the **exclusive curriculum source** for the **PC-CRAFT Troubleshooting Lab** (`client/pages/troubleshooting.html`), covering all 5 canonical scenarios (**#TS-001 through #TS-005**).

### Lesson 06.1 · Preventive Maintenance Schedules, Thermal Paste Re-application & Dust Mitigation
* **Module**: `Module 06 · Maintenance & Diagnostics`
* **Reading Time**: `6 minutes`
* **Interactive Lab Target**: **Troubleshooting Lab — Case #TS-001 (Heavy Dust Clog & Thermal Shutdown)**

#### Why Preventive Maintenance Matters
Dust is a thermal blanket. Over months of running, intake fans pull lint, pet hair, and fine dust into your CPU cooler fins and GPU heatsinks. When air can no longer flow through the metal fins, CPU temperatures spike to **95°C–100°C**, causing **thermal throttling** (sudden lag) or an **emergency thermal shutdown** mid-game.

#### Recommended Maintenance Schedule
| Interval | Maintenance Task |
| :--- | :--- |
| **Every 1–3 Months** | Slide out magnetic **case dust filters**, rinse or brush them clean, and let them dry completely before reinstalling. |
| **Every 6 Months** | Open the side panel and blow out heatsink fins, GPU fans, and PSU intake using upright **compressed air** (or an ESD-safe electric duster). |
| **Every 2–3 Years** | Re-apply fresh **thermal paste** if idle/load temperatures rise noticeably above normal (dried-out paste turns chalky and stops transferring heat). |

#### Safe Dusting & Repasting Rules
1. **Hold Fan Blades Still!** When blowing compressed air at a PC fan, place one finger gently on the center hub to stop it from spinning. Spinning a fan faster than its rated RPM can ruin the bearings and generate **back-EMF voltage** back into the motherboard.
2. **Never Use a Household Vacuum Inside a PC**: Vacuum nozzles generate huge **static electricity (ESD)** charges.
3. **Repasting Steps**: Unplug AC power → unclip/unscrew CPU cooler → wipe old paste off both the CPU and cooler base with **90%+ Isopropyl Alcohol** and a lint-free cloth → apply a fresh pea-sized dot → remount in an X-pattern.

#### Quick Self-Check
1. **Why should you hold fan blades still when blowing dust out with compressed air?**
   * **Answer**: Overspinning can damage fan bearings and send unwanted back-EMF electricity into the motherboard.
2. **What happens when thick dust clogs a CPU heatsink's fins?**
   * **Answer**: Heat cannot escape, causing CPU temperatures to hit ~99°C–100°C and triggering **thermal throttling or emergency shutdown** (as seen in Lab Scenario **#TS-001**).

---

### Lesson 06.2 · The Universal Diagnostic Methodology
* **Module**: `Module 06 · Maintenance & Diagnostics`
* **Reading Time**: `5 minutes`
* **Interactive Lab Target**: **Troubleshooting Lab — Case #TS-002 (and all Diagnostic Workflows)**

#### Think Like a Scientist, Not a Guesser
Beginners often panic and unplug five parts at once. When the PC suddenly works—or stops working worse—they have no idea what caused it. Professional technicians follow a repeatable **5-Step Diagnostic Loop**:

1. **Observe & Gather Clues**: What did the user change recently? Do fans spin? Are any motherboard Debug LEDs glowing? Are there error messages or beeps?
2. **Form a Hypothesis**: Based on the clues, pick the **most likely** single cause (e.g., *"The orange DRAM light is on and RAM was just upgraded, so a stick is probably unseated"*).
3. **Test One Variable at a Time**: Change **only one thing**, then test. Keep track of what you **ruled out** (e.g., *"Monitor cable is fine"*) vs. what is **relevant** (*"RAM latch is open"*).
4. **Isolate & Resolve**: Fix the confirmed fault safely (power unplugged first!).
5. **Verify Full Recovery**: Boot the PC, confirm the warning light clears, and verify the original symptom is completely gone.

#### Quick Self-Check
1. **Why should you test only one change at a time when troubleshooting?**
   * **Answer**: So you know with certainty which exact change fixed (or caused) the behavior.
2. **In the Troubleshooting Lab, what is the difference between a "Ruled out" finding and a "Relevant" finding?**
   * **Answer**: "Ruled out" means a component tested healthy and isn't the cause; "Relevant" means the clue points directly toward the active fault.

---

### Lesson 06.3 · Basic Hardware Troubleshooting: POST Failures & "Power On, No Display"
* **Module**: `Module 06 · Maintenance & Diagnostics`
* **Reading Time**: `7 minutes`
* **Interactive Lab Target**: **Troubleshooting Lab — Case #TS-002 (Unseated RAM)**

#### What is Happening? (The Problem in Plain English)
You sit down at your desk and push the computer's power button.
- The fans start whooshing inside the case.
- The colorful RGB lights turn on.
- But your monitor screen stays completely black and displays **"NO SIGNAL"**.

Don't panic! This is the single most common computer problem in the world, especially after moving a computer or installing a new part. It almost always means **one small piece is loose**—most often your **RAM (memory stick)**.

#### Real-World Analogy: How a PC Wakes Up
Think of a computer waking up like a student getting ready for school:
1. **Check Brain & Heart (CPU)**
2. **Grab School Backpack (RAM)** — *Halts right here if loose!*
3. **Open Eyes (Graphics Card / Monitor)**
4. **Put on Shoes & Walk Out Door (Load Windows / OS)**

In technical terms, this morning routine is called **POST** (**P**ower-**O**n **S**elf-**T**est). The computer tests each piece of hardware in sequence. If it reaches the RAM and cannot talk to it, **it stops right there**. It refuses to show anything on the monitor until the problem is fixed.

#### Why are the Fans Spinning if the PC is Broken?
> [!NOTE]
> **Common beginner trap:** *"The fans are spinning, so the computer must be working, right?"*
> **Answer:** **No!** Fans are simple electric motors. Just like a household fan plugged into a wall outlet spins the moment electricity arrives, computer fans spin immediately when power is supplied. A spinning fan only proves electricity is flowing—**it does not mean the computer's brain passed its morning checkup.**

#### Your Visual Clue Map: The Motherboard's "Traffic Lights"
Modern motherboards have **4 tiny Debug LEDs** on the top-right corner that tell you exactly where POST stopped:

| Debug LED Label | Typical Color | What It Means |
| :---: | :---: | :--- |
| **CPU** | Red | Problem with the processor or its 8-pin EPS power cable |
| **DRAM** | **Amber / Orange** | **RAM is loose, unlatched, or in the wrong slot** |
| **VGA** | White | Problem with the graphics card or video output path |
| **BOOT** | Green | Processor, RAM, and GPU passed, but Windows/SSD drive is missing |

When you look through the computer's glass side panel and see the **DRAM light glowing orange or yellow**, the motherboard is telling you: *"Hey! I can't detect the memory stick! Check if it's plugged all the way in!"*

#### The 4 Detective Steps to Fix It
1. **Step 1: Look (Don't touch yet!)** — Check if the monitor cable is plugged into the **Graphics Card** (not the motherboard) and check which of the 4 debug lights is lit.
2. **Step 2: Test One Thing** — Never pull out 5 parts at once. Change only one thing at a time.
3. **Step 3: Find the Clue** — Spot the glowing orange **DRAM** light and inspect the RAM slot: the small plastic latch at the end is sticking outward because it never clicked shut.
4. **Step 4: Fix & Verify** — Unplug the power cord, push the RAM stick down until both latches click, plug power back in, and confirm the screen lights up.

#### Step-by-Step: How to Safely Reseat RAM
1. **Safety First: Cut the Power!** Flip the PSU switch to `O`, unplug the wall cable, and press the front power button once to drain residual power.
2. **Open the Latches**: Push the plastic clip(s) at the end of the RAM slot outward.
3. **Check the Notch**: Line up the off-center gap (notch) on the bottom gold pins of the RAM stick with the plastic bump inside the slot.
4. **The "Two-Thumb Click"**: Place both thumbs on the top corners of the RAM stick and press straight down firmly and evenly until **both side latches snap shut with a crisp click**.
5. **Turn It On & Celebrate**: Plug the power cord back in, flip the switch to `I`, and press the power button. The orange DRAM light turns off and your monitor displays the BIOS/OS screen!

#### Beginner Troubleshooting Cheat Sheet
| What You See on the Computer | Debug LED | What is Actually Wrong | How to Fix It |
| :--- | :---: | :--- | :--- |
| Fans spin, monitor says "No Signal" | **DRAM** (Orange) | RAM stick is loose or in the wrong slot | Unplug power, open latches, push RAM down firmly until it clicks |
| Fans spin, monitor says "No Signal" | **VGA** (White) | Display cable is in the wrong port, or GPU is loose | Plug HDMI/DisplayPort cable directly into the dedicated graphics card |
| Computer turns on for 1 second, then immediately dies | **CPU** (Red) | CPU 8-pin power cable at the top-left is unplugged | Plug in the 8-pin EPS CPU power cable from the power supply |
| Computer turns on, shows text, but Windows won't open | **BOOT** (Green) | Computer can't find your SSD or hard drive | Check if your M.2 NVMe or SATA SSD is securely connected |

#### 3 Golden Rules for Beginners
> [!CAUTION]
> 1. **Never Force Anything**: Computer parts fit like puzzle pieces. If the motherboard is bending dangerously, stop and check alignment.
> 2. **Electricity and Hands Don't Mix**: Never touch internal parts while the AC power cable is plugged into the wall.
> 3. **Touch Metal Before Touching Parts (ESD Safety)**: Discharge static by touching an unpainted metal part of the PC case before handling RAM or a CPU.

#### Direct Lab Integration: Troubleshooting Lab Scenario #TS-002
> [!TIP]
> **Experience This in the Troubleshooting Lab (`client/pages/troubleshooting.html`)**:
> Open the virtual PC side panel, spot the glowing orange DRAM debug light, inspect the unlatched RAM clip, click to reseat the RAM until it snaps shut, and watch POST succeed!

#### Quick Self-Check
1. **You turn on a newly built PC. The case fans spin, but the monitor says "No Signal". Does the spinning fan prove the computer passed POST?**
   * **Answer**: **No**—fans only prove raw electric power is arriving, not that the CPU or RAM passed POST.
2. **Which motherboard debug light warns you that a RAM stick is loose?**
   * **Answer**: **Orange / Amber (DRAM)**.
3. **How do you know when a RAM stick is fully seated?**
   * **Answer**: Both side latches snap inward with a distinct **click**.

---

### Lesson 06.4 · Peripheral, Video Output & External Interface Fault Isolation
* **Module**: `Module 06 · Maintenance & Diagnostics`
* **Reading Time**: `6 minutes`
* **Interactive Lab Targets**: **Troubleshooting Lab — Case #TS-003 (Display Cable Mismatch) & Case #TS-004 (Missing CPU EPS 12V Cable)**

#### Fault Pattern 1: PC Boots & Plays Sound, But Screen is Black (Case #TS-003)
If you press the power button, the **green BOOT LED** lights up and turns off, and you even hear the Windows startup chime through your speakers—yet the monitor says *"No Signal"*—the PC is working fine! The video signal is just going to the wrong plug.
- **The Cause**: Many CPUs (like Intel **F-series** chips) have **no integrated graphics**, and on desktops with a dedicated graphics card, the motherboard's upper HDMI/DisplayPort outputs are disabled.
- **The Fix**: Unplug the HDMI/DisplayPort cable from the upper motherboard I/O panel and plug it into the **lower horizontal ports on the dedicated graphics card**.

#### Fault Pattern 2: Instant 1-Second Power Cutoff (Case #TS-004)
You press the power button, fans twitch for half a second, RGB flashes once, and the PC immediately shuts off—and won't try again until you flip the PSU switch off and on.
- **The Cause**: Either the PSU's short-circuit protection tripped (e.g., a stray standoff) **or** the **8-pin (4+4) EPS 12V CPU power cable** at the top-left of the motherboard was forgotten or only half-plugged in!
- **The Fix**: Unplug AC power, inspect the top-left motherboard header, and click the 8-pin EPS CPU cable firmly into place.

#### Isolating USB & External Peripherals
A shorted or power-hungry external USB device (damaged flash drive, frayed mouse cable, unpowered USB hub) can freeze POST or cause over-current warnings. Unplug **all** external USB devices except your keyboard and monitor to see if the PC boots cleanly, then plug devices back in one by one.

#### Quick Self-Check
1. **You hear the Windows chime, and the green BOOT LED passed, but the monitor shows "No Signal". Where should you check first?**
   * **Answer**: Make sure the HDMI/DisplayPort cable is plugged into the **dedicated graphics card**, not the upper motherboard port (Lab Case **#TS-003**).
2. **What missing cable commonly causes a PC to twitch for half a second and shut off immediately?**
   * **Answer**: The **8-pin EPS 12V CPU power cable** in the top-left corner of the motherboard (Lab Case **#TS-004**).

---

### Lesson 06.5 · Operating System Boot Loop, BSOD Analysis & System File Recovery
* **Module**: `Module 06 · Maintenance & Diagnostics`
* **Reading Time**: `6 minutes`
* **Interactive Lab Target**: **Troubleshooting Lab — Case #TS-005 (Storage Device Not Detected)**

#### Fault Pattern: "Reboot and Select Proper Boot Device" (Case #TS-005)
Your PC passes CPU, RAM, and GPU checks—the screen turns on!—but instead of Windows, you see a message like *"Reboot and Select proper Boot device"* or *"No bootable device found"*, and the **green BOOT LED** stays lit.
- **Common Hardware Causes**:
  1. An **M.2 NVMe SSD** popped up at a 30° angle because its tiny retention screw came loose or was missing.
  2. A **SATA data or SATA power cable** slipped loose on a 2.5" SSD.
- **Common Firmware Cause**: Boot priority changed after a BIOS reset (or CSM/UEFI mismatch).
- **The Fix**: Power down, reseat and screw down the M.2 SSD (or firm up SATA cables), then verify the drive appears in BIOS.

#### Handling BSODs (Blue Screen of Death) & Boot Loops
If Windows starts loading and then crashes with a **BSOD** (Blue Screen of Death):
1. **Read the Stop Code** at the bottom of the screen (e.g., `INACCESSIBLE_BOOT_DEVICE`, `MEMORY_MANAGEMENT`, `VIDEO_TDR_FAILURE`).
2. **Enter Windows Recovery Environment (WinRE)**: Interrupt boot 3 times (or boot from your Windows USB and click *Repair your computer*).
3. **Key Recovery Tools**:
   - **Safe Mode**: Loads Windows with minimal drivers—great for uninstalling a bad GPU driver or recent update.
   - **Startup Repair**: Automatically fixes damaged EFI boot records.
   - **Command Prompt (`sfc /scannow`)**: Scans and repairs corrupted Windows system files.

#### Quick Self-Check
1. **If a PC turns on and shows "Reboot and Select proper Boot device" with a solid green BOOT LED, what should you inspect inside the case?**
   * **Answer**: Check that your **M.2 NVMe SSD** is seated flat and screwed down (or that SATA data/power cables are connected), as in Lab Case **#TS-005**.
2. **Which Windows command checks and repairs corrupted core OS system files?**
   * **Answer**: **`sfc /scannow`**.

---

## 8. Canonical Troubleshooting Lab Scenarios & Architectural Guardrails

> [!IMPORTANT]
> ### Strict Architectural Guardrails
> 1. **Sole Authoritative Specification for `troubleshooting.html`**: The scenarios and evidence matrices below are the exclusive reference for implementing `client/pages/troubleshooting.html`, `client/js/troubleshooting/troubleshooting.js`, and `client/js/troubleshooting/faults.js`.
> 2. **Absolute Isolation**: These 5 scenarios belong **exclusively to Module 06 (Maintenance & Diagnostics)** and must never be reassigned to or referenced by Modules 01–05.
> 3. **Closed-Scope Boundary**: No ad-hoc scenarios outside **#TS-001 to #TS-005** are permitted.
> 4. **Wireframe Fidelity**: `troubleshooting.html` replicates `PC-CRAFT · Troubleshooting lab.png` with a two-column split (Left: 3D PC chassis + telemetry badge; Right: 4-phase step guide *1. Observe, 2. Test, 3. Diagnose, 4. Verify*, diagnostic tools bar, and diagnosis submission form; Bottom: real-time evidence table).

### The 5 Canonical Troubleshooting Labs

| Case ID | Lab Scenario Title | Originating Lesson | Core Fault Mechanism |
| :---: | :--- | :--- | :--- |
| **#TS-001** | Heavy Dust Clog & Thermal Cutoff | Lesson 06.1 | Thermal throttling / dust-clogged heatsink |
| **#TS-002** | Power on. No display. *(Featured)* | Lesson 06.3 | Unseated RAM / Amber DRAM debug LED |
| **#TS-003** | Black Screen (No Video Output) | Lesson 06.4 | Display cable plugged into motherboard instead of GPU |
| **#TS-004** | Instant 1-Second Power Cutoff | Lesson 06.4 | Missing 8-Pin CPU EPS 12V cable |
| **#TS-005** | OS Boot Failure / No Media | Lesson 06.5 | Disconnected / unseated M.2 NVMe SSD |

#### Scenario #TS-001: Heavy Dust Clog & Thermal Shutdown
- **Category**: `THERMAL & COOLING` · **Origin**: `Module 06 · Lesson 01` · **Time**: `10–12 minutes`
- **Student Intake**: *"My PC turns on, loads Windows, but shuts off abruptly after 5 minutes of gaming. The fans make a loud whine, and the side panel feels extremely hot."*
- **3D Telemetry & Visuals**: Fans at 100% duty cycle; CPU climbs past 98°C until thermal cutoff; thick grey dust carpet clogging CPU cooler fin stack.
- **Evidence Matrix**:
  - CPU Temperature Sensor → **99°C TjMax (Relevant)**
  - PSU 12V Rail → **Voltages stable within ATX ±5% (Ruled out)**
  - Dust filter & heatsink → **Heatsink fins 85% obstructed with debris (Relevant)**
- **Correct Diagnosis**: Severe heatsink dust blockage causing emergency thermal protection shutdown.
- **Next Action**: Remove cooler, clear dust with compressed air, re-apply thermal compound, and remount cooler.
- **Verification**: Cooler cleaned, CPU idle temp drops to 38°C, system runs stably without shutting down.

#### Scenario #TS-002: Power on. No display (Unseated RAM)
- **Category**: `POST & MEMORY` · **Origin**: `Module 06 · Lesson 03` · **Time**: `10–15 minutes`
- **Student Intake**: *"I upgraded my RAM yesterday. Now the fans spin, but the monitor stays blank. The computer worked before the upgrade. No operating system screen appears."*
- **3D Telemetry & Visuals**: Continuous fan spin; **DRAM Diagnostic LED illuminated Amber/Orange**; monitor shows `NO SIGNAL (HDMI 01)`; secondary DIMM latch open outward with stick slightly raised.
- **Evidence Matrix**:
  - Display check → **Monitor input and HDMI connection are correct (Ruled out)**
  - POST indicators → **DRAM diagnostic LED remains illuminated (Relevant)**
  - Visual inspection → **One RAM module has an unlocked retaining clip (Relevant)**
- **Correct Diagnosis**: RAM module not fully seated.
- **Next Action**: Reseat RAM, then run a POST check.
- **Verification**: RAM pressed into slot until latch snaps shut, DRAM LED turns off, system passes POST, display shows BIOS splash screen.

#### Scenario #TS-003: Video Output Fault (Display Cable Mismatch)
- **Category**: `GRAPHICS & DISPLAY PATH` · **Origin**: `Module 06 · Lesson 04` · **Time**: `8–10 minutes`
- **Student Intake**: *"I bought a new graphics card and installed it. The computer turns on, I hear the Windows chime through my speakers, but the screen is completely black with 'Check Signal Cable'."*
- **3D Telemetry & Visuals**: Fans normal; **BOOT LED glows green**; Windows chime plays; HDMI cable plugged into upper motherboard rear I/O instead of lower dedicated GPU port (CPU has no iGPU).
- **Evidence Matrix**:
  - POST Indicators → **Green BOOT LED illuminated; POST passed (Ruled out)**
  - Audio Output → **OS chime sounds; system fully running (Ruled out)**
  - Rear I/O Cable Inspection → **Display cable plugged into motherboard port instead of dedicated GPU port (Relevant)**
- **Correct Diagnosis**: Display cable plugged into motherboard video port while using a CPU without integrated graphics.
- **Next Action**: Move HDMI/DisplayPort cable to the dedicated graphics card port.
- **Verification**: Cable moved to lower PCIe GPU bracket, monitor detects signal, desktop displays immediately.

#### Scenario #TS-004: Instant Shutoff (Missing CPU EPS 12V Cable)
- **Category**: `POWER DELIVERY & WIRING` · **Origin**: `Module 06 · Lesson 04` · **Time**: `10–12 minutes`
- **Student Intake**: *"I replaced my power supply with a modular one. When I press the power button, the fans twitch for half a second, the RGB flashes once, and the machine immediately dies."*
- **3D Telemetry & Visuals**: 0.5-second power surge then immediate trip; Red CPU LED flashes 200ms; top-left motherboard 8-pin EPS 12V socket is empty.
- **Evidence Matrix**:
  - PSU 24-pin Test → **Power supply turns on normally and rails within spec (Ruled out)**
  - Short Circuit Check → **Motherboard standoffs correctly positioned (Ruled out)**
  - Motherboard Wiring → **8-pin EPS 12V CPU power connector is unpopulated (Relevant)**
- **Correct Diagnosis**: 8-pin EPS 12V auxiliary CPU power cable is unplugged.
- **Next Action**: Connect the 8-pin EPS power lead from the modular PSU to the top-left motherboard header.
- **Verification**: Cable locked in, fans remain spinning, system initiates POST without tripping.

#### Scenario #TS-005: OS Boot Failure (Storage Device Not Detected)
- **Category**: `STORAGE & BOOT DISK` · **Origin**: `Module 06 · Lesson 05` · **Time**: `8–10 minutes`
- **Student Intake**: *"The computer turns on and shows the manufacturer logo, but immediately opens a screen saying: 'Reboot and Select proper Boot device'."*
- **3D Telemetry & Visuals**: CPU, DRAM, and VGA LEDs pass; **BOOT LED solidly lit Green**; M.2 NVMe SSD popped up at a 30° angle due to missing retention screw.
- **Evidence Matrix**:
  - CPU & RAM POST → **All core POST tests pass (Ruled out)**
  - BIOS Boot Priority → **Boot menu empty; zero storage devices discovered (Relevant)**
  - Physical Drive Inspection → **M.2 NVMe SSD unlatched and popped up at 30° angle (Relevant)**
- **Correct Diagnosis**: M.2 SSD unseated from slot due to missing retention screw.
- **Next Action**: Insert M.2 SSD firmly into key-M slot, lay flat, and fasten with M.2 standoff screw.
- **Verification**: Drive fastened flat, BIOS detects SSD model, system boots cleanly into OS desktop.

### Data Model & Verification Schema for `troubleshooting.html`

```javascript
// client/js/troubleshooting/faults.js
// CANONICAL SCENARIO REGISTRY FOR troubleshooting.html
export const CANONICAL_SCENARIOS = {
  'TS-001': {
    id: 'TS-001',
    category: 'THERMAL & COOLING',
    title: 'Heavy Dust Clog & Thermal Shutdown',
    moduleOrigin: 'Module 06 · Lesson 01',
    intakePrompt: 'PC shuts off abruptly after 5 minutes of gaming with loud fan whine.',
    debugLed: 'NONE',
    initialState: { coolerClogged: true, cpuTemp: 99 },
    correctDiagnosis: 'DIAG_HEATSINK_CLOG',
    remediationAction: 'ACTION_CLEAN_REPASTE'
  },
  'TS-002': {
    id: 'TS-002',
    category: 'POST & MEMORY',
    title: 'Power on. No display.',
    moduleOrigin: 'Module 06 · Lesson 03',
    intakePrompt: 'I upgraded my RAM yesterday. Now fans spin, but monitor stays blank.',
    debugLed: 'DRAM_ORANGE',
    initialState: { ramSeated: false, latchOpen: true, displaySignal: false },
    correctDiagnosis: 'RAM module not fully seated',
    remediationAction: 'Reseat RAM, then run a POST check'
  },
  'TS-003': {
    id: 'TS-003',
    category: 'GRAPHICS & DISPLAY PATH',
    title: 'Video Output Fault (Cable Port Mismatch)',
    moduleOrigin: 'Module 06 · Lesson 04',
    intakePrompt: 'New GPU installed. Windows chime plays, but screen displays No Signal.',
    debugLed: 'BOOT_GREEN',
    initialState: { cableOnMotherboard: true, cableOnGPU: false },
    correctDiagnosis: 'Display cable plugged into motherboard video port instead of GPU',
    remediationAction: 'Move display cable to dedicated graphics card port'
  },
  'TS-004': {
    id: 'TS-004',
    category: 'POWER DELIVERY',
    title: 'Instant 1-Second Power Cutoff',
    moduleOrigin: 'Module 06 · Lesson 04',
    intakePrompt: 'Fans twitch for half a second, then computer dies immediately.',
    debugLed: 'CPU_RED_FLASH',
    initialState: { eps12vConnected: false },
    correctDiagnosis: '8-pin EPS 12V auxiliary CPU power cable is unplugged',
    remediationAction: 'Connect 8-pin EPS 12V cable to top-left motherboard header'
  },
  'TS-005': {
    id: 'TS-005',
    category: 'STORAGE & BOOT DISK',
    title: 'OS Boot Failure (Storage Device Not Detected)',
    moduleOrigin: 'Module 06 · Lesson 05',
    intakePrompt: 'Reboot and Select proper Boot device error on boot screen.',
    debugLed: 'BOOT_GREEN',
    initialState: { nvmePoppedUp: true, nvmeScrewed: false },
    correctDiagnosis: 'M.2 SSD unseated from slot due to missing retention screw',
    remediationAction: 'Insert M.2 SSD firmly and secure with retention screw'
  }
};
```

---

## 9. Building the Module 06 Troubleshooting Lab with Three.js Only

100% of the **PC-CRAFT Troubleshooting Lab** can be built using **Three.js alone** with standard Vanilla JavaScript—no external physics engines (Cannon.js/Rapier) or heavy game engines (Unity WebGL) are required, because hardware troubleshooting is **state-based** (e.g., `ramSeated: true/false`, `latchOpen: true/false`, `dramLedOn: true/false`).

| Lab Feature (Module 06) | How Three.js Handles It Alone | Three.js Method / API |
| :--- | :--- | :--- |
| **PC Chassis & Motherboard** | Loads 3D models or draws procedural meshes for chassis, motherboard, and parts | `THREE.GLTFLoader` or `THREE.BoxGeometry` |
| **Orange DRAM Warning Light** | Small cylinder mesh with glowing emissive material | `THREE.MeshStandardMaterial({ emissive: 0xffaa00, emissiveIntensity: 3.0 })` |
| **Clicking & Part Selection** | Shoots a ray from the mouse into the 3D scene to detect clicks | `THREE.Raycaster` & `raycaster.intersectObjects()` |
| **Zooming Into Motherboard** | Smooth camera transition between outer chassis and closeup | `OrbitControls` + camera position `lerp` |
| **Reseating RAM & Snapping Latches** | Animates `ramMesh.position.y` and `latchMesh.rotation.x` | `requestAnimationFrame` |
| **Sound Effects** | Plays audio when clips snap and POST succeeds | `new Audio('assets/sounds/click.mp3').play()` |

### Working Three.js Simulation Code (`client/js/troubleshooting/troubleshooting.js`)

```javascript
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const container = document.getElementById('troubleshooting-canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1726);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.set(0, 4, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2.1;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);
const spotLight = new THREE.SpotLight(0xffffff, 2.5);
spotLight.position.set(5, 12, 6);
scene.add(spotLight);

const mobo = new THREE.Mesh(
  new THREE.BoxGeometry(4.5, 0.1, 4.5),
  new THREE.MeshStandardMaterial({ color: 0x13382c, roughness: 0.6 })
);
scene.add(mobo);

const cpuSocket = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 0.12, 1.4),
  new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
);
cpuSocket.position.set(-0.8, 0.05, -0.6);
scene.add(cpuSocket);

const ramSlot = new THREE.Mesh(
  new THREE.BoxGeometry(0.16, 0.18, 2.8),
  new THREE.MeshStandardMaterial({ color: 0x1e293b })
);
ramSlot.position.set(0.8, 0.08, 0);
scene.add(ramSlot);

const ledMat = new THREE.MeshStandardMaterial({
  color: 0x331500,
  emissive: 0xff8800,
  emissiveIntensity: 4.0
});
const dramLed = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 16), ledMat);
dramLed.position.set(1.8, 0.08, -1.8);
scene.add(dramLed);

const ramStick = new THREE.Mesh(
  new THREE.BoxGeometry(0.08, 0.7, 2.6),
  new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 })
);
ramStick.position.set(0.8, 0.75, 0);
ramStick.name = 'ram_stick';
scene.add(ramStick);

const topLatch = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.2, 0.12),
  new THREE.MeshStandardMaterial({ color: 0xe2e8f0 })
);
topLatch.position.set(0.8, 0.2, -1.35);
topLatch.rotation.x = -0.4;
scene.add(topLatch);

const labState = { powerConnected: true, ramSeated: false, postPassed: false };
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([ramStick, topLatch]);
  if (intersects.length > 0 && !labState.ramSeated) reseatRam();
});

function reseatRam() {
  const targetY = 0.38;
  function animate() {
    if (ramStick.position.y > targetY) {
      ramStick.position.y -= 0.025;
      requestAnimationFrame(animate);
    } else {
      ramStick.position.y = targetY;
      topLatch.rotation.x = 0;
      labState.ramSeated = true;
      labState.postPassed = true;
      ledMat.emissive.setHex(0x000000);
      ledMat.color.setHex(0x222222);
      try { new Audio('../assets/sounds/latch_click.mp3').play(); } catch (e) {}
      const statusElement = document.getElementById('lab-status-banner');
      if (statusElement) {
        statusElement.textContent = '✓ RAM Reseated & Latched! DRAM LED Extinguished. POST Successful!';
        statusElement.className = 'status-success';
      }
    }
  }
  animate();
}

function animateLoop() {
  requestAnimationFrame(animateLoop);
  controls.update();
  renderer.render(scene, camera);
}
animateLoop();
```

---

## 10. Frontend HTML & CSS Implementation Blueprint (Modules 01–06)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PC-CRAFT · Module Learning</title>
  <link rel="stylesheet" href="../css/styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
</head>
<body class="bg-app text-main font-sans">
  <header class="app-header">
    <div class="header-container">
      <div class="brand-group">
        <a href="../index.html" class="brand-link">
          <div class="brand-text">
            <span class="brand-title">PC-CRAFT</span>
            <span class="brand-tagline">Build. Learn. Assess</span>
          </div>
        </a>
      </div>
      <nav class="main-nav">
        <a href="dashboard.html" class="nav-link">Overview</a>
        <a href="modules.html" class="nav-link active">Modules</a>
        <a href="simulation.html" class="nav-link">Assembly lab</a>
        <a href="troubleshooting.html" class="nav-link">Troubleshooting</a>
        <a href="quiz.html" class="nav-link">Quizzes</a>
      </nav>
    </div>
  </header>

  <div class="module-layout-container">
    <aside class="curriculum-sidebar">
      <div class="path-card">
        <span class="path-label">YOUR LEARNING PATH</span>
        <h2 class="path-title">Computer System Servicing</h2>
        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill" style="width: 33%;"></div>
        </div>
        <div class="progress-meta">
          <span>2 of 6 modules completed</span>
          <span class="font-bold">33%</span>
        </div>
      </div>

      <div class="track-section">
        <span class="track-header">CORE CURRICULUM</span>
        <div class="module-item completed">
          <div class="item-status-icon check">✓</div>
          <div class="item-details">
            <h4 class="item-title">Occupational health & safety</h4>
            <span class="item-meta">3 lessons · Complete</span>
          </div>
        </div>
        <div class="module-item completed">
          <div class="item-status-icon check">✓</div>
          <div class="item-details">
            <h4 class="item-title">Computer hardware basics</h4>
            <span class="item-meta">4 lessons · Complete</span>
          </div>
        </div>
        <div class="module-item">
          <span class="module-badge">03</span>
          <div class="item-details">
            <h4 class="item-title">System unit assembly</h4>
            <span class="item-meta">5 lessons · Up next</span>
          </div>
        </div>
        <div class="module-item">
          <span class="module-badge muted">04</span>
          <div class="item-details">
            <h4 class="item-title">BIOS & operating systems</h4>
            <span class="item-meta">4 lessons · Locked</span>
          </div>
        </div>
        <div class="module-item">
          <span class="module-badge muted">05</span>
          <div class="item-details">
            <h4 class="item-title">Networking fundamentals</h4>
            <span class="item-meta">4 lessons · Locked</span>
          </div>
        </div>
        <div class="module-item in-progress expanded">
          <div class="module-header">
            <span class="module-badge active">06</span>
            <div class="item-details">
              <h4 class="item-title">Maintenance & diagnostics</h4>
              <span class="item-meta">5 lessons · Active (Troubleshooting Lab)</span>
            </div>
          </div>
          <ul class="sublesson-list">
            <li class="sublesson-item done">Preventive maintenance & cleaning</li>
            <li class="sublesson-item done">Universal diagnostic methodology</li>
            <li class="sublesson-item active">Basic hardware troubleshooting (POST & RAM)</li>
            <li class="sublesson-item">Peripheral & display fault isolation</li>
            <li class="sublesson-item">OS boot & recovery diagnostics</li>
          </ul>
        </div>
      </div>
    </aside>

    <main class="lesson-canvas">
      <div class="breadcrumb-bar">
        <nav class="breadcrumbs">
          <span>MODULES</span> / <span>MAINTENANCE & DIAGNOSTICS</span> / <span class="current">LESSON 03</span>
        </nav>
        <span class="save-status">✓ Progress saved</span>
      </div>
      <h1 class="lesson-title">Basic Hardware Troubleshooting: POST Failures & "Power On, No Display"</h1>
      <p class="lesson-lead">
        When a PC powers on with spinning fans but shows no display, the computer hasn't finished waking up. Learn how to spot the clues and fix it in four easy steps.
      </p>
      <div class="practice-cta-card">
        <div class="cta-text">
          <h3>Ready to put it into practice?</h3>
          <p>This lesson feeds directly into Troubleshooting Lab Scenario #TS-002.</p>
        </div>
        <a href="troubleshooting.html" class="btn btn-secondary">Open troubleshooting lab ↗</a>
      </div>
      <div class="lesson-footer-nav">
        <button class="btn btn-outline">← Previous lesson</button>
        <button class="btn btn-primary">Mark complete & continue →</button>
      </div>
    </main>
  </div>
</body>
</html>
```
