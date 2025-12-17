import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TournamentParticipant } from './participant.entity';

export enum TournamentFormat {
    SWISS = 'swiss',
    SINGLE_ELIMINATION = 'single_elimination',
    COMMANDER = 'commander',
}

export enum TournamentStatus {
    UPCOMING = 'upcoming',
    ACTIVE = 'active',
    COMPLETED = 'completed',
}

@Entity('tournaments')
export class Tournament {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: TournamentFormat,
        default: TournamentFormat.SWISS,
    })
    format: TournamentFormat;

    @Column({
        type: 'enum',
        enum: TournamentStatus,
        default: TournamentStatus.UPCOMING,
    })
    @Index()
    status: TournamentStatus;

    @ManyToOne(() => User)
    @Index()
    created_by: User;

    @OneToMany(() => TournamentParticipant, participant => participant.tournament)
    participants: TournamentParticipant[];

    @Column({ default: 8 })
    capacity: number;

    @Column('simple-json', { nullable: true })
    rounds: any;

    @Column({ default: 1 })
    current_round: number;

    @Column({ type: 'timestamp', nullable: true })
    round_start_time: Date;

    @Column({ default: 50 })
    round_duration_minutes: number;

    @Column({ default: false })
    timer_paused: boolean;

    @CreateDateColumn()
    created_at: Date;

    @ManyToOne('League', 'tournaments', { nullable: true })
    @Index()
    league: any;
}
