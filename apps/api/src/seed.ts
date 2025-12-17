import { DataSource } from 'typeorm';
import { User } from './users/entities/user.entity';
import { League } from './leagues/entities/league.entity';
import { Tournament } from './tournaments/entities/tournament.entity';
import { TournamentParticipant } from './tournaments/entities/participant.entity';
import { Pairing } from './tournaments/entities/pairing.entity';
import { Invitation } from './tournaments/entities/invitation.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        username: process.env.POSTGRES_USER || 'mtg_user',
        password: process.env.POSTGRES_PASSWORD || 'mtg_password',
        database: process.env.POSTGRES_DB || 'mtg_db',
        entities: [User, League, Tournament, TournamentParticipant, Pairing, Invitation],
        synchronize: true,
    });

    await dataSource.initialize();
    console.log('Data Source has been initialized!');

    const userRepository = dataSource.getRepository(User);
    const leagueRepository = dataSource.getRepository(League);

    // Create Admin User
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
    } else {
        console.log('Admin user already exists');
    }

    // Create Test User with U-000001
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

    // Create 5 Test Users for Tournament Testing
    const extraUsers = ['user1', 'user2', 'user3', 'user4', 'user5'];
    for (let i = 0; i < extraUsers.length; i++) {
        const username = extraUsers[i];
        const exists = await userRepository.findOneBy({ username });
        if (!exists) {
            const newUser = userRepository.create({
                email: `${username}@example.com`,
                username: username,
                custom_id: `U-TEST0${i + 1}`, // U-TEST01, U-TEST02...
            });
            await userRepository.save(newUser);
            console.log(`Created test user ${username} (ID: U-TEST0${i + 1})`);
        } else {
            console.log(`Test user ${username} already exists`);
        }
    }

    // Create Leagues
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
        } else {
            console.log(`League already exists: ${existing.name}`);
        }
    }

    await dataSource.destroy();
    console.log('Seed completed!');
}

seed().catch((error) => console.log(error));
