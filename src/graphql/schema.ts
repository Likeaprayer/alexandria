import { ApolloServer } from 'apollo-server-express';
import typeDefs from './typedef';
import resolvers from './resolver';
import { redisClient } from '../db/redis/init';

// Create Apollo Server with caching
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    return {
      redis: redisClient
    };
  },
  plugins: [
    {
      async serverWillStart() {
        console.log('Apollo Server starting up!');
        return {
          async drainServer() {
            console.log('Apollo Server shutting down!');
          },
        };
      },
    },
  ],
});

export default apolloServer;
