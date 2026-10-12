import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationsRepository: Repository<Notification>,
    ) { }

    async create(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        relatedEntityId?: string,
    ): Promise<Notification> {
        const notification = this.notificationsRepository.create({
            userId,
            type,
            title,
            message,
            relatedEntityId,
        });

        return this.notificationsRepository.save(notification);
    }

    async findAllForUser(userId: string): Promise<Notification[]> {
        return this.notificationsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.notificationsRepository.count({
            where: { userId, isRead: false },
        });
    }

    async markAsRead(id: string, userId: string): Promise<Notification> {
        const notification = await this.notificationsRepository.findOne({ where: { id, userId } });
        if (notification) {
            notification.isRead = true;
            return this.notificationsRepository.save(notification);
        }
        return null!;
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationsRepository.update({ userId, isRead: false }, { isRead: true });
    }

    async remove(id: string, userId: string): Promise<void> {
        await this.notificationsRepository.delete({ id, userId });
    }
}
