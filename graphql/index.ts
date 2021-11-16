import { ApolloServer, gql } from "apollo-server-azure-functions";
import {
  getPossibleTickers,
  priceCheck,
  feed,
  getAllFeedNames,
  getPublicFeedNames,
  getUserFeedNames,
} from "./resolvers/Query";
import {
  addTickerToFeed,
  removeTickerFromFeed,
  addNewPrivateFeedName,
  addNewPublicFeedName,
  changeFeedStatus,
  deletePrivateFeed,
  deletePublicFeed,
  addTickersToDB,
} from "./resolvers/Mutation";
import { user } from "./resolvers/Feed";
import { authOauthBearer } from "./utils/verifyToken";
import { authPayload } from "./TypeScriptInterfaces";

const typeDefs = gql`
  type Query {
    feed(feedName: String): Feed!
    priceCheck(tickerSymbol: String!): String
    getPossibleTickers: [String!]!
    getAllFeedNames: [Feed!]!
    getPublicFeedNames: [Feed!]!
    getUserFeedNames: [Feed!]!
  }

  type Mutation {
    addTickerToFeed(tickerSymbol: String!, feedName: String!): Ticker!
    removeTickerFromFeed(tickerSymbol: String!, feedName: String!): Ticker!
    deletePrivateFeed(feedId: Int!): Feed!
    deletePublicFeed(feedId: Int!): Feed!
    addNewPrivateFeedName(feedName: String!): Feed!
    addNewPublicFeedName(feedName: String!): Feed!
    changeFeedStatus(feedName: String!): Feed!
    addTickersToDB(tickerList: [String!]!): [Ticker!]!
  }
  type Feed {
    id: ID
    companies: [Ticker!]!
    count: Int!
    user: User
    is_public: Boolean!
    name: String!
  }

  type Ticker {
    id: ID!
    symbol: String!
    country: String
    currency: String
    logo: String
    market_cap: String
    name: String
    url: String
  }

  type Subscription {
    newTicker: Ticker
  }

  type User {
    authSub: String!
  }
`;

const resolvers = {
  Query: {
    getPossibleTickers,
    priceCheck,
    feed,
    getAllFeedNames,
    getPublicFeedNames,
    getUserFeedNames,
  },
  Mutation: {
    addTickerToFeed,
    removeTickerFromFeed,
    addNewPrivateFeedName,
    addNewPublicFeedName,
    changeFeedStatus,
    deletePrivateFeed,
    deletePublicFeed,
    addTickersToDB,
  },
  Feed: { user },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async (context) => {
    let isAuthenticated = false;
    let payload: authPayload;
    try {
      payload = (await authOauthBearer(context.context)) as authPayload;
      isAuthenticated = payload && payload.sub ? true : false;
    } catch (error) {
      // you may want to escalate the auth issue to the client so you can just throw:
      // throw error;

      // or you can store the auth error in the context
      context.authError = error;
    }

    return { ...context, auth: { isAuthenticated, payload } };
  },
  debug: true,
});

export default server.createHandler({
  cors: {
    origin: "http://localhost:1234",
    credentials: true,
    allowedHeaders: [
      "content-type",
      "authorization",
      "access-control-allow-origin",
    ],
  },
});
