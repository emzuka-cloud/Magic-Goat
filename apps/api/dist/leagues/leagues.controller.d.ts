import { LeaguesService } from './leagues.service';
export declare class LeaguesController {
    private readonly leaguesService;
    constructor(leaguesService: LeaguesService);
    create(createLeagueDto: {
        name: string;
        description?: string;
        start_date: Date;
        end_date?: Date;
    }, req: any): Promise<import("./entities/league.entity").League>;
    findAll(req: any): Promise<import("./entities/league.entity").League[]>;
    findOne(id: string): Promise<import("./entities/league.entity").League>;
    update(id: string, updateLeagueDto: any): Promise<import("./entities/league.entity").League>;
    remove(id: string): Promise<void>;
    getStandings(id: string): Promise<import("./entities/league-participant.entity").LeagueParticipant[]>;
    updateStanding(id: string, userId: string, updates: any): Promise<import("./entities/league-participant.entity").LeagueParticipant>;
    addMember(id: string, body: {
        userId?: string;
        username?: string;
    }): Promise<import("./entities/league-participant.entity").LeagueParticipant>;
    removeMember(id: string, userId: string): Promise<void>;
    leave(id: string, req: any): Promise<void>;
    addGroup(id: string, body: {
        groupId: string;
    }): Promise<void>;
}
