import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Tournament } from './tournament.entity';
import { User } from '../../users/entities/user.entity';

export enum InvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined',
}

@Entity('invitations')
export class Invitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tournament)
    tournament: Tournament;

    @ManyToOne(() => User)
    invitee: User;

    @Column({
        type: 'enum',
        enum: InvitationStatus,
        default: InvitationStatus.PENDING,
    })
    status: InvitationStatus;

    @CreateDateColumn()
    created_at: Date;
}
