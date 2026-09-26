import axios from "axios";

export function handleAxiosError(error: unknown) {
  if (axios.isAxiosError(error)) {
    console.error(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }

  console.error(error);
  return { success: false, message: "Unknown error" };
}
