import { User } from '../../users/entities/user.entity';
export declare enum NotificationType {
    PLAYGROUP_ADD = "PLAYGROUP_ADD",
    TOURNAMENT_ADD = "TOURNAMENT_ADD",
    LEAGUE_ADD = "LEAGUE_ADD"
}
export declare class Notification {
    id: string;
    userId: string;
    user: User;
    type: NotificationType;
    title: string;
    message: string;
    relatedEntityId: string;
    isRead: boolean;
    createdAt: Date;
}
