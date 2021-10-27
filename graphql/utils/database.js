const { Client } = require("pg");
require("dotenv").config();

const config = {
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASS,
  database: process.env.DBNAME,
  port: 5432,
  ssl: true,
};

async function queryDatabase(query, values) {
  const client = new Client(config);
  await client.connect();
  const res = await client.query(query, values);
  await client.end();
  return res.rows;
}

module.exports = { queryDatabase };
