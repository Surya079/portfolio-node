import express from "express";
import env from "dotenv";
import cors from "cors";
import mongoConnect from "./database/dbconnect.js";
import authRouter from "./routers/auth.js";

env.config();
const app = express();
const port = process.env.PORT;

mongoConnect();
app.use(cors());

app.use(express.static("public/images"));

app.use("/api/auth/", authRouter);

app.get("/", (req, res) => {
  res.send("Server Running Succes");
});
app.listen(port, () => {
  console.log(`Server Listening on ${port}`);
});
