import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { LeagueParticipant } from './league-participant.entity';

@Entity('leagues')
export class League {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'date' })
    start_date: Date;

    @Column({ type: 'date', nullable: true })
    end_date: Date;

    @ManyToOne(() => User)
    @Index()
    created_by: User;

    @OneToMany(() => Tournament, tournament => tournament.league)
    tournaments: Tournament[];

    @OneToMany(() => LeagueParticipant, participant => participant.league)
    participants: LeagueParticipant[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
