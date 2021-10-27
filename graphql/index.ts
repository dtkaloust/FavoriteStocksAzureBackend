import { ApolloServer, gql } from "apollo-server-azure-functions";
import { getPossibleTickers, priceCheck, feed } from "./resolvers/Query";
import { addTickerToFeed, removeTickerFromFeed } from "./resolvers/Mutation";
import { user } from "./resolvers/Feed";
import { verifyToken } from "./utils/verifyToken";
import { authPayload } from "./TypeScriptInterfaces";

const typeDefs = gql`
  type Query {
    feed(feedName: String): Feed!
    priceCheck(tickerSymbol: String!): String
    getPossibleTickers: [String!]!
  }

  type Mutation {
    addTickerToFeed(tickerSymbol: String!, feedName: String!): Ticker!
    removeTickerFromFeed(tickerSymbol: String!, feedName: String!): Ticker!
  }
  type Feed {
    id: ID
    companies: [Ticker!]!
    count: Int!
    user: User
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
    id: ID!
    authSub: String!
  }
`;

const resolvers = {
  Query: { getPossibleTickers, priceCheck, feed },
  Mutation: { addTickerToFeed, removeTickerFromFeed },
  Feed: { user },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async (req) => {
    let isAuthenticated = false;
    let sub = "";
    try {
      const authHeader = req.request.headers.authorization || "";
      if (authHeader) {
        const token = authHeader.split(" ")[1];
        const payload = (await verifyToken(token)) as authPayload;
        isAuthenticated = payload && payload.sub ? true : false;
        sub = payload.sub;
      }
    } catch (error) {
      console.error(error);
    }
    return {
      req,
      auth: { isAuthenticated, sub },
    };
  },
  debug: true,
});

export default server.createHandler({
  cors: {
    origin: "*",
  },
});
