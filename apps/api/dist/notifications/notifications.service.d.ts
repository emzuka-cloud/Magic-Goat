import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
export declare class NotificationsService {
    private notificationsRepository;
    constructor(notificationsRepository: Repository<Notification>);
    create(userId: string, type: NotificationType, title: string, message: string, relatedEntityId?: string): Promise<Notification>;
    findAllForUser(userId: string): Promise<Notification[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(id: string): Promise<Notification>;
    markAllAsRead(userId: string): Promise<void>;
    remove(id: string): Promise<void>;
}
