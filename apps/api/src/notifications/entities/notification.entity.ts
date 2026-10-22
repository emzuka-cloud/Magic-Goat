import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
    PLAYGROUP_ADD = 'PLAYGROUP_ADD',
    TOURNAMENT_ADD = 'TOURNAMENT_ADD',
    LEAGUE_ADD = 'LEAGUE_ADD',
    TOURNAMENT_JOIN_REQUEST = 'TOURNAMENT_JOIN_REQUEST',
    LEAGUE_JOIN_REQUEST = 'LEAGUE_JOIN_REQUEST',
    JOIN_DECLINED = 'JOIN_DECLINED',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, user => user.notifications, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Column()
    title: string;

    @Column()
    message: string;

    @Column({ nullable: true })
    relatedEntityId: string;

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
