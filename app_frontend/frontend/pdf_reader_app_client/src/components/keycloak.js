import Keycloak from 'keycloak-js';

const login_path = process.env.VUE_APP_LOGIN_PATH;
console.log("login path " + login_path)

const keycloakConfig = {
  url: login_path, //'http://localhost:8180', // Keycloak server URL
  //url: 'http://localhost:8180', // Keycloak server URL
  // realm: 'RGZ2',
  realm: 'RGZ',               // Replace 'your-realm' with your realm name
  clientId: 'rgz-pdf-user',        // Replace 'your-client-id' with your client ID
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;
//console.log("hehe")