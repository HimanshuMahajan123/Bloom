import api from "./api";

export const fetchHome = async (cursor?: string, id?: string) => {
  try {
    const params: Record<string, string> = {};

    if (cursor && id) {
      params.cursor = cursor;
      params.id = id;
    }

    const response = await api.get("/profile/home-content", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching home content:", error);
    throw error;
  }
};
