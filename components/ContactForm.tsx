"use client"

import { FormEvent, useState } from "react"

type FormState = "idle" | "submitting" | "success" | "error"

export default function ContactForm() {
  const [state, setState] = useState<FormState>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState("submitting")
    setErrorMessage("")

    const form = event.currentTarget
    const formData = new FormData(form)

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? ""),
      source: "contact",
    }

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.")
      }

      form.reset()
      setState("success")
    } catch (error) {
      setState("error")
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="name" className="block font-sans-ui text-sm font-medium text-[#141413] mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            disabled={state === "submitting"}
            className="w-full rounded-xl border border-[#dbd9d7] bg-white px-4 py-3 font-sans-ui text-sm text-[#141413] placeholder:text-[#b0aea5] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none transition-all disabled:opacity-60"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block font-sans-ui text-sm font-medium text-[#141413] mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            disabled={state === "submitting"}
            className="w-full rounded-xl border border-[#dbd9d7] bg-white px-4 py-3 font-sans-ui text-sm text-[#141413] placeholder:text-[#b0aea5] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none transition-all disabled:opacity-60"
            placeholder="you@company.com"
          />
        </div>
      </div>
      <div>
        <label htmlFor="subject" className="block font-sans-ui text-sm font-medium text-[#141413] mb-2">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          disabled={state === "submitting"}
          className="w-full rounded-xl border border-[#dbd9d7] bg-white px-4 py-3 font-sans-ui text-sm text-[#141413] placeholder:text-[#b0aea5] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none transition-all disabled:opacity-60"
          placeholder="What's this about?"
        />
      </div>
      <div>
        <label htmlFor="message" className="block font-sans-ui text-sm font-medium text-[#141413] mb-2">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          disabled={state === "submitting"}
          className="w-full rounded-xl border border-[#dbd9d7] bg-white px-4 py-3 font-sans-ui text-sm text-[#141413] placeholder:text-[#b0aea5] focus:border-[#141413] focus:ring-1 focus:ring-[#141413] focus:outline-none transition-all resize-y disabled:opacity-60"
          placeholder="Tell us about your project, your questions, or just say hi."
        />
      </div>

      {state === "success" && (
        <p className="font-sans-ui text-sm text-[#2f6b4f]">
          Thanks — your message was saved. We&apos;ll get back to you soon.
        </p>
      )}

      {state === "error" && (
        <p className="font-sans-ui text-sm text-[#b42318]">
          {errorMessage}
        </p>
      )}

      <button type="submit" className="btn-pill-dark" disabled={state === "submitting"}>
        {state === "submitting" ? "Sending..." : "Send message"}
        {state !== "submitting" && <span aria-hidden="true">→</span>}
      </button>
    </form>
  )
}
