import type { ReactNode } from "react"
import { motion } from "motion/react"

type PageTransitionProps = {
  children: ReactNode
  transitionKey: string
}

export default function PageTransition({
  children,
  transitionKey,
}: PageTransitionProps) {
  return (
    <motion.div
      key={transitionKey}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  )
}
