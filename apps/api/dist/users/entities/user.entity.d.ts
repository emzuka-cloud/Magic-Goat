import { Notification } from '../../notifications/entities/notification.entity';
export declare class User {
    id: string;
    email: string;
    username: string;
    custom_id: string;
    password_hash: string;
    created_at: Date;
    updated_at: Date;
    notifications: Notification[];
}
