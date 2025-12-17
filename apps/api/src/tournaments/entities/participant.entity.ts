import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tournament } from './tournament.entity';

@Entity('tournament_participants')
export class TournamentParticipant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tournament, (tournament) => tournament.participants, { onDelete: 'CASCADE' })
    @Index()
    tournament: Tournament;

    @ManyToOne(() => User)
    @Index()
    user: User;

    @Column({ type: 'jsonb', nullable: true })
    decklist: any;

    @Column({ default: 0 })
    score: number;
}
