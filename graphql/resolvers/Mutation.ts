import { getOrCreateUser } from "../utils/userLogic";
import { queryDatabase } from "../utils/database";
import { AuthenticationError } from "apollo-server-azure-functions";
import { finhubProfileAPIResponse } from "../TypeScriptInterfaces";
require("dotenv").config();
import fetch from "node-fetch";

const apiToken = process.env.API_KEY;

//function 1: for fetching additional data about a company
const loadCompanyData = async (symbol) => {
  const response = await fetch(
    `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiToken}`
  );
  const json = await response.json();
  return json;
};

//function 2: for creating or getting a ticker from a symbol
const createOrGetTicker = async (symbol) => {
  const readTickerQuery = "SELECT * FROM TICKER_NAME WHERE SYMBOL = $1";
  const insertTickerQuery =
    "INSERT INTO TICKER_NAME (symbol, country, currency, logo, market_cap, name, url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;";
  const ticker = await queryDatabase(readTickerQuery, [symbol]);

  if (!ticker[0]) {
    const companyData = loadCompanyData(symbol);
    return companyData.then(async (res: finhubProfileAPIResponse) => {
      const newTicker = await queryDatabase(insertTickerQuery, [
        symbol,
        res.country,
        res.currency,
        res.logo,
        res.marketCapitalization,
        res.name,
        res.weburl,
      ]);
      return newTicker[0];
    });
  } else {
    return ticker[0];
  }
};

//function 3: gets the unique feed id
const getFeed = async (userId, feedName) => {
  const readFeedQuery =
    "SELECT FEED_ID FROM FEED_NAME WHERE CREATOR_ID = $1 AND FEED_NAME = $2";
  const feed = await queryDatabase(readFeedQuery, [userId, feedName]);
  return feed[0];
};

//function 4: add ticker feed relationship
const addTickerFeedRel = async (feed_id, ticker_id) => {
  const readRelQuery =
    "SELECT * FROM FEED_TICKERS WHERE FEED_ID = $1 AND TICKER_ID = $2";
  const insertRelQuery =
    "INSERT INTO FEED_TICKERS (FEED_ID, TICKER_ID) VALUES ($1, $2) RETURNING *";
  const rel = await queryDatabase(readRelQuery, [feed_id, ticker_id]);
  if (!rel[0]) {
    await queryDatabase(insertRelQuery, [feed_id, ticker_id]);
  } else {
    throw new Error(`ticker already exists in your feed!`);
  }
};

//function 5: remove ticker feed relationship
const deleteTickerFeedRel = async (feed_id, ticker_id) => {
  const delRelQuery =
    "DELETE FROM FEED_TICKERS WHERE FEED_ID = $1 AND TICKER_ID = $2";
  await queryDatabase(delRelQuery, [feed_id, ticker_id]);
};

//graphql mutation 1: Will add a ticker to a specific feed of a specific user
export async function addTickerToFeed(parent, args, context, info) {
  //check if authenticated
  if (!context.auth.isAuthenticated) {
    throw new AuthenticationError("Not logged in");
  }

  //create user if first time, and get user's info
  const user = await getOrCreateUser(context.auth.sub);

  //create ticker if it is new or just get ticker id
  const ticker = await createOrGetTicker(args.tickerSymbol);

  //get feed id
  const feed = await getFeed(user.user_id, args.feedName);

  //add ticker and feed relationship
  await addTickerFeedRel(feed.feed_id, ticker.ticker_id);

  //return the added ticker
  return {
    id: ticker.ticker_id,
    symbol: ticker.symbol,
    country: ticker.country,
    currency: ticker.currency,
    logo: ticker.logo,
    market_cap: ticker.market_cap,
    name: ticker.name,
    url: ticker.url,
  };
}

