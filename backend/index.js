const express = require("express");
const { Issuer, generators } = require("openid-client");
const jose = require("jose");
const cors = require("cors");
const session = require("express-session");
const {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  sendAndConfirmTransaction,
} = require("thirdweb");
const { defineChain } = require("thirdweb/chains");
const { privateKeyToAccount } = require("thirdweb/wallets");
require("dotenv").config();

const thirdwebClient = createThirdwebClient({
  secretKey: process.env.THIRDWEB_API_KEY,
});

const wallet = privateKeyToAccount({
  client: thirdwebClient,
  privateKey: process.env.PRIVATE_KEY,
});
// connect to your contract
const contract = getContract({
  client: thirdwebClient,
  chain: defineChain(84532),
  address: "0x68E6773488b1ca6791DAC2C353f88bEf2B0B8841",
});

let client;
// Initialize the OIDC client
Issuer.discover("https://id.worldcoin.org")
  .then((worldcoinIssuer) => {
    client = new worldcoinIssuer.Client({
      client_id: "app_8545bd14acebd3afcc675bdd4caedd8c",
      client_secret: "sk_7e383cc58e7e165037d4cf3a58cd1299c3f42b304f77efab",
      redirect_uris: ["https://backend-young-wildflower-4665.fly.dev/redirect"],
      response_types: ["code"],
    });
  })
  .catch((err) => {
    console.error("Failed to discover the issuer:", err);
  });

const app = express();

app.use(
  session({
    secret: "superhackysecret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.json());
app.use(cors());

// Middleware to ensure the user is authenticated
async function ensureAuthenticated(req, res, next) {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send("Unauthorized: No token provided");
  }

  try {
    const payload = await verifyJwt(token);
    console.log("payload", payload);
    req.user = payload; // Store the payload in the request for use in the route if needed.
    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).send("Unauthorized: Invalid token");
  }
}

app.get("/auth/check", ensureAuthenticated, (req, res) => {
  res.json({ authenticated: true, user: req.user });
});

app.get("/login", (req, res) => {
  const nonce = generators.nonce();
  const state = generators.state();

  console.log("Generated nonce:", nonce);
  console.log("Generated state:", state);

  req.session.nonce = nonce;
  req.session.state = state;

  const authUrl = client.authorizationUrl({
    scope: "openid",
    nonce,
    state,
  });

  res.redirect(authUrl);
});

app.get("/redirect", async (req, res) => {
  const { code, state } = req.query;

  console.log("Stored state:", req.session.state);
  console.log("Returned state:", state);

  // Validate state
  if (state !== req.session.state) {
    return res.status(400).send("State mismatch");
  }

  try {
    const tokenSet = await client.callback(
      "https://backend-young-wildflower-4665.fly.dev/redirect",
      { code },
      { nonce: req.session.nonce } // Pass the nonce from session
    );
    const payload = await verifyJwt(tokenSet.access_token);

    // If payload is verified successfully, redirect to the specified URL
    if (payload) {
      res.redirect(
        `https://civguard.vercel.app/onboard?token=${tokenSet.access_token}`
      );
    } else {
      res.status(401).send("Invalid token");
    }
  } catch (err) {
    console.error("Error exchanging code for token:", err);
    res.sendStatus(500);
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/addUser", ensureAuthenticated, async (req, res) => {
  const { walletAddress, sub, zipCode } = req.body;
  console.log("walletAddress", walletAddress);
  console.log("sub", sub);
  console.log("zipCode", zipCode);

  const userAddress = walletAddress;
  const _sub = sub;
  const _postalCode = zipCode;

  const transaction = await prepareContractCall({
    contract,
    method:
      "function createUser(address userAddress, string _sub, string _postalCode)",
    params: [userAddress, _sub, _postalCode],
  });
  const { transactionHash } = await sendAndConfirmTransaction({
    transaction,
    account: wallet,
  });

  console.log("Transaction hash:", transactionHash);

  res.json({ success: true });
});

const verifyJwt = async (token) => {
  const JWKS = jose.createRemoteJWKSet(
    new URL("https://id.worldcoin.org/jwks.json")
  );

  const { payload, header } = await jose.jwtVerify(token, JWKS, {
    issuer: "https://id.worldcoin.org",
    aud: "app_8545bd14acebd3afcc675bdd4caedd8c",
  });

  return payload;
};

app.listen(3000, () => {
  console.log("App listening on port 3000");
  console.log(wallet?.address);
});
