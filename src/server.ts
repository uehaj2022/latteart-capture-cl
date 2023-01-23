import express, { Express, Request, Response } from "express";
import UserTimeRoutes from "./routes/UserTimeRoutes";

import mongoose from "mongoose";
const mongostr = "mongodb://localhost:27017/latteArt";

const connectToMongo = () => {
  mongoose.connect(mongostr, () => {
    console.log("MongoDB connection Successfull");
  });
};

const app: Express = express();
app.use(express.json());
const port = process.env.PORT || 8000;
connectToMongo();

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});
app.use("/usertime", UserTimeRoutes);
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
