import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
require("dotenv").config();
const auth0Domain = process.env.AUTH0_DOMAIN;
const auth0Audience = process.env.AUDIENCE;

export const verifyToken = async (bearerToken) => {
  const client = jwksClient({
    jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
  });

  function getJwksClientKey(header, callback) {
    client.getSigningKey(
      header.kid,
      function (error, key: jwksClient.SigningKey) {
        const signingKey =
          (key as jwksClient.CertSigningKey).publicKey ||
          (key as jwksClient.RsaSigningKey).rsaPublicKey;
        callback(null, signingKey);
      }
    );
  }

  return new Promise((resolve, reject) => {
    jwt.verify(
      bearerToken,
      getJwksClientKey,
      {
        audience: auth0Audience,
        issuer: `https://${auth0Domain}/`,
        algorithms: ["RS256"],
      },
      function (err, decoded) {
        if (err) reject(err);
        resolve(decoded);
      }
    );
  });
};
