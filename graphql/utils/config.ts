export const config = {
  credentials: {
    tenantName: "StockTickerAuth.onmicrosoft.com",
    clientID: "d80ec518-c463-424c-91f8-7169250c4a4e",
  },
  policies: {
    policyName: "B2C_1_SUSI",
  },
  metadata: {
    b2cDomain: "StockTickerAuth.b2clogin.com",
    authority: "login.microsoftonline.com",
    discovery: ".well-known/openid-configuration",
    version: "v2.0",
  },
  settings: {
    isB2C: true,
    validateIssuer: true,
    passReqToCallback: false,
    loggingLevel: "warn",
  },
  protectedRoutes: {
    apiGraphql: {
      endpoint: "https://stocktickerbackend.azurewebsites.net/api/graphql",
      scopes: ["demo.read"],
    },
  },
};
