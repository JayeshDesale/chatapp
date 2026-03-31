const API_BASE_URL = import.meta.env.VITE_API_URL;

export const API = {
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  USERS: `${API_BASE_URL}/api/users`,
  SEND_MESSAGE: `${API_BASE_URL}/api/messages`,
  GET_MESSAGES: (userId) => `${API_BASE_URL}/api/messages/${userId}`,
};

export default API_BASE_URL;