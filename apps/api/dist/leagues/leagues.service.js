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
exports.LeaguesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const league_entity_1 = require("./entities/league.entity");
const league_participant_entity_1 = require("./entities/league-participant.entity");
const tournament_entity_1 = require("../tournaments/entities/tournament.entity");
const pairing_entity_1 = require("../tournaments/entities/pairing.entity");
const user_entity_1 = require("../users/entities/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/entities/notification.entity");
let LeaguesService = class LeaguesService {
    leaguesRepository;
    leagueParticipantsRepository;
    tournamentsRepository;
    pairingsRepository;
    notificationsService;
    constructor(leaguesRepository, leagueParticipantsRepository, tournamentsRepository, pairingsRepository, notificationsService) {
        this.leaguesRepository = leaguesRepository;
        this.leagueParticipantsRepository = leagueParticipantsRepository;
        this.tournamentsRepository = tournamentsRepository;
        this.pairingsRepository = pairingsRepository;
        this.notificationsService = notificationsService;
    }
    async create(createLeagueDto, user) {
        const league = this.leaguesRepository.create({
            ...createLeagueDto,
            created_by: user,
        });
        return this.leaguesRepository.save(league);
    }
    async findAll(userId) {
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
    async findOne(id) {
        const league = await this.leaguesRepository.findOne({
            where: { id },
            relations: ['created_by', 'tournaments'],
        });
        if (!league) {
            throw new common_1.NotFoundException(`League with ID ${id} not found`);
        }
        return league;
    }
    async update(id, updateLeagueDto) {
        const league = await this.findOne(id);
        Object.assign(league, updateLeagueDto);
        return this.leaguesRepository.save(league);
    }
    async remove(id) {
        await this.leaguesRepository.delete(id);
    }
    async addMember(leagueId, identifier) {
        const league = await this.findOne(leagueId);
        let user = null;
        const usersRepository = this.leagueParticipantsRepository.manager.getRepository(user_entity_1.User);
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
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const existing = await this.leagueParticipantsRepository.findOne({
            where: { league: { id: leagueId }, user: { id: user.id } }
        });
        if (existing)
            return existing;
        const participant = this.leagueParticipantsRepository.create({ league, user });
        const savedParticipant = await this.leagueParticipantsRepository.save(participant);
        await this.notificationsService.create(user.id, notification_entity_1.NotificationType.LEAGUE_ADD, 'Added to League', `You have been added to the league "${league.name}"`, league.id);
        return savedParticipant;
    }
    async removeMember(leagueId, userId) {
        const participant = await this.leagueParticipantsRepository.findOne({
            where: { league: { id: leagueId }, user: { id: userId } }
        });
        if (participant) {
            await this.leagueParticipantsRepository.remove(participant);
        }
    }
    async addPlayGroup(leagueId, groupId) {
        const league = await this.findOne(leagueId);
        const playGroupsRepository = this.leagueParticipantsRepository.manager.getRepository('PlayGroup');
        const group = await playGroupsRepository.findOne({ where: { id: groupId }, relations: ['members'] });
        if (!group)
            throw new common_1.NotFoundException('Play group not found');
        for (const member of group.members) {
            const exists = await this.leagueParticipantsRepository.findOne({
                where: { league: { id: leagueId }, user: { id: member.id } }
            });
            if (!exists) {
                await this.leagueParticipantsRepository.save({ league, user: member });
                await this.notificationsService.create(member.id, notification_entity_1.NotificationType.LEAGUE_ADD, 'Added to League', `You have been added to the league "${league.name}" via your playgroup`, league.id);
            }
        }
    }
    async updateStanding(leagueId, userId, updates) {
        let participant = await this.leagueParticipantsRepository.findOne({
            where: { league: { id: leagueId }, user: { id: userId } },
            relations: ['user', 'league']
        });
        if (!participant) {
            const league = await this.findOne(leagueId);
            const usersRepository = this.leagueParticipantsRepository.manager.getRepository(user_entity_1.User);
            const user = await usersRepository.findOne({ where: { id: userId } });
            if (!user)
                throw new common_1.NotFoundException('User not found');
            participant = this.leagueParticipantsRepository.create({ league, user });
        }
        if (updates.points !== undefined)
            participant.points = updates.points;
        if (updates.matches_played !== undefined)
            participant.matches_played = updates.matches_played;
        if (updates.matches_won !== undefined)
            participant.matches_won = updates.matches_won;
        if (updates.matches_drawn !== undefined)
            participant.matches_drawn = updates.matches_drawn;
        if (updates.matches_lost !== undefined)
            participant.matches_lost = updates.matches_lost;
        if (updates.omw_percentage !== undefined)
            participant.omw_percentage = updates.omw_percentage;
        return this.leagueParticipantsRepository.save(participant);
    }
    async getStandings(leagueId) {
        await this.updateStandings(leagueId);
        return this.leagueParticipantsRepository.find({
            where: { league: { id: leagueId } },
            relations: ['user'],
            order: { points: 'DESC', omw_percentage: 'DESC', matches_won: 'DESC' },
        });
    }
    async updateStandings(leagueId) {
        const league = await this.findOne(leagueId);
        const tournaments = await this.tournamentsRepository.find({
            where: { league: { id: leagueId } },
            relations: ['participants', 'participants.user'],
        });
        const userStats = new Map();
        for (const tournament of tournaments) {
            const pairings = await this.pairingsRepository.find({
                where: { tournament: { id: tournament.id } },
                relations: ['player1', 'player2'],
            });
            for (const pairing of pairings) {
                if (!pairing.result || pairing.result === 'pending')
                    continue;
                const p1 = pairing.player1;
                const p2 = pairing.player2;
                if (p1)
                    this.initUserStats(userStats, p1);
                if (p2)
                    this.initUserStats(userStats, p2);
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
                        if (stats1) {
                            stats1.points += 3;
                            stats1.matches_won++;
                        }
                        if (stats2) {
                            stats2.matches_lost++;
                        }
                    }
                    else if (pairing.result === 'p2_win') {
                        if (stats1) {
                            stats1.matches_lost++;
                        }
                        if (stats2) {
                            stats2.points += 3;
                            stats2.matches_won++;
                        }
                    }
                    else if (pairing.result === 'draw') {
                        if (stats1) {
                            stats1.points += 1;
                            stats1.matches_drawn++;
                        }
                        if (stats2) {
                            stats2.points += 1;
                            stats2.matches_drawn++;
                        }
                    }
                }
                else if (p1 && !p2 && pairing.result === 'p1_win') {
                    const stats1 = userStats.get(p1.id);
                    if (stats1) {
                        stats1.points += 3;
                        stats1.matches_won++;
                        stats1.matches_played++;
                    }
                }
            }
        }
        for (const stats of userStats.values()) {
            const maxPoints = stats.matches_played * 3;
            let mw = maxPoints > 0 ? stats.points / maxPoints : 0;
            if (mw < 0.33)
                mw = 0.33;
            stats.mw_percentage = mw;
        }
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
    initUserStats(map, user) {
        if (!map.has(user.id)) {
            map.set(user.id, {
                user,
                points: 0,
                matches_played: 0,
                matches_won: 0,
                matches_drawn: 0,
                matches_lost: 0,
                opponents: new Set(),
            });
        }
    }
};
exports.LeaguesService = LeaguesService;
exports.LeaguesService = LeaguesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(league_entity_1.League)),
    __param(1, (0, typeorm_1.InjectRepository)(league_participant_entity_1.LeagueParticipant)),
    __param(2, (0, typeorm_1.InjectRepository)(tournament_entity_1.Tournament)),
    __param(3, (0, typeorm_1.InjectRepository)(pairing_entity_1.Pairing)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], LeaguesService);
//# sourceMappingURL=leagues.service.js.map