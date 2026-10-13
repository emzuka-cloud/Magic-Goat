import { applyResults, setTotals } from './leagues.service';

const row = () => ({ points: 0, matches_played: 0, matches_won: 0, matches_drawn: 0, matches_lost: 0, omw_percentage: 0,
  adj_points: 0, adj_matches_played: 0, adj_matches_won: 0, adj_matches_drawn: 0, adj_matches_lost: 0 }) as any;
const results = (points: number, won: number, lost = 0) => ({ points, matches_played: won + lost, matches_won: won, matches_drawn: 0, matches_lost: lost });

describe('league standings: results + manual adjustments', () => {
  it('keeps an owner correction when new results come in', () => {
    const p = row();
    applyResults(p, results(6, 2), 0.5);          // 2 wins from tournaments
    setTotals(p, { points: 10 });                 // owner adds 4 points (e.g. a casual night)
    expect(p.points).toBe(10);
    expect(p.adj_points).toBe(4);

    applyResults(p, results(9, 3), 0.5);          // another win is reported
    expect(p.points).toBe(13);                    // 9 from results + 4 kept
    expect(p.matches_won).toBe(3);                // untouched stats follow results only
  });

  it('can lower a total below what results give, and clearing adjustments restores results', () => {
    const p = row();
    applyResults(p, results(9, 3), 0.5);
    setTotals(p, { points: 3, matches_won: 1 });
    expect([p.adj_points, p.adj_matches_won]).toEqual([-6, -2]);

    p.adj_points = 0; p.adj_matches_won = 0;      // what clearAdjustments does before recalculating
    applyResults(p, results(9, 3), 0.5);
    expect([p.points, p.matches_won]).toEqual([9, 3]);
  });

  it('editing twice replaces the correction instead of stacking it', () => {
    const p = row();
    applyResults(p, results(3, 1), 0.5);
    setTotals(p, { points: 5 });
    setTotals(p, { points: 4 });
    expect([p.points, p.adj_points]).toEqual([4, 1]);
  });
});
