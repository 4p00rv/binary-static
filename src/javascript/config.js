// const Cookies = require('js-cookie');

/*
 * Configuration values needed in js codes
 *
 * NOTE:
 * Please use the following command to avoid accidentally committing personal changes
 * git update-index --assume-unchanged src/javascript/config.js
 *
 */

const getAppId = () => {
  let appId;
  const userAppId = '2445';
  const configAppId = window.localStorage.getItem('config.app_id');
  if (configAppId) {
    appId = configAppId;
  } else if (/staging\.binary\.com/i.test(window.location.hostname)) {
    appId = 1098;
  } else {
    if (userAppId.length) {
      window.localStorage.setItem('config.default_app_id', userAppId);
    }
    appId = userAppId.length ? userAppId : 1;
  }
  return appId;
};

const getSocketURL = () => {
  let server_url = window.localStorage.getItem('config.server_url');
  if (!server_url) {
    // const toGreenPercent = { real: 100, virtual: 0, logged_out: 0 }; // default percentage
    // const categoryMap    = ['real', 'virtual', 'logged_out'];
    // const percentValues  = Cookies.get('connection_setup'); // set by GTM
    //
    // // override defaults by cookie values
    // if (percentValues && percentValues.indexOf(',') > 0) {
    //     const cookie_percents = percentValues.split(',');
    //     categoryMap.map((cat, idx) => {
    //         if (cookie_percents[idx] && !isNaN(cookie_percents[idx])) {
    //             toGreenPercent[cat] = +cookie_percents[idx].trim();
    //         }
    //     });
    // }

    // let server = 'blue';
    // if (!/staging\.binary\.com/i.test(window.location.hostname)) {
    //     const loginid = window.localStorage.getItem('active_loginid');
    //     let client_type = categoryMap[2];
    //     if (loginid) {
    //         client_type = /^VRT/.test(loginid) ? categoryMap[1] : categoryMap[0];
    //     }

    // const randomPercent = Math.random() * 100;
    // if (randomPercent < toGreenPercent[client_type]) {
    //     server = 'green';
    // }
    // }

    // server_url = `${server}.binaryws.com`;
    server_url = 'frontend.binaryws.com';
  }
  return `wss://${server_url}/websockets/v3`;
};

module.exports = {
  getAppId,
  getSocketURL,
};
