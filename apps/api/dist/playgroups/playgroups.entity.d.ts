import { User } from '../users/entities/user.entity';
export declare class PlayGroup {
    id: string;
    name: string;
    description: string;
    owner: User;
    ownerId: string;
    members: User[];
    created_at: Date;
    updated_at: Date;
}
