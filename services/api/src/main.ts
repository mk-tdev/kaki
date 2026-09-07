import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
async function main() {
 if(!process.env.DATABASE_URL || !process.env.API_BRIDGE_KEY)throw new Error('DATABASE_URL and API_BRIDGE_KEY are required');
 const app=await NestFactory.create(AppModule,{bodyParser:false});
 app.enableShutdownHooks();
 await app.listen(Number(process.env.PORT || 5030),'0.0.0.0');
}
void main();
