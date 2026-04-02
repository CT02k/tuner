import {
  defaultInstrumentGaugePalette,
  getGaugeArcColors,
} from "#/lib/instruments"
import type { InstrumentGaugeConfig } from "#/lib/instruments"
import type { ComponentType } from "react"
import { useEffect, useMemo, useState } from "react"

type TunerGaugeProps = {
  gauge: InstrumentGaugeConfig
  value: number
}

export default function TunerGauge({ gauge, value }: TunerGaugeProps) {
  const [GaugeComponent, setGaugeComponent] = useState<ComponentType<any> | null>(
    null,
  )

  useEffect(() => {
    let isMounted = true

    void import("react-gauge-component").then((module) => {
      if (isMounted) {
        setGaugeComponent(() => module.GaugeComponent)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  const isInTune = Math.abs(value) <= gauge.inTuneThreshold
  const gaugeArcColors = useMemo(
    () => getGaugeArcColors(value, isInTune, gauge),
    [gauge, isInTune, value],
  )

  const subArcs = useMemo(
    () => [
      { limit: -gauge.dangerThreshold, color: gaugeArcColors[0] },
      { limit: -gauge.warningThreshold, color: gaugeArcColors[1] },
      { limit: gauge.warningThreshold, color: gaugeArcColors[2] },
      { limit: gauge.dangerThreshold, color: gaugeArcColors[3] },
      { limit: gauge.max, color: gaugeArcColors[4] },
    ],
    [gauge, gaugeArcColors],
  )

  const tickItems = useMemo(
    () => gauge.ticks.map((tickValue) => ({ value: tickValue })),
    [gauge.ticks],
  )

  if (!GaugeComponent) {
    return <div className="h-[220px] w-full" aria-hidden />
  }

  return (
    <div className="h-[220px] w-full">
      <GaugeComponent
        value={value}
        type="semicircle"
        minValue={gauge.min}
        maxValue={gauge.max}
        arc={{
          width: 0.18,
          cornerRadius: 10,
          gradient: false,
          subArcs,
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
            ticks: tickItems,
            defaultTickLineConfig: {
              color: defaultInstrumentGaugePalette.tick,
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
            value,
            type: "needle",
            baseColor: defaultInstrumentGaugePalette.needle,
            color: defaultInstrumentGaugePalette.needle,
            length: 0.6,
            width: 9,
            strokeWidth: 0,
          },
        ]}
      />
    </div>
  )
}
