import { TournamentsService } from './tournaments.service';
import { Pairing, PairingResult } from './entities/pairing.entity';
import { TournamentFormat } from './entities/tournament.entity';

const u = (username: string) => ({ id: username, username }) as any;
const match = (round: number, order: number, player1: any = null, player2: any = null, result = PairingResult.PENDING) =>
  ({ round, order, player1, player2, result }) as Pairing;

function resolve(pairings: Pairing[]) {
  const repo = { find: jest.fn(async () => pairings), save: jest.fn(async (x) => x) };
  const svc = new TournamentsService({} as any, {} as any, repo as any, {} as any, {} as any, {} as any, {} as any, {} as any);
  return (svc as any).resolveByes('t', TournamentFormat.SINGLE_ELIMINATION);
}

describe('TournamentsService.resolveByes', () => {
  it('advances byes and auto-wins slots that can never be filled (3 players in an 8 bracket)', async () => {
    const [a, b, c] = [u('a'), u('b'), u('c')];
    const p = [
      match(1, 0, a, b), match(1, 1, c, null, PairingResult.P1_WIN), match(1, 2), match(1, 3),
      match(2, 0), match(2, 1),
      match(3, 0),
    ];
    await resolve(p);
    expect(p[4].player2).toBe(c);            // bye winner moved to round 2
    expect(p[4].result).toBe(PairingResult.PENDING); // still waits for a vs b
    expect(p[5].player1).toBeNull();         // empty side of bracket stays empty

    p[0].result = PairingResult.P1_WIN;      // a beats b
    p[4].result = PairingResult.P2_WIN;      // c beats a
    await resolve(p);
    expect(p[6].player1).toBe(c);
    expect(p[6].result).toBe(PairingResult.P1_WIN); // final opponent slot is dead: c wins
  });
});
