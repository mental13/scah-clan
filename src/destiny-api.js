const dotenv = require('dotenv').config();
const fetch = require('node-fetch');
const parser = require('./destiny-parser');

const ErrorCode = {
  NONE: 0,
  SUCCESS: 1,
  UNAVAILABLE: 5
}

const STEAM_MEMBERSHIP_ID = 3;

exports.getOauthURL = function () {
  const clientId = process.env.CLIENT_ID;
  return `https://www.bungie.net/en/OAuth/Authorize?client_id=${clientId}&response_type=code`;
}

exports.auth = async function (authCode) {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  return fetch('https://www.bungie.net/platform/app/oauth/token/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=authorization_code&code=${authCode}&client_id=${clientId}&client_secret=${clientSecret}`
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error_description);
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        membershipId: data.membership_id
      }
    })
    .catch(error => {
      throw error;
    });
}

exports.refreshAuthToken = async function (refreshToken) {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  return fetch('https://www.bungie.net/platform/app/oauth/token/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}`
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        throw new Error(data.error_description);
      }
      return data.access_token;
    })
    .catch(error => {
      throw error;
    });;
}

exports.getProfileId = async function (membershipId) {
  return fetch(`https://www.bungie.net/Platform/User/GetMembershipsById/${membershipId}/254/`,
    { method: 'GET', headers: { 'x-api-key': process.env.BUNGIE_API_KEY } })
    .then(response => response.json())
    .then(data => {
      if (data.ErrorCode != ErrorCode.SUCCESS) {
        throw new Error(data.Message);
      }

      const bnetMembership = data.Response.destinyMemberships.find(membership => membership.membershipType == STEAM_MEMBERSHIP_ID);
      if (bnetMembership) {
        return bnetMembership.membershipId;
      }
      else {
        throw new Error('Steam profile was not found');
      }
    })
    .catch(error => {
      throw error;
    });;
}

exports.getProfileData = async function (profileId, accessToken) {
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
  const components = 'components=100,102,200,201,202,205,300,700,800,900';
  return fetch(`https://www.bungie.net/Platform//Destiny2/${STEAM_MEMBERSHIP_ID}/Profile/${profileId}/?${components}`,
    {
      method: 'GET',
      headers: {
        'x-api-key': process.env.BUNGIE_API_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    })
    .then(response => response.json())
    .then(async (data) => {
      if (data.ErrorCode != ErrorCode.SUCCESS) {
        throw new Error(data.Message);
      }

      const titleDefinitions = await parser.getTitleDefinitions(data.Response);
      return titleDefinitions;
    })
    .catch(error => {
      throw error;
    });
}
