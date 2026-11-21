import { ShieldAlert } from "lucide-react"
import { LinkButton } from "./ui"

const connectionPoints = [
  [
    "CPU socket",
    "Match the socket type. Align the triangle markers before lowering the CPU.",
  ],
  [
    "DIMM slots",
    "Check the motherboard manual for the recommended pair of memory slots.",
  ],
  [
    "Retention mechanism",
    "Open the lever or clips before placing components. Close them once the parts are seated.",
  ],
]

const steps = [
  [
    "Prepare",
    "Disconnect power, ground yourself, and check CPU-socket compatibility.",
  ],
  [
    "Align & seat",
    "Hold the CPU by its edges. Lower it gently and secure the retention lever.",
  ],
  [
    "Install memory",
    "Align the notch, press evenly, and confirm the retaining clips lock.",
  ],
]

export function AssemblyDiagram() {
  return (
    <>
      <div className="assembly-diagram">
        <figure>
          <div className="motherboard-frame">
            <div className="motherboard" aria-hidden="true">
              <div className="board-socket">01 / CPU</div>
              <div className="board-ram">
                <span>02 / DIMM</span>
                <i />
                <i />
                <i />
                <i />
              </div>
              <span className="board-retention">03 / RETENTION LEVER</span>
              <div className="board-slots" />
              <div className="board-chip" />
            </div>
          </div>
          <figcaption>ATX motherboard · Simplified component map</figcaption>
        </figure>
        <section className="stack">
          <h2>Know your connection points</h2>
          <ol>
            {connectionPoints.map(([title, note], index) => (
              <li key={title}>
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <section className="stack">
        <h2>A safe installation sequence</h2>
        <ol className="assembly-sequence">
          {steps.map(([title, note], index) => (
            <li key={title}>
              <strong>
                {index + 1} / {title}
              </strong>
              <p>{note}</p>
            </li>
          ))}
        </ol>
      </section>
      <div className="lesson-caution">
        <ShieldAlert aria-hidden="true" />
        <p>
          Never force a component. Stop and recheck orientation if the CPU or
          RAM does not seat correctly. Install the cooler before powering on.
        </p>
      </div>
    </>
  )
}

export function AssemblyPractice() {
  return (
    <section className="feature-top lesson-practice">
      <div>
        <h2>Ready to put it into practice?</h2>
        <p>Apply what you learned in the assembly lab.</p>
      </div>
      <LinkButton variant="outline" to="#/simulation">
        Open assembly lab
      </LinkButton>
    </section>
  )
}
