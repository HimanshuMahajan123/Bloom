import api from "./api";

export const rightSwipe = async (otherUserId: string) => {
  await api.post("/match/right-swipe", { otherUserId });
};

export const leftSwipe = async (otherUserId: string) => {
  await api.post("/match/left-swipe", { otherUserId });
};
