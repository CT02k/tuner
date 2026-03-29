import { useMicrophone } from "#/hooks/useMicrophone"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"

export const Route = createFileRoute("/")({ component: App })

type StringId = "G3" | "D4" | "A4" | "E5"

const VIOLIN_STRINGS = [
  { id: "G3", label: "G", name: "Sol", freq: 196.0 },
  { id: "D4", label: "D", name: "Ré", freq: 293.66 },
  { id: "A4", label: "A", name: "Lá", freq: 440.0 },
  { id: "E5", label: "E", name: "Mi", freq: 659.25 },
]

function getCentsOff(freq: number, targetFreq: number) {
  return 1200 * Math.log2(freq / targetFreq)
}

function getClosestString(freq: number) {
  return VIOLIN_STRINGS.reduce((best, current) => {
    const bestDiff = Math.abs(getCentsOff(freq, best.freq))
    const currentDiff = Math.abs(getCentsOff(freq, current.freq))
    return currentDiff < bestDiff ? current : best
  })
}

function getTuneMessage(cents: number) {
  const abs = Math.abs(cents)

  if (abs < 5) return "Show de bola"
  if (cents < 0) return `Suba ${abs.toFixed(1)} cents`
  return `Desça ${abs.toFixed(1)} cents`
}

function isValidFrequency(freq: number | null, min = 150, max = 750) {
  return !!freq && freq >= 150 && freq <= 750
}

function clampFrequency(freq: number, min: number, max: number) {
  return Math.min(max, Math.max(min, freq))
}

function App() {
  const { frequency, volume, isListening, error, start, stop } = useMicrophone()
  const [selectedString, setSelectedString] = useState<StringId | "auto">(
    "auto",
  )

  const usableFrequency = useMemo(() => {
    if (!isValidFrequency(frequency)) return null

    if (volume && volume < 0.01) return null

    return frequency
  }, [frequency, volume])

  const targetString = useMemo(() => {
    if (!usableFrequency) return null

    if (selectedString === "auto") return getClosestString(usableFrequency)

    return VIOLIN_STRINGS.find((s) => s.id === selectedString) ?? null
  }, [usableFrequency, selectedString])

  const cents = useMemo(() => {
    if (!usableFrequency || !targetString) return null
    return getCentsOff(usableFrequency, targetString.freq)
  }, [usableFrequency, targetString])

  const percent = useMemo(() => {
    if (!cents) return 50

    const clamped = clampFrequency(cents, -50, 50)

    return ((clamped + 50) / 100) * 100
  }, [cents])

  return (
    <main className="page-wrap max-w-md mx-auto px-4 pb-8 pt-10">
      <h1 className="text-3xl font-bold mb-4">Afinador de Violino</h1>

      <button
        onClick={isListening ? stop : start}
        className={`px-4 py-2 rounded mb-4 ${
          isListening ? "bg-red-500 text-white" : "bg-green-500 text-white"
        }`}
      >
        {isListening ? "Parar" : "Iniciar"}
      </button>

      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setSelectedString("auto")}
          className={`px-3 py-1 rounded border ${
            selectedString === "auto" ? "bg-black text-white" : ""
          }`}
        >
          Auto
        </button>

        {VIOLIN_STRINGS.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedString(item.id as StringId)}
            className={`px-3 py-1 rounded border ${
              selectedString === item.id ? "bg-black text-white" : ""
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {!usableFrequency && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            {isListening
              ? "Toque uma corda solta perto do microfone"
              : "Clique em iniciar para começar"}
          </p>
          <p className="text-sm text-gray-500">
            Afine uma corda por vez em ambiente silencioso
          </p>
        </div>
      )}

      {usableFrequency && targetString && cents != null && (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-sm text-gray-500">Corda alvo</p>
            <p className="text-6xl font-bold">{targetString.label}</p>
            <p className="text-sm text-gray-500">
              {targetString.name} • {targetString.id}
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded border p-3">
              <p className="text-sm text-gray-500">Frequência atual</p>
              <p className="text-2xl font-semibold">
                {usableFrequency.toFixed(1)} Hz
              </p>
            </div>

            <div className="rounded border p-3">
              <p className="text-sm text-gray-500">Frequência alvo</p>
              <p className="text-2xl font-semibold">
                {targetString.freq.toFixed(2)} Hz
              </p>
            </div>

            <div className="rounded border p-3">
              <p className="text-sm text-gray-500">Desvio</p>
              <p className="text-2xl font-semibold">
                {cents > 0 ? "+" : ""}
                {Math.round(cents)} cents
              </p>
              <p className="text-sm mt-1">{getTuneMessage(cents)}</p>
            </div>
          </div>

          <div>
            <div className="relative h-4 rounded bg-gray-200 overflow-hidden">
              <div className="absolute inset-y-0 left-1/2 w-px bg-black" />
              <div
                className="absolute top-0 h-4 w-2 -translate-x-1/2 rounded bg-black"
                style={{ left: `${percent}%` }}
              />
            </div>

            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>-50</span>
              <span>0</span>
              <span>+50</span>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
