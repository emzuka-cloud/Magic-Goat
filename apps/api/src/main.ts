import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { corsOrigin } from './cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
