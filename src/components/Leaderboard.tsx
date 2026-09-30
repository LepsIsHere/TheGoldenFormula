import { useRef, useEffect } from 'react';
import type { ScoredPlayer, Edition } from '../types';
import { ballotPoints } from '../engine/scoring';

interface PrevPositions {
  [playerId: string]: number;
}

export default function Leaderboard({
  scored,
  edition,
  onFlagClick,
}: {
  scored: ScoredPlayer[];
  edition: Edition;
  onFlagClick: (playerId: string) => void;
}) {
  const prevPositions = useRef<PrevPositions>({});

  useEffect(() => {
    const next: PrevPositions = {};
    scored.forEach((s, i) => (next[s.player.id] = i));
    return () => {
      prevPositions.current = next;
    };
  }, [scored]);

  const maxScore = Math.max(...scored.map((s) => s.score), 1);

  return (
    <section className="leaderboard" aria-label="Live top 30">
      <h2>Top 30 — live ranking ({edition === 'men' ? "men's" : "women's"} edition)</h2>
      <ol className="rows">
        {scored.map((s, i) => {
          const prev = prevPositions.current[s.player.id] ?? i;
          const movement = prev - i;
          return (
            <li
              key={s.player.id}
              className="row"
              style={{ transform: `translateY(${(prev - i) * 0}px)` }}
            >
              <span className="rank">{i + 1}</span>
              <span className="movement">
                {movement > 0 ? `▲${movement}` : movement < 0 ? `▼${-movement}` : ''}
              </span>
              <span className="flag">{s.player.flag}</span>
              <div className="identity">
                <span className="name">{s.player.name}</span>
                <span className="meta">
                  {s.player.club} · <span className={`role-badge role-${s.player.role.toLowerCase()}`}>{s.player.role}</span>
                </span>
              </div>
              {s.conductEvents.length > 0 && (
                <button
                  className="conduct-flag"
                  onClick={() => onFlagClick(s.player.id)}
                  title="Fair-play events — click to inspect sources"
                >
                  ⚑
                </button>
              )}
              <div className="score-track">
                <div className="score-bar" style={{ width: `${(s.score / maxScore) * 100}%` }} />
                <span className="score-value">{s.score.toFixed(1)}</span>
              </div>
              {i < 10 && <span className="ballot">{ballotPoints(i)}p</span>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
