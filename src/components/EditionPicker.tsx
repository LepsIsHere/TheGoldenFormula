import type { Edition } from '../types';

export default function EditionPicker({ edition, onChange }: { edition: Edition; onChange: (e: Edition) => void }) {
  return (
    <div className="edition-picker" role="tablist" aria-label="Edition">
      <button
        role="tab"
        aria-selected={edition === 'men'}
        className={edition === 'men' ? 'active' : ''}
        onClick={() => onChange('men')}
      >
        Men
      </button>
      <button
        role="tab"
        aria-selected={edition === 'women'}
        className={edition === 'women' ? 'active' : ''}
        onClick={() => onChange('women')}
      >
        Women
      </button>
    </div>
  );
}
