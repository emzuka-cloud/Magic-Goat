import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament, TournamentFormat, TournamentStatus } from './entities/tournament.entity';
import { TournamentParticipant } from './entities/participant.entity';
import { Pairing, PairingResult } from './entities/pairing.entity';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { User } from '../users/entities/user.entity';
import { EventsGateway } from '../events/events.gateway';
import { PlayGroup } from '../playgroups/playgroups.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';


/** Quote a CSV field, and stop spreadsheets from running user text (e.g. a username "=HYPERLINK(...)") as a formula. */
export function csvCell(value: unknown): string {
    let s = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
}

@Injectable()
export class TournamentsService {
    constructor(
        @InjectRepository(Tournament)
        private tournamentsRepository: Repository<Tournament>,
        @InjectRepository(TournamentParticipant)
        private participantsRepository: Repository<TournamentParticipant>,
        @InjectRepository(Pairing)
        private pairingsRepository: Repository<Pairing>,
        @InjectRepository(Invitation)
        private invitationsRepository: Repository<Invitation>,
        @InjectRepository(PlayGroup)
        private playGroupsRepository: Repository<PlayGroup>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private eventsGateway: EventsGateway,
        private notificationsService: NotificationsService,
    ) { }

    async assertOwner(tournamentId: string, userId: string): Promise<void> {
        const tournament = await this.tournamentsRepository.findOne({ where: { id: tournamentId }, relations: ['created_by'] });
        if (!tournament) throw new NotFoundException(`Tournament with ID ${tournamentId} not found`);
        if (tournament.created_by?.id !== userId) throw new ForbiddenException('Only the tournament owner can do this.');
    }

    /** Owner or participant; returns the tournament so callers don't load it twice. */
    async assertCanView(tournamentId: string, userId: string): Promise<Tournament> {
        const tournament = await this.findOne(tournamentId);
        const isMember = tournament.participants?.some((p) => p.user?.id === userId);
        if (tournament.created_by?.id !== userId && !isMember) {
            throw new ForbiddenException('You are not part of this tournament.');
        }
        return tournament;
    }

    async addParticipant(tournamentId: string, identifier: string): Promise<TournamentParticipant> {
        const tournament = await this.findOne(tournamentId);

        // Check capacity
        const count = await this.participantsRepository.count({ where: { tournament: { id: tournamentId } } });
        if (count >= (tournament.capacity || 8)) {
            throw new BadRequestException('This tournament is full.');
        }

        let user: User | null = null;
        // Try finding by ID first
        if (identifier.match(/^[0-9a-fA-F-]{36}$/)) {
            user = await this.usersRepository.findOne({ where: { id: identifier } });
        }

        // Try custom_id
        if (!user && identifier.startsWith('U-')) {
            user = await this.usersRepository.findOne({ where: { custom_id: identifier } });
        }

        // Try email
        if (!user && identifier.includes('@')) {
            user = await this.usersRepository.findOne({ where: { email: identifier } });
        }

        // Try username
        if (!user) {
            user = await this.usersRepository.findOne({ where: { username: identifier } });
        }

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check existing
        const existing = await this.participantsRepository.findOne({
            where: { tournament: { id: tournamentId }, user: { id: user.id } }
        });
        if (existing) return existing;

        const participant = this.participantsRepository.create({
            tournament,
            user,
        });
        const savedParticipant = await this.participantsRepository.save(participant);

        // Notify participant
        await this.notificationsService.create(
            user.id,
            NotificationType.TOURNAMENT_ADD,
            'Added to Tournament',
            `You have been added to the tournament "${tournament.name}"`,
            tournament.id,
            tournament.created_by?.id, // only the owner can add people
        );

        return savedParticipant;
    }

    async removeParticipant(tournamentId: string, memberId: string): Promise<void> {
        // memberId is likely USER ID based on requirement, or Participant ID?
        // Let's assume User ID to align with "Delete individual participants".
        // But the list usually has Participants. 
        // I'll support User ID for consistency.

        const participant = await this.participantsRepository.findOne({
            where: { tournament: { id: tournamentId }, user: { id: memberId } }
        });

        if (participant) {
            await this.participantsRepository.remove(participant);
        }
    }

