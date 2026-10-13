import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { QueryErrorFilter } from './query-error.filter';
import { AppModule } from './app.module';
import { corsOrigin } from './cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Strip unknown body fields and reject bad ones with a 400 listing what is wrong.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new QueryErrorFilter(app.get(HttpAdapterHost).httpAdapter));
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
