export function getCentsOff(freq: number, targetFreq: number) {
  return 1200 * Math.log2(freq / targetFreq)
}
