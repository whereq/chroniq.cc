import Keycloak from 'keycloak-js'

// Realm hosted at keytomarvel.com. Values are baked at build time via Vite env.
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL as string,
  realm: import.meta.env.VITE_KEYCLOAK_REALM as string,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string,
})

export default keycloak
