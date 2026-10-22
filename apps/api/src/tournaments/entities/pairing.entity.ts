import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Index } from 'typeorm';
import { Tournament } from './tournament.entity';
import { User } from '../../users/entities/user.entity';

export enum PairingResult {
    PENDING = 'pending',
    P1_WIN = 'p1_win',
    P2_WIN = 'p2_win',
    DRAW = 'draw',
    // Commander pods: the final has one winner (any seat); earlier pods send two players on,
    // written as their seats in order. A short pod that auto-advances one player uses pN_win.
    P3_WIN = 'p3_win',
    P4_WIN = 'p4_win',
    P1_P2 = 'p1_p2',
    P1_P3 = 'p1_p3',
    P1_P4 = 'p1_p4',
    P2_P3 = 'p2_p3',
    P2_P4 = 'p2_p4',
    P3_P4 = 'p3_p4',
}

/** Seats (1-4) a result sends on: "p1_p3" -> [1, 3], "p2_win" -> [2], "pending" -> []. */
export const resultSeats = (result: string): number[] => [...result.matchAll(/p([1-4])/g)].map((m) => Number(m[1]));

/** Result string for these seats in a Commander pod (sorted, so "p3_p1" and "p1_p3" are the same). */
export const seatsResult = (seats: number[]): PairingResult => {
    const s = [...seats].sort();
    return (s.length === 1 ? `p${s[0]}_win` : `p${s[0]}_p${s[1]}`) as PairingResult;
};

@Entity('pairings')
export class Pairing {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
    @Index()
    tournament: Tournament;

    @Column()
    @Index()
    round: number;

    @ManyToOne(() => User, { nullable: true })
    player1: User;

    @ManyToOne(() => User, { nullable: true })
    player2: User;

    @ManyToOne(() => User, { nullable: true })
    player3: User;

    @ManyToOne(() => User, { nullable: true })
    player4: User; // Nullable for byes

    @Column({
        type: 'enum',
        enum: PairingResult,
        default: PairingResult.PENDING,
    })
    result: PairingResult;

    @Column({ default: 0 })
    order: number; // 0-indexed position in the round (0, 1, 2...)

    @ManyToOne(() => Pairing, { nullable: true })
    next_pairing: Pairing;
}
