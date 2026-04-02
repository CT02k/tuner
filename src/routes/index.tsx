import Button from "#/components/Button"
import MicrophoneToggleButton from "#/components/MicrophoneToggleButton"
import PageShell from "#/components/PageShell"
import ProgressHeader from "#/components/ProgressHeader"
import PageTransition from "#/components/PageTransition"
import { useMicrophone } from "#/hooks/useMicrophone"
import { createFileRoute } from "@tanstack/react-router"
import type { LottieRefCurrentProps } from "lottie-react"
import { AnimatePresence, motion } from "motion/react"
import { useMemo, useRef, useState } from "react"
import { GaugeComponent } from "react-gauge-component"

export const Route = createFileRoute("/")({ component: App })

type StringId = "G3" | "D4" | "A4" | "E5"
type OnboardingView = "choice" | "guided" | "closed"

const VIOLIN_STRINGS = [
  { id: "G3", label: "G", name: "G", freq: 196.0 },
  { id: "D4", label: "D", name: "D", freq: 293.66 },
  { id: "A4", label: "A", name: "A", freq: 440.0 },
  { id: "E5", label: "E", name: "E", freq: 659.25 },
] satisfies ReadonlyArray<{
  id: StringId
  label: string
  name: string
  freq: number
}>

const GUIDED_STRINGS: StringId[] = ["E5", "A4", "D4", "G3"]

function getCentsOff(freq: number, targetFreq: number) {
  return 1200 * Math.log2(freq / targetFreq)
}

function isValidFrequency(freq: number | null, min = 150, max = 750) {
  return !!freq && freq >= min && freq <= max
}

function clampFrequency(freq: number, min: number, max: number) {
  return Math.min(max, Math.max(min, freq))
}

const GAUGE_MIN = -50
const GAUGE_MAX = 50

function App() {
  const { frequency, volume, isListening, error, start, stop } = useMicrophone()
  const [onboardingView, setOnboardingView] = useState<OnboardingView>("choice")
  const [guidedStep, setGuidedStep] = useState(0)
  const [selectedString, setSelectedString] = useState<StringId>("E5")
  const arrowLeftRef = useRef<LottieRefCurrentProps>(null)

  const activeStringId =
    onboardingView === "guided" ? GUIDED_STRINGS[guidedStep] : selectedString

  const usableFrequency = useMemo(() => {
    if (!isValidFrequency(frequency)) return null
    if (volume && volume < 0.01) return null
    return frequency
  }, [frequency, volume])

  const targetString = useMemo(() => {
    return VIOLIN_STRINGS.find((item) => item.id === activeStringId) ?? null
  }, [activeStringId])

  const cents = useMemo(() => {
    if (!usableFrequency || !targetString) return null
    return getCentsOff(usableFrequency, targetString.freq)
  }, [usableFrequency, targetString])

  const gaugeValue = useMemo(() => {
    if (cents == null) return 0
    return clampFrequency(cents, GAUGE_MIN, GAUGE_MAX)
  }, [cents])

  const isInTune = Math.abs(gaugeValue) <= 10
  const isLastGuidedStep = guidedStep === GUIDED_STRINGS.length - 1

  if (onboardingView !== "closed") {
    return (
      <PageShell mode="onboarding">
        <ProgressHeader
          currentStep={guidedStep}
          isVisible={onboardingView === "guided"}
          steps={GUIDED_STRINGS}
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
                        {"🎻"}
                      </motion.h1>
                    </div>
                  </motion.div>

                  <div>
                    <motion.h1
                      className="mt-2 text-3xl font-bold text-green-950"
                      animate={{ opacity: [0, 1], y: [50, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      Choose how you want to tune
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
                        <p className="font-semibold">Tune in steps</p>
                        <p className="text-sm font-normal">
                          Start from E and continue to A, D, and G.
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
                        <p className="font-semibold">Manual mode</p>
                        <p className="text-sm font-normal">
                          Close this setup and open the normal tuner screen.
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
                          {"🎻"}
                        </motion.h1>
                      </div>
                    </motion.div>

                    <div>
                      <h1 className="mt-2 text-3xl font-bold text-green-950">
                        Tune the {targetString.label} string
                      </h1>
                    </div>

                    <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4">
                      <p className="text-sm text-green-900/70">Current step</p>
                      <p className="mt-1 text-4xl font-bold text-green-950">
                        {targetString.label}
                      </p>
                      <p className="mt-1 text-sm text-green-900/70">
                        Step {guidedStep + 1} of {GUIDED_STRINGS.length}
                      </p>
                    </div>
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
                    {isLastGuidedStep ? "Open tuner" : "Next string"}
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
      <h1 className="mb-4 text-3xl font-bold">Violin Tuner</h1>

      <MicrophoneToggleButton
        isListening={isListening}
        onClick={isListening ? stop : start}
      />

      <div className="mb-6 flex select-none">
        {VIOLIN_STRINGS.map((item, index) => (
          <Button
            key={item.id}
            onClick={() => setSelectedString(item.id)}
            size="sm"
            variant={selectedString === item.id ? "primary" : "outline"}
            className={`rounded-none ${
              index === 0 ? "rounded-l-lg border" : "border-y border-r"
            } ${index === VIOLIN_STRINGS.length - 1 ? "rounded-r-lg" : ""}`}
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
              ? "Play one open string near the microphone."
              : "Press start to begin."}
          </p>
          <p className="text-sm text-gray-500">
            Tune one string at a time in a quiet room.
          </p>
        </div>
      )}

      <div className="space-y-5">
        <div className="text-center">
          <p className="text-sm text-gray-500">Target string</p>
          <p className="text-6xl font-bold">{targetString?.label}</p>
          <p className="text-sm text-gray-500">
            {targetString?.name} - {targetString?.id}
          </p>
        </div>

        <div>
          <GaugeComponent
            value={gaugeValue}
            type="semicircle"
            minValue={GAUGE_MIN}
            maxValue={GAUGE_MAX}
            arc={{
              width: 0.18,
              cornerRadius: 10,
              gradient: false,
              nbSubArcs: 5,
              colorArray: [
                gaugeValue <= -25 ? "#f87171" : "#d8b8b0",
                gaugeValue > -25 && gaugeValue < -10 ? "#fbbf24" : "#eed7bf",
                isInTune ? "#34d399" : "#9bcdbf",
                gaugeValue > 10 && gaugeValue < 25 ? "#fbbf24" : "#eed7bf",
                gaugeValue >= 25 ? "#f87171" : "#d8b8b0",
              ],
              padding: 0.01,
              subArcsStrokeWidth: 0,
              effects: { glow: false, innerShadow: false },
            }}
            pointer={{
              animationDuration: 120,
              animationDelay: 0,
              animate: false,
            }}
            labels={{
              valueLabel: {
                hide: true,
                animateValue: false,
              },
              tickLabels: {
                type: "outer",
                hideMinMax: true,
                ticks: [{ value: -25 }, { value: 0 }, { value: 25 }],
                defaultTickLineConfig: {
                  color: "rgba(76, 96, 88, 0.28)",
                  width: 1,
                  length: 6,
                },
                defaultTickValueConfig: {
                  style: {
                    fontSize: "11px",
                    fill: "#587166",
                    fontWeight: "600",
                  },
                },
              },
            }}
            startAngle={-90}
            endAngle={90}
            pointers={[
              {
                value: gaugeValue,
                type: "needle",
                baseColor: "#405e52",
                color: "#405e52",
                length: 0.6,
                width: 9,
                strokeWidth: 0,
              },
            ]}
          />
        </div>
      </div>
    </PageShell>
  )
}
