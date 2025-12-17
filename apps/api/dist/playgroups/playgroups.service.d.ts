import { Repository } from 'typeorm';
import { PlayGroup } from './playgroups.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class PlayGroupsService {
    private playGroupsRepository;
    private usersRepository;
    private notificationsService;
    constructor(playGroupsRepository: Repository<PlayGroup>, usersRepository: Repository<User>, notificationsService: NotificationsService);
    create(createPlayGroupDto: {
        name: string;
        description?: string;
        ownerId?: string;
        ownerUsername?: string;
        ownerEmail?: string;
    }): Promise<PlayGroup>;
    findAllForUser(identifier: string): Promise<PlayGroup[]>;
    findOne(id: string): Promise<PlayGroup>;
    addMember(groupId: string, identifier: string): Promise<PlayGroup>;
    removeMember(groupId: string, memberId: string): Promise<PlayGroup>;
    remove(id: string): Promise<void>;
}
