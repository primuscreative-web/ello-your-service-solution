import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function ScrollWaveCanvas() {
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

    // Smooth scroll position and momentum
    let currentScroll = window.scrollY;
    let targetScroll = window.scrollY;
    let scrollVelocity = 0;
    let lastScrollTime = performance.now();

    // Mouse tracking with fluid spring lerp
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let isMouseActive = false;

    // Time progression
    let time = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });

    let scrollTicking = false;
    const handleScroll = () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          const now = performance.now();
          const dt = Math.max((now - lastScrollTime) / 1000, 0.008);
          const dy = window.scrollY - targetScroll;
          scrollVelocity = dy / dt;
          targetScroll = window.scrollY;
          lastScrollTime = now;
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
      isMouseActive = true;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible && !animationFrameId && !isReducedMotion) {
        lastFrameTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let lastFrameTime = performance.now();

    // Generate 36 finely orchestrated line definitions:
    // 20 filaments in the central 3D ribbon veil + 8 upper harmonic + 8 lower counter-wave
    interface Filament {
      ribbonGroup: "center" | "upper" | "lower";
      colorType: "charcoal" | "olive" | "lime";
      offsetFraction: number; // -1 to 1 across bundle
      phaseOffset: number;
      width: number;
      alpha: number;
      speed: number;
    }

    const filaments: Filament[] = [];

    // 1) Central 3D Ribbon Veil (20 lines)
    for (let i = 0; i < 20; i++) {
      const fraction = (i / 19) * 2 - 1; // -1 to 1
      const centerProximity = 1 - Math.abs(fraction); // 0 at edges, 1 at center
      const isLimeAccent = i === 9 || i === 10 || i === 14;
      const isOlive = i % 3 === 0;

      filaments.push({
        ribbonGroup: "center",
        colorType: isLimeAccent ? "lime" : isOlive ? "olive" : "charcoal",
        offsetFraction: fraction,
        phaseOffset: fraction * Math.PI * 0.95,
        width: isLimeAccent ? 1.8 : 0.9 + centerProximity * 0.8,
        alpha: isLimeAccent ? 0.45 : 0.12 + centerProximity * 0.28,
        speed: 0.58 + Math.abs(fraction) * 0.08,
      });
    }

    // 2) Upper Ambient Harmonic Ribbon (8 lines)
    for (let i = 0; i < 8; i++) {
      const fraction = (i / 7) * 2 - 1;
      const isLime = i === 3 || i === 4;
      filaments.push({
        ribbonGroup: "upper",
        colorType: isLime ? "lime" : "olive",
        offsetFraction: fraction,
        phaseOffset: fraction * Math.PI * 0.7 + 1.2,
        width: 1.0 + (1 - Math.abs(fraction)) * 0.6,
        alpha: 0.10 + (1 - Math.abs(fraction)) * 0.20,
        speed: 0.48 + i * 0.02,
      });
    }

    // 3) Lower Counter-Wave Ribbon (8 lines)
    for (let i = 0; i < 8; i++) {
      const fraction = (i / 7) * 2 - 1;
      filaments.push({
        ribbonGroup: "lower",
        colorType: i % 2 === 0 ? "charcoal" : "olive",
        offsetFraction: fraction,
        phaseOffset: fraction * Math.PI * 0.8 + 2.4,
        width: 0.9 + (1 - Math.abs(fraction)) * 0.5,
        alpha: 0.08 + (1 - Math.abs(fraction)) * 0.18,
        speed: 0.52 - i * 0.02,
      });
    }

    const render = (now: number) => {
      if (!isVisible) return;

      const delta = Math.min((now - lastFrameTime) / 1000, 0.04);
      lastFrameTime = now;

      // Silky spring lerp for scroll and velocity
      currentScroll += (targetScroll - currentScroll) * (1 - Math.exp(-8 * delta));
      scrollVelocity *= Math.exp(-6 * delta);

      // Spring lerp for mouse pointer
      mouseX += (targetMouseX - mouseX) * (1 - Math.exp(-7 * delta));
      mouseY += (targetMouseY - mouseY) * (1 - Math.exp(-7 * delta));

      // Constant fluid time progression with subtle scroll boost
      const velocityBoost = Math.min(Math.abs(scrollVelocity) * 0.00003, 0.015);
      time += (0.009 + velocityBoost) * (delta / 0.016);

      ctx.clearRect(0, 0, width, height);

      // Pre-compute horizontal sample nodes across screen (dense sampling for smooth wave curves)
      const numNodes = Math.max(32, Math.min(54, Math.floor(width / 32)));
      const stepX = (width + 220) / (numNodes - 1);

      // Group paths into 3 color batches for 3 fast draw calls
      const pathCharcoal = new Path2D();
      const pathOlive = new Path2D();
      const pathLime = new Path2D();

      // Base ribbon anchor levels
      const baseCenters = {
        center: height * 0.50 + Math.sin(time * 0.18) * 25 + (currentScroll * 0.04),
        upper: height * 0.22 + Math.sin(time * 0.14 + 1.0) * 18 - (currentScroll * 0.025),
        lower: height * 0.80 + Math.sin(time * 0.16 + 2.0) * 20 + (currentScroll * 0.03),
      };

      // Formato de onda real: amplitudes pronunciadas (ondas visíveis com picos e vales)
      const groupAmplitudes = {
        center: 145 + Math.min(Math.abs(scrollVelocity) * 0.03, 35),
        upper: 75 + Math.min(Math.abs(scrollVelocity) * 0.02, 20),
        lower: 85 + Math.min(Math.abs(scrollVelocity) * 0.02, 22),
      };

      const groupSpreads = {
        center: 52,
        upper: 28,
        lower: 32,
      };

      // Frequências calibradas para formar cerca de 2 a 3 ciclos completos de ondas na tela
      const groupFrequencies = {
        center: 0.0052,
        upper: 0.0042,
        lower: 0.0046,
      };

      // Draw all 36 filaments with silky C1 quadratic spline interpolation
      for (let f = 0; f < filaments.length; f++) {
        const item = filaments[f];
        const group = item.ribbonGroup;
        const baseY = baseCenters[group];
        const amp = groupAmplitudes[group];
        const spread = groupSpreads[group];
        const freq = groupFrequencies[group];
        const itemTime = time * item.speed + item.phaseOffset;

        // Path destination
        const path =
          item.colorType === "lime"
            ? pathLime
            : item.colorType === "olive"
              ? pathOlive
              : pathCharcoal;

        // Sample spline points for this filament
        const points: { x: number; y: number }[] = [];

        for (let p = 0; p < numNodes; p++) {
          const x = p * stepX - 110;

          // Equação de onda harmônica com cristas e vales ondulantes pronunciados
          const wave1 = Math.sin(x * freq + itemTime);
          const wave2 = Math.sin(x * freq * 2.1 - itemTime * 1.1) * 0.38;
          const wave3 = Math.cos(x * freq * 0.65 + itemTime * 0.45) * 0.25;

          // Interactive mouse deflection with soft falloff
          let mouseDeflect = 0;
          if (isMouseActive) {
            const dx = x - mouseX;
            const dy = baseY - mouseY;
            const distSq = dx * dx + dy * dy;
            if (distSq < 150000) { // 385px radius
              const factor = 1 - Math.sqrt(distSq) / 385;
              mouseDeflect = Math.sin(factor * Math.PI) * -38 * factor;
            }
          }

          // A fita se abre nas cristas e vales da onda e se entrelaça nos nós
          const twist = Math.sin(x * freq * 1.5 + itemTime * 0.7);
          const peakFanning = 0.55 + Math.abs(wave1) * 0.75;
          const filamentDisplacement = item.offsetFraction * spread * peakFanning * (0.8 + twist * 0.35);

          const y = baseY + filamentDisplacement + (wave1 + wave2 + wave3) * amp + mouseDeflect;
          points.push({ x, y });
        }

        // Add continuous smooth spline to batched path
        path.moveTo(points[0].x, points[0].y);
        for (let p = 1; p < points.length - 1; p++) {
          const xc = (points[p].x + points[p + 1].x) * 0.5;
          const yc = (points[p].y + points[p + 1].y) * 0.5;
          path.quadraticCurveTo(points[p].x, points[p].y, xc, yc);
        }
        const last = points[points.length - 1];
        path.lineTo(last.x, last.y);
      }

      // Execute exactly 3 hyper-fast batched strokes with rich linear gradients
      const gradCharcoal = ctx.createLinearGradient(0, 0, width, 0);
      gradCharcoal.addColorStop(0, "rgba(41, 43, 37, 0.02)");
      gradCharcoal.addColorStop(0.2, "rgba(41, 43, 37, 0.26)");
      gradCharcoal.addColorStop(0.55, "rgba(41, 43, 37, 0.38)");
      gradCharcoal.addColorStop(0.85, "rgba(65, 68, 56, 0.22)");
      gradCharcoal.addColorStop(1, "rgba(41, 43, 37, 0.02)");

      ctx.strokeStyle = gradCharcoal;
      ctx.lineWidth = 1.1;
      ctx.stroke(pathCharcoal);

      const gradOlive = ctx.createLinearGradient(0, 0, width, 0);
      gradOlive.addColorStop(0, "rgba(88, 99, 65, 0.02)");
      gradOlive.addColorStop(0.25, "rgba(88, 99, 65, 0.28)");
      gradOlive.addColorStop(0.65, "rgba(104, 120, 71, 0.36)");
      gradOlive.addColorStop(1, "rgba(88, 99, 65, 0.02)");

      ctx.strokeStyle = gradOlive;
      ctx.lineWidth = 1.2;
      ctx.stroke(pathOlive);

      const gradLime = ctx.createLinearGradient(0, 0, width, 0);
      gradLime.addColorStop(0, "rgba(208, 242, 90, 0.02)");
      gradLime.addColorStop(0.3, "rgba(165, 195, 70, 0.40)");
      gradLime.addColorStop(0.6, "rgba(208, 242, 90, 0.55)");
      gradLime.addColorStop(0.85, "rgba(145, 175, 65, 0.38)");
      gradLime.addColorStop(1, "rgba(208, 242, 90, 0.02)");

      ctx.strokeStyle = gradLime;
      ctx.lineWidth = 1.6;
      ctx.stroke(pathLime);

      if (!isReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render(performance.now());

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibility);
      mediaQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-[#f8f7f4]"
      aria-hidden="true"
    >
      {/* Aurora Ambient Light Fields (100% GPU-accelerated CSS compositor, 0% CPU lag) */}
      <div
        className="absolute -left-[10%] top-[10%] h-[650px] w-[650px] rounded-full opacity-60 blur-[115px] will-change-transform"
        style={{
          background: "radial-gradient(circle, rgba(237, 240, 229, 0.95) 0%, rgba(208, 242, 90, 0.16) 60%, transparent 80%)",
          animation: "ello-aurora-drift 22s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute -right-[8%] top-[22%] h-[720px] w-[720px] rounded-full opacity-50 blur-[125px] will-change-transform"
        style={{
          background: "radial-gradient(circle, rgba(208, 242, 90, 0.26) 0%, rgba(138, 158, 75, 0.15) 50%, transparent 75%)",
          animation: "ello-aurora-drift 28s ease-in-out infinite alternate-reverse",
        }}
      />
      <div
        className="absolute left-[28%] bottom-[12%] h-[600px] w-[600px] rounded-full opacity-35 blur-[105px] will-change-transform"
        style={{
          background: "radial-gradient(circle, rgba(88, 99, 65, 0.18) 0%, rgba(237, 240, 229, 0.6) 50%, transparent 80%)",
          animation: "ello-aurora-drift 20s ease-in-out infinite alternate",
        }}
      />

      {/* Silky-smooth 36-Filament 120fps Parametric Wave Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-cover"
        tabIndex={-1}
      />

      {/* Tactile micro-grain overlay for Apple / Linear editorial finish */}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Gentle center-focus vignette so typography has pristine contrast */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 32%, transparent 0%, rgba(248, 247, 244, 0.28) 70%, rgba(248, 247, 244, 0.72) 100%)",
        }}
      />
    </div>,
    document.body,
  );
}
