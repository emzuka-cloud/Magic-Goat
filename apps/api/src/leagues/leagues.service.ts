import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLeagueDto, UpdateLeagueDto, UpdateStandingDto } from './dto';
import { League } from './entities/league.entity';
import { LeagueParticipant } from './entities/league-participant.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Pairing } from '../tournaments/entities/pairing.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class LeaguesService {
    constructor(
        @InjectRepository(League)
        private leaguesRepository: Repository<League>,
        @InjectRepository(LeagueParticipant)
        private leagueParticipantsRepository: Repository<LeagueParticipant>,
        @InjectRepository(Tournament)
        private tournamentsRepository: Repository<Tournament>,
        @InjectRepository(Pairing)
        private pairingsRepository: Repository<Pairing>,
        private notificationsService: NotificationsService,
    ) { }

    private assertValidDates(dates: (Date | string | undefined | null)[]) {
        if (dates.some(d => d != null && isNaN(new Date(d).getTime()))) {
            throw new BadRequestException('Dates must be valid, in YYYY-MM-DD format.');
        }
    }

    async create(createLeagueDto: CreateLeagueDto, user: User): Promise<League> {
        if (!createLeagueDto.name?.trim() || !createLeagueDto.start_date) {
            throw new BadRequestException('A league needs a name and a start date.');
        }
        this.assertValidDates([createLeagueDto.start_date, createLeagueDto.end_date]);
        const league = this.leaguesRepository.create({
            ...createLeagueDto,
            created_by: user,
        });
        return this.leaguesRepository.save(league);
    }

    async findAll(userId: string): Promise<League[]> {
        return this.leaguesRepository
            .createQueryBuilder('league')
            .leftJoinAndSelect('league.created_by', 'creator')
            .leftJoinAndSelect('league.tournaments', 'tournaments')
            .leftJoin('league.participants', 'participants')
            .where('league.created_by = :userId', { userId })
            .orWhere('participants.user = :userId', { userId })
            .orderBy('league.created_at', 'DESC')
            .getMany();
    }

    async findOne(id: string): Promise<League> {
        const league = await this.leaguesRepository.findOne({
            where: { id },
            relations: ['created_by', 'tournaments'],
        });
        if (!league) {
            throw new NotFoundException(`League with ID ${id} not found`);
        }
        return league;
    }

    async assertOwner(leagueId: string, userId: string): Promise<void> {
        const league = await this.findOne(leagueId);
        if (league.created_by?.id !== userId) throw new ForbiddenException('Only the league owner can do this.');
    }

    /** Owner or participant; returns the league so callers don't load it twice. */
    async assertCanView(leagueId: string, userId: string): Promise<League> {
        const league = await this.findOne(leagueId);
        if (league.created_by?.id === userId) return league;
        const isMember = await this.leagueParticipantsRepository.exists({
            where: { league: { id: leagueId }, user: { id: userId } },
        });
        if (!isMember) throw new ForbiddenException('You are not part of this league.');
        return league;
    }

    async update(id: string, updateLeagueDto: UpdateLeagueDto): Promise<League> {
        const league = await this.findOne(id);
        // Whitelist editable fields; never let the body overwrite id/created_by/relations.
        const { name, description, start_date, end_date } = updateLeagueDto;
        this.assertValidDates([start_date, end_date]);
        Object.assign(league, Object.fromEntries(
            Object.entries({ name, description, start_date, end_date }).filter(([, v]) => v !== undefined),
        ));
        return this.leaguesRepository.save(league);
    }

    async remove(id: string): Promise<void> {
        await this.leaguesRepository.delete(id);
    }

    async addMember(leagueId: string, identifier: string): Promise<LeagueParticipant> {
        const league = await this.findOne(leagueId);

        // Find user by various methods (similar to tournaments)
        let user = null;
        const usersRepository = this.leagueParticipantsRepository.manager.getRepository(User);

        if (identifier.match(/^[0-9a-fA-F-]{36}$/)) {
            user = await usersRepository.findOne({ where: { id: identifier } });
        }
        if (!user && identifier.startsWith('U-')) {
            user = await usersRepository.findOne({ where: { custom_id: identifier } });
        }
        if (!user && identifier.includes('@')) {
            user = await usersRepository.findOne({ where: { email: identifier } });
        }
        if (!user) {
            user = await usersRepository.findOne({ where: { username: identifier } });
        }

        if (!user) throw new NotFoundException('User not found');

        const existing = await this.leagueParticipantsRepository.findOne({
            where: { league: { id: leagueId }, user: { id: user.id } }
        });
        if (existing) return existing;

        const participant = this.leagueParticipantsRepository.create({ league, user });
        const savedParticipant = await this.leagueParticipantsRepository.save(participant);

        // Notify user
        await this.notificationsService.create(
            user.id,
            NotificationType.LEAGUE_ADD,
            'Added to League',
            `You have been added to the league "${league.name}"`,
            league.id,
        );

        return savedParticipant;
    }

    async removeMember(leagueId: string, userId: string): Promise<void> {
        const participant = await this.leagueParticipantsRepository.findOne({
            where: { league: { id: leagueId }, user: { id: userId } }
        });
        if (participant) {
            await this.leagueParticipantsRepository.remove(participant);
        }
    }

    async addPlayGroup(leagueId: string, groupId: string): Promise<void> {
        const league = await this.findOne(leagueId);
        const playGroupsRepository = this.leagueParticipantsRepository.manager.getRepository('PlayGroup');
        const group = await playGroupsRepository.findOne({ where: { id: groupId }, relations: ['members'] });

        if (!group) throw new NotFoundException('Play group not found');

        for (const member of group.members) {
            const exists = await this.leagueParticipantsRepository.findOne({
                where: { league: { id: leagueId }, user: { id: member.id } }
            });
            if (!exists) {
                await this.leagueParticipantsRepository.save({ league, user: member });

                // Notify member
                await this.notificationsService.create(
                    member.id,
                    NotificationType.LEAGUE_ADD,
                    'Added to League',
                    `You have been added to the league "${league.name}" via your playgroup`,
                    league.id,
                );
            }
        }
    }

    async updateStanding(leagueId: string, userId: string, updates: UpdateStandingDto): Promise<LeagueParticipant> {
        let participant = await this.leagueParticipantsRepository.findOne({
            where: { league: { id: leagueId }, user: { id: userId } },
            relations: ['user', 'league']
        });

        if (!participant) {
            const league = await this.findOne(leagueId);
            const usersRepository = this.leagueParticipantsRepository.manager.getRepository(User);
            const user = await usersRepository.findOne({ where: { id: userId } });
            if (!user) throw new NotFoundException('User not found');

            participant = this.leagueParticipantsRepository.create({ league, user });
        }

        // Update fields
        if (updates.points !== undefined) participant.points = updates.points;
        if (updates.matches_played !== undefined) participant.matches_played = updates.matches_played;
        if (updates.matches_won !== undefined) participant.matches_won = updates.matches_won;
        if (updates.matches_drawn !== undefined) participant.matches_drawn = updates.matches_drawn;
        if (updates.matches_lost !== undefined) participant.matches_lost = updates.matches_lost;
        if (updates.omw_percentage !== undefined) participant.omw_percentage = updates.omw_percentage;

        return this.leagueParticipantsRepository.save(participant);
    }

    async getStandings(leagueId: string): Promise<LeagueParticipant[]> {
        // ponytail: recalculates (DB writes) on every read; members-only now, move to result-write time if load matters.
        await this.updateStandings(leagueId);

        return this.leagueParticipantsRepository.find({
            where: { league: { id: leagueId } },
            relations: ['user'],
            order: { points: 'DESC', omw_percentage: 'DESC', matches_won: 'DESC' },
        });
    }

    async updateStandings(leagueId: string): Promise<void> {
        const league = await this.findOne(leagueId);
        const tournaments = await this.tournamentsRepository.find({
            where: { league: { id: leagueId } },
            relations: ['participants', 'participants.user'],
        });

        const userStats = new Map<string, {
            user: User;
            points: number;
            matches_played: number;
            matches_won: number;
            matches_drawn: number;
            matches_lost: number;
            opponents: Set<string>;
            mw_percentage?: number;
        }>();

        for (const tournament of tournaments) {
            const pairings = await this.pairingsRepository.find({
                where: { tournament: { id: tournament.id } },
                relations: ['player1', 'player2'],
            });

            for (const pairing of pairings) {
                if (!pairing.result || pairing.result === 'pending') continue;

                const p1 = pairing.player1;
                const p2 = pairing.player2;

                if (p1) this.initUserStats(userStats, p1);
                if (p2) this.initUserStats(userStats, p2);

                if (p1 && p2) {
                    const stats1 = userStats.get(p1.id);
                    const stats2 = userStats.get(p2.id);

                    if (stats1) {
                        stats1.matches_played++;
                        stats1.opponents.add(p2.id);
                    }
                    if (stats2) {
                        stats2.matches_played++;
                        stats2.opponents.add(p1.id);
                    }

                    if (pairing.result === 'p1_win') {
                        if (stats1) { stats1.points += 3; stats1.matches_won++; }
                        if (stats2) { stats2.matches_lost++; }
                    } else if (pairing.result === 'p2_win') {
                        if (stats1) { stats1.matches_lost++; }
                        if (stats2) { stats2.points += 3; stats2.matches_won++; }
                    } else if (pairing.result === 'draw') {
                        if (stats1) { stats1.points += 1; stats1.matches_drawn++; }
                        if (stats2) { stats2.points += 1; stats2.matches_drawn++; }
                    }
                } else if (p1 && !p2 && pairing.result === 'p1_win') {
                    // Bye
                    const stats1 = userStats.get(p1.id);
                    if (stats1) { stats1.points += 3; stats1.matches_won++; stats1.matches_played++; }
                }
            }
        }

        // Calculate Match Win % (MW%) for everyone
        for (const stats of userStats.values()) {
            const maxPoints = stats.matches_played * 3;
            let mw = maxPoints > 0 ? stats.points / maxPoints : 0;
            if (mw < 0.33) mw = 0.33; // Minimum 0.33 rule
            stats.mw_percentage = mw;
        }

        // Calculate OMW% and save
        for (const [userId, stats] of userStats) {
            let omwSum = 0;
            let opponentCount = 0;

            stats.opponents.forEach(oppId => {
                const oppStats = userStats.get(oppId);
                if (oppStats && oppStats.mw_percentage) {
                    omwSum += oppStats.mw_percentage;
                    opponentCount++;
                }
            });

            const omw_percentage = opponentCount > 0 ? omwSum / opponentCount : 0.33;

            let participant = await this.leagueParticipantsRepository.findOne({
                where: { league: { id: leagueId }, user: { id: userId } },
            });

            if (!participant) {
                participant = this.leagueParticipantsRepository.create({
                    league,
                    user: stats.user,
                });
            }

            participant.points = stats.points;
            participant.matches_played = stats.matches_played;
            participant.matches_won = stats.matches_won;
            participant.matches_drawn = stats.matches_drawn;
            participant.matches_lost = stats.matches_lost;
            participant.omw_percentage = omw_percentage;

            await this.leagueParticipantsRepository.save(participant);
        }
    }

    private initUserStats(map: Map<string, any>, user: User) {
        if (!map.has(user.id)) {
            map.set(user.id, {
                user,
                points: 0,
                matches_played: 0,
                matches_won: 0,
                matches_drawn: 0,
                matches_lost: 0,
                opponents: new Set<string>(),
            });
        }
    }
}
