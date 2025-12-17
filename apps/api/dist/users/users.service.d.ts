import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findOne(username: string): Promise<User | null>;
    create(userData: Partial<User>): Promise<User>;
    findOrCreateUser(payload: any): Promise<User>;
}
