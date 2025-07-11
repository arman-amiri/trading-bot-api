import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get<ConfigService>(ConfigService);
  const appPort = config.get<number>('APP_PORT');

  app.enableCors({
    origin: 'http://localhost:3001', // یا '*', اگر بخوای برای همه آزاد باشه (در توسعه قابل قبوله)
    credentials: false, // اگه کوکی یا توکن نیاز داری
  });

  await app.listen(appPort ?? 5000);
}
bootstrap();
