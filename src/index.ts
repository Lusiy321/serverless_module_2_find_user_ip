import express, { Application } from "express";
import bodyParser from "body-parser";
import authRoute from "./routes/authRoute";

const app: Application = express();
const port = 3000;

app.use(bodyParser.json());

app.get("/", (_req, res) => {
  res.send("Server is online");
});

app.use("/auth", authRoute);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
