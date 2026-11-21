import type { ReactNode } from "react"
import { ArrowRight, RefreshCw } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import logo from "../../assets/ui_design/logo/pc_craft_clean.png"
import workbench from "../../assets/image/hero_workbench_photo.png"
import installation from "../../assets/image/cpu_installation_photo.png"

export { workbench, installation }

export function Brand() {
  return (
    <a href="#/" className="brand">
      <img src={logo} alt="" />
      <span>
        <strong>PC-CRAFT</strong>
        <small>Build. Learn. Assess.</small>
      </span>
    </a>
  )
}

export function LinkButton({
  to,
  children,
  variant = "default",
}: {
  to: string
  children: ReactNode
  variant?: "default" | "outline"
}) {
  return (
    <a className={buttonVariants({ variant, size: "lg" })} href={to}>
      {children}
      <ArrowRight aria-hidden="true" />
    </a>
  )
}

export function Heading({
  section,
  title,
  children,
  action,
}: {
  section?: string
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        {section && <div className="eyebrow">{section}</div>}
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  )
}

export function Status({
  loading,
  error,
  reload,
}: {
  loading?: boolean
  error?: string
  reload?: () => void
}) {
  if (loading)
    return (
      <p className="panel" role="status">
        Loading…
      </p>
    )
  if (!error) return null
  return (
    <div className="notice error" role="alert">
      <p>{error}</p>
      {reload && (
        <Button variant="outline" onClick={reload}>
          <RefreshCw aria-hidden="true" /> Try again
        </Button>
      )}
    </div>
  )
}

export function Meter({ value, label }: { value: number; label: string }) {
  return <progress max={100} value={value} aria-label={label} />
}

export function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="panel metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
