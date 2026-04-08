import type {
  InstrumentConfig,
  InstrumentCopy,
  InstrumentString,
} from "../instruments"

const violinStrings = [
  { id: "G3", label: "G", name: "G", freq: 196.0 },
  { id: "D4", label: "D", name: "D", freq: 293.66 },
  { id: "A4", label: "A", name: "A", freq: 440.0 },
  { id: "E5", label: "E", name: "E", freq: 659.25 },
] satisfies readonly InstrumentString[]

const violinGuidedOrder = ["E5", "A4", "D4", "G3"] as const

const violinCopy: InstrumentCopy = {
  pickerTitle: "Choose how you want to tune",
  guidedTitle: "Tune the {stringLabel} string",
  guidedStepLabel: "Current step",
  guidedStepCta: "Next string",
  guidedDoneCta: "Open tuner",
  manualModeTitle: "Manual mode",
  manualModeDescription: "Close this setup and open the normal tuner screen.",
  manualTitle: "Violin Tuner",
  targetLabel: "Target string",
  idleHint: "Tap to start.",
  guidedModeTitle: "Tune in steps",
  guidedModeDescription: "Start with E, then continue to A, D, and G.",
}

export const violinConfig = {
  id: "violin",
  name: "Violin",
  icon: "🎻",
  strings: violinStrings,
  guidedOrder: violinGuidedOrder,
  frequencyRange: {
    min: 150,
    max: 750,
  },
  minimumVolume: 0.01,
  copy: violinCopy,
  gauge: {
    min: -50,
    max: 50,
    inTuneThreshold: 10,
    warningThreshold: 10,
    dangerThreshold: 25,
    ticks: [-25, 0, 25],
  },
} satisfies InstrumentConfig
