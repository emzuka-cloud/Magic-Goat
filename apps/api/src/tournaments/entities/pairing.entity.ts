import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Index } from 'typeorm';
import { Tournament } from './tournament.entity';
import { User } from '../../users/entities/user.entity';

export enum PairingResult {
    PENDING = 'pending',
    P1_WIN = 'p1_win',
    P2_WIN = 'p2_win',
    DRAW = 'draw',
}

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
