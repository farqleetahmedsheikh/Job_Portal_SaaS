import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../modules/users/entities/user.entity';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function seedSuperAdmin() {
  const email = requiredEnv('SUPER_ADMIN_EMAIL').toLowerCase();
  const password = requiredEnv('SUPER_ADMIN_PASSWORD');
  const fullName = requiredEnv('SUPER_ADMIN_FULL_NAME');

  if (password.length < 12) {
    throw new Error('SUPER_ADMIN_PASSWORD must be at least 12 characters');
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const ds = app.get(DataSource);
    const config = app.get(ConfigService);
    const users = ds.getRepository(User);
    const superAdminCount = await users.count({
      where: { role: UserRole.SUPER_ADMIN },
    });
    const existing = await users.findOne({ where: { email } });

    if (superAdminCount > 0 && existing?.role !== UserRole.SUPER_ADMIN) {
      throw new Error(
        'A super_admin already exists. Refusing to bootstrap another account.',
      );
    }

    if (existing?.role === UserRole.SUPER_ADMIN) {
      existing.fullName = fullName;
      existing.isActive = true;
      existing.isEmailVerified = true;
      existing.isProfileComplete = true;
      await users.save(existing);
      console.log(`Super admin already exists: ${email}`);
      return;
    }

    const bcryptRounds = config.get<number>('app.bcryptRounds') ?? 12;
    const passwordHash = await bcrypt.hash(password, bcryptRounds);

    if (existing) {
      existing.fullName = fullName;
      existing.passwordHash = passwordHash;
      existing.role = UserRole.SUPER_ADMIN;
      existing.isActive = true;
      existing.isEmailVerified = true;
      existing.isProfileComplete = true;
      await users.save(existing);
      console.log(`Existing user elevated to first super admin: ${email}`);
      return;
    }

    await users.save(
      users.create({
        email,
        fullName,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        isEmailVerified: true,
        isProfileComplete: true,
      }),
    );
    console.log(`First super admin created: ${email}`);
  } finally {
    await app.close();
  }
}

seedSuperAdmin().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
