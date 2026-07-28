import { define } from '@effuse/core';

export const HeroCanvas = define({
  script: ({ onMount }) => {
    let canvas: HTMLCanvasElement | null = null;
    let animId: number | null = null;

    onMount(() => {
      canvas = document.querySelector(
        '.hero-canvas'
      ) as HTMLCanvasElement | null;
      if (!canvas) return undefined;

      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;

      let width = 0;
      let height = 0;

      const mouse = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        vx: 0,
        vy: 0,
        active: false,
      };

      const handleResize = () => {
        if (!canvas) return;
        width = window.innerWidth;
        height = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      const handleMouseMove = (e: MouseEvent) => {
        mouse.targetX = e.clientX;
        mouse.targetY = e.clientY;
        mouse.active = true;
      };

      const handleMouseLeave = () => {
        mouse.active = false;
      };

      window.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseleave', handleMouseLeave);

      // Initial mouse position at center
      mouse.x = width / 2;
      mouse.y = height / 2;
      mouse.targetX = width / 2;
      mouse.targetY = height / 2;

      let time = 0;

      const render = () => {
        time += 0.016;

        // Smooth mouse position lerp
        const dxMouse = mouse.targetX - mouse.x;
        const dyMouse = mouse.targetY - mouse.y;
        mouse.vx = dxMouse * 0.12;
        mouse.vy = dyMouse * 0.12;
        mouse.x += mouse.vx;
        mouse.y += mouse.vy;

        ctx.clearRect(0, 0, width, height);

        // Soft ambient radial glow centered on cursor
        if (mouse.active || Math.abs(mouse.vx) > 0.01) {
          const auraGrad = ctx.createRadialGradient(
            mouse.x,
            mouse.y,
            0,
            mouse.x,
            mouse.y,
            300
          );
          auraGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
          auraGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.015)');
          auraGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = auraGrad;
          ctx.fillRect(0, 0, width, height);
        }

        // Crisp, visible dot matrix grid (always visible by default)
        const gridSize = 26;
        const cols = Math.ceil(width / gridSize) + 2;
        const rows = Math.ceil(height / gridSize) + 2;
        const spacingX = width / (cols - 1);
        const spacingY = height / (rows - 1);

        ctx.lineWidth = 0.75;

        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = i * spacingX;
            const y = j * spacingY;

            // Distance to mouse
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Dynamic sine wave motion for default continuous animation
            const wave1 = Math.sin(x * 0.005 + time * 1.3);
            const wave2 = Math.cos(y * 0.005 + time * 1.5);
            const wave3 = Math.sin((x + y) * 0.003 + time * 0.9);

            // Reactive cursor radius
            const radius = 260;
            const mouseEffect = Math.max(0, (radius - dist) / radius);
            const smoothEffect =
              mouseEffect * mouseEffect * (3 - 2 * mouseEffect);

            // Dynamic displacement offset
            const angle = Math.atan2(dy, dx);
            const pushDist = smoothEffect * 16;
            const offsetX =
              Math.cos(angle) * pushDist +
              Math.sin(dist * 0.02 - time * 1.8) * smoothEffect * 6;
            const offsetY =
              Math.sin(angle) * pushDist +
              Math.cos(dist * 0.02 - time * 1.8) * smoothEffect * 6;

            const px = x + offsetX;
            const py = y + (wave1 + wave2 + wave3) * 4 + offsetY;

            // Base opacity ensuring dots are 100% visible by default on screen
            const baseAlpha = 0.12 + (wave1 + 1) * 0.06;
            const hoverAlpha = smoothEffect * 0.45;
            const alpha = Math.min(0.75, baseAlpha + hoverAlpha);

            ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
            const dotSize = 1.0 + smoothEffect * 1.5;

            ctx.beginPath();
            ctx.arc(px, py, dotSize, 0, Math.PI * 2);
            ctx.fill();

            // Subtle vector lines near cursor on hover
            if (smoothEffect > 0.3 && (i % 2 === 0 || j % 2 === 0)) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${(smoothEffect * 0.12).toFixed(3)})`;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.stroke();
            }
          }
        }

        animId = requestAnimationFrame(render);
      };

      animId = requestAnimationFrame(render);

      return () => {
        if (animId) cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseleave', handleMouseLeave);
      };
    });

    return {};
  },
  template: () => (
    <div class="hero-canvas-container" aria-hidden="true">
      <canvas class="hero-canvas" />
      <div class="hero-vignette" />
    </div>
  ),
});
