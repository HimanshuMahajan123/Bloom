import api from "./api";

export const generateProfile = async (answers) => {
  console.log("Submitting answers:", answers);
  const response = await api.post("profile/submit-answers", answers);
  return response.data.message;
}