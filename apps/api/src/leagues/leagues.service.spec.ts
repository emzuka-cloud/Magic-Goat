import { LeaguesService, applyResults, setTotals } from './leagues.service';

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

describe('league standings: Commander pods', () => {
  const svc = new LeaguesService({} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
  const u = (id: string) => ({ id, username: id }) as any;
  const score = (pairings: any[]) => {
    const stats = new Map<string, any>();
    for (const p of pairings) (svc as any).scoreCommanderPod(stats, p);
    return (id: string) => { const s = stats.get(id); return s && `${s.points}pts ${s.matches_won}-${s.matches_lost} opp=${s.opponents.size}`; };
  };

  it('gives 3 points to each player who wins a pod, a loss to the rest', () => {
    const [a, b, c, d] = ['a', 'b', 'c', 'd'].map(u);
    const get = score([{ round: 1, player1: a, player2: b, player3: c, player4: d, result: 'p1_p3' }]);
    expect([get('a'), get('b'), get('c'), get('d')]).toEqual(['3pts 1-0 opp=3', '0pts 0-1 opp=3', '3pts 1-0 opp=3', '0pts 0-1 opp=3']);
  });

  it('scores the final winner, and treats a short pod like a bye (round 1 only)', () => {
    const [a, b, c, e, f] = ['a', 'b', 'c', 'e', 'f'].map(u);
    const get = score([
      { round: 1, player1: e, player2: f, player3: null, player4: null, result: 'p1_p2' },   // auto-advanced in round 1
      { round: 2, player1: a, player2: null, player3: null, player4: null, result: 'p1_win' }, // walkover later: nothing
      { round: 2, player1: b, player2: c, player3: e, player4: f, result: 'p4_win' },         // final
    ]);
    expect(get('e')).toBe('3pts 1-1 opp=3');   // bye win (no opponents from it) + final loss
    expect(get('f')).toBe('6pts 2-0 opp=3');   // bye win + final win
    expect(get('a')).toBeUndefined();
  });
});
