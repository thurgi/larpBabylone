import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser tous les sous-domaines configurés + localhost en dev
      const allowedPattern = process.env.CORS_ORIGIN_PATTERN || '.*\\.localhost(:\\d+)?$';
      if (!origin || new RegExp(allowedPattern).test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  const port = process.env.AUTH_PORT || 3002;
  await app.listen(port);
  console.log(`Auth service running on port ${port}`);
}

bootstrap();
