import { violinConfig } from "./instruments/violin"

export type InstrumentString = {
  id: string
  label: string
  name: string
  freq: number
}

export type InstrumentCopy = {
  pickerTitle: string
  guidedTitle: string
  guidedStepLabel: string
  guidedStepCta: string
  guidedDoneCta: string
  manualModeTitle: string
  manualModeDescription: string
  manualTitle: string
  targetLabel: string
  listeningHint: string
  idleHint: string
  quietRoomHint: string
  guidedModeTitle: string
  guidedModeDescription: string
}

export type InstrumentGaugePalette = {
  danger: string
  dangerMuted: string
  warning: string
  warningMuted: string
  success: string
  successMuted: string
  tick: string
  needle: string
}

export type InstrumentGaugeConfig = {
  min: number
  max: number
  inTuneThreshold: number
  warningThreshold: number
  dangerThreshold: number
  ticks: number[]
}

export type InstrumentConfig = {
  id: string
  name: string
  icon: string
  strings: readonly InstrumentString[]
  guidedOrder: readonly string[]
  frequencyRange: {
    min: number
    max: number
  }
  minimumVolume: number
  copy: InstrumentCopy
  gauge: InstrumentGaugeConfig
}

export { violinConfig }

export const instruments = {
  violin: violinConfig,
} as const

export const defaultInstrumentGaugePalette: InstrumentGaugePalette = {
  danger: "#f87171",
  dangerMuted: "#d8b8b0",
  warning: "#fbbf24",
  warningMuted: "#eed7bf",
  success: "#34d399",
  successMuted: "#9bcdbf",
  tick: "rgba(76, 96, 88, 0.28)",
  needle: "#405e52",
}

export function getInstrumentStringMap(instrument: InstrumentConfig) {
  return new Map(instrument.strings.map((item) => [item.id, item]))
}

export function getGaugeArcColors(
  value: number,
  isInTune: boolean,
  gauge: InstrumentGaugeConfig,
) {
  const { dangerThreshold, warningThreshold } = gauge
  const palette = defaultInstrumentGaugePalette

  return [
    value <= -dangerThreshold ? palette.danger : palette.dangerMuted,
    value > -dangerThreshold && value < -warningThreshold
      ? palette.warning
      : palette.warningMuted,
    isInTune ? palette.success : palette.successMuted,
    value > warningThreshold && value < dangerThreshold
      ? palette.warning
      : palette.warningMuted,
    value >= dangerThreshold ? palette.danger : palette.dangerMuted,
  ]
}

export function formatInstrumentCopy(
  template: string,
  values: Record<string, string>,
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "")
}
