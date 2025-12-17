"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayGroupsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const playgroups_entity_1 = require("./playgroups.entity");
const user_entity_1 = require("../users/entities/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/entities/notification.entity");
let PlayGroupsService = class PlayGroupsService {
    playGroupsRepository;
    usersRepository;
    notificationsService;
    constructor(playGroupsRepository, usersRepository, notificationsService) {
        this.playGroupsRepository = playGroupsRepository;
        this.usersRepository = usersRepository;
        this.notificationsService = notificationsService;
    }
    async create(createPlayGroupDto) {
        const { name, description, ownerId, ownerUsername, ownerEmail } = createPlayGroupDto;
        let owner = null;
        try {
            if (ownerId && ownerId.length > 10) {
                owner = await this.usersRepository.findOneBy({ id: ownerId });
            }
            if (!owner && ownerUsername) {
                owner = await this.usersRepository.findOneBy({ username: ownerUsername });
            }
            if (!owner && ownerEmail) {
                owner = await this.usersRepository.findOneBy({ email: ownerEmail });
            }
            if (!owner && ownerUsername && ownerEmail) {
                console.log(`Creating new user for playgroup owner: ${ownerUsername}`);
                owner = this.usersRepository.create({
                    username: ownerUsername,
                    email: ownerEmail,
                });
                owner = await this.usersRepository.save(owner);
            }
            if (!owner) {
                console.error('Owner not found and creation failed');
                throw new common_1.NotFoundException('Owner not found and could not be created');
            }
            const playGroup = this.playGroupsRepository.create({
                name,
                description,
                owner,
                ownerId: owner.id,
                members: [owner],
            });
            return await this.playGroupsRepository.save(playGroup);
        }
        catch (error) {
            console.error('Error creating playgroup:', error);
            throw error;
        }
    }
    async findAllForUser(identifier) {
        let user = null;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        if (isUUID) {
            user = await this.usersRepository.findOneBy({ id: identifier });
        }
        else {
            user = await this.usersRepository.findOneBy({ username: identifier });
        }
        if (!user) {
            return [];
        }
        return this.playGroupsRepository.find({
            where: [
                { owner: { id: user.id } },
                { members: { id: user.id } }
            ],
            relations: ['members', 'owner'],
        });
    }
    async findOne(id) {
        const playGroup = await this.playGroupsRepository.findOne({
            where: { id },
            relations: ['members', 'owner'],
        });
        if (!playGroup) {
            throw new common_1.NotFoundException(`PlayGroup with ID ${id} not found`);
        }
        return playGroup;
    }
    async addMember(groupId, identifier) {
        const group = await this.findOne(groupId);
        let user = null;
        if (identifier.startsWith('U-')) {
            user = await this.usersRepository.findOne({
                where: [
                    { custom_id: identifier },
                    { username: identifier }
                ]
            });
        }
        else if (identifier.includes('@')) {
            user = await this.usersRepository.findOne({ where: { email: identifier } });
        }
        else {
            user = await this.usersRepository.findOne({ where: { username: identifier } });
        }
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isMember = group.members.some(member => member.id === user.id);
        if (!isMember) {
            group.members.push(user);
            const savedGroup = await this.playGroupsRepository.save(group);
            await this.notificationsService.create(user.id, notification_entity_1.NotificationType.PLAYGROUP_ADD, 'Added to Play Group', `You have been added to the play group "${group.name}"`, group.id);
            return savedGroup;
        }
        return group;
    }
    async removeMember(groupId, memberId) {
        console.log('🔍 [removeMember] Called with groupId:', groupId, 'memberId:', memberId);
        const group = await this.playGroupsRepository.findOne({
            where: { id: groupId },
            relations: ['members'],
        });
        if (!group) {
            console.log('❌ [removeMember] Play Group not found');
            throw new common_1.NotFoundException('Play Group not found');
        }
        console.log('🔍 [removeMember] Group found, current members:', group.members.map(m => ({ id: m.id, username: m.username })));
        group.members = group.members.filter(m => m.id !== memberId);
        console.log('✅ [removeMember] After filter, remaining members:', group.members.map(m => ({ id: m.id, username: m.username })));
        const saved = await this.playGroupsRepository.save(group);
        console.log('✅ [removeMember] Group saved');
        return saved;
    }
    async remove(id) {
        await this.playGroupsRepository.delete(id);
    }
};
exports.PlayGroupsService = PlayGroupsService;
exports.PlayGroupsService = PlayGroupsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(playgroups_entity_1.PlayGroup)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], PlayGroupsService);
//# sourceMappingURL=playgroups.service.js.map