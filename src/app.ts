import express from "express";
import "express-async-errors";
import dotenv from "dotenv";
import routes from "./router";

// import { Authorize } from "./common/middleware/auth.middleware";
import { errorHandlingMiddleware } from "./middleware/error.middleware";
import { connect } from "mongoose";
import apolloServer from "./graphql/schema";


dotenv.config();

// Initialize express app
const app = express() as express.Application | any;

// Connect to MongoDB
connect(process.env.NODE_ENV! == 'production' ? process.env.MONGO_URI_PROD! : process.env.MONGO_URI_DEV!)
  .then((r) => { console.log('MongoDB connected')})
  .catch(err => console.error('MongoDB connection error:', err));




app.use(express.json());

app.use(express.urlencoded({ extended: true }));

async function startApolloServer() {
  await apolloServer.start();
  
  // Apply Apollo Express Middleware
  apolloServer.applyMiddleware({ app, path: '/graphql' });
  
  console.log(`GraphQL server ready at http://localhost:${process.env.PORT}${apolloServer.graphqlPath}`);
}

startApolloServer();


app.use('/api',routes);


app.use(errorHandlingMiddleware)




export default app;