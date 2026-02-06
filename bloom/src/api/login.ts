import api from "./api";

export const login = async (email:string) => {
    try {
        const response = await api.post("/auth/login/", { email });
        return response.data;
    } catch (error) {
        console.error("Login failed:", error);
        throw error;
    }
};
