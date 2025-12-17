import { User } from '../../users/entities/user.entity';
import { League } from './league.entity';
export declare class LeagueParticipant {
    id: string;
    league: League;
    user: User;
    points: number;
    matches_played: number;
    matches_won: number;
    matches_drawn: number;
    matches_lost: number;
    omw_percentage: number;
}
