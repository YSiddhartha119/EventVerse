export const api = (path, options = {}) => {
  const session = JSON.parse(localStorage.getItem('eventverse-session') || '{}');
  return fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.token || ''}`,
      ...options.headers,
    },
  });
};

export const apiUpload = (path, formData) => {
  const session = JSON.parse(localStorage.getItem('eventverse-session') || '{}');
  return fetch(`/api${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.token || ''}` },
    body: formData,
  });
};

export const getSession = () => JSON.parse(localStorage.getItem('eventverse-session') || '{}');
export const setSession = (data) => localStorage.setItem('eventverse-session', JSON.stringify(data));
export const clearSession = () => localStorage.removeItem('eventverse-session');
