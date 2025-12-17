import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { passportJwtSecret } from 'jwks-rsa';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private usersService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_irm6sACmh/.well-known/jwks.json',
            }),
            issuer: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_irm6sACmh',
            algorithms: ['RS256'],
        });
    }

    async validate(payload: any) {
        // Find or create user in local DB to ensure FK constraints work
        return this.usersService.findOrCreateUser(payload);
    }
}
