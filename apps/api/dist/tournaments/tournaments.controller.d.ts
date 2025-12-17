import { TournamentsService } from './tournaments.service';
import { TournamentFormat } from './entities/tournament.entity';
export declare class TournamentsController {
    private readonly tournamentsService;
    constructor(tournamentsService: TournamentsService);
    create(createTournamentDto: {
        name: string;
        format: TournamentFormat;
        capacity?: number;
    }, req: any): Promise<import("./entities/tournament.entity").Tournament>;
    addGroup(id: string, body: {
        groupId: string;
    }): Promise<void>;
    findAll(req: any): Promise<import("./entities/tournament.entity").Tournament[]>;
    delete(id: string): Promise<void>;
    addParticipant(id: string, body: {
        userId?: string;
        username?: string;
    }): Promise<import("./entities/participant.entity").TournamentParticipant>;
    removeParticipant(id: string, userId: string): Promise<void>;
    leave(id: string, req: any): Promise<void>;
    findOne(id: string): Promise<import("./entities/tournament.entity").Tournament>;
    join(id: string, req: any): Promise<import("./entities/participant.entity").TournamentParticipant>;
    createPairing(id: string, body: {
        round: number;
        player1Id: string;
        player2Id: string;
    }): Promise<import("./entities/pairing.entity").Pairing>;
    getPairings(id: string): Promise<import("./entities/pairing.entity").Pairing[]>;
    generatePairings(id: string): Promise<import("./entities/pairing.entity").Pairing[]>;
    updatePairingResult(pairingId: string, body: {
        result: string;
    }): Promise<import("./entities/pairing.entity").Pairing>;
    startTimer(id: string, body: {
        durationMinutes?: number;
    }): Promise<import("./entities/tournament.entity").Tournament>;
    pauseTimer(id: string): Promise<import("./entities/tournament.entity").Tournament>;
    resetTimer(id: string): Promise<import("./entities/tournament.entity").Tournament>;
    exportTournament(id: string, format: "json" | "csv" | undefined, res: any): Promise<void>;
    createInvitation(id: string, body: {
        inviteeId: string;
    }): Promise<import("./entities/invitation.entity").Invitation>;
    getUserInvitations(req: any): Promise<import("./entities/invitation.entity").Invitation[]>;
    acceptInvitation(id: string, req: any): Promise<import("./entities/invitation.entity").Invitation>;
    declineInvitation(id: string, req: any): Promise<import("./entities/invitation.entity").Invitation>;
}
