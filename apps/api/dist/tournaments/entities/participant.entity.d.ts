import { User } from '../../users/entities/user.entity';
import { Tournament } from './tournament.entity';
export declare class TournamentParticipant {
    id: string;
    tournament: Tournament;
    user: User;
    decklist: any;
    score: number;
}
