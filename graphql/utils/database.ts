const { Client } = require("pg");
require("dotenv").config();
const dbHost = process.env.HOST;
const dbUser = process.env.USER;
const dbPass = process.env.PASS;
const dbName = process.env.DBNAME;

const config = {
  host: dbHost,
  user: dbUser,
  password: dbPass,
  database: dbName,
  port: 5432,
  ssl: true,
};

export async function queryDatabase(query, values) {
  const client = new Client(config);
  await client.connect();
  const res = await client.query(query, values);
  await client.end();
  return res.rows;
}
