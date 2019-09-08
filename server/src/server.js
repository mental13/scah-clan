const express = require("express");

const app = express();
const cors = require("cors");
const port = process.env.PORT || "8000";

const dotenv = require("dotenv").config();
const fetch = require("node-fetch");
const destiny = require("./destiny-parser")

// Constants
const REACT_APP_URL = 'http://localhost:1234';

const ErrorCode = {
  NONE: 0,
  SUCCESS: 1,
  UNAVAILABLE: 5
}

// TODO figure out how to store this and the refresh token
var ACCESS_TOKEN = '';

app.use(cors());

app.get("/", (req, res) => {
  res.status(200).send("Hello World!");
});

app.get("/oauth", (req, res) => {
  console.log('Start auth');
  const clientId = process.env.ClIENT_ID;
  // TODO generate state and check it on response
  res.send(`https://www.bungie.net/en/OAuth/Authorize?client_id=${clientId}&response_type=code&state=12345678`);
});

app.get("/oauth/redirect", (req, res) => {
  const reqCode = req.query.code;
  const clientId = process.env.ClIENT_ID;
  fetch('https://www.bungie.net/platform/app/oauth/token/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=authorization_code&code=${reqCode}&client_id=${clientId}`
    })
    .then(response => response.json())
    .then(data => {
      ACCESS_TOKEN = data.access_token;
      fetch(`https://www.bungie.net/Platform/User/GetMembershipsById/${data.membership_id}/254/`,
        { method: 'GET', headers: { 'x-api-key': process.env.BUNGIE_API_KEY } })
        .then(response => response.json())
        .then(data => {
          res.redirect(`${REACT_APP_URL}/profile/${data.Response.destinyMemberships[0].membershipId}`);
        })
    })
});

app.get("/destiny/:profileId", (req, res) => {
  // Components:
  // 100 - profile data (character IDs)
  // 102 - profile inventorie (vault)
  // 200 - character info
  // 201 - character inventorie
  // 202 - character progression (season resets)
  // 205 - character equipment
  // 300 - basic instanced item info
  // 700 - presentation nodes (seals)
  // 800 - collectibles
  // 900 - triumphs
  fetch(`https://www.bungie.net/Platform//Destiny2/4/Profile/${req.params.profileId}/?components=100,102,200,201,202,205,300,700,800,900`,
    {
      method: 'GET',
      headers: {
        'x-api-key': process.env.BUNGIE_API_KEY,
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.ErrorCode != ErrorCode.SUCCESS) {
        res.status(400).json({ 'errorMessage': data.Message });
      }

      let roleDefinitions = [];
      roleDefinitions.push(destiny.parseTriumphant(data.Response));

      res.status(200).json({
        'roles': roleDefinitions
      });
    });
});

app.listen(port)
