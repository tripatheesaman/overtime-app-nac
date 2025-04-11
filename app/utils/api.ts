import { FormData } from "../types/InputFormType";

export const sendFormData = async (
  formData: FormData
) => {
  try {
    const response = await fetch("/api/overtime", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to send formData:", error);
    return { error: "Failed to send data. Please try again later." };
  }
};
