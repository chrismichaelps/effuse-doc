import { define } from '@effuse/core';

export const HeroCanvas = define({
  script: ({ onMount }) => {
    let canvas: HTMLCanvasElement | null = null;
    let animId: number | null = null;

    onMount(() => {
      canvas = document.querySelector('.hero-canvas') as HTMLCanvasElement | null;
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
        const rect = canvas.parentElement?.getBoundingClientRect() || canvas.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      };

      handleResize();
      window.addEventListener('resize', handleResize);

      const handleMouseMove = (e: MouseEvent) => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        mouse.targetX = e.clientX - rect.left;
        mouse.targetY = e.clientY - rect.top;
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
        time += 0.018;

        // Calculate velocity & high-precision responsive lerp for tight sync
        const dxMouse = mouse.targetX - mouse.x;
        const dyMouse = mouse.targetY - mouse.y;
        mouse.vx = dxMouse * 0.14;
        mouse.vy = dyMouse * 0.14;
        mouse.x += mouse.vx;
        mouse.y += mouse.vy;

        ctx.clearRect(0, 0, width, height);

        // Ambient radial spotlight around the cursor position
        if (mouse.active || Math.abs(mouse.vx) > 0.01) {
          const auraGrad = ctx.createRadialGradient(
            mouse.x,
            mouse.y,
            0,
            mouse.x,
            mouse.y,
            320
          );
          auraGrad.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
          auraGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
          auraGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = auraGrad;
          ctx.fillRect(0, 0, width, height);
        }

        // Draw animated particle grid with wave interference & cursor sync
        const gridSize = 28;
        const cols = Math.ceil(width / gridSize) + 2;
        const rows = Math.ceil(height / gridSize) + 2;
        const spacingX = width / (cols - 1);
        const spacingY = height / (rows - 1);

        ctx.lineWidth = 1;

        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = i * spacingX;
            const y = j * spacingY;

            // Distance to mouse
            const dx = x - mouse.x;
            const dy = y - mouse.y;
            const distSq = dx * dx + dy * dy;
            const dist = Math.sqrt(distSq);

            // Plasma wave formula
            const wave1 = Math.sin(x * 0.006 + time * 1.4);
            const wave2 = Math.cos(y * 0.006 + time * 1.6);
            const wave3 = Math.sin((x + y) * 0.004 + time * 0.8);

            // Mouse interaction physics (reactive field)
            const radius = 280;
            const mouseEffect = Math.max(0, (radius - dist) / radius);
            const smoothEffect = mouseEffect * mouseEffect * (3 - 2 * mouseEffect); // cubic ease

            // Push/pull force synced with cursor movement velocity
            const angle = Math.atan2(dy, dx);
            const pushDist = smoothEffect * 22;
            const offsetX = Math.cos(angle) * pushDist + Math.sin(dist * 0.02 - time * 2) * smoothEffect * 8;
            const offsetY = Math.sin(angle) * pushDist + Math.cos(dist * 0.02 - time * 2) * smoothEffect * 8;

            const px = x + offsetX;
            const py = y + (wave1 + wave2 + wave3) * 5 + offsetY;

            // Dynamic point opacity & size
            const baseAlpha = 0.06 + (wave1 + 1) * 0.04;
            const hoverAlpha = smoothEffect * 0.55;
            const alpha = Math.min(0.9, baseAlpha + hoverAlpha);

            ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
            const dotSize = 1.1 + smoothEffect * 2.8;

            ctx.beginPath();
            ctx.arc(px, py, dotSize, 0, Math.PI * 2);
            ctx.fill();

            // Connect nearby grid nodes with subtle energetic lines when cursor is active
            if (smoothEffect > 0.25 && (i % 2 === 0 || j % 2 === 0)) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${(smoothEffect * 0.16).toFixed(3)})`;
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
