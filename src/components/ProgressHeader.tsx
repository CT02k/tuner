import Button from "#/components/Button"
import arrowLeft from "#/components/icons/arrow left.json"
import type { LottieRefCurrentProps } from "lottie-react"
import Lottie from "lottie-react"
import { motion } from "motion/react"
import type { RefObject } from "react"

type ProgressHeaderProps = {
  currentStep: number
  isVisible: boolean
  steps: ReadonlyArray<string>
  onBack: () => void
  arrowLeftRef: RefObject<LottieRefCurrentProps | null>
}

export default function ProgressHeader({
  currentStep,
  isVisible,
  steps,
  onBack,
  arrowLeftRef,
}: ProgressHeaderProps) {
  const progressPercent = isVisible ? 100 : 0

  return (
    <div className="mb-8 flex items-center gap-3">
      <div className="flex w-full items-center">
        <Button
          onClick={() => {
            onBack()
            arrowLeftRef.current?.goToAndPlay(0)
          }}
          border={false}
          size="icon"
          variant="ghost"
        >
          <Lottie
            animationData={arrowLeft}
            style={{ width: 20, height: 20 }}
            loop={false}
            autoplay={false}
            lottieRef={arrowLeftRef}
          />
        </Button>
        <div className="ml-2 h-2 flex-1 rounded-full bg-green-300">
          <motion.div
            className="h-full rounded-full bg-green-500"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />
        </div>
      </div>
      {steps.map((step, index) => {
        const isCompleted = isVisible && currentStep > index

        return (
          <div
            key={step}
            className={`rounded-full bg-green-300 transition-all duration-500 ${
              isVisible ? "w-20" : "w-0"
            }`}
          >
            <motion.div
              className="h-2 rounded-full bg-green-500"
              animate={{ width: isCompleted ? "100%" : "0%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </div>
        )
      })}
    </div>
  )
}
