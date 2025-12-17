import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findOne(username: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { username } });
    }

    async create(userData: Partial<User>): Promise<User> {
        const user = this.usersRepository.create(userData);
        return this.usersRepository.save(user);
    }

    async findOrCreateUser(payload: any): Promise<User> {
        console.log('🔍 [findOrCreateUser] Called with payload:', JSON.stringify(payload, null, 2));

        const { sub, email, username, 'cognito:username': cognitoUsername } = payload;
        const id = sub;
        const finalUsername = cognitoUsername || username || email;

        console.log('🔍 [findOrCreateUser] Extracted - ID:', id, 'Username:', finalUsername, 'Email:', email);

        // Try to find by ID (sub)
        let user = await this.usersRepository.findOne({ where: { id } });
        if (user) {
            console.log('✅ [findOrCreateUser] User found by ID:', user.username);
            return user;
        }

        console.log('🔍 [findOrCreateUser] User not found by ID, trying username...');

        // Try to find by username if ID not found (migration case)
        user = await this.usersRepository.findOne({ where: { username: finalUsername } });
        if (user) {
            console.log('✅ [findOrCreateUser] User found by username:', user.username);
            // Update the ID to match sub? Difficult if PK. 
            // For now, assume if not found by ID, we create new or fail if username taken.
            // Actually, if username exists but ID is different, we have a problem.
            // Let's assume username uniqueness is key.
            return user;
        }

        console.log('🆕 [findOrCreateUser] User not found, creating new user...');

        // Create new user
        // Generate custom_id U-xxxxxxx
        const custom_id = 'U-' + Math.random().toString(36).substring(2, 9);

        user = this.usersRepository.create({
            id, // Set UUID from Cognito
            email,
            username: finalUsername,
            custom_id
        });

        console.log('🆕 [findOrCreateUser] Created user object:', { id, email, username: finalUsername, custom_id });

        const savedUser = await this.usersRepository.save(user);
        console.log('✅ [findOrCreateUser] User saved to database:', savedUser.username, savedUser.id);

        return savedUser;
    }
}
