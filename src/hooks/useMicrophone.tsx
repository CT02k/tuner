import { useCallback, useEffect, useRef, useState } from "react"

type PitchState = {
  frequency: number | null
  volume: number | null
  isListening: boolean
  error: string | null
}

function rms(buffer: Float32Array) {
  let sum = 0

  for (const value of buffer) {
    sum += value * value
  }

  return Math.sqrt(sum / buffer.length)
}

function correlate(buffer: Float32Array, sampleRate: number): number | null {
  const size = buffer.length
  let rmsValue = 0

  for (let i = 0; i < size; i++) {
    const v = buffer[i]
    rmsValue += v * v
  }
  rmsValue = Math.sqrt(rmsValue / size)

  if (rmsValue < 0.01) return null

  let r1 = 0
  let r2 = size - 1
  const threshold = 0.2

  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i
      break
    }
  }

  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buffer[size - i]) < threshold) {
      r2 = size - i
      break
    }
  }

  const trimmed = buffer.slice(r1, r2)
  const newSize = trimmed.length
  const c = new Array<number>(newSize).fill(0)

  for (let lag = 0; lag < newSize; lag++) {
    for (let i = 0; i < newSize - lag; i++) {
      c[lag] += trimmed[i] * trimmed[i + lag]
    }
  }

  let d = 0
  while (d + 1 < newSize && c[d] > c[d + 1]) d++

  let maxValue = -1
  let maxIndex = -1
  for (let i = d; i < newSize; i++) {
    if (c[i] > maxValue) {
      maxValue = c[i]
      maxIndex = i
    }
  }

  if (maxIndex <= 0) return null

  const x1 = c[maxIndex - 1] ?? c[maxIndex]
  const x2 = c[maxIndex]
  const x3 = c[maxIndex + 1] ?? c[maxIndex]
  const a = (x1 + x3 - 2 * x2) / 2
  const b = (x3 - x1) / 2

  let refined = maxIndex
  if (a !== 0) {
    refined = maxIndex - b / (2 * a)
  }

  const frequency = sampleRate / refined
  if (!Number.isFinite(frequency) || frequency < 20 || frequency > 2000) {
    return null
  }

  return frequency
}

export function useMicrophone() {
  const [state, setState] = useState<PitchState>({
    frequency: null,
    volume: 0,
    isListening: false,
    error: null,
  })

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rafRef = useRef<number | null>(null)
  const bufferRef = useRef<Float32Array | null>(null)

  const stop = useCallback(async () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    sourceRef.current?.disconnect()
    sourceRef.current = null

    analyserRef.current?.disconnect()
    analyserRef.current = null

    if (audioContextRef.current) {
      await audioContextRef.current.close()
      audioContextRef.current = null
    }

    setState({
      frequency: null,
      volume: 0,
      isListening: false,
      error: null,
    })
  }, [])

  const loop = useCallback(() => {
    const analyser = analyserRef.current
    const audioContext = audioContextRef.current
    const buffer = bufferRef.current

    if (!analyser || !audioContext || !buffer) return

    analyser.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>)

    const volume = rms(buffer)
    const frequency = correlate(buffer, audioContext.sampleRate)

    setState((prev) => {
      const sameFreq =
        (prev.frequency === null && frequency === null) ||
        (prev.frequency !== null &&
          frequency !== null &&
          Math.abs(prev.frequency - frequency) < 0.5)

      const sameVol = Math.abs((prev.volume ?? 0) - volume) < 0.01

      if (sameFreq && sameVol && prev.isListening) return prev

      return {
        ...prev,
        frequency,
        volume,
        isListening: true,
      }
    })

    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()

      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.2

      source.connect(analyser)

      const buffer = new Float32Array(analyser.fftSize)

      streamRef.current = stream
      audioContextRef.current = audioContext
      sourceRef.current = source
      analyserRef.current = analyser
      bufferRef.current = buffer

      setState({
        frequency: null,
        volume: 0,
        isListening: true,
        error: null,
      })

      loop()
    } catch (error) {
      setState({
        frequency: null,
        volume: 0,
        isListening: false,
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel acessar o microfone",
      })
    }
  }, [loop])

  useEffect(() => {
    return () => {
      void stop()
    }
  }, [stop])

  return {
    ...state,
    start,
    stop,
  }
}
