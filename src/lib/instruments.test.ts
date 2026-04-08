import { describe, expect, it } from "vitest"

import {
  defaultInstrumentGaugePalette,
  formatInstrumentCopy,
  getClosestInstrumentString,
  getGaugeArcColors,
  instruments,
} from "./instruments"

describe("instrument config", () => {
  it("keeps violin strings and guided order in dedicated violin data", () => {
    expect(instruments.violin.guidedOrder).toEqual(["E5", "A4", "D4", "G3"])
    expect(instruments.violin.strings.map((item) => item.id)).toEqual([
      "G3",
      "D4",
      "A4",
      "E5",
    ])
  })

  it("formats copy placeholders", () => {
    expect(
      formatInstrumentCopy(instruments.violin.copy.guidedTitle, {
        stringLabel: "A",
      }),
    ).toBe("Tune the A string")
  })

  it("uses the success color for the center gauge arc when in tune", () => {
    const colors = getGaugeArcColors(0, true, instruments.violin.gauge)

    expect(colors[2]).toBe(defaultInstrumentGaugePalette.success)
  })

  it("finds the closest violin string for a detected frequency", () => {
    const detected = getClosestInstrumentString(instruments.violin.strings, 438)

    expect(detected.id).toBe("A4")
  })
})
