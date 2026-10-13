import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLeagueDto, UpdateLeagueDto, UpdateStandingDto } from './dto';
import { League } from './entities/league.entity';
import { ADJUSTABLE_STATS, AdjustableStat, LeagueParticipant } from './entities/league-participant.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Pairing } from '../tournaments/entities/pairing.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { JoinRequestsService } from '../join-requests/join-requests.service';
import { NotificationType } from '../notifications/entities/notification.entity';

type Results = Record<AdjustableStat, number>;
const EMPTY_RESULTS: Results = { points: 0, matches_played: 0, matches_won: 0, matches_drawn: 0, matches_lost: 0 };

/** Stored total = what results give + the owner's adjustment. */
export function applyResults(p: LeagueParticipant, results: Results, omw: number) {
    for (const stat of ADJUSTABLE_STATS) p[stat] = results[stat] + (p[`adj_${stat}`] ?? 0);
    p.omw_percentage = omw;
}

/** Owner typed new totals: keep them by storing their difference from the results. Expects current totals. */
export function setTotals(p: LeagueParticipant, totals: Partial<Results>) {
    for (const stat of ADJUSTABLE_STATS) {
        const wanted = totals[stat];
        if (wanted === undefined) continue;
        const fromResults = p[stat] - (p[`adj_${stat}`] ?? 0);
        p[`adj_${stat}`] = wanted - fromResults;
        p[stat] = wanted;
    }
}

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
        private joinRequests: JoinRequestsService,
    ) { }

    /** Anyone with the league's code can ask to join; the owner approves or declines. */
    async requestToJoin(leagueId: string, user: User) {
        const league = await this.findOne(leagueId);
        const isMember = league.created_by?.id === user.id || await this.leagueParticipantsRepository.exists({
            where: { league: { id: leagueId }, user: { id: user.id } },
        });
        if (isMember) throw new BadRequestException('You are already in this league.');
        const { request, created } = await this.joinRequests.request({ league: { id: leagueId } }, user);
        if (created && league.created_by) {
            await this.notificationsService.create(
                league.created_by.id,
                NotificationType.LEAGUE_JOIN_REQUEST,
                'Join request',
                `${user.username} asked to join "${league.name}"`,
                league.id,
            );
        }
        return { id: request.id, status: request.status, league: { id: league.id, name: league.name } };
    }

    async pendingJoinRequests(leagueId: string) {
        const requests = await this.joinRequests.pending({ league: { id: leagueId } });
        return requests.map((r) => ({ id: r.id, created_at: r.created_at, user: { id: r.user.id, username: r.user.username } }));
    }

    async answerJoinRequest(leagueId: string, requestId: string, approve: boolean) {
        const league = await this.findOne(leagueId);
        const request = await this.joinRequests.decide(requestId, { league: { id: leagueId } }, approve, async (r) => {
            if (approve) await this.addMember(leagueId, r.user.id); // tells them they're in
        });
        if (!approve) {
            await this.notificationsService.create(
                request.user.id,
                NotificationType.JOIN_DECLINED,
                'Join request declined',
                `Your request to join "${league.name}" was declined.`,
                league.id,
            );
        }
        return { id: request.id, status: request.status };
    }

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
            league.created_by?.id, // only the owner can add people
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
                    league.created_by?.id,
                );
            }
        }
    }

    /**
     * The owner sets the totals they want to show; we store the difference from the results as an
     * adjustment, so later results still count and the correction is kept.
     */
    async updateStanding(leagueId: string, userId: string, updates: UpdateStandingDto): Promise<LeagueParticipant> {
        await this.updateStandings(leagueId); // stored totals must be current before we diff against them
        const participant = await this.findParticipant(leagueId, userId);
        setTotals(participant, updates);
        return this.leagueParticipantsRepository.save(participant);
    }

    /** Drop the owner's corrections for this player; standings go back to what results give. */
    async clearAdjustments(leagueId: string, userId: string): Promise<LeagueParticipant> {
        const participant = await this.findParticipant(leagueId, userId);
        for (const stat of ADJUSTABLE_STATS) participant[`adj_${stat}`] = 0;
        await this.leagueParticipantsRepository.save(participant);
        await this.updateStandings(leagueId);
        return this.findParticipant(leagueId, userId);
    }

    private async findParticipant(leagueId: string, userId: string): Promise<LeagueParticipant> {
        const participant = await this.leagueParticipantsRepository.findOne({
            where: { league: { id: leagueId }, user: { id: userId } },
            relations: ['user'],
        });
        if (!participant) throw new NotFoundException('This player is not in the league.');
        return participant;
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
                } else if (p1 && !p2 && pairing.result === 'p1_win' && pairing.round === 1) {
                    // A first-round bye counts as a win (MTG convention). Later rounds with an empty slot are
                    // walkovers through empty bracket branches, not matches, so they don't score.
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

        // Every row is rewritten (members without results go back to 0 + their adjustment), and
        // anyone who played a league tournament without being a member gets a row.
        const participants = await this.leagueParticipantsRepository.find({
            where: { league: { id: leagueId } },
            relations: ['user'],
        });
        const byUser = new Map(participants.map((p) => [p.user.id, p]));
        for (const [userId, stats] of userStats) {
            if (!byUser.has(userId)) byUser.set(userId, this.leagueParticipantsRepository.create({ league, user: stats.user }));
        }

        for (const [userId, participant] of byUser) {
            const stats = userStats.get(userId);
            let omw_percentage = 0;
            if (stats) {
                const opponentMw = [...stats.opponents].map((id) => userStats.get(id)?.mw_percentage).filter((mw): mw is number => !!mw);
                omw_percentage = opponentMw.length ? opponentMw.reduce((a, b) => a + b, 0) / opponentMw.length : 0.33;
            }
            applyResults(participant, stats ?? EMPTY_RESULTS, omw_percentage);
        }

        await this.leagueParticipantsRepository.save([...byUser.values()]);
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
