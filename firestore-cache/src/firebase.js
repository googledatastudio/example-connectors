// [start firebase_access_implementation]


var FIREBASE_REALTIME_DB_BASE_URL = '.firebaseio.com';
var FIREBASE_REALTIME_DB_COLLECTION = '/cache';

/**
 * Returns the URL for a file in a firebase database.
 *
 * @param {string} fileName The filename in the database
 * @returns {string} The url for the file in the database
 */
function buildFirebaseUrl(fileName) {
  var serviceAccountCreds = getServiceAccountCreds();
  var projectId = serviceAccountCreds[BILLING_PROJECT_ID];

  if (fileName) {
    fileName = '/' + fileName;
  }
  var urlElements = [
    'https://',
    projectId,
    FIREBASE_REALTIME_DB_BASE_URL,
    FIREBASE_REALTIME_DB_COLLECTION,
    fileName,
    '.json'
  ];
  var url = urlElements.join('');
  return url;
}

/**
 * Generic method for handling the Firebase Realtime Database REST API.
 * For `get`: returns the data at the given url.
 * For `post`: posts the data in in firestore db at the given url and returns `undefined`.
 * For `delete`: deletes the data at the given url and returns `undefined`.
 *
 * @param {string} method Method for the REST API: `get`, `post`, or `delete`
 * @param {string} url REST endpoint
 * @param {string} [data] Data to be stored for `post` method
 * @returns {undefined|object} Returns data from the REST endpoint for `get`
 *          method. For other methods, returns `undefined`.
 */
function firebaseCache(method, url, data) {
  var oAuthToken = getOauthService().getAccessToken();

  var responseOptions = {
    headers: {
      Authorization: 'Bearer ' + oAuthToken
    },
    method: method,
    contentType: 'application/json'
  };

  // Add payload for post method
  if (method === 'post') {
    responseOptions['payload'] = JSON.stringify(data);
  }

  var response = UrlFetchApp.fetch(url, responseOptions);

  // Return value only for `get`.
  if (method === 'get') {
    var responseObject = JSON.parse(response);
    if (responseObject === null) {
      return null;
    } else {
      var autoKey = Object.keys(responseObject)[0];
      var returnValue = responseObject[autoKey];
    }
    return returnValue;
  }
}

function getFromCache(url) {
  return firebaseCache('get', url);
}

function deleteFromCache(url) {
  return firebaseCache('delete', url);
}

function putInCache(url, data) {
  return firebaseCache('put', url, data);
}

// [end firebase_access_implementation]


// [START service_account_init]
var SERVICE_ACCOUNT_CREDS = 'SERVICE_ACCOUNT_CREDS';
var SERVICE_ACCOUNT_KEY = 'private_key';
var SERVICE_ACCOUNT_EMAIL = 'client_email';
var BILLING_PROJECT_ID = 'project_id';

var scriptProperties = PropertiesService.getScriptProperties();

/**
 * Copy the entire credentials JSON file from creating a service account in GCP.
 * Service account should have `Firebase Admin` IAM role.
 */
function getServiceAccountCreds() {
  return JSON.parse(scriptProperties.getProperty(SERVICE_ACCOUNT_CREDS));
}

function getOauthService() {
  var serviceAccountCreds = getServiceAccountCreds();
  var serviceAccountKey = serviceAccountCreds[SERVICE_ACCOUNT_KEY];
  var serviceAccountEmail = serviceAccountCreds[SERVICE_ACCOUNT_EMAIL];

  return OAuth2.createService('FirebaseCache')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setPrivateKey(serviceAccountKey)
    .setIssuer(serviceAccountEmail)
    .setPropertyStore(scriptProperties)
    .setCache(CacheService.getScriptCache())
    .setScope([
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/firebase.database'
    ]);
}
// [END service_account_init]
