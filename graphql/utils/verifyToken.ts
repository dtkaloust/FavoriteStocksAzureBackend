import passport from "passport";

import { config } from "./config";

import OIDCBearerStrategy from "passport-azure-ad";
import { authPayload } from "../TypeScriptInterfaces";

const options = {
  identityMetadata: `https://${config.metadata.b2cDomain}/${config.credentials.tenantName}/${config.policies.policyName}/${config.metadata.version}/${config.metadata.discovery}`,
  clientID: config.credentials.clientID,
  audience: config.credentials.clientID,
  policyName: config.policies.policyName,
  isB2C: config.settings.isB2C,
  validateIssuer: config.settings.validateIssuer,
  loggingLevel: config.settings.loggingLevel,
  passReqToCallback: config.settings.passReqToCallback,
  scope: config.protectedRoutes.apiGraphql.scopes,
};

const bearerStrategy = new OIDCBearerStrategy.BearerStrategy(
  options,
  (token, done) => {
    if (!token.scp.includes("demo.read")) {
      return done(null, false, {
        message: "User not authorized to access resource",
      });
    }
    return done(null, token);
  }
);

passport.use("oauth-bearer", bearerStrategy);

export const authOauthBearer = ({ req, res }) =>
  new Promise<authPayload>((resolve, reject) => {
    passport.authenticate("oauth-bearer", (authErr, authUser, authInfo) => {
      if (!authUser) reject(authErr || authInfo);
      else resolve(authUser);
    })(req, res);
  });