    async deleteTournament(id: string): Promise<void> {
        // Cascade should handle details, but let's be safe.
        // Actually, if cascade is not set up, I need to delete relations.
        // Pairings, Participants, Invitations.
        // Let's rely on standard delete and see if specific deletion is needed. 
        // Given TypeORM default, might fail if foreign keys exist and cascade not set.
        // I'll try simple delete first.
        await this.tournamentsRepository.delete(id);
    }

    async create(createTournamentDto: { name: string; format: TournamentFormat; capacity?: number }, user: User): Promise<Tournament> {
        const tournament = this.tournamentsRepository.create({
            ...createTournamentDto,
            created_by: user,
            // If capacity is passed, use it, otherwise format might need mapping or default
            capacity: createTournamentDto.capacity || 8
        });
        await this.tournamentsRepository.insert(tournament);
        return tournament;
    }

    async findAll(userId: string): Promise<Tournament[]> {
        return this.tournamentsRepository.find({
            where: [
                { created_by: { id: userId } },
                { participants: { user: { id: userId } } }
            ],
            relations: ['created_by'],
            order: { created_at: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Tournament> {
        const tournament = await this.tournamentsRepository.findOne({ where: { id }, relations: ['created_by', 'participants', 'participants.user'] });
        if (!tournament) {
            throw new NotFoundException(`Tournament with ID ${id} not found`);
        }
        return tournament;
    }

    async joinTournament(id: string, user: User): Promise<TournamentParticipant> {
        const tournament = await this.findOne(id);
        // Check capacity
        const count = await this.participantsRepository.count({ where: { tournament: { id } } });
        if (count >= tournament.capacity) {
            throw new BadRequestException('This tournament is full.');
        }

        const participant = this.participantsRepository.create({
            tournament,
            user,
        });
        return this.participantsRepository.save(participant);
    }

    async addGroup(tournamentId: string, groupId: string): Promise<void> {
        const tournament = await this.findOne(tournamentId);
        const group = await this.playGroupsRepository.findOne({ where: { id: groupId }, relations: ['members'] });

        if (!group) throw new NotFoundException('Group not found');

        const currentCount = await this.participantsRepository.count({ where: { tournament: { id: tournamentId } } });
        if (currentCount + group.members.length > tournament.capacity) {
            throw new BadRequestException('Not enough space in this tournament for the whole group.');
        }

        for (const member of group.members) {
            // Check if already in
            const exists = await this.participantsRepository.findOne({ where: { tournament: { id: tournamentId }, user: { id: member.id } } });
            if (!exists) {
                await this.participantsRepository.save({
                    tournament,
                    user: member
                });

                // Notify member
                await this.notificationsService.create(
                    member.id,
                    NotificationType.TOURNAMENT_ADD,
                    'Added to Tournament',
                    `You have been added to the tournament "${tournament.name}" via your playgroup`,
                    tournament.id,
                    tournament.created_by?.id,
                );
            }
        }
    }

    async createPairing(tournamentId: string, round: number, player1Id: string, player2Id: string): Promise<Pairing> {
        const tournament = await this.findOne(tournamentId);
        const pairing = this.pairingsRepository.create({
            tournament,
            round,
            player1: { id: player1Id } as User,
            player2: { id: player2Id } as User,
        });
        await this.pairingsRepository.insert(pairing);

        this.eventsGateway.server.to(`tournament_${tournamentId}`).emit('pairing_created', pairing);

        return pairing;
    }

    async getPairings(tournamentId: string): Promise<Pairing[]> {
        return this.pairingsRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['player1', 'player2'],
            order: { round: 'DESC' },
        });
    }

    /**
     * Single-elimination: auto-win matches whose opponent slot can never be filled (a BYE, or a
     * feeder match with nobody in it) and move every decided winner into the next round.
     */
    // ponytail: reloads the whole bracket on each call; fine for the 8/16/32-player sizes offered.
    private async resolveByes(tournamentId: string, format: TournamentFormat): Promise<void> {
        if (format === TournamentFormat.COMMANDER) return; // ponytail: 4-player pods advance 2 players; not handled here
        const pairings = await this.pairingsRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['player1', 'player2'],
            order: { round: 'ASC', order: 'ASC' },
        });
        const at = (round: number, order: number) => pairings.find(p => p.round === round && p.order === order);
        const slotEmptyForever = (p: Pairing, slot: 0 | 1): boolean => {
            if (slot === 0 ? p.player1 : p.player2) return false;
            if (p.round === 1) return true;
            const feeder = at(p.round - 1, p.order * 2 + slot);
            return !feeder || (slotEmptyForever(feeder, 0) && slotEmptyForever(feeder, 1));
        };

        const changed = new Set<Pairing>();
        for (const p of pairings) {
            if (p.result === PairingResult.PENDING) {
                if (p.player1 && !p.player2 && slotEmptyForever(p, 1)) p.result = PairingResult.P1_WIN;
                else if (p.player2 && !p.player1 && slotEmptyForever(p, 0)) p.result = PairingResult.P2_WIN;
                if (p.result !== PairingResult.PENDING) changed.add(p);
            }
            const winner = p.result === PairingResult.P1_WIN ? p.player1 : p.result === PairingResult.P2_WIN ? p.player2 : null;
            const next = at(p.round + 1, Math.floor(p.order / 2));
            const slot = p.order % 2 === 0 ? 'player1' : 'player2';
            if (winner && next && next[slot]?.id !== winner.id) {
                next[slot] = winner;
                changed.add(next);
            }
        }
        if (changed.size) await this.pairingsRepository.save([...changed]);

        // The tournament is complete once the final (the only match with no next round) has a winner.
        const final = pairings[pairings.length - 1];
        if (final) {
            const done = final.result === PairingResult.P1_WIN || final.result === PairingResult.P2_WIN;
            await this.tournamentsRepository.update(tournamentId, { status: done ? TournamentStatus.COMPLETED : TournamentStatus.ACTIVE });
        }
    }

