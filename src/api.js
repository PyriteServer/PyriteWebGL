/* eslint comma-dangle: ["error", "only-multiline"]*/
import nanoajax from 'nanoajax';
import browser from 'detect-browser';

const localForage = require('localforage');

class Api {
  static get(uri, type) {
    return new Promise((complete) => {
      nanoajax.ajax(
        {
          url: uri,
          cors: true,
          responseType: type,
        },
        (code, response) => { complete(response); }
      );
    });
  }

  // type == 'blob' for images, or 'text' or 'json'
  static cachedGet(uri, type) {
    // Do not do this for Safari for now
    if (browser.name === 'safari') { return this.get(uri, type); }


    return new Promise((complete) => {
      localForage.getItem(uri).then((value) => {
        if (value == null) {
          nanoajax.ajax({ url: uri, cors: true, responseType: type }, (code, response) => {
            localForage.setItem(uri, response).then(() => { complete(response); });
          });
        } else {
          complete(value);
        }
      }).catch((err) => {
        // This code runs if there were any errors - obviously we need to do something better
        // and potentially use this as another place to complete the promise with a nanoajax call
        // directly in case localforage is unsupported
        // I think this could be good but I have not tested
        /*
             nanoajax.ajax({url:uri, cors:true}, function(code, response) { complete(response); });
        */
        console.log(`cachedGet Error: ${err}`);
      });
    });
  }
}

export default Api;
