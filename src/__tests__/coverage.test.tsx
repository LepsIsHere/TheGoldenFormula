import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../App';

describe('data-coverage honesty indicators', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('flags stat sliders with no data as disabled with a badge', () => {
    render(<App />);
    const tabNames = screen
      .getAllByRole('tab')
      .map((t) => t.textContent ?? '')
      .filter(Boolean);
    expect(tabNames.length).toBeGreaterThan(0);
    let foundNoData = false;
    let foundWithBadge = false;
    for (const name of tabNames) {
      fireEvent.click(screen.getByRole('tab', { name }));
      const stats = screen.getAllByRole('slider').filter((el) => el.closest('.stat-slider'));
      expect(stats.length).toBeGreaterThan(0);
      for (const el of stats) {
        const input = el as HTMLInputElement;
        const row = input.closest('.stat-slider') as HTMLElement;
        const badge = within(row).queryByText(/^data \d+\/\d+$/);
        if (input.closest('.stat-slider.no-data')) {
          foundNoData = true;
          expect(input.disabled).toBe(true);
          expect(within(row).getByText('no data yet')).toBeTruthy();
        } else if (badge) {
          foundWithBadge = true;
          expect(input.disabled).toBe(false);
        }
      }
    }
    expect(foundNoData).toBe(true);
    expect(foundWithBadge).toBe(true);
  });

  it('marks the opposition-strength panel as inactive when no player has avgOpponentRating', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /ADV MODE: opposition strength/ }));
    const slider = screen.getByLabelText('Opposition strength') as HTMLInputElement;
    expect(slider.disabled).toBe(true);
    expect(
      screen.getByText(/no player in this edition has a real opposition-strength rating/)
    ).toBeTruthy();
  });

  it('disabled sliders cannot change the weights', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /ADV MODE: opposition strength/ }));
    const slider = screen.getByLabelText('Opposition strength') as HTMLInputElement;
    const hashBefore = window.location.hash;
    fireEvent.change(slider, { target: { value: '2' } });
    expect(window.location.hash).toBe(hashBefore);
    expect(slider.value).not.toBe('2');
  });
});
