import { User } from '../users/entities/user.entity';
export declare enum TournamentFormat {
    PLAYERS_8 = 8,
    PLAYERS_16 = 16,
    PLAYERS_32 = 32
}
export declare enum TournamentStatus {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED"
}
export declare class Tournament {
    id: string;
    name: string;
    format: TournamentFormat;
    status: TournamentStatus;
    owner: User;
    participants: User[];
    rounds: any;
    created_at: Date;
    updated_at: Date;
}
