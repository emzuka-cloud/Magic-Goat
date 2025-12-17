import { Tournament } from './tournament.entity';
import { User } from '../../users/entities/user.entity';
export declare enum InvitationStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    DECLINED = "declined"
}
export declare class Invitation {
    id: string;
    tournament: Tournament;
    invitee: User;
    status: InvitationStatus;
    created_at: Date;
}
