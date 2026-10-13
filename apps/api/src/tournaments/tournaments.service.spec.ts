import { TournamentsService, csvCell } from './tournaments.service';
import { Pairing, PairingResult } from './entities/pairing.entity';
import { TournamentFormat, TournamentStatus } from './entities/tournament.entity';

const u = (username: string) => ({ id: username, username }) as any;
const match = (round: number, order: number, player1: any = null, player2: any = null, result = PairingResult.PENDING) =>
  ({ round, order, player1, player2, result }) as Pairing;

const tournaments = { update: jest.fn() };

function resolve(pairings: Pairing[]) {
  const repo = { find: jest.fn(async () => pairings), save: jest.fn(async (x) => x) };
  const svc = new TournamentsService(tournaments as any, {} as any, repo as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
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
    expect(tournaments.update).toHaveBeenLastCalledWith('t', { status: TournamentStatus.ACTIVE });

    p[0].result = PairingResult.P1_WIN;      // a beats b
    p[4].result = PairingResult.P2_WIN;      // c beats a
    await resolve(p);
    expect(p[6].player1).toBe(c);
    expect(p[6].result).toBe(PairingResult.P1_WIN); // final opponent slot is dead: c wins
    expect(tournaments.update).toHaveBeenLastCalledWith('t', { status: TournamentStatus.COMPLETED });
  });
});

describe('TournamentsService.assertCanView', () => {
  const tournament = { id: 't', created_by: u('owner'), participants: [{ user: u('player') }] };
  const leagueMembers = { exists: jest.fn(async ({ where }) => where.user.id === 'leaguer') };
  const svc = new TournamentsService({ findOne: jest.fn(async () => tournament) } as any,
    {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, leagueMembers as any, {} as any);

  it('lets the owner and participants read the tournament', async () => {
    await expect(svc.assertCanView('t', 'owner')).resolves.toBe(tournament);
    await expect(svc.assertCanView('t', 'player')).resolves.toBe(tournament);
  });

  it('rejects anyone else with 403', async () => {
    await expect(svc.assertCanView('t', 'stranger')).rejects.toThrow('You are not part of this tournament.');
  });

  it('lets league members follow a league tournament', async () => {
    (tournament as any).league = { id: 'l', created_by: u('league-owner') };
    await expect(svc.assertCanView('t', 'leaguer')).resolves.toBe(tournament);
    await expect(svc.assertCanView('t', 'league-owner')).resolves.toBe(tournament);
    await expect(svc.assertCanView('t', 'stranger')).rejects.toThrow('You are not part of this tournament.');
    delete (tournament as any).league;
  });
});

describe('csvCell', () => {
  it('quotes fields and neutralises spreadsheet formulas', () => {
    expect(csvCell(1)).toBe('"1"');
    expect(csvCell('alice')).toBe('"alice"');
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    for (const evil of ['=HYPERLINK("http://x")', '+1', '-1+1', '@SUM(A1)', '\tcmd']) {
      expect(csvCell(evil).startsWith(`"'`)).toBe(true);
    }
  });
});

const pod = (round: number, order: number, players: any[] = [], result = PairingResult.PENDING) =>
  ({ round, order, player1: players[0] ?? null, player2: players[1] ?? null, player3: players[2] ?? null, player4: players[3] ?? null, result }) as Pairing;

function resolveCommander(pairings: Pairing[]) {
  const repo = { find: jest.fn(async () => pairings), save: jest.fn(async (x) => x) };
  const svc = new TournamentsService(tournaments as any, {} as any, repo as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);
  return (svc as any).resolveByes('t', TournamentFormat.COMMANDER);
}

describe('Commander pods', () => {
  it('auto-advances a short pod, sends two on, and crowns one champion (6 players, 8 seats)', async () => {
    const [a, b, c, d, e, f] = ['a', 'b', 'c', 'd', 'e', 'f'].map(u);
    const p = [pod(1, 0, [a, b, c, d]), pod(1, 1, [e, f]), pod(2, 0)];
    await resolveCommander(p);
    expect(p[1].result).toBe(PairingResult.P1_P2);          // only 2 players: both move on
    expect([p[2].player3, p[2].player4]).toEqual([e, f]);   // odd pod fills seats 3-4 of the final
    expect(p[0].result).toBe(PairingResult.PENDING);        // full pod still has to play
    expect(tournaments.update).toHaveBeenLastCalledWith('t', { status: TournamentStatus.ACTIVE });

    p[0].result = PairingResult.P1_P3;                      // a and c win their pod
    await resolveCommander(p);
    expect([p[2].player1, p[2].player2]).toEqual([a, c]);
    expect(p[2].result).toBe(PairingResult.PENDING);        // 4-player final is played, not auto-decided

    p[2].result = PairingResult.P4_WIN;                     // f wins the final
    await resolveCommander(p);
    expect(tournaments.update).toHaveBeenLastCalledWith('t', { status: TournamentStatus.COMPLETED });
  });

  it('waits for a pod that can still send players before deciding the next one (5 players)', async () => {
    const [a, b, c, d, e] = ['a', 'b', 'c', 'd', 'e'].map(u);
    const p = [pod(1, 0, [a, b, c, d]), pod(1, 1, [e]), pod(2, 0)];
    await resolveCommander(p);
    expect(p[1].result).toBe(PairingResult.P1_WIN);         // lone player moves on
    expect(p[2].player3).toBe(e);
    expect(p[2].result).toBe(PairingResult.PENDING);        // final must wait for pod 1's two players
  });
});
