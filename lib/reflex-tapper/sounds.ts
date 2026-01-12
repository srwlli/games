/**
 * Sound effects manager for Reflex Tapper game
 * Uses Web Audio API for lightweight, performant sound effects
 */

class SoundManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private enabled: boolean = true

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.warn("Web Audio API not supported, sounds disabled")
        this.enabled = false
      }
    }
  }

  private async loadSound(name: string, frequency: number, duration: number, type: "sine" | "square" | "triangle" = "sine"): Promise<AudioBuffer | null> {
    if (!this.audioContext || !this.enabled) return null

    try {
      const sampleRate = this.audioContext.sampleRate
      const frameCount = sampleRate * duration
      const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate
        let value = 0
        switch (type) {
          case "sine":
            value = Math.sin(2 * Math.PI * frequency * t)
            break
          case "square":
            value = Math.sign(Math.sin(2 * Math.PI * frequency * t))
            break
          case "triangle":
            value = 2 * Math.abs(2 * ((frequency * t) % 1) - 1) - 1
            break
        }
        // Apply envelope to prevent clicks
        const envelope = t < 0.01 ? t / 0.01 : t > duration - 0.01 ? (duration - t) / 0.01 : 1
        data[i] = value * envelope * 0.3 // Volume
      }

      this.sounds.set(name, buffer)
      return buffer
    } catch (e) {
      console.warn(`Failed to generate sound: ${name}`, e)
      return null
    }
  }

  async initialize(): Promise<void> {
    if (!this.enabled) return

    // Generate sounds on initialization
    await Promise.all([
      this.loadSound("hit", 800, 0.1, "sine"),
      this.loadSound("miss", 200, 0.15, "square"),
      this.loadSound("phaseChange", 600, 0.2, "triangle"),
      this.loadSound("powerUp", 1000, 0.3, "sine"),
      this.loadSound("decoy", 150, 0.2, "square"),
    ])
  }

  play(name: string): void {
    if (!this.audioContext || !this.enabled || !this.sounds.has(name)) return

    try {
      const buffer = this.sounds.get(name)!
      const source = this.audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(this.audioContext.destination)
      source.start(0)
    } catch (e) {
      // Silently fail if audio context is suspended (user interaction required)
      if (e instanceof Error && !e.message.includes("suspended")) {
        console.warn(`Failed to play sound: ${name}`, e)
      }
    }
  }

  hit(): void {
    this.play("hit")
  }

  miss(): void {
    this.play("miss")
  }

  phaseChange(): void {
    this.play("phaseChange")
  }

  powerUp(): void {
    this.play("powerUp")
  }

  decoy(): void {
    this.play("decoy")
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}

export const soundManager = new SoundManager()

// Initialize on module load
if (typeof window !== "undefined") {
  soundManager.initialize()
}
