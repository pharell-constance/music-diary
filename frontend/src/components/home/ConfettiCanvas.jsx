import { useEffect, useRef } from 'react';

export default function ConfettiCanvas({ colors = ['#8b5cf6', '#ec4899', '#facc15', '#3b82f6', '#10b981'], count = 120 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let isActive = true;
        let particles = [];
        let particlesInitialized = false;

        const initParticles = (width, height) => {
            for (let i = 0; i < count; i++) {
                const angle = (Math.random() * 120 + 30) * Math.PI / 180;
                const speed = Math.random() * 14 + 6;
                particles.push({
                    x: width / 2,
                    y: height + 10,
                    sizeX: Math.random() * 6 + 4,
                    sizeY: Math.random() * 10 + 6,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    vx: Math.cos(angle) * speed,
                    vy: -Math.sin(angle) * speed,
                    gravity: 0.35,
                    drag: 0.98,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.15,
                    wobble: Math.random() * Math.PI * 2,
                    wobbleSpeed: Math.random() * 0.08 + 0.04
                });
            }
            particlesInitialized = true;
        };

        const render = () => {
            if (!isActive) return;
            
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            if (width === 0 || height === 0) {
                animationFrameId = requestAnimationFrame(render);
                return;
            }

            const targetWidth = Math.floor(width * dpr);
            const targetHeight = Math.floor(height * dpr);

            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                ctx.scale(dpr, dpr);
            }

            if (!particlesInitialized) {
                initParticles(width, height);
            }

            ctx.clearRect(0, 0, width, height);

            let activeParticles = 0;
            particles.forEach(p => {
                if (p.y < height + 20) {
                    activeParticles++;

                    p.vx *= p.drag;
                    p.vy *= p.drag;
                    p.vy += p.gravity;
                    p.x += p.vx + Math.sin(p.wobble) * 0.6;
                    p.y += p.vy;
                    p.rotation += p.rotationSpeed;
                    p.wobble += p.wobbleSpeed;

                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.sizeX / 2, -p.sizeY / 2, p.sizeX, p.sizeY);
                    ctx.restore();
                }
            });

            if (activeParticles > 0) {
                animationFrameId = requestAnimationFrame(render);
            }
        };

        const timerId = setTimeout(() => {
            render();
        }, 150);

        return () => {
            isActive = false;
            clearTimeout(timerId);
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [colors, count]);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none z-0 rounded-3xl" 
        />
    );
}