    async generateBracket(tournamentId: string): Promise<Pairing[]> {
        const tournament = await this.findOne(tournamentId);
        const capacity = tournament.capacity || 8;
        const isCommander = tournament.format === TournamentFormat.COMMANDER;

        // 1. Validate participants
        const participants = await this.participantsRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['user'],
        });

        // For MVP, simplistic check. Ideally fill with Byes.
        const minPlayers = isCommander ? 4 : 2;
        if (participants.length < minPlayers) {
            throw new BadRequestException('Not enough players to start this tournament.');
        }

        // 2. Shuffle Players
        const shuffled = participants.map(p => p.user).sort(() => Math.random() - 0.5);

        // 3. Create Bracket Tree
        const totalRounds = Math.log2(capacity) - (isCommander ? 1 : 0);
        const pairingsToSave: Pairing[] = [];

        // We need to store created pairings to link them.
        // Map<Round, Map<Order, Pairing>>
        const createdPairings = new Map<number, Map<number, Pairing>>();

        // Iterate from Last Round (Final) down to Round 1
        for (let r = totalRounds; r >= 1; r--) {
            createdPairings.set(r, new Map());
            const matchCount = Math.pow(2, totalRounds - r); // Round 3 (Final): 2^(3-3)=1. Round 1: 2^(3-1)=4.

            for (let i = 0; i < matchCount; i++) {
                const pairing = this.pairingsRepository.create({
                    tournament,
                    round: r,
                    order: i,
                    result: PairingResult.PENDING,
                });

                // Link to Next Round
                if (r < totalRounds) {
                    const nextRound = r + 1;
                    const nextOrder = Math.floor(i / 2);
                    const nextPairing = createdPairings.get(nextRound)?.get(nextOrder);
                    if (nextPairing) {
                        pairing.next_pairing = nextPairing;
                    }
                }

                createdPairings.get(r)!.set(i, pairing);
                pairingsToSave.push(pairing);
            }
        }

        // 4. Fill Round 1 with Users
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
                    } else {
                        // Player 1: index 2*i
                        // Player 2: index 2*i + 1
                        pairing.player1 = shuffled[2 * i] || null;
                        pairing.player2 = shuffled[2 * i + 1] || null;

                        // Auto-win if BYE
                        if (pairing.player1 && !pairing.player2) {
                            pairing.result = PairingResult.P1_WIN;
                        } else if (!pairing.player1 && pairing.player2) {
                            pairing.result = PairingResult.P2_WIN;
                        }
                    }
                }
            }
        }

        // 5. Save All (Cascade should handle relations if setup, but safe to save in order next time or save all)
        // Since we have circular/self relations, might need 2 passes or save parent first.
        // Parent is Next Pairing. So save Round 3, then Round 2, then Round 1.
        // Our 'pairingsToSave' list is effectively in that order (Outer loop r descending).
        // Round 3 (Final) created first.
        // Round 2 (Semis) created next, uses reference to Round 3 obj.
        // So saving in order should work if TypeORM handles in-memory references correctly before DB ID generation?
        // Actually, TypeORM needs the 'next_pairing' to have an ID if it's a foreign key.
        // So we MUST save Round N+1 before Round N.
        // Loop r from totalRounds down to 1. 
        // Logic above did create them in that order. 
        // BUT if we want to save them to DB, we should probably save them as we create them or save the map values.

        const finalPairings: Pairing[] = [];
        // Save round by round from Top (Final) to Bottom (Round 1) to ensure FKs exist
        for (let r = totalRounds; r >= 1; r--) {
            const matches = Array.from(createdPairings.get(r)!.values());
            await this.pairingsRepository.save(matches);
            finalPairings.push(...matches);
        }

        // Update Tournament Status
        tournament.status = TournamentStatus.ACTIVE as any; // Cast if enum mismatch
        await this.tournamentsRepository.save(tournament);

        await this.resolveByes(tournamentId, tournament.format);

        // Emit
        for (const p of finalPairings) {
            this.eventsGateway.server.to(`tournament_${tournamentId}`).emit('pairing_created', p);
        }

        return finalPairings;
    }

    async generatePairings(tournamentId: string): Promise<Pairing[]> {
        // Keep existing Swiss logic or redirect to generateBracket if single elimination
        // For now, I'll just keep this as backup or for 'swiss' format tournaments
        const tournament = await this.findOne(tournamentId);

        if (tournament.capacity || tournament.format === TournamentFormat.SINGLE_ELIMINATION) {
            return this.generateBracket(tournamentId);
        }

        const participants = await this.participantsRepository.find({
            where: { tournament: { id: tournamentId } },
            relations: ['user'],
            order: { score: 'DESC' },
        });

        if (participants.length < 2) {
            throw new BadRequestException('At least 2 players are needed to generate pairings.');
        }

        const existingPairings = await this.pairingsRepository.find({
            where: { tournament: { id: tournamentId } },
            order: { round: 'DESC' },
            take: 1,
        });
        const nextRound = (existingPairings[0]?.round || 0) + 1;

        const newPairings: Pairing[] = [];
        const pairedPlayerIds = new Set<string>();

        for (let i = 0; i < participants.length; i++) {
            if (pairedPlayerIds.has(participants[i].user.id)) continue;

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
            } else {
                const pairing = this.pairingsRepository.create({
                    tournament,
                    round: nextRound,
                    player1: player1.user,
                    player2: null,
                    result: 'p1_win',
                } as unknown as Pairing);
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

    async updatePairingResult(tournamentId: string, pairingId: string, result: string): Promise<Pairing> {
        const pairing = await this.pairingsRepository.findOne({
            where: { id: pairingId, tournament: { id: tournamentId } },
            relations: ['tournament', 'next_pairing', 'player1', 'player2', 'player3', 'player4']
        });

        if (!pairing) {
            throw new NotFoundException('This match was not found in this tournament.');
        }

        if (pairing.tournament.format !== TournamentFormat.COMMANDER) {
            if (result !== PairingResult.P1_WIN && result !== PairingResult.P2_WIN) {
                throw new BadRequestException('A match result must be a win for player 1 or player 2.');
            }
            if (!(result === PairingResult.P1_WIN ? pairing.player1 : pairing.player2)) {
                throw new BadRequestException('There is no player in that slot to win this match.');
            }
        }

        pairing.result = result as any;
        await this.pairingsRepository.save(pairing);

        // Advance Winner
        if (pairing.next_pairing) {
            const isCommander = pairing.tournament.format === TournamentFormat.COMMANDER;

            if (isCommander) {
                const winners: User[] = [];
                if (result.includes('p1') && pairing.player1) winners.push(pairing.player1);
                if (result.includes('p2') && pairing.player2) winners.push(pairing.player2);
                if (result.includes('p3') && pairing.player3) winners.push(pairing.player3);
                if (result.includes('p4') && pairing.player4) winners.push(pairing.player4);

                if (winners.length === 2) {
                    const isEvenOrder = pairing.order % 2 === 0;
                    if (isEvenOrder) {
                        pairing.next_pairing.player1 = winners[0];
                        pairing.next_pairing.player2 = winners[1];
                    } else {
                        pairing.next_pairing.player3 = winners[0];
                        pairing.next_pairing.player4 = winners[1];
                    }
                    await this.pairingsRepository.save(pairing.next_pairing);
                    this.eventsGateway.server.to(`tournament_${pairing.tournament.id}`).emit('pairing_updated', pairing.next_pairing);
                }
            } else if (result === 'p1_win' || result === 'p2_win') {
                const winner = result === 'p1_win' ? pairing.player1 : pairing.player2;
                const isPlayer1Slot = pairing.order % 2 === 0;

                if (isPlayer1Slot) {
                    pairing.next_pairing.player1 = winner;
                } else {
                    pairing.next_pairing.player2 = winner;
                }

                await this.pairingsRepository.save(pairing.next_pairing);
                this.eventsGateway.server.to(`tournament_${pairing.tournament.id}`).emit('pairing_updated', pairing.next_pairing);
            }
        }

        await this.resolveByes(pairing.tournament.id, pairing.tournament.format);
        this.eventsGateway.server.to(`tournament_${pairing.tournament.id}`).emit('result_updated', pairing);

        return pairing;
    }

    async startTimer(tournamentId: string, durationMinutes?: number): Promise<Tournament> {
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

    async pauseTimer(tournamentId: string): Promise<Tournament> {
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

    async resetTimer(tournamentId: string): Promise<Tournament> {
        const tournament = await this.findOne(tournamentId);

        tournament.round_start_time = null as any;
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

    async exportTournament(tournamentId: string, format: 'json' | 'csv'): Promise<{ data: string; contentType: string; filename: string }> {
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

        // Goes into a Content-Disposition header: keep it to safe ASCII so a name can't break or inject headers.
        const baseName = tournament.name.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 80) || 'tournament';
        if (format === 'json') {
            return {
                data: JSON.stringify(exportData, null, 2),
                contentType: 'application/json',
                filename: `${baseName}_export.json`,
            };
        } else {
            // CSV format: one row per pairing
            const csvLines = ['Round,Player 1,Player 2,Result'];
            for (const pairing of exportData.pairings) {
                csvLines.push([pairing.round, pairing.player1, pairing.player2, pairing.result].map(csvCell).join(','));
            }
            return {
                data: csvLines.join('\n'),
                contentType: 'text/csv',
                filename: `${baseName}_export.csv`,
            };
        }
    }

    async createInvitation(tournamentId: string, inviteeId: string): Promise<Invitation> {
        const tournament = await this.findOne(tournamentId);
        const invitee = { id: inviteeId } as User;

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

    async getUserInvitations(userId: string): Promise<Invitation[]> {
        return this.invitationsRepository.find({
            where: {
                invitee: { id: userId },
                status: InvitationStatus.PENDING,
            },
            relations: ['tournament'],
        });
    }

    async acceptInvitation(invitationId: string, user: User): Promise<Invitation> {
        const invitation = await this.invitationsRepository.findOne({
            where: { id: invitationId },
            relations: ['tournament', 'invitee'],
        });

        if (!invitation) {
            throw new NotFoundException(`Invitation with ID ${invitationId} not found`);
        }

        if (invitation.invitee.id !== user.id) {
            throw new ForbiddenException('This invitation was sent to another user.');
        }

        invitation.status = InvitationStatus.ACCEPTED;
        await this.invitationsRepository.save(invitation);

        // Auto-join tournament
        await this.joinTournament(invitation.tournament.id, user);

        this.eventsGateway.server.to(`tournament_${invitation.tournament.id}`).emit('invitation_accepted', {
            invitationId: invitation.id,
            userId: user.id,
        });

        return invitation;
    }

    async declineInvitation(invitationId: string, user: User): Promise<Invitation> {
        const invitation = await this.invitationsRepository.findOne({
            where: { id: invitationId },
            relations: ['invitee'],
        });

        if (!invitation) {
            throw new NotFoundException(`Invitation with ID ${invitationId} not found`);
        }

        if (invitation.invitee.id !== user.id) {
            throw new ForbiddenException('This invitation was sent to another user.');
        }

        invitation.status = InvitationStatus.DECLINED;
        await this.invitationsRepository.save(invitation);

        return invitation;
    }
}
