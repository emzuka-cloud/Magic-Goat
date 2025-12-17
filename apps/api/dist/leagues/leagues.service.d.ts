import { Repository } from 'typeorm';
import { League } from './entities/league.entity';
import { LeagueParticipant } from './entities/league-participant.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Pairing } from '../tournaments/entities/pairing.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
export declare class LeaguesService {
    private leaguesRepository;
    private leagueParticipantsRepository;
    private tournamentsRepository;
    private pairingsRepository;
    private notificationsService;
    constructor(leaguesRepository: Repository<League>, leagueParticipantsRepository: Repository<LeagueParticipant>, tournamentsRepository: Repository<Tournament>, pairingsRepository: Repository<Pairing>, notificationsService: NotificationsService);
    create(createLeagueDto: {
        name: string;
        description?: string;
        start_date: Date;
        end_date?: Date;
    }, user: User): Promise<League>;
    findAll(userId: string): Promise<League[]>;
    findOne(id: string): Promise<League>;
    update(id: string, updateLeagueDto: Partial<League>): Promise<League>;
    remove(id: string): Promise<void>;
    addMember(leagueId: string, identifier: string): Promise<LeagueParticipant>;
    removeMember(leagueId: string, userId: string): Promise<void>;
    addPlayGroup(leagueId: string, groupId: string): Promise<void>;
    updateStanding(leagueId: string, userId: string, updates: Partial<LeagueParticipant>): Promise<LeagueParticipant>;
    getStandings(leagueId: string): Promise<LeagueParticipant[]>;
    updateStandings(leagueId: string): Promise<void>;
    private initUserStats;
}
