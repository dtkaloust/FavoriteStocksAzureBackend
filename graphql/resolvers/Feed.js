const { queryDatabase } = require("../utils/database");

async function user(parent, args, context, info) {
  const user = await queryDatabase(
    "SELECT USER_ID AS ID, AUTH_SUB FROM  USERS U JOIN FEED_NAME FN ON (U.USER_ID = FN.CREATOR_ID) WHERE FN.FEED_ID = $1",
    [parent.id]
  );
  return { id: user[0].id, authSub: user[0].auth_sub };
}

module.exports = {
  user,
};