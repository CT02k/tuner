import type { ReactNode } from "react"

type PageShellProps = {
  children: ReactNode
  mode?: "default" | "onboarding"
}

export default function PageShell({
  children,
  mode = "default",
}: PageShellProps) {
  if (mode === "onboarding") {
    return (
      <main className="min-h-screen bg-green-50 px-4 py-6">
        <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col rounded-[2rem] border border-green-100 bg-white/90 p-5">
          {children}
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap mx-auto max-w-md px-4 pb-8 pt-10">{children}</main>
  )
}
