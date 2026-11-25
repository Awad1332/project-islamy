import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { CryptoService } from './crypto.service';
import { AuditService } from './audit.service';
import { EventsService } from './events.service';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [PrismaService, RedisService, CryptoService, AuditService, EventsService],
  exports: [PrismaService, RedisService, CryptoService, AuditService, EventsService, JwtModule],
})
export class CommonModule {}
