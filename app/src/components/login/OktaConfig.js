export default {
    oidc: {
      clientId: '0oadddfwyMnx0qHaw356',
      issuer: 'https://dev-293927.okta.com/oauth2/default',
      // redirectUri: 'http://localhost:3000/implicit/callback',
      redirectUri: 'https://d289thuiw7n9ug.cloudfront.net/implicit/callback',
      scope: 'openid profile email',
    },
    resourceServer: {
      // messagesUrl: 'http://localhost:3000/api/messages',
      messagesUrl: 'https://d289thuiw7n9ug.cloudfront.net/api/messages',
    },
  };
  