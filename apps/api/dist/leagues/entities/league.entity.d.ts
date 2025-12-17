import { User } from '../../users/entities/user.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { LeagueParticipant } from './league-participant.entity';
export declare class League {
    id: string;
    name: string;
    description: string;
    start_date: Date;
    end_date: Date;
    created_by: User;
    tournaments: Tournament[];
    participants: LeagueParticipant[];
    created_at: Date;
    updated_at: Date;
}
