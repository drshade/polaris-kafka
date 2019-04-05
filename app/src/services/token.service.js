let t;
export const getToken = () => {
  return t || (t = localStorage.getItem('token'));
};

export const setToken = (token) => {
  t = null;
  localStorage.setItem('token', token);
};

const getInfo = () => {
  let token = getToken();

  try {
    let jwt = token
      .split('.')
      .map((t) => t.replace(/-/g, '+').replace(/_/g, '/'))
      .map((t) => atob(t));

    return {
      token,
      info: JSON.parse(jwt[1])
    };
  } catch (ex) {
    return {};
  }
};

export const validateToken = () => {
  let { token, info } = getInfo();

  if (!info) {
    console.warn(`Invalid token, it was garbage.`);
    setToken(null);

    return null;
  }

  let expiry = new Date(info.exp * 1000);
  if (expiry < new Date()) {
    console.warn(`Invalid token, it expired on ${expiry}`);
    setToken(null);

    return null;
  }

  return token;
};

export const getProfile = () => {
  let { info } = getInfo();

  if (!info) return null;

  return {
    name: info.given_name,
    lastName: info.family_name,
    fullname: info.name,
    email: info.email,
    picture: info.picture
  };
};