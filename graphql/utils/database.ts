const { Pool } = require("pg");
require("dotenv").config();
const dbHost = process.env.HOST;
const dbUser = process.env.USER;
const dbPass = process.env.PASS;
const dbName = process.env.DBNAME;
const dbPort = process.env.PORT;

const config = {
  host: dbHost,
  user: dbUser,
  password: dbPass,
  database: dbName,
  port: dbPort,
  ssl: true,
  max: 20,
};

const pool = new Pool(config);

export async function queryDatabase(query, values) {
  const res = await pool.query(query, values);
  return res.rows;
}
