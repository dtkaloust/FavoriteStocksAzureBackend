require("dotenv").config();
import { queryDatabase } from "../utils/database";
import {
  finhubQuoteAPIResponse,
  finhubSymbolAPIResponse,
} from "../TypeScriptInterfaces";
import fetch from "node-fetch";

const apiKey = process.env.API_KEY;

//function 1: retrieves the home page tickers
const getHomePageTickers = async () => {
  const readHomePageTickers = `WITH T1 AS (
    SELECT TN.TICKER_ID AS ID, SYMBOL, COUNTRY, CURRENCY, LOGO, MARKET_CAP, NAME, URL, COUNT(*) AS TOTAL_COUNT FROM
    TICKER_NAME TN join FEED_TICKERS FT ON (TN.TICKER_ID = FT.TICKER_ID)
    GROUP BY TN.TICKER_ID, SYMBOL, COUNTRY, CURRENCY, LOGO, MARKET_CAP, NAME, URL)
    SELECT ID, SYMBOL, COUNTRY, CURRENCY, LOGO, MARKET_CAP, NAME, URL FROM T1 ORDER BY TOTAL_COUNT DESC;`;
  const tickers = await queryDatabase(readHomePageTickers, []);
  return tickers;
};

//function 2: retrieves the current feed's tickers
const getCurrentFeedTickers = async (feedName) => {
  const readCurrentFeedTickers = `SELECT FN.FEED_ID AS FEED_ID, FN.FEED_NAME AS FEED_NAME, FN.IS_PUBLIC AS IS_PUBLIC, TN.TICKER_ID AS ID, SYMBOL, COUNTRY, CURRENCY, LOGO, MARKET_CAP, NAME, URL
  FROM FEED_NAME FN JOIN FEED_TICKERS FT ON (FN.FEED_ID = FT.FEED_ID)
  JOIN TICKER_NAME TN ON (TN.TICKER_ID = FT.TICKER_ID)
  WHERE FN.FEED_NAME = $1;`;
  const tickers = await queryDatabase(readCurrentFeedTickers, [feedName]);
  return tickers;
};

//graphql query 1: retrieves a list of all possible tickers. Used for predictive search in the front end
export async function getPossibleTickers(parent, args, context) {
  const apiToken = apiKey;
  if (!context.auth.sub) {
    return ["nothing"];
  }

  const response = await fetch(
    `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${apiToken}`
  );

  const json = (await response.json()) as finhubSymbolAPIResponse[];
  const symbolList = json.map((ticker) => {
    return ticker.symbol;
  });
  return symbolList;
}

//graphql query 2: retrieves current price details of a symbol
export async function priceCheck(parent, args) {
  const apiToken = apiKey;
  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${args.tickerSymbol}&token=${apiToken}`
  );
  const json = (await response.json()) as finhubQuoteAPIResponse;
  return json.c;
}

//graphql query 3: retrieves a specific feed
export async function feed(parent, args, context) {
  //retrieve the feed. If it is the homepage feed then return default feed
  if (!args.feedName) {
    const homePageTickers = await getHomePageTickers();
    return {
      companies: homePageTickers,
      count: homePageTickers.length,
      name: "",
      is_public: true,
    };
  } else {
    const currentFeedTickers = await getCurrentFeedTickers(args.feedName);
    return {
      id: currentFeedTickers[0].feed_id,
      companies: currentFeedTickers,
      count: currentFeedTickers.length,
      name: currentFeedTickers[0].feed_name,
      is_public: currentFeedTickers[0].is_public,
    };
  }
}

//graphql query 4: retrieve an array of feed names ordered by most popular
export async function getAllFeedNames(parent, args, context) {
  let user = null;

  //get or create a user if we have authorization in our header
  if (context.auth.sub) {
    user = context.auth.sub.split("|")[1];
  }
  const readAllFeedNames = `WITH T1 AS(
    SELECT FN.FEED_NAME AS NAME, FN.FEED_ID AS ID, COUNT(*) AS COUNTED FROM USER_FEEDS UF JOIN FEED_NAME FN ON (FN.FEED_ID = UF.FEED_ID) WHERE FN.IS_PUBLIC = TRUE AND FN.CREATOR_ID != $1
    GROUP BY FN.FEED_NAME, FN.FEED_ID)
    SELECT NAME, ID FROM T1
    ORDER BY COUNTED DESC;`;
  const feeds = await queryDatabase(readAllFeedNames, [user]);
  return feeds;
}

//graphql query 5: retrieve all public feeds that a user is tracking
export async function getPublicFeedNames(parent, args, context) {
  let user = null;

  //get or create a user if we have authorization in our header
  if (context.auth.sub) {
    user = context.auth.sub.split("|")[1];
  }

  const readAllFeedNames = `SELECT FN.FEED_NAME AS NAME, FN.FEED_ID AS ID FROM
USER_FEEDS UF JOIN FEED_NAME FN ON (UF.FEED_ID = FN.FEED_ID)
WHERE
UF.USER_ID = $1
AND FN.IS_PUBLIC = TRUE
AND UF.USER_ID != FN.CREATOR_ID;`;
  const feeds = await queryDatabase(readAllFeedNames, [user]);
  return feeds;
}

//graphql query 6: retrieve all person user feeds
export async function getUserFeedNames(parent, args, context) {
  let user = null;

  //get or create a user if we have authorization in our header
  if (context.auth.sub) {
    user = context.auth.sub.split("|")[1];
  }

  const readAllFeedNames = `SELECT FEED_NAME AS NAME, IS_PUBLIC, FEED_ID AS ID FROM FEED_NAME WHERE CREATOR_ID = $1;`;
  const feeds = await queryDatabase(readAllFeedNames, [user]);
  return feeds;
}
