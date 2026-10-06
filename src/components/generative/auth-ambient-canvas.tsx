import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulseOffset: number;
  color: string;
}

export function AuthAmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = mediaQuery.matches;

    const onMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
    };
    mediaQuery.addEventListener("change", onMotionChange);

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Pointer interaction
    let mouseX = -1000;
    let mouseY = -1000;
    let isHovered = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isHovered = true;
    };

    const handleMouseLeave = () => {
      isHovered = false;
      mouseX = -1000;
      mouseY = -1000;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener("mousemove", handleMouseMove, { passive: true });
      parent.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width || window.innerWidth / 2;
      height = rect.height || window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });

    if (parent) {
      resizeObserver.observe(parent);
    }
    resize();

    // Generate constellation particles
    const particleCount = 70;
    const particles: Particle[] = [];

    const colors = [
      "245, 244, 239", // warm stone
      "208, 242, 90",  // electric lime accent
      "214, 224, 181", // soft sage
      "255, 255, 255", // crisp light
    ];

    for (let i = 0; i < particleCount; i++) {
      const isAccent = Math.random() > 0.75;
      particles.push({
        x: Math.random() * (width || 800),
        y: Math.random() * (height || 900),
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: isAccent ? 1.8 + Math.random() * 1.6 : 0.8 + Math.random() * 1.2,
        alpha: 0.15 + Math.random() * 0.4,
        baseAlpha: 0.15 + Math.random() * 0.35,
        pulseSpeed: 0.001 + Math.random() * 0.002,
        pulseOffset: Math.random() * Math.PI * 2,
        color: isAccent ? colors[1] : colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible && !animationFrameId && !isReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let lastTime = performance.now();

    const render = (now: number) => {
      if (!isVisible) return;

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Subtle ambient radial glow in the center-top
      const glow = ctx.createRadialGradient(
        width * 0.4,
        height * 0.35,
        0,
        width * 0.4,
        height * 0.35,
        width * 0.75,
      );
      glow.addColorStop(0, "rgba(208, 242, 90, 0.055)");
      glow.addColorStop(0.5, "rgba(88, 99, 65, 0.035)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Connect nearby particles with subtle threads ("ello" / connection motif)
      const maxConnectDist = 95;
      const maxConnectDistSq = maxConnectDist * maxConnectDist;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxConnectDistSq) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxConnectDist) * 0.12 * Math.min(p1.alpha, p2.alpha);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(208, 242, 90, ${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Motion physics
        p.x += p.vx * 60 * delta;
        p.y += p.vy * 60 * delta;

        // Wrap around borders smoothly
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Interactive mouse deflection
        if (isHovered) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const distSq = dx * dx + dy * dy;
          if (distSq < 22500) { // 150px radius
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / 150) * 25 * delta;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        // Breathing pulse
        const pulse = Math.sin(now * p.pulseSpeed + p.pulseOffset);
        p.alpha = Math.max(0.08, p.baseAlpha + pulse * 0.15);

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha.toFixed(3)})`;
        ctx.fill();

        // Extra soft halo on larger accent particles
        if (p.size > 2.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color}, ${(p.alpha * 0.22).toFixed(3)})`;
          ctx.fill();
        }
      }

      if (!isReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render(performance.now());

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (parent) {
        parent.removeEventListener("mousemove", handleMouseMove);
        parent.removeEventListener("mouseleave", handleMouseLeave);
      }
      document.removeEventListener("visibilitychange", handleVisibility);
      mediaQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 h-full w-full object-cover"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
