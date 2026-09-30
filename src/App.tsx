import { useMemo, useState } from 'react';
import type { ConductEvent, Dataset, Weights } from './types';
import { scorePlayers } from './engine/scoring';
import { PRESETS, defaultWeights } from './engine/presets';
import { useHashState } from './hooks/useHashState';
import CriteriaPanel from './components/CriteriaPanel';
import Leaderboard from './components/Leaderboard';
import EditionPicker from './components/EditionPicker';
import ConductModal from './components/ConductModal';
import ShareModal from './components/ShareModal';
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
  const [shareOpen, setShareOpen] = useState(false);

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
        <div className="brand">
          <h1>
            <span className="star">★</span> Ballon d'Or Lab
          </h1>
          <p className="tagline">Build your own Ballon d'Or — men's & women's 2026.</p>
        </div>
        <div className="header-actions">
          <EditionPicker edition={state.edition} onChange={setEdition} />
          <div className="export-buttons">
            <button onClick={() => setShareOpen(true)}>Export / Share</button>
          </div>
        </div>
      </header>
      <div className="ticker" role="status">
        <span className="live">● LIVE</span>
        <span>REF 2025-08-03 → 2026-07-19</span>
        <span>N={scored.length}</span>
        <span>{editionLabel(state.edition)} EDITION</span>
        <span className="warn">DATA: DRAFT</span>
      </div>

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

      {shareOpen && (
        <ShareModal
          scored={scored}
          edition={state.edition}
          url={window.location.href}
          onClose={() => setShareOpen(false)}
        />
      )}

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

function editionLabel(edition: 'men' | 'women') {
  return edition === 'men' ? "MEN'S" : "WOMEN'S";
}
