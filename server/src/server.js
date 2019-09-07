const express = require("express");

const app = express();
const cors = require("cors");
const port = process.env.PORT || "8000";

const dotenv = require("dotenv").config();
const fetch = require("node-fetch");

const REACT_APP_URL = 'http://localhost:1234';

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

app.listen(port)
