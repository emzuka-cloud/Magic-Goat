import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Notification } from '../../notifications/entities/notification.entity';


@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Not loaded by default: users appear in public tournament/league/group responses.
    // Lookups by email (WHERE clauses) still work.
    @Column({ unique: true, select: false })
    email: string;

    @Column({ unique: true })
    username: string;

    @Column({ nullable: true, unique: true })
    custom_id: string; // For the U-xxxxxxx ID

    // Never loaded by default, so it can't leak through relations or responses.
    @Column({ nullable: true, select: false })
    password_hash: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => Notification, notification => notification.user)
    notifications: Notification[];
}
