import express from "express";
import env from "dotenv";
import cors from "cors";
import mongoConnect from "./database/dbconnect.js";

env.config();
const app = express();
const port = process.env.PORT;

app.use(cors());
mongoConnect();
app.get("/", (req, res) => {
  res.send("Server Running Succes");
});
app.listen(port, () => {
  console.log(`Server Listening on ${port}`);
});
