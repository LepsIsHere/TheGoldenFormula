import { useEffect, useState, useCallback } from 'react';
import type { Edition, Weights } from '../types';
import { defaultWeights } from '../engine/presets';

export interface AppState {
  edition: Edition;
  weights: Weights;
}

export function encodeState(state: AppState): string {
  const compact = {
    e: state.edition,
    b: state.weights.blockWeights,
    s: state.weights.statWeights,
    c: state.weights.competitionMultipliers,
    f: Math.round(state.weights.conductSensitivity * 10) / 10,
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(compact))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeState(hash: string): AppState | null {
  try {
    const b64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    const parsed = JSON.parse(json);
    if (parsed.e !== 'men' && parsed.e !== 'women') return null;
    const defaults = defaultWeights();
    return {
      edition: parsed.e,
      weights: {
        blockWeights: { ...defaults.blockWeights, ...parsed.b },
        statWeights: mergeStatWeights(defaults.statWeights, parsed.s),
        competitionMultipliers: { ...defaults.competitionMultipliers, ...parsed.c },
        conductSensitivity: typeof parsed.f === 'number' ? parsed.f : 1,
      },
    };
  } catch {
    return null;
  }
}

function mergeStatWeights(
  defaults: Record<string, Record<string, number>>,
  overrides: unknown
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  for (const [role, weights] of Object.entries(defaults)) {
    const o = (overrides as Record<string, Record<string, number>>)?.[role] ?? {};
    out[role] = { ...weights, ...o };
  }
  return out as Weights['statWeights'];
}

export function useHashState(): [AppState, (next: AppState) => void] {
  const [state, setState] = useState<AppState>(() => {
    const hash = window.location.hash.replace(/^#/, '');
    return decodeState(hash) ?? { edition: 'men', weights: defaultWeights() };
  });

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const decoded = decodeState(hash);
      if (decoded) setState(decoded);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const update = useCallback((next: AppState) => {
    setState(next);
    const encoded = encodeState(next);
    window.history.replaceState(null, '', `#${encoded}`);
  }, []);

  return [state, update];
}
