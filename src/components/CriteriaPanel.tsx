import { useState } from 'react';
import type { CompetitionTier, Role, Weights } from '../types';
import { ROLE_CATALOGS, ROLE_ORDER } from '../engine/roleCatalogs';
import { DEFAULT_COMPETITION_MULTIPLIERS } from '../engine/presets';

interface Preset {
  id: string;
  name: string;
  description: string;
  weights: Weights;
}

interface Props {
  weights: Weights;
  onWeightsChange: (w: Weights) => void;
  selectedRoleTab: string;
  onRoleTabChange: (role: string) => void;
  presets: Preset[];
  onPreset: (p: Preset) => void;
  onReset: () => void;
}

const COMP_LABELS: Record<CompetitionTier, string> = {
  'world-cup': 'World Cup',
  ucl: 'Champions League',
  wccl: "Women's Champions League",
  'top-league': 'Top league title',
  'other-league': 'Other league title',
  'domestic-cup': 'Domestic cup',
  international: 'International trophy',
  other: 'Other',
};

export default function CriteriaPanel({
  weights,
  onWeightsChange,
  selectedRoleTab,
  onRoleTabChange,
  presets,
  onPreset,
  onReset,
}: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const setBlock = (key: keyof Weights['blockWeights'], v: number) =>
    onWeightsChange({ ...weights, blockWeights: { ...weights.blockWeights, [key]: v } });

  const setStat = (role: Role, statKey: string, v: number) =>
    onWeightsChange({
      ...weights,
      statWeights: { ...weights.statWeights, [role]: { ...weights.statWeights[role], [statKey]: v } },
    });

  const setTier = (tier: CompetitionTier, v: number) =>
    onWeightsChange({
      ...weights,
      competitionMultipliers: { ...weights.competitionMultipliers, [tier]: v },
    });

  const roleCatalog = ROLE_CATALOGS[selectedRoleTab as Role];
  const selectedRole = selectedRoleTab as Role;

  return (
    <aside className="criteria-panel">
      <div className="presets">
        <h3>Presets</h3>
        <div className="preset-buttons">
          {presets.map((p) => (
            <button key={p.id} title={p.description} onClick={() => onPreset(p)}>
              {p.name}
            </button>
          ))}
          <button className="reset" onClick={onReset}>Reset</button>
        </div>
      </div>

      <section className="criteria-block">
        <h2>
          <span className="block-number">1</span> Individual performances
        </h2>
        <p className="block-hint">Decisive and impressive character — the first criterion.</p>
        <Slider label="Block weight" value={weights.blockWeights.individual} min={0} max={10} onChange={(v) => setBlock('individual', v)} />

        <div className="role-tabs" role="tablist">
          {ROLE_ORDER.map((role) => (
            <button
              key={role}
              role="tab"
              aria-selected={selectedRoleTab === role}
              className={selectedRoleTab === role ? 'active' : ''}
              onClick={() => onRoleTabChange(role)}
            >
              {ROLE_CATALOGS[role].label}
            </button>
          ))}
        </div>
        <div className="stat-sliders">
          {roleCatalog.stats.map((stat) => (
            <div key={stat.key} className="stat-slider" title={stat.description}>
              <label>{stat.label}</label>
              <Slider
                label=""
                value={weights.statWeights[selectedRole]?.[stat.key] ?? 1}
                min={0}
                max={5}
                step={0.5}
                hideLabel
                onChange={(v) => setStat(selectedRole, stat.key, v)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="criteria-block">
        <h2>
          <span className="block-number">2</span> Collective performances & titles
        </h2>
        <p className="block-hint">Titles won — weighted by competition context.</p>
        <div className="advanced-toggle">
          <button
            className={showAdvanced ? 'on' : ''}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? '▼' : '▶'} ADV MODE: opposition strength
          </button>
        </div>
        {showAdvanced && (
          <div className="advanced-panel">
            <p className="advanced-hint">
              Scales individual points by the average strength of opponents faced
              (UEFA club coefficients / FIFA national rankings, 0-100 per player).
              A goal vs PSG counts more than a goal vs Leipzig. 0 = off.
            </p>
            <Slider
              label="Opposition strength"
              value={weights.oppositionStrengthSensitivity}
              min={0}
              max={2}
              step={0.1}
              onChange={(v) => onWeightsChange({ ...weights, oppositionStrengthSensitivity: v })}
            />
          </div>
        )}
        <Slider label="Block weight" value={weights.blockWeights.team} min={0} max={10} onChange={(v) => setBlock('team', v)} />
        <div className="stat-sliders">
          {(Object.keys(DEFAULT_COMPETITION_MULTIPLIERS) as CompetitionTier[]).map((tier) => (
            <div key={tier} className="stat-slider">
              <label>{COMP_LABELS[tier]}</label>
              <Slider
                label=""
                value={weights.competitionMultipliers[tier]}
                min={0}
                max={2}
                step={0.1}
                hideLabel
                onChange={(v) => setTier(tier, v)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="criteria-block">
        <h2>
          <span className="block-number">3</span> Class & fair play
        </h2>
        <p className="block-hint">
          Cards are the quantitative floor; the sourced conduct event log goes beyond it.
        </p>
        <Slider label="Block weight" value={weights.blockWeights.fairPlay} min={0} max={10} onChange={(v) => setBlock('fairPlay', v)} />
        <Slider
          label="Conduct severity sensitivity"
          value={weights.conductSensitivity}
          min={0}
          max={3}
          step={0.1}
          onChange={(v) => onWeightsChange({ ...weights, conductSensitivity: v })}
        />
      </section>
    </aside>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hideLabel,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  hideLabel?: boolean;
}) {
  return (
    <div className="slider-row">
      {!hideLabel && <label>{label}</label>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label || 'slider'}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="slider-value">{value}</span>
    </div>
  );
}
