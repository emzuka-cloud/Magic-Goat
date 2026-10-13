import { JoinRequestsService } from './join-requests.service';
import { JoinRequestStatus } from './join-request.entity';

function service(rows: any[] = []) {
  const repo = {
    findOne: jest.fn(async ({ where }) => rows.find((r) =>
      (!where.id || r.id === where.id) && (!where.status || r.status === where.status) && (!where.user || r.user.id === where.user.id)) ?? null),
    create: jest.fn((r) => ({ id: 'new', status: JoinRequestStatus.PENDING, ...r })),
    save: jest.fn(async (r) => r),
  };
  return { svc: new JoinRequestsService(repo as any), repo };
}
const target = { tournament: { id: 't' } };

describe('JoinRequestsService', () => {
  it('does not create a second pending request for the same person', async () => {
    const { svc, repo } = service([{ id: 'r1', status: JoinRequestStatus.PENDING, user: { id: 'u' } }]);
    const { request, created } = await svc.request(target, { id: 'u' } as any);
    expect([request.id, created]).toEqual(['r1', false]);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('keeps the request pending when approving fails (e.g. tournament full)', async () => {
    const req = { id: 'r1', status: JoinRequestStatus.PENDING, user: { id: 'u' } };
    const { svc } = service([req]);
    await expect(svc.decide('r1', target, true, async () => { throw new Error('This tournament is full.'); })).rejects.toThrow('full');
    expect(req.status).toBe(JoinRequestStatus.PENDING);
    await expect(svc.decide('r1', target, true, async () => undefined)).resolves.toMatchObject({ status: JoinRequestStatus.APPROVED });
  });

  it('refuses to answer a request twice', async () => {
    const { svc } = service([{ id: 'r1', status: JoinRequestStatus.DECLINED, user: { id: 'u' } }]);
    await expect(svc.decide('r1', target, true, async () => undefined)).rejects.toThrow('already answered');
  });
});
