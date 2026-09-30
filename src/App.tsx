import { useMemo, useState } from 'react';
import type { ConductEvent, Dataset, Weights } from './types';
import { scorePlayers, ballotPoints } from './engine/scoring';
import { PRESETS, defaultWeights } from './engine/presets';
import { useHashState } from './hooks/useHashState';
import CriteriaPanel from './components/CriteriaPanel';
import Leaderboard from './components/Leaderboard';
import EditionPicker from './components/EditionPicker';
import ConductModal from './components/ConductModal';
import menData from '../data/men-2026.json';
import womenData from '../data/women-2026.json';
import conductLog from '../data/conduct-log.json';

const DATASETS: Record<string, Dataset> = {
  men: menData as unknown as Dataset,
  women: womenData as unknown as Dataset,
};

export default function App() {
  const [state, updateState] = useHashState();
  const [selectedRoleTab, setSelectedRoleTab] = useState<string>('GK');
  const [conductPlayerId, setConductPlayerId] = useState<string | null>(null);

  const dataset = DATASETS[state.edition];
  const eventsByPlayer = useMemo(() => {
    const map: Record<string, ConductEvent[]> = {};
    for (const ev of conductLog.events as ConductEvent[]) {
      (map[ev.playerId] ??= []).push(ev);
    }
    return map;
  }, []);

  const scored = useMemo(
    () => scorePlayers(dataset.players, eventsByPlayer, state.weights),
    [dataset, eventsByPlayer, state.weights]
  );

  const setWeights = (w: Weights) => updateState({ ...state, weights: w });
  const setEdition = (edition: 'men' | 'women') => updateState({ ...state, edition });

  const conductPlayer = conductPlayerId
    ? scored.find((s) => s.player.id === conductPlayerId) ?? null
    : null;

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Ballon d'Or Lab</h1>
          <p className="tagline">Build your own Ballon d'Or — men's & women's 2026.</p>
        </div>
        <div className="header-actions">
          <EditionPicker edition={state.edition} onChange={setEdition} />
          <div className="export-buttons">
            <button onClick={() => exportRanking(scored, 'text')}>Copy ranking</button>
            <button onClick={() => exportRanking(scored, 'json')}>Copy JSON</button>
          </div>
        </div>
      </header>

      <main className="layout">
        <CriteriaPanel
          weights={state.weights}
          onWeightsChange={setWeights}
          selectedRoleTab={selectedRoleTab}
          onRoleTabChange={setSelectedRoleTab}
          presets={PRESETS}
          onPreset={(p) => setWeights(p.weights)}
          onReset={() => setWeights(defaultWeights())}
        />
        <Leaderboard
          scored={scored}
          edition={state.edition}
          onFlagClick={setConductPlayerId}
        />
      </main>

      {conductPlayer && (
        <ConductModal
          scored={conductPlayer}
          onClose={() => setConductPlayerId(null)}
        />
      )}
      <footer className="footer">
        <p>
          Scores are computed live from your weights. Roster per the reported 2026
          shortlists; stat lines are draft placeholders pending the FBref data pass —
          see the methodology page. Fair-play events cite sources so you can judge
          credibility yourself.
        </p>
      </footer>
    </div>
  );
}

function exportRanking(scored: ReturnType<typeof scorePlayers>, mode: 'text' | 'json') {
  if (mode === 'text') {
    const lines = scored.map(
      (s, i) => `${i + 1}. ${s.player.name} (${s.player.club}) — ${s.score.toFixed(1)} pts`
    );
    navigator.clipboard?.writeText(lines.join('\n'));
  } else {
    const payload = scored.map((s, i) => ({
      rank: i + 1,
      ballotPoints: ballotPoints(i),
      player: s.player.name,
      club: s.player.club,
      role: s.player.role,
      score: Math.round(s.score * 10) / 10,
    }));
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
  }
}
