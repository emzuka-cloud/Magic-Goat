import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';

describe('NotificationsService.create', () => {
  const repo = { create: jest.fn((n) => n), save: jest.fn(async (n) => n) };
  const svc = new NotificationsService(repo as any);

  it('skips notifying the person who did the action', async () => {
    await expect(svc.create('owner', NotificationType.TOURNAMENT_ADD, 't', 'm', 'id', 'owner')).resolves.toBeNull();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('notifies everyone else', async () => {
    await expect(svc.create('alice', NotificationType.TOURNAMENT_ADD, 't', 'm', 'id', 'owner')).resolves.toMatchObject({ userId: 'alice' });
  });
});
