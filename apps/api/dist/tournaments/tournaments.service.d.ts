import { Repository } from 'typeorm';
import { Tournament, TournamentFormat } from './entities/tournament.entity';
import { TournamentParticipant } from './entities/participant.entity';
import { Pairing } from './entities/pairing.entity';
import { Invitation } from './entities/invitation.entity';
import { User } from '../users/entities/user.entity';
import { EventsGateway } from '../events/events.gateway';
import { PlayGroup } from '../playgroups/playgroups.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class TournamentsService {
    private tournamentsRepository;
    private participantsRepository;
    private pairingsRepository;
    private invitationsRepository;
    private playGroupsRepository;
    private usersRepository;
    private eventsGateway;
    private notificationsService;
    constructor(tournamentsRepository: Repository<Tournament>, participantsRepository: Repository<TournamentParticipant>, pairingsRepository: Repository<Pairing>, invitationsRepository: Repository<Invitation>, playGroupsRepository: Repository<PlayGroup>, usersRepository: Repository<User>, eventsGateway: EventsGateway, notificationsService: NotificationsService);
    addParticipant(tournamentId: string, identifier: string): Promise<TournamentParticipant>;
    removeParticipant(tournamentId: string, memberId: string): Promise<void>;
    deleteTournament(id: string): Promise<void>;
    create(createTournamentDto: {
        name: string;
        format: TournamentFormat;
        capacity?: number;
    }, user: User): Promise<Tournament>;
    findAll(userId: string): Promise<Tournament[]>;
    findOne(id: string): Promise<Tournament>;
    joinTournament(id: string, user: User): Promise<TournamentParticipant>;
    addGroup(tournamentId: string, groupId: string): Promise<void>;
    createPairing(tournamentId: string, round: number, player1Id: string, player2Id: string): Promise<Pairing>;
    getPairings(tournamentId: string): Promise<Pairing[]>;
    generateBracket(tournamentId: string): Promise<Pairing[]>;
    generatePairings(tournamentId: string): Promise<Pairing[]>;
    updatePairingResult(pairingId: string, result: string): Promise<Pairing>;
    startTimer(tournamentId: string, durationMinutes?: number): Promise<Tournament>;
    pauseTimer(tournamentId: string): Promise<Tournament>;
    resetTimer(tournamentId: string): Promise<Tournament>;
    exportTournament(tournamentId: string, format: 'json' | 'csv'): Promise<{
        data: string;
        contentType: string;
        filename: string;
    }>;
    createInvitation(tournamentId: string, inviteeId: string): Promise<Invitation>;
    getUserInvitations(userId: string): Promise<Invitation[]>;
    acceptInvitation(invitationId: string, user: User): Promise<Invitation>;
    declineInvitation(invitationId: string, user: User): Promise<Invitation>;
}
