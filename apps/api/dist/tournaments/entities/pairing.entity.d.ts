import { Tournament } from './tournament.entity';
import { User } from '../../users/entities/user.entity';
export declare enum PairingResult {
    PENDING = "pending",
    P1_WIN = "p1_win",
    P2_WIN = "p2_win",
    DRAW = "draw"
}
export declare class Pairing {
    id: string;
    tournament: Tournament;
    round: number;
    player1: User;
    player2: User;
    player3: User;
    player4: User;
    result: PairingResult;
    order: number;
    next_pairing: Pairing;
}
