import Button from "#/components/Button"
import MicrophoneToggleButton from "#/components/MicrophoneToggleButton"
import PageShell from "#/components/PageShell"
import ProgressHeader from "#/components/ProgressHeader"
import PageTransition from "#/components/PageTransition"
import TunerGauge from "#/components/TunerGauge"
import { useMicrophone } from "#/hooks/useMicrophone"
import {
  formatInstrumentCopy,
  getClosestInstrumentString,
  getInstrumentStringMap,
  instruments,
} from "#/lib/instruments"
import { getCentsOff } from "#/lib/tuning"
import { createFileRoute } from "@tanstack/react-router"
import type { LottieRefCurrentProps } from "lottie-react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useMemo, useRef, useState } from "react"

export const Route = createFileRoute("/")({ component: App })

type OnboardingView = "choice" | "guided" | "closed"

function isValidFrequency(freq: number | null, min = 150, max = 750) {
  return !!freq && freq >= min && freq <= max
}

function clampFrequency(freq: number, min: number, max: number) {
  return Math.min(max, Math.max(min, freq))
}

function getTuningInstruction(cents: number | null, stringLabel: string) {
  if (cents == null) {
    return `Play the ${stringLabel} string near the microphone.`
  }

  const absoluteCents = Math.abs(cents)

  if (absoluteCents <= 5) {
    return `${stringLabel} string is in tune.`
  }

  const roundedCents = absoluteCents.toFixed(1)

  if (cents < 0) {
    return `Tighten the ${stringLabel} string by ${roundedCents} cents.`
  }

  return `Loosen the ${stringLabel} string by ${roundedCents} cents.`
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
  const [heldFrequency, setHeldFrequency] = useState<number | null>(null)
  const arrowLeftRef = useRef<LottieRefCurrentProps>(null)
  const hasAutoStartedRef = useRef(false)

  const activeStringId =
    onboardingView === "guided"
      ? (instrument.guidedOrder[guidedStep] ?? instrument.guidedOrder[0])
      : ""
  const expectedString = stringMap.get(activeStringId) ?? null

  useEffect(() => {
    if (hasAutoStartedRef.current) return

    hasAutoStartedRef.current = true
    void start()
  }, [start])

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

  useEffect(() => {
    if (!isListening) {
      setHeldFrequency(null)
      return
    }

    if (usableFrequency != null) {
      setHeldFrequency(usableFrequency)
    }
  }, [isListening, usableFrequency])

  const displayedFrequency = usableFrequency ?? heldFrequency

  const targetString = useMemo(() => {
    if (displayedFrequency) {
      return getClosestInstrumentString(instrument.strings, displayedFrequency)
    }

    return expectedString
  }, [displayedFrequency, expectedString, instrument.strings])

  const cents = useMemo(() => {
    if (!displayedFrequency) return null

    if (onboardingView === "guided") {
      if (!expectedString) return null
      return getCentsOff(displayedFrequency, expectedString.freq)
    }

    if (!targetString) return null
    return getCentsOff(displayedFrequency, targetString.freq)
  }, [displayedFrequency, expectedString, onboardingView, targetString])

  const gaugeValue = useMemo(() => {
    if (cents == null) return 0
    return clampFrequency(cents, instrument.gauge.min, instrument.gauge.max)
  }, [cents, instrument.gauge.max, instrument.gauge.min])

  const isLastGuidedStep = guidedStep === instrument.guidedOrder.length - 1
  const tuningInstruction = getTuningInstruction(
    cents,
    expectedString?.label ?? targetString?.label ?? "the string",
  )
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
                          stringLabel:
                            expectedString?.label ?? targetString.label,
                        })}
                      </h1>
                    </div>
                    <TunerGauge gauge={instrument.gauge} value={gaugeValue} />
                    <p className="text-center text-sm font-medium text-green-900/70">
                      {tuningInstruction}
                    </p>
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
    <PageShell mode="onboarding">
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-5">
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

          <div className="space-y-2">
            <motion.h1
              className="text-3xl font-bold text-green-950"
              animate={{ opacity: [0, 1], y: [50, 0] }}
              transition={{ duration: 0.4 }}
            >
              {instrument.copy.manualTitle}
            </motion.h1>
            <p className="text-sm text-green-900/70">
              {instrument.copy.manualModeDescription}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-green-100 bg-green-50/70 p-4">
            <MicrophoneToggleButton
              isListening={isListening}
              onClick={isListening ? stop : start}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="space-y-5 rounded-[1.75rem] border border-green-100 bg-white/95 p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-green-900/55">
                {instrument.copy.targetLabel}
              </p>
              <p className="text-6xl font-bold text-green-950">
                {targetString?.label}
              </p>
              <p className="text-sm text-green-900/60">
                {targetString?.name} - {targetString?.id}
              </p>
              {displayedFrequency && (
                <p className="mt-2 text-sm font-medium text-green-800">
                  {displayedFrequency.toFixed(1)} Hz
                </p>
              )}
            </div>

            <TunerGauge gauge={instrument.gauge} value={gaugeValue} />

            <p className="text-center text-sm font-medium text-green-900/75">
              {tuningInstruction}
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
