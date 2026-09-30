import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders the leaderboard with 30 players and switches editions', () => {
    render(<App />);
    const rows = screen.getAllByRole('listitem');
    expect(rows.length).toBe(30);
    expect(screen.getByText(/men's edition/)).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Women' }));
    expect(screen.getByText(/women's edition/)).toBeTruthy();
    expect(screen.getAllByRole('listitem').length).toBe(30);
  });

  it('shows presets and criteria blocks in official order', () => {
    render(<App />);
    expect(screen.getByText('1', { selector: '.block-number' })).toBeTruthy();
    expect(screen.getByText('Goalscorer Logic')).toBeTruthy();
    expect(screen.getByText(/Individual performances/)).toBeTruthy();
    expect(screen.getByText(/Collective performances & titles/)).toBeTruthy();
    expect(screen.getByText(/Class & fair play/)).toBeTruthy();
  });
});
