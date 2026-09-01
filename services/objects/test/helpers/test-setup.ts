import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface TestContext {
  app: INestApplication;
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
  process.env.ADMIN_USERNAME = 'admin-user';
  process.env.KEYCLOAK_CLIENT_SECRET = '';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  const userId = '11111111-1111-4111-a111-111111111111';
  const adminId = '22222222-2222-4222-b222-222222222222';
  const otherUserId = '33333333-3333-4333-b333-333333333333';

  const userToken = buildUnsignedJwt({
    sub: userId,
    preferred_username: 'test-user',
    email: 'test@example.com',
    realm_access: { roles: ['documents:read', 'documents:create', 'documents:update', 'documents:delete', 'group-admin'] },
  });
  const adminToken = buildUnsignedJwt({
    sub: adminId,
    preferred_username: 'admin-user',
    email: 'admin@example.com',
    realm_access: { roles: ['admin', 'super-admin'] },
  });
  const otherUserToken = buildUnsignedJwt({
    sub: otherUserId,
    preferred_username: 'other-user',
    email: 'other@example.com',
    realm_access: { roles: ['documents:read'] },
  });

  return { app, dataDir, userToken, adminToken, otherUserToken, userId, adminId, otherUserId };
}

export async function teardownTestApp(ctx: TestContext): Promise<void> {
  await ctx.app.close();
  await fs.rm(ctx.dataDir, { recursive: true, force: true });
}

function buildUnsignedJwt(payload: Record<string, unknown>): string {
  const header = { alg: 'none', typ: 'JWT' };
  return `${toBase64Url(header)}.${toBase64Url(payload)}.signature`;
}

function toBase64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}
