'use client'

import { useEffect, useRef, useCallback } from 'react'

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
                audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
            }
            if (audioCtx.current.state === 'suspended') {
                audioCtx.current.resume()
            }
        }

        window.addEventListener('click', initAudio, { once: true })
        window.addEventListener('keydown', initAudio, { once: true })
        window.addEventListener('touchstart', initAudio, { once: true })

        return () => {
            window.removeEventListener('click', initAudio)
            window.removeEventListener('keydown', initAudio)
            window.removeEventListener('touchstart', initAudio)
        }
    }, [])

    const playTone = useCallback((freq: number, type: OscillatorType, duration: number, vol = 0.5) => {
        if (!audioCtx.current) return
        
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

    return {
        // High-pitch pop for a player joining
        playJoin: useCallback(() => playTone(600, 'sine', 0.2, 0.4), [playTone]),
        
        // Low-pitch thud when a question locks
        playLock: useCallback(() => playTone(100, 'square', 0.4, 0.5), [playTone]),
        
        // Tick-tock for the answering phase (tension)
        playTick: useCallback(() => playTone(800, 'triangle', 0.1, 0.2), [playTone]),
        
        // Bright bell for revealing the correct answer
        playReveal: useCallback(() => playChord([523.25, 659.25, 783.99, 1046.50], 'sine', 1.5, 0.5), [playChord]),
        
        // Dramatic low drone for thinking phase
        playTension: useCallback(() => playTone(55, 'sawtooth', 3.0, 0.2), [playTone]),

        // Negative buzzer for wrong answer
        playWrong: useCallback(() => playTone(150, 'sawtooth', 0.5, 0.4), [playTone]),

        // Ascending chime for leaderboard climb
        playLevelUp: useCallback(() => {
            if (!audioCtx.current) return;
            const now = audioCtx.current.currentTime;
            [440, 554.37, 659.25, 880].forEach((freq, i) => {
                setTimeout(() => playTone(freq, 'sine', 0.5, 0.3), i * 150)
            })
        }, [playTone])
    }
}
