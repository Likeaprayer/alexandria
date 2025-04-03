import express from "express";
import "express-async-errors";
import dotenv from "dotenv";
import routes from "./router";

// import { Authorize } from "./common/middleware/auth.middleware";
import { errorHandlingMiddleware } from "./middleware/error.middleware";
import { connect } from "mongoose";
import { connectRedis } from "./db/redis/init";



dotenv.config();

// Initialize express app
const app = express();


// Connect to MongoDB
connect(process.env.NODE_ENV! == 'production' ? process.env.MONGO_URI_PROD! : process.env.MONGO_URI_DEV!)
  .then((r) => { console.log('MongoDB connected')})
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize Redis client
connectRedis()



app.use(express.json());

app.use(express.urlencoded({ extended: true }));


app.use('/api',routes);


app.use(errorHandlingMiddleware)




export default app;