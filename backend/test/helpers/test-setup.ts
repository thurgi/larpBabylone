import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { StorageService } from '../../src/storage/storage.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface TestContext {
  app: INestApplication;
  jwtService: JwtService;
  storageService: StorageService;
  dataDir: string;
  userToken: string;
  adminToken: string;
  otherUserToken: string;
  userId: string;
  adminId: string;
  otherUserId: string;
}

export async function setupTestApp(): Promise<TestContext> {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'larpbabylone-test-'));

  process.env.DATA_DIR = dataDir;
  process.env.JWT_SECRET = 'test-secret';
  process.env.ADMIN_USERNAME = 'admin-user';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const jwtService = moduleFixture.get<JwtService>(JwtService);
  const storageService = moduleFixture.get<StorageService>(StorageService);

  // Create test users on disk
  const userId = '11111111-1111-4111-a111-111111111111';
  const adminId = '22222222-2222-4222-b222-222222222222';
  const otherUserId = '33333333-3333-4333-b333-333333333333';

  await storageService.writeJson(storageService.resolvePath('users', `${userId}.json`), {
    id: userId,
    username: 'test-user',
    email: 'test@example.com',
    provider: 'discord',
    providerId: 'discord-123',
  });

  await storageService.writeJson(storageService.resolvePath('users', `${adminId}.json`), {
    id: adminId,
    username: 'admin-user',
    email: 'admin@example.com',
    provider: 'google',
    providerId: 'google-456',
  });

  await storageService.writeJson(storageService.resolvePath('users', `${otherUserId}.json`), {
    id: otherUserId,
    username: 'other-user',
    email: 'other@example.com',
    provider: 'discord',
    providerId: 'discord-789',
  });

  const userToken = jwtService.sign({ sub: userId, username: 'test-user' });
  const adminToken = jwtService.sign({ sub: adminId, username: 'admin-user' });
  const otherUserToken = jwtService.sign({ sub: otherUserId, username: 'other-user' });

  return { app, jwtService, storageService, dataDir, userToken, adminToken, otherUserToken, userId, adminId, otherUserId };
}

export async function teardownTestApp(ctx: TestContext): Promise<void> {
  await ctx.app.close();
  await fs.rm(ctx.dataDir, { recursive: true, force: true });
}
