import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { api, message, useResource, type PrivacyNotice, type User } from "./api"
import { LessonBody } from "./LessonBody"
import { Heading, Status } from "./ui"
import privacyPolicy from "./content/privacy-policy.md?raw"
import termsOfUse from "./content/terms-of-use.md?raw"

export function LegalPage({
  terms,
  consentRequired,
}: {
  terms: boolean
  consentRequired: boolean
}) {
  return (
    <main id="main" tabIndex={-1} className="wrap workspace privacy-page">
      <article className="panel stack">
        <Heading title={terms ? "Terms of Use" : "Privacy Policy"} />
        {(consentRequired || !terms) && (
          <p>
            <a href="#/privacy">
              {consentRequired
                ? "Return to privacy acknowledgment"
                : "Read the account Privacy Notice"}
            </a>
          </p>
        )}
        <LessonBody content={terms ? termsOfUse : privacyPolicy} />
      </article>
    </main>
  )
}

export function PrivacyPage({
  acknowledgment,
}: {
  acknowledgment?: {
    onAgree: (user: User) => void
    onDecline: () => void
    signingOut?: boolean
  }
}) {
  const notice = useResource<PrivacyNotice>("/auth/privacy")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const main = useRef<HTMLElement>(null)
  const requiresConsent = Boolean(acknowledgment)

  useEffect(() => {
    if (requiresConsent) main.current?.focus()
  }, [requiresConsent])

  async function agree() {
    if (!notice.data || !acknowledgment) return
    setPending(true)
    setError("")
    try {
      const user = await api<User>("/auth/privacy/consent", "POST", {
        privacy_accepted: true,
        privacy_notice_version: notice.data.version,
      })
      acknowledgment.onAgree(user)
    } catch (error) {
      setError(message(error))
      notice.reload()
    } finally {
      setPending(false)
    }
  }

  return (
    <main
      id="main"
      ref={main}
      tabIndex={-1}
      className="wrap workspace privacy-page"
    >
      <article className="panel stack">
        <Heading title="Privacy Notice">
          {acknowledgment &&
            "Review and accept the notice to continue to PC-CRAFT."}
        </Heading>
        <Status {...notice} />
        {notice.data && (
          <>
            <p className="eyebrow">Version {notice.data.version}</p>
            {notice.data.sections.map(({ title, text }) => (
              <section className="privacy-section" key={title}>
                <h2>{title}</h2>
                <p>{text}</p>
              </section>
            ))}
          </>
        )}
        {acknowledgment && (
          <>
            <Status error={error} />
            <div className="actions">
              <Button
                size="lg"
                disabled={!notice.data || pending || acknowledgment.signingOut}
                onClick={agree}
              >
                {pending ? "Saving acknowledgment…" : "Agree and continue"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                disabled={pending || acknowledgment.signingOut}
                onClick={acknowledgment.onDecline}
              >
                {acknowledgment.signingOut
                  ? "Signing out…"
                  : "Decline and log out"}
              </Button>
            </div>
          </>
        )}
      </article>
    </main>
  )
}
