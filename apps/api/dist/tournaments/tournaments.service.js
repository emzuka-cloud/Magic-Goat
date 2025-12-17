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
exports.TournamentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tournament_entity_1 = require("./entities/tournament.entity");
const participant_entity_1 = require("./entities/participant.entity");
const pairing_entity_1 = require("./entities/pairing.entity");
const invitation_entity_1 = require("./entities/invitation.entity");
const user_entity_1 = require("../users/entities/user.entity");
const events_gateway_1 = require("../events/events.gateway");
const playgroups_entity_1 = require("../playgroups/playgroups.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_entity_1 = require("../notifications/entities/notification.entity");
let TournamentsService = class TournamentsService {
    tournamentsRepository;
    participantsRepository;
    pairingsRepository;
    invitationsRepository;
    playGroupsRepository;
    usersRepository;
    eventsGateway;
    notificationsService;
    constructor(tournamentsRepository, participantsRepository, pairingsRepository, invitationsRepository, playGroupsRepository, usersRepository, eventsGateway, notificationsService) {
        this.tournamentsRepository = tournamentsRepository;
        this.participantsRepository = participantsRepository;
        this.pairingsRepository = pairingsRepository;
        this.invitationsRepository = invitationsRepository;
        this.playGroupsRepository = playGroupsRepository;
        this.usersRepository = usersRepository;
        this.eventsGateway = eventsGateway;
        this.notificationsService = notificationsService;
    }
    async addParticipant(tournamentId, identifier) {
        const tournament = await this.findOne(tournamentId);
        const count = await this.participantsRepository.count({ where: { tournament: { id: tournamentId } } });
        if (count >= (tournament.capacity || 8)) {
            throw new Error('Tournament is full');
        }
        let user = null;
        if (identifier.match(/^[0-9a-fA-F-]{36}$/)) {
            user = await this.usersRepository.findOne({ where: { id: identifier } });
        }
        if (!user && identifier.startsWith('U-')) {
            user = await this.usersRepository.findOne({ where: { custom_id: identifier } });
        }
        if (!user && identifier.includes('@')) {
            user = await this.usersRepository.findOne({ where: { email: identifier } });
        }
        if (!user) {
            user = await this.usersRepository.findOne({ where: { username: identifier } });
        }
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const existing = await this.participantsRepository.findOne({
            where: { tournament: { id: tournamentId }, user: { id: user.id } }
        });
        if (existing)
            return existing;
        const participant = this.participantsRepository.create({
            tournament,
            user,
        });
        const savedParticipant = await this.participantsRepository.save(participant);
        await this.notificationsService.create(user.id, notification_entity_1.NotificationType.TOURNAMENT_ADD, 'Added to Tournament', `You have been added to the tournament "${tournament.name}"`, tournament.id);
        return savedParticipant;
    }
    async removeParticipant(tournamentId, memberId) {
        const participant = await this.participantsRepository.findOne({
            where: { tournament: { id: tournamentId }, user: { id: memberId } }
        });
        if (participant) {
            await this.participantsRepository.remove(participant);
        }
    }
    async deleteTournament(id) {
        await this.tournamentsRepository.delete(id);
    }
    async create(createTournamentDto, user) {
        const tournament = this.tournamentsRepository.create({
            ...createTournamentDto,
            created_by: user,
            capacity: createTournamentDto.capacity || 8
        });
        await this.tournamentsRepository.insert(tournament);
        return tournament;
    }
    async findAll(userId) {
        return this.tournamentsRepository.find({
            where: [
                { created_by: { id: userId } },
                { participants: { user: { id: userId } } }
            ],
            relations: ['created_by'],
            order: { created_at: 'DESC' },
        });
    }
    async findOne(id) {
        const tournament = await this.tournamentsRepository.findOne({ where: { id }, relations: ['created_by', 'participants', 'participants.user'] });
        if (!tournament) {
            throw new common_1.NotFoundException(`Tournament with ID ${id} not found`);
        }
        return tournament;
    }
    async joinTournament(id, user) {
        const tournament = await this.findOne(id);
        const count = await this.participantsRepository.count({ where: { tournament: { id } } });
        if (count >= tournament.capacity) {
            throw new Error('Tournament is full');
        }
        const participant = this.participantsRepository.create({
            tournament,
            user,
        });
        return this.participantsRepository.save(participant);
    }
    async addGroup(tournamentId, groupId) {
        const tournament = await this.findOne(tournamentId);
        const group = await this.playGroupsRepository.findOne({ where: { id: groupId }, relations: ['members'] });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        const currentCount = await this.participantsRepository.count({ where: { tournament: { id: tournamentId } } });
        if (currentCount + group.members.length > tournament.capacity) {
            throw new Error('Not enough space in tournament for this group');
        }
        for (const member of group.members) {
            const exists = await this.participantsRepository.findOne({ where: { tournament: { id: tournamentId }, user: { id: member.id } } });
            if (!exists) {
                await this.participantsRepository.save({
                    tournament,
                    user: member
                });
                await this.notificationsService.create(member.id, notification_entity_1.NotificationType.TOURNAMENT_ADD, 'Added to Tournament', `You have been added to the tournament "${tournament.name}" via your playgroup`, tournament.id);
            }
        }
    }
    async createPairing(tournamentId, round, player1Id, player2Id) {
        const tournament = await this.findOne(tournamentId);
        const pairing = this.pairingsRepository.create({
            tournament,
            round,
            player1: { id: player1Id },
            player2: { id: player2Id },
        });
        await this.pairingsRepository.insert(pairing);
        this.eventsGateway.server.to(`tournament_${tournamentId}`).emit('pairing_created', pairing);
        return pairing;
    }
    async getPairings(tournamentId) {
        return this.pairingsRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['player1', 'player2'],
            order: { round: 'DESC' },
        });
    }
    async generateBracket(tournamentId) {
        const tournament = await this.findOne(tournamentId);
        const capacity = tournament.capacity || 8;
        const isCommander = tournament.format === tournament_entity_1.TournamentFormat.COMMANDER;
        const participants = await this.participantsRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['user'],
        });
        const minPlayers = isCommander ? 4 : 2;
        if (participants.length < minPlayers) {
            throw new Error('Not enough players to start');
        }
        const shuffled = participants.map(p => p.user).sort(() => Math.random() - 0.5);
        const totalRounds = Math.log2(capacity) - (isCommander ? 1 : 0);
        const pairingsToSave = [];
        const createdPairings = new Map();
        for (let r = totalRounds; r >= 1; r--) {
            createdPairings.set(r, new Map());
            const matchCount = Math.pow(2, totalRounds - r);
            for (let i = 0; i < matchCount; i++) {
                const pairing = this.pairingsRepository.create({
                    tournament,
                    round: r,
                    order: i,
                    result: pairing_entity_1.PairingResult.PENDING,
                });
                if (r < totalRounds) {
                    const nextRound = r + 1;
                    const nextOrder = Math.floor(i / 2);
                    const nextPairing = createdPairings.get(nextRound)?.get(nextOrder);
                    if (nextPairing) {
                        pairing.next_pairing = nextPairing;
                    }
                }
                createdPairings.get(r).set(i, pairing);
                pairingsToSave.push(pairing);
            }
        }
        const round1Pairings = createdPairings.get(1);
        if (round1Pairings) {
            for (let i = 0; i < round1Pairings.size; i++) {
                const pairing = round1Pairings.get(i);
                if (pairing) {
                    if (isCommander) {
                        const baseIdx = i * 4;
                        pairing.player1 = shuffled[baseIdx] || null;
                        pairing.player2 = shuffled[baseIdx + 1] || null;
                        pairing.player3 = shuffled[baseIdx + 2] || null;
                        pairing.player4 = shuffled[baseIdx + 3] || null;
                    }
                    else {
                        pairing.player1 = shuffled[2 * i] || null;
                        pairing.player2 = shuffled[2 * i + 1] || null;
                        if (pairing.player1 && !pairing.player2) {
                            pairing.result = pairing_entity_1.PairingResult.P1_WIN;
                        }
                        else if (!pairing.player1 && pairing.player2) {
                            pairing.result = pairing_entity_1.PairingResult.P2_WIN;
                        }
                    }
                }
            }
        }
        const finalPairings = [];
        for (let r = totalRounds; r >= 1; r--) {
            const matches = Array.from(createdPairings.get(r).values());
            await this.pairingsRepository.save(matches);
            finalPairings.push(...matches);
        }
        tournament.status = tournament_entity_1.TournamentStatus.ACTIVE;
        await this.tournamentsRepository.save(tournament);
        for (const p of finalPairings) {
            this.eventsGateway.server.to(`tournament_${tournamentId}`).emit('pairing_created', p);
        }
        return finalPairings;
    }
    async generatePairings(tournamentId) {
        const tournament = await this.findOne(tournamentId);
        if (tournament.capacity || tournament.format === tournament_entity_1.TournamentFormat.SINGLE_ELIMINATION) {
            return this.generateBracket(tournamentId);
        }
        const participants = await this.participantsRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['user'],
            order: { score: 'DESC' },
        });
        if (participants.length < 2) {
            throw new Error('Not enough players to generate pairings');
        }
        const existingPairings = await this.pairingsRepository.find({
            where: { tournament: { id: tournamentId } },
            order: { round: 'DESC' },
            take: 1,
        });
        const nextRound = (existingPairings[0]?.round || 0) + 1;
        const newPairings = [];
        const pairedPlayerIds = new Set();
        for (let i = 0; i < participants.length; i++) {
            if (pairedPlayerIds.has(participants[i].user.id))
                continue;
            const player1 = participants[i];
            let player2 = null;
            for (let j = i + 1; j < participants.length; j++) {
                if (!pairedPlayerIds.has(participants[j].user.id)) {
                    player2 = participants[j];
                    break;
                }
            }
            if (player2) {
                const pairing = this.pairingsRepository.create({
                    tournament,
                    round: nextRound,
                    player1: player1.user,
                    player2: player2.user,
                });
                newPairings.push(pairing);
                pairedPlayerIds.add(player1.user.id);
                pairedPlayerIds.add(player2.user.id);
            }
            else {
                const pairing = this.pairingsRepository.create({
                    tournament,
                    round: nextRound,
                    player1: player1.user,
                    player2: null,
                    result: 'p1_win',
                });
                newPairings.push(pairing);
                pairedPlayerIds.add(player1.user.id);
            }
        }
        await this.pairingsRepository.save(newPairings);
        for (const pairing of newPairings) {
            this.eventsGateway.server.to(`tournament_${tournamentId}`).emit('pairing_created', pairing);
        }
        return newPairings;
    }
    async updatePairingResult(pairingId, result) {
        const pairing = await this.pairingsRepository.findOne({
            where: { id: pairingId },
            relations: ['tournament', 'next_pairing', 'player1', 'player2', 'player3', 'player4']
        });
        if (!pairing) {
            throw new common_1.NotFoundException(`Pairing with ID ${pairingId} not found`);
        }
        pairing.result = result;
        await this.pairingsRepository.save(pairing);
        if (pairing.next_pairing) {
            const isCommander = pairing.tournament.format === tournament_entity_1.TournamentFormat.COMMANDER;
            if (isCommander) {
                const winners = [];
                if (result.includes('p1') && pairing.player1)
                    winners.push(pairing.player1);
                if (result.includes('p2') && pairing.player2)
                    winners.push(pairing.player2);
                if (result.includes('p3') && pairing.player3)
                    winners.push(pairing.player3);
                if (result.includes('p4') && pairing.player4)
                    winners.push(pairing.player4);
                if (winners.length === 2) {
                    const isEvenOrder = pairing.order % 2 === 0;
                    if (isEvenOrder) {
                        pairing.next_pairing.player1 = winners[0];
                        pairing.next_pairing.player2 = winners[1];
                    }
                    else {
                        pairing.next_pairing.player3 = winners[0];
                        pairing.next_pairing.player4 = winners[1];
                    }
                    await this.pairingsRepository.save(pairing.next_pairing);
                    this.eventsGateway.server.to(`tournament_${pairing.tournament.id}`).emit('pairing_updated', pairing.next_pairing);
                }
            }
            else if (result === 'p1_win' || result === 'p2_win') {
                const winner = result === 'p1_win' ? pairing.player1 : pairing.player2;
                const isPlayer1Slot = pairing.order % 2 === 0;
                if (isPlayer1Slot) {
                    pairing.next_pairing.player1 = winner;
                }
                else {
                    pairing.next_pairing.player2 = winner;
                }
                await this.pairingsRepository.save(pairing.next_pairing);
                this.eventsGateway.server.to(`tournament_${pairing.tournament.id}`).emit('pairing_updated', pairing.next_pairing);
            }
        }
        this.eventsGateway.server.to(`tournament_${pairing.tournament.id}`).emit('result_updated', pairing);
        return pairing;
    }
    async startTimer(tournamentId, durationMinutes) {
        const tournament = await this.findOne(tournamentId);
        tournament.round_start_time = new Date();
        tournament.timer_paused = false;
        if (durationMinutes) {
            tournament.round_duration_minutes = durationMinutes;
        }
        await this.tournamentsRepository.save(tournament);
        this.eventsGateway.server.to(`tournament_${tournamentId}`).emit('timer_updated', {
            round_start_time: tournament.round_start_time,
            round_duration_minutes: tournament.round_duration_minutes,
            timer_paused: tournament.timer_paused,
        });
        return tournament;
    }
    async pauseTimer(tournamentId) {
        const tournament = await this.findOne(tournamentId);
        tournament.timer_paused = !tournament.timer_paused;
        await this.tournamentsRepository.save(tournament);
        this.eventsGateway.server.to(`tournament_${tournamentId}`).emit('timer_updated', {
            round_start_time: tournament.round_start_time,
            round_duration_minutes: tournament.round_duration_minutes,
            timer_paused: tournament.timer_paused,
        });
        return tournament;
    }
    async resetTimer(tournamentId) {
        const tournament = await this.findOne(tournamentId);
        tournament.round_start_time = null;
        tournament.timer_paused = false;
        tournament.round_duration_minutes = 50;
        await this.tournamentsRepository.save(tournament);
        this.eventsGateway.server.to(`tournament_${tournamentId}`).emit('timer_updated', {
            round_start_time: tournament.round_start_time,
            round_duration_minutes: tournament.round_duration_minutes,
            timer_paused: tournament.timer_paused,
        });
        return tournament;
    }
    async exportTournament(tournamentId, format) {
        const tournament = await this.findOne(tournamentId);
        const pairings = await this.getPairings(tournamentId);
        const participants = await this.participantsRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['user'],
        });
        const exportData = {
            tournament: {
                id: tournament.id,
                name: tournament.name,
                format: tournament.format,
                status: tournament.status,
                created_at: tournament.created_at,
            },
            participants: participants.map(p => ({
                username: p.user.username,
                score: p.score,
            })),
            pairings: pairings.map(p => ({
                round: p.round,
                player1: p.player1?.username || 'BYE',
                player2: p.player2?.username || 'BYE',
                result: p.result,
            })),
        };
        if (format === 'json') {
            return {
                data: JSON.stringify(exportData, null, 2),
                contentType: 'application/json',
                filename: `${tournament.name.replace(/\s+/g, '_')}_export.json`,
            };
        }
        else {
            const csvLines = ['Round,Player 1,Player 2,Result'];
            for (const pairing of exportData.pairings) {
                csvLines.push(`${pairing.round},${pairing.player1},${pairing.player2},${pairing.result}`);
            }
            return {
                data: csvLines.join('\n'),
                contentType: 'text/csv',
                filename: `${tournament.name.replace(/\s+/g, '_')}_export.csv`,
            };
        }
    }
    async createInvitation(tournamentId, inviteeId) {
        const tournament = await this.findOne(tournamentId);
        const invitee = { id: inviteeId };
        const invitation = this.invitationsRepository.create({
            tournament,
            invitee,
        });
        await this.invitationsRepository.save(invitation);
        this.eventsGateway.server.to(`user_${inviteeId}`).emit('invitation_created', {
            id: invitation.id,
            tournament: {
                id: tournament.id,
                name: tournament.name,
            },
        });
        return invitation;
    }
    async getUserInvitations(userId) {
        return this.invitationsRepository.find({
            where: {
                invitee: { id: userId },
                status: invitation_entity_1.InvitationStatus.PENDING,
            },
            relations: ['tournament'],
        });
    }
    async acceptInvitation(invitationId, user) {
        const invitation = await this.invitationsRepository.findOne({
            where: { id: invitationId },
            relations: ['tournament', 'invitee'],
        });
        if (!invitation) {
            throw new common_1.NotFoundException(`Invitation with ID ${invitationId} not found`);
        }
        if (invitation.invitee.id !== user.id) {
            throw new Error('Unauthorized');
        }
        invitation.status = invitation_entity_1.InvitationStatus.ACCEPTED;
        await this.invitationsRepository.save(invitation);
        await this.joinTournament(invitation.tournament.id, user);
        this.eventsGateway.server.to(`tournament_${invitation.tournament.id}`).emit('invitation_accepted', {
            invitationId: invitation.id,
            userId: user.id,
        });
        return invitation;
    }
    async declineInvitation(invitationId, user) {
        const invitation = await this.invitationsRepository.findOne({
            where: { id: invitationId },
            relations: ['invitee'],
        });
        if (!invitation) {
            throw new common_1.NotFoundException(`Invitation with ID ${invitationId} not found`);
        }
        if (invitation.invitee.id !== user.id) {
            throw new Error('Unauthorized');
        }
        invitation.status = invitation_entity_1.InvitationStatus.DECLINED;
        await this.invitationsRepository.save(invitation);
        return invitation;
    }
};
exports.TournamentsService = TournamentsService;
exports.TournamentsService = TournamentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tournament_entity_1.Tournament)),
    __param(1, (0, typeorm_1.InjectRepository)(participant_entity_1.TournamentParticipant)),
    __param(2, (0, typeorm_1.InjectRepository)(pairing_entity_1.Pairing)),
    __param(3, (0, typeorm_1.InjectRepository)(invitation_entity_1.Invitation)),
    __param(4, (0, typeorm_1.InjectRepository)(playgroups_entity_1.PlayGroup)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        events_gateway_1.EventsGateway,
        notifications_service_1.NotificationsService])
], TournamentsService);
//# sourceMappingURL=tournaments.service.js.map