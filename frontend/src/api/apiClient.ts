import { API_BASE_URL, API_TIMEOUT } from '../config';

const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  },
};

export default apiClient;