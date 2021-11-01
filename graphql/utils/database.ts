const { Client, Pool } = require("pg");
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
  max: 20,
};

const pool = new Pool(config);

export async function queryDatabase(query, values) {
  //const client = new Client(config);
  //console.log(Date.now());
  //await client.connect();
  const res = await pool.query(query, values);
  //await client.end();
  //console.log(Date.now());
  return res.rows;
}
