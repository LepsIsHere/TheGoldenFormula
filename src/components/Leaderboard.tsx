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
    prevPositions.current = next;
  }, [scored]);

  const maxScore = Math.max(...scored.map((s) => s.score), 1);

  return (
    <section className="leaderboard" aria-label="Live top 30">
      <h2>
        <span>Top 30 — live ranking / {edition === 'men' ? "men's" : "women's"} edition</span>
        <span className="count">REF 2025-08-03 → 2026-07-19</span>
      </h2>
      <div className="lb-head">
        <span>RK</span>
        <span>Δ</span>
        <span> </span>
        <span>Player</span>
        <span>IND</span>
        <span>TEAM</span>
        <span>FFP</span>
        <span> </span>
        <span>Score</span>
        <span>Ballot</span>
      </div>
      <ol className="rows">
        {scored.map((s, i) => {
          const prev = prevPositions.current[s.player.id] ?? i;
          const movement = prev - i;
          return (
            <li
              key={s.player.id}
              className={`row${i < 3 ? ' top' : ''}`}
            >
              <span className="rank">{String(i + 1).padStart(2, '0')}</span>
              <span className={`movement${movement > 0 ? ' up' : movement < 0 ? ' down' : ''}`}>
                {movement > 0 ? `▲${movement}` : movement < 0 ? `▼${-movement}` : '–'}
              </span>
              <span className="flag">{s.player.flag}</span>
              <div className="identity">
                <span className="name">{s.player.name}</span>
                <span className="meta">
                  {s.player.club} · <span className={`role-badge role-${s.player.role.toLowerCase()}`}>{s.player.role}</span>
                </span>
              </div>
              <span className="cell">{s.individualScore.toFixed(1)}</span>
              <span className="cell">{s.teamScore.toFixed(1)}</span>
              <span className="cell">{s.fairPlayScore.toFixed(1)}</span>
              {s.conductEvents.length > 0 ? (
                <button
                  className="conduct-flag"
                  onClick={() => onFlagClick(s.player.id)}
                  title="Fair-play events — click to inspect sources"
                >
                  ⚑{s.conductEvents.length}
                </button>
              ) : (
                <span />
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
