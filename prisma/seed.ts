import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient, Role } from '@prisma/client';

if (process.env.NODE_ENV === 'production') {
	throw new Error('The demo seed must not be run in production.');
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error('DATABASE_URL is required to seed the SQLite database.');
}

const prisma = new PrismaClient({
	adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
});

async function main() {
	const tenantName = 'Demo Workspace';
	const existingTenant = await prisma.tenant.findFirst({
		where: { name: tenantName },
	});
	const tenant =
		existingTenant ??
		(await prisma.tenant.create({
			data: { name: tenantName },
		}));

	const users = [
		{
			email: 'admin@demo.com',
			name: 'Demo Admin',
			password: 'Admin123!',
			role: Role.ADMIN,
		},
		{
			email: 'user@demo.com',
			name: 'Demo User',
			password: 'User123!',
			role: Role.USER,
		},
	];

	for (const user of users) {
		const hashedPassword = await bcrypt.hash(user.password, 10);
		const { password: _password, ...userData } = user;

		await prisma.user.upsert({
			where: { email: user.email },
			create: {
				...userData,
				password: hashedPassword,
				tenant: { connect: { id: tenant.id } },
			},
			update: {
				...userData,
				password: hashedPassword,
				tenant: { connect: { id: tenant.id } },
			},
		});
	}

	console.info(`Seed completed: ${users.length} demo users in "${tenantName}".`);
}

main()
	.catch((error: unknown) => {
		console.error('Seed failed:', error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
