const { ApolloServer, gql } = require("apollo-server-azure-functions");
const fs = require("fs");
const path = require("path");
const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutation");
const Feed = require("./resolvers/Feed");
// const User = require("./resolvers/User");
const { verifyToken } = require("./utils/verifyToken");
require("dotenv").config();

const resolvers = {
  Query,
  Mutation,
  // User,
  Feed,
};

const server = new ApolloServer({
  typeDefs: fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8"),
  resolvers,
  context: async (req) => {
    let isAuthenticated = false;
    let sub = "";
    try {
      const authHeader = req.request.headers.authorization || "";
      if (authHeader) {
        const token = authHeader.split(" ")[1];
        const payload = await verifyToken(token);
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
  playground: true,
});

exports.graphqlHandler = server.createHandler();
