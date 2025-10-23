// Mobile Contact Picker Utility
// Uses Web Contacts API to fetch contacts from mobile device

export interface MobileContact {
  full_name: string;
  phone: string;
  email: string;
}

export interface MobileContactPickerResult {
  success: boolean;
  contacts: MobileContact[];
  error?: string;
}

// Check if mobile contact picker is supported
export const isContactPickerSupported = (): boolean => {
  return typeof navigator !== "undefined" && 
         "contacts" in navigator && 
         typeof (navigator as any).contacts?.select === "function";
};

// Check if running on mobile device
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Fetch contacts from mobile device using Web Contacts API
export const fetchMobileContacts = async (): Promise<MobileContactPickerResult> => {
  // Check if contact picker is supported
  if (!isContactPickerSupported()) {
    return {
      success: false,
      contacts: [],
      error: "Mobile contact picker not supported on this device. Please use a mobile browser like Chrome on Android."
    };
  }

  // Check if running on mobile device
  if (!isMobileDevice()) {
    return {
      success: false,
      contacts: [],
      error: "This feature only works on mobile devices. Please use a mobile browser."
    };
  }

  try {
    // Request permission and fetch contacts from mobile device
    const contacts = await (navigator as any).contacts.select(
      ["name", "tel", "email"], 
      { multiple: true }
    );

    // Transform mobile contacts to API format
    const transformedContacts: MobileContact[] = contacts
      .map((contact: any) => ({
        full_name: contact.name?.[0] || "",
        phone: contact.tel?.[0] || "",
        email: contact.email?.[0] || ""
      }))
      .filter((contact: MobileContact) => contact.full_name || contact.phone);

    return {
      success: true,
      contacts: transformedContacts
    };
  } catch (error: any) {
    let errorMessage = "Failed to fetch contacts from device";
    
    if (error.name === "NotAllowedError") {
      errorMessage = "Please allow access to contacts to use this feature";
    } else if (error.name === "AbortError") {
      errorMessage = "Contact selection was cancelled";
    } else if (error.name === "NotSupportedError") {
      errorMessage = "Contact picker is not supported on this device";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      contacts: [],
      error: errorMessage
    };
  }
};

// Get device info for debugging
export const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    isMobile: isMobileDevice(),
    isContactPickerSupported: isContactPickerSupported(),
    platform: navigator.platform,
    language: navigator.language
  };
};
