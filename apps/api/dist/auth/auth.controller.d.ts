import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
        access_token: string;
    }>;
    register(user: Partial<User>): Promise<User>;
}