//graphql mutation 2: Will remove a ticker from a specific feed of a specific user
export async function removeTickerFromFeed(parent, args, context, info) {
  //check if authenticated
  if (!context.auth.isAuthenticated) {
    throw new AuthenticationError("Not logged in");
  }

  //get user's info
  const user = await getOrCreateUser(context.auth.sub);

  //get feed id for current user
  const feed = await getFeed(user.user_id, args.feedName);

  //get the ticker id
  const ticker = await createOrGetTicker(args.tickerSymbol);

  //delete the ticker feed relationship
  await deleteTickerFeedRel(feed.feed_id, ticker.ticker_id);

  //return the removed ticker
  return {
    id: ticker.ticker_id,
    symbol: ticker.symbol,
    country: ticker.country,
    currency: ticker.currency,
    logo: ticker.logo,
    market_cap: ticker.market_cap,
    name: ticker.name,
    url: ticker.url,
  };
}

//graphql mutation 3: add a new private feed
export async function addNewPrivateFeedName(parent, args, context, info) {
  let user = null;

  //get or create a user if we have authorization in our header
  if (context.auth.sub) {
    user = await getOrCreateUser(context.auth.sub);
  }

  const insertFeedName = `INSERT INTO FEED_NAME (FEED_NAME, CREATOR_ID, IS_PUBLIC) VALUES ($1, $2, FALSE) RETURNING *`;
  const insertUserFeed = `INSERT INTO USER_FEEDS (FEED_ID, USER_ID) VALUES ($1, $2)`;
  const newFeed = await queryDatabase(insertFeedName, [
    args.feedName,
    user.user_id,
  ]);
  await queryDatabase(insertUserFeed, [newFeed[0].feed_id, user.user_id]);
  return { name: args.feedName, is_public: false };
}

export async function deletePrivateFeed(parent, args, context, info) {
  let user = null;

  //get or create a user if we have authorization in our header
  if (context.auth.sub) {
    user = await getOrCreateUser(context.auth.sub);
  }
  const deleteFeedTickers = `DELETE FROM FEED_TICKERS WHERE FEED_ID = $1`;
  const deleteFeedName = `DELETE FROM FEED_NAME WHERE FEED_ID = $1 AND CREATOR_ID = $2 RETURNING *`;
  const deleteUserFeeds = `DELETE FROM USER_FEEDS WHERE FEED_ID = $1`;

  await queryDatabase(deleteFeedTickers, [args.feedId]);
  await queryDatabase(deleteUserFeeds, [args.feedId]);
  const deletedQuery = await queryDatabase(deleteFeedName, [
    args.feedId,
    user.user_id,
  ]);
  return { id: args.feedId, name: deletedQuery[0].feed_name };
}

//graphql mutation 4: add a new public feed
export async function addNewPublicFeedName(parent, args, context, info) {
  let user = null;

  //get or create a user if we have authorization in our header
  if (context.auth.sub) {
    user = await getOrCreateUser(context.auth.sub);
  }
  const readFeedId = `SELECT FEED_ID FROM FEED_NAME WHERE FEED_NAME = $1 and IS_PUBLIC = TRUE and CREATOR_ID != $2;`;
  const publicFeed = await queryDatabase(readFeedId, [
    args.feedName,
    user.user_id,
  ]);
  const insertUserFeed = `INSERT INTO USER_FEEDS (FEED_ID, USER_ID) VALUES ($1, $2)`;
  await queryDatabase(insertUserFeed, [publicFeed[0].feed_id, user.user_id]);
  return args.feedName;
}

//graphql mutation 5: change status of feed (public/private)
export async function changeFeedStatus(parent, args, context, info) {
  let user = null;

  //get or create a user if we have authorization in our header
  if (context.auth.sub) {
    user = await getOrCreateUser(context.auth.sub);
  }
  const updateStatus = `UPDATE FEED_NAME SET IS_PUBLIC = NOT IS_PUBLIC WHERE FEED_NAME=$1 AND CREATOR_ID=$2 RETURNING *`;
  const newStatus = await queryDatabase(updateStatus, [
    args.feedName,
    user.user_id,
  ]);
  return newStatus[0].is_public;
}
