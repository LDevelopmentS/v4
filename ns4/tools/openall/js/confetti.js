// Small local stand-in for canvas-confetti (the page's CSP only allows scripts from this site, so the CDN copy cannot load).
// Supports the options the tool uses: particleCount, spread, origin {x,y}, colors.
export function confetti(opts = {}) {
  const count = opts.particleCount ?? 100;
  const spread = (opts.spread ?? 45) * Math.PI / 180;
  const ox = (opts.origin?.x ?? 0.5), oy = (opts.origin?.y ?? 0.5);
  const colors = opts.colors?.length ? opts.colors : ['#f6c90e', '#ffffff'];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  const dpr = window.devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);

  const parts = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
    const speed = 8 + Math.random() * 12;
    return {
      x: ox * innerWidth, y: oy * innerHeight,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      w: 6 + Math.random() * 6, h: 4 + Math.random() * 4,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)], life: 0
    };
  });

  const MAX = 140;
  (function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    for (const p of parts) {
      p.life++;
      p.vx *= 0.99; p.vy = p.vy * 0.99 + 0.35;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      const a = Math.max(0, 1 - p.life / MAX);
      if (a <= 0 || p.y > innerHeight + 20) continue;
      alive++;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive) requestAnimationFrame(frame); else cv.remove();
  })();
}
