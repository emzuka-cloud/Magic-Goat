"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./users/entities/user.entity");
const league_entity_1 = require("./leagues/entities/league.entity");
const tournament_entity_1 = require("./tournaments/entities/tournament.entity");
const participant_entity_1 = require("./tournaments/entities/participant.entity");
const pairing_entity_1 = require("./tournaments/entities/pairing.entity");
const invitation_entity_1 = require("./tournaments/entities/invitation.entity");
const bcrypt = __importStar(require("bcrypt"));
async function seed() {
    const dataSource = new typeorm_1.DataSource({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        username: process.env.POSTGRES_USER || 'mtg_user',
        password: process.env.POSTGRES_PASSWORD || 'mtg_password',
        database: process.env.POSTGRES_DB || 'mtg_db',
        entities: [user_entity_1.User, league_entity_1.League, tournament_entity_1.Tournament, participant_entity_1.TournamentParticipant, pairing_entity_1.Pairing, invitation_entity_1.Invitation],
        synchronize: true,
    });
    await dataSource.initialize();
    console.log('Data Source has been initialized!');
    const userRepository = dataSource.getRepository(user_entity_1.User);
    const leagueRepository = dataSource.getRepository(league_entity_1.League);
    let admin = await userRepository.findOneBy({ username: 'admin' });
    if (!admin) {
        const passwordHash = await bcrypt.hash('admin123', 10);
        admin = userRepository.create({
            email: 'admin@example.com',
            username: 'admin',
            password_hash: passwordHash,
        });
        await userRepository.save(admin);
        console.log('Created admin user');
    }
    else {
        console.log('Admin user already exists');
    }
    let testUser = await userRepository.findOneBy({ username: 'test_u_000001' });
    if (!testUser) {
        testUser = userRepository.create({
            email: 'test_u_000001@example.com',
            username: 'test_u_000001',
            custom_id: 'U-000001',
        });
        await userRepository.save(testUser);
        console.log('Created test user U-000001');
    }
    const extraUsers = ['user1', 'user2', 'user3', 'user4', 'user5'];
    for (let i = 0; i < extraUsers.length; i++) {
        const username = extraUsers[i];
        const exists = await userRepository.findOneBy({ username });
        if (!exists) {
            const newUser = userRepository.create({
                email: `${username}@example.com`,
                username: username,
                custom_id: `U-TEST0${i + 1}`,
            });
            await userRepository.save(newUser);
            console.log(`Created test user ${username} (ID: U-TEST0${i + 1})`);
        }
        else {
            console.log(`Test user ${username} already exists`);
        }
    }
    const leaguesData = [
        {
            name: 'Standard League 2025',
            description: 'The premier Standard format league for 2025.',
            start_date: new Date(),
            created_by: admin,
        },
        {
            name: 'Modern Monday Nights',
            description: 'Weekly Modern format tournaments.',
            start_date: new Date(),
            created_by: admin,
        },
        {
            name: 'Commander Legends',
            description: 'Casual Commander league for fun and glory.',
            start_date: new Date(),
            created_by: admin,
        },
    ];
    for (const leagueData of leaguesData) {
        const existing = await leagueRepository.findOneBy({ name: leagueData.name });
        if (!existing) {
            const league = leagueRepository.create(leagueData);
            await leagueRepository.save(league);
            console.log(`Created league: ${league.name}`);
        }
        else {
            console.log(`League already exists: ${existing.name}`);
        }
    }
    await dataSource.destroy();
    console.log('Seed completed!');
}
seed().catch((error) => console.log(error));
//# sourceMappingURL=seed.js.map