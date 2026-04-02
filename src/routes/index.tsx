import Button from "#/components/Button"
import MicrophoneToggleButton from "#/components/MicrophoneToggleButton"
import PageShell from "#/components/PageShell"
import ProgressHeader from "#/components/ProgressHeader"
import PageTransition from "#/components/PageTransition"
import TunerGauge from "#/components/TunerGauge"
import { useMicrophone } from "#/hooks/useMicrophone"
import {
  formatInstrumentCopy,
  getInstrumentStringMap,
  instruments,
} from "#/lib/instruments"
import { createFileRoute } from "@tanstack/react-router"
import type { LottieRefCurrentProps } from "lottie-react"
import { AnimatePresence, motion } from "motion/react"
import { useMemo, useRef, useState } from "react"

export const Route = createFileRoute("/")({ component: App })

type OnboardingView = "choice" | "guided" | "closed"

function getCentsOff(freq: number, targetFreq: number) {
  return 1200 * Math.log2(freq / targetFreq)
}

function isValidFrequency(freq: number | null, min = 150, max = 750) {
  return !!freq && freq >= min && freq <= max
}

function clampFrequency(freq: number, min: number, max: number) {
  return Math.min(max, Math.max(min, freq))
}

function App() {
  const instrument = instruments.violin
  const stringMap = useMemo(
    () => getInstrumentStringMap(instrument),
    [instrument],
  )
  const guidedSteps = instrument.guidedOrder.map(
    (stringId) => stringMap.get(stringId)?.label ?? stringId,
  )
  const { frequency, volume, isListening, error, start, stop } = useMicrophone()
  const [onboardingView, setOnboardingView] = useState<OnboardingView>("choice")
  const [guidedStep, setGuidedStep] = useState(0)
  const [selectedString, setSelectedString] = useState<string>(
    instrument.guidedOrder[0],
  )
  const arrowLeftRef = useRef<LottieRefCurrentProps>(null)

  const activeStringId =
    onboardingView === "guided"
      ? (instrument.guidedOrder[guidedStep] ?? instrument.guidedOrder[0])
      : selectedString

  const usableFrequency = useMemo(() => {
    if (
      !isValidFrequency(
        frequency,
        instrument.frequencyRange.min,
        instrument.frequencyRange.max,
      )
    ) {
      return null
    }
    if (volume && volume < instrument.minimumVolume) return null
    return frequency
  }, [frequency, instrument, volume])

  const targetString = useMemo(() => {
    return stringMap.get(activeStringId) ?? null
  }, [activeStringId, stringMap])

  const cents = useMemo(() => {
    if (!usableFrequency || !targetString) return null
    return getCentsOff(usableFrequency, targetString.freq)
  }, [usableFrequency, targetString])

  const gaugeValue = useMemo(() => {
    if (cents == null) return 0
    return clampFrequency(cents, instrument.gauge.min, instrument.gauge.max)
  }, [cents, instrument.gauge.max, instrument.gauge.min])

  const isLastGuidedStep = guidedStep === instrument.guidedOrder.length - 1
  if (onboardingView !== "closed") {
    return (
      <PageShell mode="onboarding">
        <ProgressHeader
          currentStep={guidedStep}
          isVisible={onboardingView === "guided"}
          steps={guidedSteps}
          arrowLeftRef={arrowLeftRef}
          onBack={() => {
            if (onboardingView === "guided" && guidedStep > 0) {
              setGuidedStep((step) => step - 1)
              return
            }

            setOnboardingView("choice")
          }}
        />

        <AnimatePresence mode="wait" initial={false}>
          {onboardingView === "choice" && (
            <PageTransition transitionKey="choice">
              <div className="flex flex-1 flex-col justify-between">
                <div className="space-y-4">
                  <motion.div
                    className="w-fit rounded-2xl bg-linear-to-br from-green-500 via-green-300 to-green-500 p-0.5 contain-content"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-green-500 text-4xl">
                      <motion.h1
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                      >
                        {instrument.icon}
                      </motion.h1>
                    </div>
                  </motion.div>

                  <div>
                    <motion.h1
                      className="mt-2 text-3xl font-bold text-green-950"
                      animate={{ opacity: [0, 1], y: [50, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      {instrument.copy.pickerTitle}
                    </motion.h1>
                  </div>

                  <div className="space-y-3 pt-2">
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Button
                        onClick={() => {
                          setGuidedStep(0)
                          setOnboardingView("guided")
                        }}
                        fullWidth
                        size="lg"
                        variant="option"
                        className="bg-green-500 text-white"
                      >
                        <p className="font-semibold">
                          {instrument.copy.guidedModeTitle}
                        </p>
                        <p className="text-sm font-normal">
                          {instrument.copy.guidedModeDescription}
                        </p>
                      </Button>
                    </motion.div>

                    <motion.div
                      className="space-y-3"
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <Button
                        onClick={() => setOnboardingView("closed")}
                        fullWidth
                        size="lg"
                        variant="option"
                        className="bg-blue-500"
                      >
                        <p className="font-semibold">
                          {instrument.copy.manualModeTitle}
                        </p>
                        <p className="text-sm font-normal">
                          {instrument.copy.manualModeDescription}
                        </p>
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </PageTransition>
          )}

          {onboardingView === "guided" && targetString && (
            <PageTransition transitionKey={`guided-${guidedStep}`}>
              <div className="flex flex-1 gap-6">
                <div className="flex flex-1 flex-col justify-between">
                  <div className="space-y-4">
                    <motion.div
                      className="w-fit rounded-2xl bg-linear-to-br from-green-500 via-green-300 to-green-500 p-0.5 contain-content"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-green-500 text-4xl">
                        <motion.h1
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.4 }}
                        >
                          {instrument.icon}
                        </motion.h1>
                      </div>
                    </motion.div>

                    <div>
                      <h1 className="mt-2 text-3xl font-bold text-green-950">
                        {formatInstrumentCopy(instrument.copy.guidedTitle, {
                          stringLabel: targetString.label,
                        })}
                      </h1>
                    </div>
                    <TunerGauge gauge={instrument.gauge} value={gaugeValue} />
                  </div>

                  <Button
                    onClick={() => {
                      if (isLastGuidedStep) {
                        setOnboardingView("closed")
                        return
                      }

                      setGuidedStep((step) => step + 1)
                    }}
                    fullWidth
                    size="lg"
                    className="mt-8"
                  >
                    {isLastGuidedStep
                      ? instrument.copy.guidedDoneCta
                      : instrument.copy.guidedStepCta}
                  </Button>
                </div>
              </div>
            </PageTransition>
          )}
        </AnimatePresence>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <h1 className="mb-4 text-3xl font-bold">{instrument.copy.manualTitle}</h1>

      <MicrophoneToggleButton
        isListening={isListening}
        onClick={isListening ? stop : start}
      />

      <div className="mb-6 flex select-none">
        {instrument.strings.map((item, index) => (
          <Button
            key={item.id}
            onClick={() => setSelectedString(item.id)}
            size="sm"
            variant={selectedString === item.id ? "primary" : "outline"}
            className={`rounded-none ${
              index === 0 ? "rounded-l-lg border" : "border-y border-r"
            } ${index === instrument.strings.length - 1 ? "rounded-r-lg" : ""}`}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {!usableFrequency && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            {isListening
              ? instrument.copy.listeningHint
              : instrument.copy.idleHint}
          </p>
          <p className="text-sm text-gray-500">
            {instrument.copy.quietRoomHint}
          </p>
        </div>
      )}

      <div className="space-y-5">
        <div className="text-center">
          <p className="text-sm text-gray-500">{instrument.copy.targetLabel}</p>
          <p className="text-6xl font-bold">{targetString?.label}</p>
          <p className="text-sm text-gray-500">
            {targetString?.name} - {targetString?.id}
          </p>
        </div>

        <div>
          <TunerGauge gauge={instrument.gauge} value={gaugeValue} />
        </div>
      </div>
    </PageShell>
  )
}
