import express from "express";
import csv from "csv-parser";
import fs from "fs";

import ngrok from "ngrok";

const app = express();

const ipData: any = [];
fs.createReadStream("src/ip.csv")
  .pipe(csv())
  .on("data", (row: any) => {
    ipData.push(row);
  })
  .on("end", () => {
    console.log("loaded.");
  });

app.get("/", async (req: any, res: any) => {
  const userIP = req.headers["x-forwarded-for"];
  // const userIP = "134.238.141.12";
  async function ipToNumber(ip: any) {
    const parts = ip.split(".").map(Number);
    return (
      parts[0] * 256 ** 3 + parts[1] * 256 ** 2 + parts[2] * 256 + parts[3]
    );
  }
  const convertIp = await ipToNumber(userIP);

  async function findCountryByIP(ipData: [], convertIp: number) {
    const userIPInt = convertIp;

    const ipInfo = ipData.find((row: any) => {
      const startIP = parseInt(row["0"], 10);
      const endIP = parseInt(row["16777215"], 10);
      return userIPInt > startIP && userIPInt < endIP;
    });
    console.log(ipInfo);
    if (ipInfo !== undefined) {
      const country = ipInfo["-"];
      const ip = userIP;
      return res.json({ country, ip });
    } else {
      return res.json({ country: "Unknown", IP: userIP });
    }
  }
  await findCountryByIP(ipData, convertIp);
});

const port = 3000;
app.listen(port, async () => {
  console.log(`Server is running http://localhost:${port}`);
  const publicUrl = await ngrok.connect(port);
  console.log(`Public URL: ${publicUrl}`);
});
