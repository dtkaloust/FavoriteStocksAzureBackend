require("dotenv").config();
const { queryDatabase } = require("../utils/database");
const { getOrCreateUser } = require("../utils/userLogic");
const fetchP = import("node-fetch").then((mod) => mod.default);
const fetch = (...args) => fetchP.then((fn) => fn(...args));

//function 1: retrieves the home page tickers
const getHomePageTickers = async () => {
  const readHomePageTickers = `WITH T1 AS (
    SELECT TN.TICKER_ID AS ID, SYMBOL, COUNTRY, CURRENCY, LOGO, MARKET_CAP, NAME, URL, COUNT(*) AS TOTAL_COUNT FROM
    TICKER_NAME TN join FEED_TICKERS FT ON (TN.TICKER_ID = FT.TICKER_ID)
    GROUP BY TN.TICKER_ID, SYMBOL, COUNTRY, CURRENCY, LOGO, MARKET_CAP, NAME, URL)
    SELECT ID, SYMBOL, COUNTRY, CURRENCY, LOGO, MARKET_CAP, NAME, URL FROM T1 ORDER BY TOTAL_COUNT DESC;`;
  const tickers = await queryDatabase(readHomePageTickers);
  return tickers;
};

//function 2: retrieves the current feed's tickers
const getCurrentFeedTickers = async (feedName) => {
  const readCurrentFeedTickers = `SELECT FN.FEED_ID AS FEED_ID, TN.TICKER_ID AS ID, SYMBOL, COUNTRY, CURRENCY, LOGO, MARKET_CAP, NAME, URL
  FROM FEED_NAME FN JOIN FEED_TICKERS FT ON (FN.FEED_ID = FT.FEED_ID)
  JOIN TICKER_NAME TN ON (TN.TICKER_ID = FT.TICKER_ID)
  WHERE FN.FEED_NAME = $1;`;
  const tickers = await queryDatabase(readCurrentFeedTickers, [feedName]);
  return tickers;
};

//graphql query 1: retrieves a list of all possible tickers. Used for predictive search in the front end
async function getPossibleTickers(parent, args, context, info) {
  const apiToken = process.env.API_KEY;
  if (!context.auth.sub) {
    return ["nothing"];
  }

  const response = await fetch(
    `https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${apiToken}`
  );

  const json = await response.json();
  const symbolList = json.map((ticker) => {
    return ticker.symbol;
  });
  return symbolList;
}

//graphql query 2: retrieves current price details of a symbol
async function priceCheck(parent, args, context, info) {
  const apiToken = process.env.API_KEY;
  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${args.tickerSymbol}&token=${apiToken}`
  );
  const json = await response.json();
  return json.c;
}

//graphql query 3: retrieves a specific feed
async function feed(parent, args, context, info) {
  let user = null;

  //get or create a user if we have authorization in our header
  if (context.auth.sub) {
    user = await getOrCreateUser(context.auth.sub);
  }

  //retrieve the feed. If it is the homepage feed then return default feed
  if (!args.feedName) {
    const homePageTickers = await getHomePageTickers();
    return {
      companies: homePageTickers,
      count: homePageTickers.length,
    };
  } else {
    const currentFeedTickers = await getCurrentFeedTickers(args.feedName);
    return {
      id: currentFeedTickers[0].feed_id,
      companies: currentFeedTickers,
      count: currentFeedTickers.length,
    };
  }
}

module.exports = {
  getPossibleTickers,
  priceCheck,
  feed,
};
