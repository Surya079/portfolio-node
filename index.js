import express from "express";
import env from "dotenv";
import cors from "cors";

env.config();
const app = express();
const port = process.env.PORT;

app.use(cors());

app.get("/", (req, res) => {
  res.send("Server Running Succes");
});
app.listen(port, () => {
  console.log(`Server Listening on ${port}`);
});
