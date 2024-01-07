'use strict';

// Replace with http.min for lower memory usage
const fetch = require('node-fetch');

function checkStatus(res) {
  if (res.ok) {
    return res;
  }
  throw new Error(res.status);
}

exports.sendCommand = async function sendCommand(endpoint, address) {
  const res = await fetch(`http://${address}${endpoint}`);
  checkStatus(res);
  const data = await res.json();
  return data;
};

/**
 * Return key for first entry matching value
 *
 * @param {*} map
 * @param {*} value
 * @returns {string|null}
 */
exports.getMapKeyByValue = function getMapKeyByValue(map, value) {
  const entry = [...map].find(([key, v]) => v === value);
  if (entry && entry.length) {
    return entry[0];
  }
  return null;
};
