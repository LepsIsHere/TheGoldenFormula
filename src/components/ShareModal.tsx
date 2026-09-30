import { useRef, useEffect, useState } from 'react';
import type { ScoredPlayer, Edition } from '../types';

const W = 800;
const ROW_H = 34;
const TOP_ROWS = 10;

export default function ShareModal({
  scored,
  edition,
  url,
  onClose,
}: {
  scored: ScoredPlayer[];
  edition: Edition;
  url: string;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pngBlob, setPngBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState(false);

  const message =
    `My 2026 Ballon d'Or top 3 (${edition === 'men' ? "men's" : "women's"} edition):\n` +
    `1. ${scored[0].player.name} (${scored[0].score.toFixed(1)} pts)\n` +
    `2. ${scored[1].player.name} (${scored[1].score.toFixed(1)} pts)\n` +
    `3. ${scored[2].player.name} (${scored[2].score.toFixed(1)} pts)\n` +
    `Build your own ranking:` + url;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rows = Math.min(TOP_ROWS, scored.length);
    const height = 190 + rows * ROW_H + 70;
    canvas.width = W;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(0, 0, W, height);

    ctx.fillStyle = '#e3b341';
    ctx.font = '700 28px "SF Mono", "Cascadia Code", Consolas, monospace';
    ctx.fillText('★ BALLON D\'OR LAB', 40, 60);
    ctx.fillStyle = '#9aa0b0';
    ctx.font = '16px "SF Mono", "Cascadia Code", Consolas, monospace';
    ctx.fillText(
      `MY TOP ${rows} — ${edition === 'men' ? "MEN'S" : "WOMEN'S"} EDITION · 2026`,
      40, 92
    );

    let y = 140;
    scored.slice(0, rows).forEach((s, i) => {
      if (i < 3) {
        ctx.fillStyle = 'rgba(227,179,65,0.08)';
        ctx.fillRect(40, y - 22, W - 80, ROW_H);
      }
      ctx.fillStyle = '#e3b341';
      ctx.font = '700 18px "SF Mono", "Cascadia Code", Consolas, monospace';
      ctx.fillText(String(i + 1).padStart(2, '0'), 52, y);
      ctx.fillStyle = '#e8e9ee';
      ctx.font = '600 18px "SF Mono", "Cascadia Code", Consolas, monospace';
      ctx.fillText(s.player.flag, 100, y);
      ctx.fillText(s.player.name, 140, y);
      ctx.fillStyle = '#9aa0b0';
      ctx.font = '14px "SF Mono", "Cascadia Code", Consolas, monospace';
      ctx.fillText(`${s.player.club} · ${s.player.role}`, 420, y);
      ctx.fillStyle = '#e3b341';
      ctx.font = '700 18px "SF Mono", "Cascadia Code", Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(s.score.toFixed(1), W - 52, y);
      ctx.textAlign = 'left';
      y += ROW_H;
    });

    ctx.fillStyle = '#9aa0b0';
    ctx.font = '14px "SF Mono", "Cascadia Code", Consolas, monospace';
    ctx.fillText('Data: draft placeholders · lepsishere.github.io/TheGoldenFormula', 40, height - 40);

    canvas.toBlob((blob) => setPngBlob(blob), 'image/png');
  }, [scored, edition]);

  const download = () => {
    if (!pngBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(pngBlob);
    a.download = `ballon-dor-lab-${edition}-top${TOP_ROWS}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const share = async () => {
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
      share?: (data: ShareData) => Promise<void>;
    };
    if (pngBlob && nav.share && nav.canShare) {
      const file = new File([pngBlob], 'ballon-dor-lab.png', { type: 'image/png' });
      const data = { text: message, files: [file], title: 'My Ballon d\'Or ranking' };
      if (nav.canShare({ files: [file] })) {
        try {
          await nav.share(data);
          return;
        } catch {
          // user cancelled or unsupported; fall through to copy
        }
      }
    }
    await navigator.clipboard?.writeText(`${message}\n(image copied separately — download the PNG and attach)`);
    setCopied(true);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal share-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Share ranking">
        <h3>EXPORT / SHARE</h3>
        <canvas ref={canvasRef} className="share-canvas" />
        <div className="share-actions">
          <button onClick={download}>DOWNLOAD PNG</button>
          <button className="gold" onClick={share}>SHARE ON SOCIAL</button>
          <button onClick={async () => { await navigator.clipboard?.writeText(message); setCopied(true); }}>
            COPY TEXT
          </button>
        </div>
        <p className="share-hint">
          {copied ? '✓ Copied to clipboard' : 'Share includes the card image, your top 3, and a link to rebuild your exact weights.'}
        </p>
        <button onClick={onClose}>CLOSE</button>
      </div>
    </div>
  );
}
