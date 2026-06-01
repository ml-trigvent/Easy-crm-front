// services/apiUrls.js
const BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:4000/api";

export const API_URLS = {
  auth: {
    login: `${BASE_URL}/auth/login`,
  },
  stages: {
    list: `${BASE_URL}/stages`,
    update: `${BASE_URL}/stages/update`,
  },
  leads: {
    list: `${BASE_URL}/leads`,
    create: `${BASE_URL}/leads`,
    delete: (id) => `${BASE_URL}/leads/${id}`,
    profile: (id) => `${BASE_URL}/leads/${id}`,
    messages: (id) => `${BASE_URL}/leads/${id}/messages`,
    notes: (id) => `${BASE_URL}/leads/${id}/notes`,
  },
  pipeline: {
    list: `${BASE_URL}/pipeline`,
    move: `${BASE_URL}/deals/move`,
    createDeal: `${BASE_URL}/deals`,
  },
  chats: {
    list: `${BASE_URL}/chats`,
  },
  tasks: {
    list: `${BASE_URL}/tasks`,
    create: `${BASE_URL}/tasks`,
    complete: (id) => `${BASE_URL}/tasks/${id}/complete`,
    delete: (id) => `${BASE_URL}/tasks/${id}`,
  },
  tickets: {
    list: `${BASE_URL}/tickets`,
    create: `${BASE_URL}/tickets`,
    update: (id) => `${BASE_URL}/tickets/${id}`,
    history: (id) => `${BASE_URL}/tickets/${id}/history`,
    comments: (id) => `${BASE_URL}/tickets/${id}/comments`,
  },
  agents: {
    list: `${BASE_URL}/agents`,
  },
  dashboard: `${BASE_URL}/dashboard`
};
