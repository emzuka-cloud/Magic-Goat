import { PlayGroupsService } from './playgroups.service';
export declare class PlayGroupsController {
    private readonly playGroupsService;
    constructor(playGroupsService: PlayGroupsService);
    create(createDto: {
        name: string;
        description?: string;
        ownerId?: string;
        ownerUsername?: string;
        ownerEmail?: string;
    }): Promise<import("./playgroups.entity").PlayGroup>;
    findAll(userId: string): Promise<import("./playgroups.entity").PlayGroup[]>;
    findOne(id: string): Promise<import("./playgroups.entity").PlayGroup>;
    addMember(id: string, body: {
        identifier: string;
    }): Promise<import("./playgroups.entity").PlayGroup>;
    removeMember(id: string, memberId: string): Promise<import("./playgroups.entity").PlayGroup>;
    leave(id: string, req: any): Promise<import("./playgroups.entity").PlayGroup>;
    remove(id: string): Promise<void>;
}
