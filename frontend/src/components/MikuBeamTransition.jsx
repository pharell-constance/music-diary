import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const playMikuBeamSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;
        
        // ── Phase 1: Sparkling Magical Chimes (Arpeggio 0s to 0.45s) ──
        const chimeFreqs = [880, 1100, 1320, 1650, 1976, 2637]; // pentatonic notes
        chimeFreqs.forEach((freq, index) => {
            const time = now + index * 0.07;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle'; // soft flute/bell tone
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.05, time + 0.15);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(time);
            osc.stop(time + 0.2);
        });
        
        // ── Phase 2: Magical Sweeping Beam (0.35s to 1.3s) ──
        const oscBeam = ctx.createOscillator();
        const gainBeam = ctx.createGain();
        oscBeam.type = 'sine'; // pure round sound
        oscBeam.frequency.setValueAtTime(440, now + 0.35);
        oscBeam.frequency.exponentialRampToValueAtTime(1200, now + 0.7);
        oscBeam.frequency.exponentialRampToValueAtTime(300, now + 1.25);
        
        gainBeam.gain.setValueAtTime(0, now + 0.35);
        gainBeam.gain.linearRampToValueAtTime(0.18, now + 0.6);
        gainBeam.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
        
        // Pitch modulation (LFO) for a shiny, vibrating effect
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 16;
        lfoGain.gain.value = 25;
        
        lfo.connect(lfoGain);
        lfoGain.connect(oscBeam.frequency);
        
        oscBeam.connect(gainBeam);
        gainBeam.connect(ctx.destination);
        
        lfo.start(now + 0.35);
        oscBeam.start(now + 0.35);
        lfo.stop(now + 1.25);
        oscBeam.stop(now + 1.25);
        
        // ── Phase 3: Glitter Wind (0.35s to 1.25s) ──
        const bufferSize = ctx.sampleRate * 0.9;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;
        
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(3000, now + 0.35);
        noiseFilter.frequency.exponentialRampToValueAtTime(800, now + 1.2);
        noiseFilter.Q.value = 2;
        
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now + 0.35);
        noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.6);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
        
        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        
        noiseNode.start(now + 0.35);
        noiseNode.stop(now + 1.25);
        
    } catch (e) {
        console.warn("AudioContext failed to play magical sound:", e);
    }
};

function MikuBeamTransition({ onThemeSwap, onComplete }) {
    const containerRef = useRef(null);

    useEffect(() => {
        // Trigger sound
        playMikuBeamSound();

        // GSAP Timeline
        const tl = gsap.timeline({
            onComplete: onComplete
        });

        // Laser lines shoot first
        tl.fromTo('.miku-beam-line', 
            { scaleX: 0, opacity: 0, transformOrigin: 'left center' }, 
            { scaleX: 1, opacity: 0.9, duration: 0.45, stagger: 0.05, ease: 'power3.inOut' },
            0
        );

        // Main Core Energy Beam shoots
        tl.fromTo('.miku-beam-core', 
            { scaleX: 0, scaleY: 0.2, opacity: 0, transformOrigin: 'left center' }, 
            { scaleX: 1.3, scaleY: 1, opacity: 1, duration: 0.4, ease: 'power2.inOut' },
            0.05
        );

        // Big Text scales up and rotates slightly
        tl.fromTo('.miku-beam-text',
            { scale: 0.2, opacity: 0, rotation: -10 },
            { scale: 1.1, opacity: 1, rotation: 5, duration: 0.4, ease: 'back.out(1.8)' },
            0.1
        );

        // Bursting particles
        tl.fromTo('.miku-beam-particle', 
            { x: 0, y: 0, scale: () => gsap.utils.random(0.5, 2.2), opacity: 0 }, 
            { 
                x: () => gsap.utils.random(-600, 600), 
                y: () => gsap.utils.random(-350, 350), 
                opacity: 1, 
                duration: 0.65, 
                stagger: 0.003,
                ease: 'power3.out' 
            },
            0.1
        );

        // White out the screen
        tl.to('.miku-beam-bg', 
            { opacity: 1, duration: 0.3, ease: 'power1.in' },
            0.25
        );

        // SWAP THEME EXACTLY DURING THE WHITE-OUT FLASH
        tl.call(onThemeSwap, null, 0.55);

        // Fade/shrink text, lines, and particles out more smoothly
        tl.to('.miku-beam-text', { scale: 1.5, opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.55);
        tl.to('.miku-beam-line', { opacity: 0, scaleY: 0, duration: 0.4, ease: 'power2.inOut' }, 0.55);
        tl.to('.miku-beam-core', { opacity: 0, scaleY: 0, duration: 0.4, ease: 'power2.inOut' }, 0.55);
        tl.to('.miku-beam-particle', { opacity: 0, scale: 0, duration: 0.5, stagger: 0.002, ease: 'power2.out' }, 0.55);
        
        // Fade out the white screen overlay back to normal slowly and smoothly
        tl.to('.miku-beam-bg', 
            { opacity: 0, duration: 0.8, ease: 'power2.out' },
            0.55
        );

        return () => {
            tl.kill();
        };
    }, [onThemeSwap, onComplete]);

    return (
        <div ref={containerRef} className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden flex flex-col items-center justify-center">
            {/* Full screen white flash background */}
            <div className="absolute inset-0 bg-white opacity-0 miku-beam-bg" />
            
            {/* Multiple laser beam lines shooting across the screen */}
            <div className="absolute w-[200vw] h-6 bg-[#39C5BB] shadow-[0_0_20px_#39C5BB] origin-left rotate-[-45deg] scale-x-0 miku-beam-line" />
            <div className="absolute w-[200vw] h-10 bg-[#ff007f] shadow-[0_0_30px_#ff007f] origin-left rotate-[-30deg] scale-x-0 miku-beam-line" />
            <div className="absolute w-[200vw] h-4 bg-[#39C5BB] shadow-[0_0_15px_#39C5BB] origin-left rotate-[-60deg] scale-x-0 miku-beam-line" />
            <div className="absolute w-[200vw] h-16 bg-white shadow-[0_0_40px_#39C5BB,_0_0_70px_#ff007f] origin-left rotate-[-35deg] scale-x-0 miku-beam-core" />
            
            {/* Particle sparkles */}
            {Array.from({ length: 40 }).map((_, i) => (
                <div 
                    key={i} 
                    className="absolute w-3.5 h-3.5 bg-[#39C5BB] rounded-full shadow-[0_0_8px_#39C5BB] opacity-0 miku-beam-particle"
                />
            ))}

            {/* Giant Miku Beam Text */}
            <h1 
                className="miku-beam-text font-mouse-memoirs text-7xl sm:text-8xl md:text-9xl text-white uppercase tracking-wider select-none absolute z-10 opacity-0 italic font-black"
                style={{
                    textShadow: '4px 4px 0px #000000, 0 0 20px #39C5BB, 0 0 40px #ff007f',
                    fontFamily: '"Mouse Memoirs", sans-serif'
                }}
            >
                Miku Beam!!!
            </h1>
        </div>
    );
}

export default MikuBeamTransition;
