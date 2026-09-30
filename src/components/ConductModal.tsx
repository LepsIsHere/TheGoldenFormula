import type { ScoredPlayer } from '../types';
import { conductSummary } from '../engine/scoring';

export default function ConductModal({
  scored,
  onClose,
}: {
  scored: ScoredPlayer;
  onClose: () => void;
}) {
  const summary = conductSummary(scored.player, scored.conductEvents, 1);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Fair play events">
        <h3>
          {scored.player.flag} {scored.player.name} — class & fair play
        </h3>
        <p className="modal-sub">
          Quantitative baseline: {scored.player.stats.yellowCards ?? 0} yellows,{' '}
          {scored.player.stats.redCards ?? 0} reds, {scored.player.stats.suspensionsServed ?? 0} suspensions served.
        </p>
        <ul className="conduct-list">
          {scored.conductEvents.map((ev) => (
            <li key={ev.id} className={ev.severity < 0 ? 'negative' : 'positive'}>
              <span className="severity">{ev.severity > 0 ? `+${ev.severity}` : ev.severity}</span>
              <span>
                <strong>{ev.date}</strong> — {ev.description}{' '}
                <a href={ev.source} target="_blank" rel="noreferrer">source ↗</a>
              </span>
            </li>
          ))}
        </ul>
        <p className="modal-hint">
          Baseline card penalty: {summary.cardsPenalty.toFixed(1)} · events: {summary.eventsPenalty + summary.positiveBonus} (scaled by your
          severity sensitivity slider). Judge credibility yourself — every event links to its source.
        </p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
