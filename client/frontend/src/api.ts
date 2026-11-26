import { useCallback, useEffect, useState } from "react"

export type User = {
  user_id: string
  first_name: string
  last_name: string
  email: string
  role: "learner" | "admin" | "super_admin"
  privacy_accepted: boolean
}
export type PrivacyNotice = {
  version: string
  sections: { title: string; text: string }[]
}
export type Module = {
  module_id: string
  title: string
  summary: string | null
}
export type Lesson = {
  lesson_id: string
  module_id: string
  title: string
  learning_objective?: string | null
  reading_minutes?: number | null
}
export type LessonProgress = Lesson & {
  status: string
  available?: boolean
  completed_at?: string | null
}
export type Progress = {
  lesson_count: number
  completed_count: number
  completion_percent: number
  next_lesson: Lesson | null
  resumable_assembly: {
    assembly_attempt_id: string
    updated_at?: string
  } | null
}
export type Quiz = {
  quiz_id: string
  title: string
  instructions: string | null
  pass_mark: string
}
export type Question = {
  question_id: string
  question_text: string
  points?: string
  choices: { choice_id: string; choice_text: string }[]
}
export type Attempt = {
  attempt_id: string
  quiz_id: string
  quiz_title?: string
  started_at?: string
  submitted_at: string | null
  score: string | null
  max_score: string | null
  passed: number | null
}
type Envelope<T> =
  | { ok: true; data: T; meta?: { has_more: boolean } }
  | { ok: false; error: { code: string; message: string } }

const tokenKey = "pc-craft-token"

export function getToken() {
  return localStorage.getItem(tokenKey) ?? sessionStorage.getItem(tokenKey)
}

export function setToken(token: string | null, remember = false) {
  localStorage.removeItem(tokenKey)
  sessionStorage.removeItem(tokenKey)
  if (token) (remember ? localStorage : sessionStorage).setItem(tokenKey, token)
}

async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal
) {
  const headers = new Headers()
  const token = getToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)
  if (body !== undefined) headers.set("Content-Type", "application/json")
  const origin = (import.meta.env.VITE_API_ORIGIN ?? "").replace(/\/$/, "")
  const response = await fetch(`${origin}/api${path}`, {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (
    response.status === 401 &&
    token &&
    token === getToken() &&
    path !== "/auth/login"
  ) {
    setToken(null)
    window.dispatchEvent(new Event("pc-craft-session-ended"))
  }
  const payload = (await response
    .json()
    .catch(() => null)) as Envelope<T> | null
  if (payload?.ok === false) {
    if (
      payload.error.code === "PRIVACY_CONSENT_REQUIRED" &&
      token &&
      token === getToken() &&
      !signal?.aborted
    ) {
      window.dispatchEvent(new Event("pc-craft-privacy-required"))
    }
    throw new Error(payload.error.message)
  }
  if (!response.ok || !payload?.ok)
    throw new Error("The API is unavailable. Please try again.")
  return payload
}

export async function api<T>(path: string, method?: string, body?: unknown) {
  return (await request<T>(path, method, body)).data
}

async function read<T>(
  path: string,
  list: boolean,
  signal: AbortSignal
): Promise<T> {
  if (!list) return (await request<T>(path, "GET", undefined, signal)).data
  const rows = []
  for (let page = 1; ; page++) {
    const result = await request<unknown[]>(
      `${path}${path.includes("?") ? "&" : "?"}page=${page}&limit=100`,
      "GET",
      undefined,
      signal
    )
    rows.push(...result.data)
    if (!result.meta?.has_more) return rows as T
  }
}

type Resource<T> = { data: T; error?: never } | { data?: never; error: string }

export function useResource<T>(path: string | null, list = false) {
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision((value) => value + 1), [])
  const key = `${path}:${list}:${revision}`
  const [state, setState] = useState<{ key: string; result: Resource<T> }>()
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    read<T>(path, list, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ key, result: { data } })
      },
      (error) => {
        if (!controller.signal.aborted)
          setState({ key, result: { error: message(error) } })
      }
    )
    return () => controller.abort()
  }, [key, path, list])
  const result = state?.key === key ? state.result : undefined
  return {
    data: result?.data,
    error: result?.error,
    loading: Boolean(path) && state?.key !== key,
    reload,
  }
}

export function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again."
}
