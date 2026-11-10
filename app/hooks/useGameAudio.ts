'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'

/**
 * A zero-latency, synthetic Web Audio API engine.
 * Generates all sound effects programmatically without requiring external MP3s.
 */
export function useGameAudio() {
    const audioCtx = useRef<AudioContext | null>(null)

    useEffect(() => {
        // Initialize AudioContext on first user interaction to bypass browser autoplay blocks
        const initAudio = () => {
            if (!audioCtx.current) {
                const Audio = window.AudioContext || (window as any).webkitAudioContext
                if (!Audio) return
                audioCtx.current = new Audio()
            }
            if (audioCtx.current?.state === 'suspended') {
                void audioCtx.current.resume().catch(() => {})
            }
        }

        window.addEventListener('click', initAudio, { once: true })
        window.addEventListener('keydown', initAudio, { once: true })
        window.addEventListener('touchstart', initAudio, { once: true })

        return () => {
            window.removeEventListener('click', initAudio)
            window.removeEventListener('keydown', initAudio)
            window.removeEventListener('touchstart', initAudio)
            void audioCtx.current?.close().catch(() => {})
            audioCtx.current = null
        }
    }, [])

    const playTone = useCallback((freq: number, type: OscillatorType, duration: number, vol = 0.5) => {
        if (!audioCtx.current || audioCtx.current.state === 'closed') return

        const osc = audioCtx.current.createOscillator()
        const gain = audioCtx.current.createGain()

        osc.type = type
        osc.frequency.setValueAtTime(freq, audioCtx.current.currentTime)

        // Envelope
        gain.gain.setValueAtTime(0, audioCtx.current.currentTime)
        gain.gain.linearRampToValueAtTime(vol, audioCtx.current.currentTime + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.current.currentTime + duration)

        osc.connect(gain)
        gain.connect(audioCtx.current.destination)

        osc.start()
        osc.stop(audioCtx.current.currentTime + duration)
    }, [])

    const playChord = useCallback((freqs: number[], type: OscillatorType, duration: number, vol = 0.3) => {
        freqs.forEach(f => playTone(f, type, duration, vol / freqs.length))
    }, [playTone])

    return useMemo(() => ({
        playJoin: () => playTone(600, 'sine', 0.2, 0.4),
        playLock: () => playTone(100, 'square', 0.4, 0.5),
        playTick: () => playTone(800, 'triangle', 0.1, 0.2),
        playReveal: () => playChord([523.25, 659.25, 783.99, 1046.50], 'sine', 1.5, 0.5),
        playTension: () => playTone(55, 'sawtooth', 3.0, 0.2),
        playWrong: () => playTone(150, 'sawtooth', 0.5, 0.4),
        playLevelUp: () => playChord([440, 554.37, 659.25, 880], 'sine', 0.8, 0.3),
    }), [playTone, playChord])
}
