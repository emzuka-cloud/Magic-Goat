import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayGroup } from './playgroups.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';


@Injectable()
export class PlayGroupsService {
    constructor(
        @InjectRepository(PlayGroup)
        private playGroupsRepository: Repository<PlayGroup>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private notificationsService: NotificationsService,
    ) { }

    async create(createPlayGroupDto: { name: string; description?: string; ownerId?: string; ownerUsername?: string; ownerEmail?: string }): Promise<PlayGroup> {
        const { name, description, ownerId, ownerUsername, ownerEmail } = createPlayGroupDto;

        let owner: User | null = null;

        try {
            // Try finding by ID first if provided
            if (ownerId && ownerId.length > 10) {
                owner = await this.usersRepository.findOneBy({ id: ownerId });
            }

            // If not found, try username
            if (!owner && ownerUsername) {
                owner = await this.usersRepository.findOneBy({ username: ownerUsername });
            }

            // If not found, try email
            if (!owner && ownerEmail) {
                owner = await this.usersRepository.findOneBy({ email: ownerEmail });
            }

            // If still not found, and we have email/username, create the user!
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
                throw new NotFoundException('Owner not found and could not be created');
            }

            const playGroup = this.playGroupsRepository.create({
                name,
                description,
                owner,
                ownerId: owner.id,
                members: [owner],
            });

            return await this.playGroupsRepository.save(playGroup);
        } catch (error) {
            console.error('Error creating playgroup:', error);
            throw error;
        }
    }

    async findAllForUser(identifier: string): Promise<PlayGroup[]> {
        let user: User | null = null;

        // Simple UUID check (length 36 and correct format usually, but length 36 is good proxy for MVP)
        // Or check if valid UUID string. catch error if invalid input for UUID column.
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

        if (isUUID) {
            user = await this.usersRepository.findOneBy({ id: identifier });
        } else {
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

    async findOne(id: string): Promise<PlayGroup> {
        const playGroup = await this.playGroupsRepository.findOne({
            where: { id },
            relations: ['members', 'owner'],
        });

        if (!playGroup) {
            throw new NotFoundException(`PlayGroup with ID ${id} not found`);
        }

        return playGroup;
    }

    async addMember(groupId: string, identifier: string): Promise<PlayGroup> {
        const group = await this.findOne(groupId);

        // Find user by username or ID (using raw query or multiple find options if needed, but here simple checks)
        // Check if identifier is a UUID (UserID) or Username
        let user: User | null = null;

        if (identifier.startsWith('U-')) {
            user = await this.usersRepository.findOne({
                where: [
                    { custom_id: identifier },
                    { username: identifier } // Fallback just in case
                ]
            });
        } else if (identifier.includes('@')) {
            user = await this.usersRepository.findOne({ where: { email: identifier } });
        } else {
            user = await this.usersRepository.findOne({ where: { username: identifier } });
        }

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if already member
        const isMember = group.members.some(member => member.id === user!.id);
        if (!isMember) {
            group.members.push(user);
            const savedGroup = await this.playGroupsRepository.save(group);

            // Notify the user
            await this.notificationsService.create(
                user.id,
                NotificationType.PLAYGROUP_ADD,
                'Added to Play Group',
                `You have been added to the play group "${group.name}"`,
                group.id,
            );

            return savedGroup;
        }

        return group;
    }
    async removeMember(groupId: string, memberId: string): Promise<PlayGroup> {
        console.log('🔍 [removeMember] Called with groupId:', groupId, 'memberId:', memberId);

        const group = await this.playGroupsRepository.findOne({
            where: { id: groupId },
            relations: ['members'],
        });

        if (!group) {
            console.log('❌ [removeMember] Play Group not found');
            throw new NotFoundException('Play Group not found');
        }

        console.log('🔍 [removeMember] Group found, current members:', group.members.map(m => ({ id: m.id, username: m.username })));

        group.members = group.members.filter(m => m.id !== memberId);

        console.log('✅ [removeMember] After filter, remaining members:', group.members.map(m => ({ id: m.id, username: m.username })));

        const saved = await this.playGroupsRepository.save(group);
        console.log('✅ [removeMember] Group saved');

        return saved;
    }

    async remove(id: string): Promise<void> {
        await this.playGroupsRepository.delete(id);
    }
}
