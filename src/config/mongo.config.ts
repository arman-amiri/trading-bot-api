import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export default () => ({
  useFactory: async (
    configService: ConfigService,
  ): Promise<MongooseModuleOptions> => {
    return {
      uri: configService.get<string>('MONGO_URI'), // MongoDB connection URI
      dbName: configService.get<string>('MONGO_DB_NAME'), // Database name
      // auth: {
      //   username: configService.get<string>('MONGO_INITDB_ROOT_USERNAME'),
      //   password: configService.get<string>('MONGO_INITDB_ROOT_PASSWORD'),
      // },
      authSource: 'admin',

      autoIndex: true, // Automatically create indexes
      connectTimeoutMS: 10000, // Connection timeout in milliseconds
      socketTimeoutMS: 45000, // Socket timeout in milliseconds
      //   useNewUrlParser: true, // Use the new URL parser
      //   useUnifiedTopology: true, // Use the unified topology engine
    };
  },
});
