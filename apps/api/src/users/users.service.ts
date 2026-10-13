import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findOrCreateUser(payload: any): Promise<User> {
        const { sub: id, email, username, 'cognito:username': cognitoUsername } = payload;

        const user = await this.usersRepository.findOne({ where: { id } });
        if (user) return user;

        // Link a pre-existing row by email only when Cognito has verified the caller owns that email.
        // Never link by username: anyone can sign up in Cognito with a username that is already taken here.
        const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
        if (email) {
            const byEmail = await this.usersRepository.findOne({ where: { email } });
            if (byEmail && emailVerified) return byEmail;
            if (byEmail) throw new ConflictException('An account with this email already exists. Verify your email address, then sign in again.');
        }

        let finalUsername = cognitoUsername || username || email;
        if (await this.usersRepository.findOne({ where: { username: finalUsername } })) {
            finalUsername = `${finalUsername}-${id.slice(0, 8)}`;
        }

        // custom_id is short (people type it), so a collision is possible; the unique index catches it and we re-roll.
        for (let attempt = 1; ; attempt++) {
            try {
                return await this.usersRepository.save(this.usersRepository.create({
                    id,
                    email,
                    username: finalUsername,
                    custom_id: 'U-' + randomUUID().slice(0, 7),
                }));
            } catch (e: any) {
                const customIdTaken = e?.driverError?.code === '23505' && String(e.driverError.detail).includes('(custom_id)');
                if (!customIdTaken || attempt >= 3) throw e;
            }
        }
    }
}
