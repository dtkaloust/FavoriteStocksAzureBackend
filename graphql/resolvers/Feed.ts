import { queryDatabase } from "../utils/database";
export async function user(parent) {
  const user = await queryDatabase(
    "SELECT CREATOR_ID FROM FEED_NAME FN WHERE FN.FEED_ID = $1",
    [parent.id]
  );
  return { authSub: user[0].creator_id };
}
