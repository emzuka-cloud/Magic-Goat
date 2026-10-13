import { EventsGateway } from './events.gateway';

const socket = (token?: string) => ({ handshake: { auth: { token } }, data: {} as any, join: jest.fn(), disconnect: jest.fn() }) as any;

describe('EventsGateway', () => {
  const repo = { exists: jest.fn(async () => false) };
  const gw = new EventsGateway({ findOrCreateUser: jest.fn() } as any, repo as any);

  it('disconnects sockets without a valid Cognito token', async () => {
    for (const s of [socket(), socket('not-a-jwt')]) {
      await gw.handleConnection(s);
      expect(s.disconnect).toHaveBeenCalled();
      expect(s.join).not.toHaveBeenCalled();
    }
  });

  it('refuses to join tournament rooms the user is not part of', async () => {
    const s = socket();
    expect(await gw.handleJoinTournament('t', s)).toEqual({ event: 'error', data: 'You are not part of this tournament.' });
    s.data.userId = 'u';
    expect((await gw.handleJoinTournament('t', s)).event).toBe('error');
    repo.exists.mockResolvedValueOnce(true);
    expect(await gw.handleJoinTournament('t', s)).toEqual({ event: 'joined_tournament', data: 't' });
    expect(s.join).toHaveBeenCalledWith('tournament_t');
  });
});
