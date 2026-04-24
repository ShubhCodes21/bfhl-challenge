const express = require("express");
const cors = require("cors");
const { processBfhl } = require("./bfhl");

const app = express();
app.use(cors());
app.use(express.json());

const ID = {
  user_id: "shubhagarwal_21102005",
  email_id: "sa3724@srmist.edu.in",
  college_roll_number: "RA2311003010328",
};

app.get("/", (_, res) => res.json({ status: "ok", endpoint: "POST /bfhl" }));

app.post("/bfhl", (req, res) => {
  try {
    const r = processBfhl(req.body?.data);
    if (r.error) return res.status(400).json({ error: r.error });
    res.json({ ...ID, ...r });
  } catch {
    res.status(500).json({ error: "internal error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));