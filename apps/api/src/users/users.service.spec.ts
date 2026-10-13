import { UsersService, likePrefix } from './users.service';
import { User } from './entities/user.entity';

function serviceWith(rows: Partial<User>[]) {
  const repo = {
    findOne: jest.fn(async ({ where }) =>
      rows.find((r) => Object.entries(where).every(([k, v]) => (r as any)[k] === v)) ?? null),
    create: jest.fn((u) => u),
    save: jest.fn(async (u) => u),
  };
  return new UsersService(repo as any);
}

const admin = { id: 'admin-id', username: 'admin', email: 'admin@example.com' };

describe('UsersService.findOrCreateUser', () => {
  it('does not hand an existing account to a new Cognito user with the same username', async () => {
    const user = await serviceWith([admin]).findOrCreateUser({
      sub: '11111111-aaaa', 'cognito:username': 'admin', email: 'attacker@evil.test', email_verified: true,
    });
    expect(user.id).toBe('11111111-aaaa');
    expect(user.username).toBe('admin-11111111');
  });

  it('rejects an unverified email that is already taken with a 409', async () => {
    await expect(serviceWith([admin]).findOrCreateUser({ sub: 'x', email: 'admin@example.com', email_verified: false }))
      .rejects.toMatchObject({ status: 409 });
  });

  it('links by verified email', async () => {
    const user = await serviceWith([admin]).findOrCreateUser({ sub: 'x', email: 'admin@example.com', email_verified: true });
    expect(user.id).toBe('admin-id');
  });

  it('returns the user matching sub', async () => {
    const user = await serviceWith([admin]).findOrCreateUser({ sub: 'admin-id' });
    expect(user).toBe(admin);
  });
});

describe('UsersService custom_id collisions', () => {
  const dup = (column: string) => Object.assign(new Error('dup'), { driverError: { code: '23505', detail: `Key (${column})=(x) already exists.` } });

  it('re-rolls custom_id when the unique index rejects it', async () => {
    const repo = { findOne: jest.fn(async () => null), create: jest.fn((u) => u), save: jest.fn() };
    repo.save.mockRejectedValueOnce(dup('custom_id')).mockImplementationOnce(async (u) => u);
    const user = await new UsersService(repo as any).findOrCreateUser({ sub: 'new', 'cognito:username': 'bob' });
    expect(user.id).toBe('new');
    expect(repo.save).toHaveBeenCalledTimes(2);
  });

  it('does not retry other unique violations', async () => {
    const repo = { findOne: jest.fn(async () => null), create: jest.fn((u) => u), save: jest.fn(async () => { throw dup('username'); }) };
    await expect(new UsersService(repo as any).findOrCreateUser({ sub: 'new', 'cognito:username': 'bob' })).rejects.toThrow('dup');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});

describe('user search', () => {
  it('matches a username prefix literally (LIKE wildcards escaped)', () => {
    expect(likePrefix('pla')).toBe('pla%');
    // input: 50%_a\b   ->   50\%\_a\\b%
    expect(likePrefix('50%_a\\b')).toBe('50\\%\\_a\\\\b%');
  });
});
