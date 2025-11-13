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
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data) {
      throw new Error("No response data received");
    }
    if (!data.success) {
      throw new Error(data.error || "Unknown error occurred");
    }
    return data;
  } catch (error) {
    console.error("Failed to send formData:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to send data. Please try again later." 
    };
  }
};
