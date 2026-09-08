const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "loltest";

let cachedClient = null;

async function getClient() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

module.exports = async (req, res) => {
  try {
    if (!uri) {
      res.status(500).json({
        error:
          "MONGODB_URI chưa được cấu hình. Vào Vercel > Project > Settings > Environment Variables để thêm.",
      });
      return;
    }

    const client = await getClient();
    const db = client.db(dbName);
    const col = db.collection("appstate");

    if (req.method === "GET") {
      const doc = await col.findOne({ _id: "main" });
      res.status(200).json(doc ? doc.data : { champions: [], matchups: [] });
      return;
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch (e) {
          body = {};
        }
      }
      await col.updateOne(
        { _id: "main" },
        { $set: { data: body, updatedAt: new Date() } },
        { upsert: true },
      );
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
