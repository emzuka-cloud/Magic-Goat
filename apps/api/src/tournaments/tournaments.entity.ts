import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/entities/user.entity';

export enum TournamentFormat {
    PLAYERS_8 = 8,
    PLAYERS_16 = 16,
    PLAYERS_32 = 32,
}

export enum TournamentStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
}

@Entity()
export class Tournament {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: TournamentFormat,
        default: TournamentFormat.PLAYERS_8
    })
    format: TournamentFormat;

    @Column({
        type: 'enum',
        enum: TournamentStatus,
        default: TournamentStatus.PENDING
    })
    status: TournamentStatus;

    @ManyToOne(() => User, { eager: true })
    owner: User;

    @ManyToMany(() => User, { eager: true })
    @JoinTable()
    participants: User[];

    @Column('simple-json', { nullable: true })
    rounds: any; // Will store the bracket structure: { "1": [match1, match2], "2": [...] }

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
