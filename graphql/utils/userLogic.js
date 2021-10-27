const { queryDatabase } = require("./database");

async function getOrCreateUser(auth_sub) {
  //get unique identifier
  const uniqueId = auth_sub.split("|")[1];

  //create sql queries
  const readQuery = "SELECT user_id, auth_sub FROM users WHERE auth_sub=$1;";
  const insertQuery = "INSERT INTO users (auth_sub) VALUES ($1) RETURNING *;";
  const values = [uniqueId];

  //query for current user
  const user = await queryDatabase(readQuery, values);

  //check if current user exists. Create user if not. Return user
  if (user.length === 0) {
    return await queryDatabase(insertQuery, values);
  } else {
    return user[0];
  }
}

module.exports = { getOrCreateUser };
