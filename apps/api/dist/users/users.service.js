"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    usersRepository;
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findOne(username) {
        return this.usersRepository.findOne({ where: { username } });
    }
    async create(userData) {
        const user = this.usersRepository.create(userData);
        return this.usersRepository.save(user);
    }
    async findOrCreateUser(payload) {
        console.log('🔍 [findOrCreateUser] Called with payload:', JSON.stringify(payload, null, 2));
        const { sub, email, username, 'cognito:username': cognitoUsername } = payload;
        const id = sub;
        const finalUsername = cognitoUsername || username || email;
        console.log('🔍 [findOrCreateUser] Extracted - ID:', id, 'Username:', finalUsername, 'Email:', email);
        let user = await this.usersRepository.findOne({ where: { id } });
        if (user) {
            console.log('✅ [findOrCreateUser] User found by ID:', user.username);
            return user;
        }
        console.log('🔍 [findOrCreateUser] User not found by ID, trying username...');
        user = await this.usersRepository.findOne({ where: { username: finalUsername } });
        if (user) {
            console.log('✅ [findOrCreateUser] User found by username:', user.username);
            return user;
        }
        console.log('🆕 [findOrCreateUser] User not found, creating new user...');
        const custom_id = 'U-' + Math.random().toString(36).substring(2, 9);
        user = this.usersRepository.create({
            id,
            email,
            username: finalUsername,
            custom_id
        });
        console.log('🆕 [findOrCreateUser] Created user object:', { id, email, username: finalUsername, custom_id });
        const savedUser = await this.usersRepository.save(user);
        console.log('✅ [findOrCreateUser] User saved to database:', savedUser.username, savedUser.id);
        return savedUser;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map