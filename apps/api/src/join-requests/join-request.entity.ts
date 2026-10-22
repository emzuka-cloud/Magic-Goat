import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, Index } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { League } from '../leagues/entities/league.entity';

export enum JoinRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    DECLINED = 'declined',
}

/** "Let me in" from a user, waiting for the owner of a tournament or league. Exactly one target is set. */
@Entity('join_requests')
export class JoinRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Tournament, { nullable: true, onDelete: 'CASCADE' })
    @Index()
    tournament: Tournament | null;

    @ManyToOne(() => League, { nullable: true, onDelete: 'CASCADE' })
    @Index()
    league: League | null;

    @Column({ type: 'enum', enum: JoinRequestStatus, default: JoinRequestStatus.PENDING })
    status: JoinRequestStatus;

    @CreateDateColumn()
    created_at: Date;
}
