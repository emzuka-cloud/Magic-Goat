import { User } from '../../users/entities/user.entity';
import { TournamentParticipant } from './participant.entity';
export declare enum TournamentFormat {
    SWISS = "swiss",
    SINGLE_ELIMINATION = "single_elimination",
    COMMANDER = "commander"
}
export declare enum TournamentStatus {
    UPCOMING = "upcoming",
    ACTIVE = "active",
    COMPLETED = "completed"
}
export declare class Tournament {
    id: string;
    name: string;
    format: TournamentFormat;
    status: TournamentStatus;
    created_by: User;
    participants: TournamentParticipant[];
    capacity: number;
    rounds: any;
    current_round: number;
    round_start_time: Date;
    round_duration_minutes: number;
    timer_paused: boolean;
    created_at: Date;
    league: any;
}
