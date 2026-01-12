/**
 * Simple sound effect system for Tetris
 * Uses Web Audio API for sound generation
 */

class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    if (typeof window !== "undefined") {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (prefersReducedMotion) {
        this.enabled = false
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.audioContext
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = "sine"): void {
    if (!this.enabled) return

    const ctx = this.getAudioContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  }

  rotate(): void {
    this.playTone(440, 0.05, "square")
  }

  move(): void {
    this.playTone(220, 0.03, "square")
  }

  lock(): void {
    this.playTone(150, 0.1, "sawtooth")
  }

  clear(lines: number): void {
    const frequencies = [440, 554, 659, 784] // C, E, G, C
    const freq = frequencies[Math.min(lines - 1, 3)] || 440
    this.playTone(freq, 0.2, "sine")
  }

  levelUp(): void {
    // Ascending tone
    const ctx = this.getAudioContext()
    if (!ctx || !this.enabled) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(440, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3)

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  }

  gameOver(): void {
    // Descending tone
    const ctx = this.getAudioContext()
    if (!ctx || !this.enabled) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = "sawtooth"
    oscillator.frequency.setValueAtTime(220, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.5)

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.5)
  }

  hardDrop(): void {
    this.playTone(330, 0.08, "square")
  }
}

export const soundManager = new SoundManager()
