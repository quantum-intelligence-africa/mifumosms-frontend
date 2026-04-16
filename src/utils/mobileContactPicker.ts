// Mobile Contact Picker Utility - Optimized for Large Contact Lists
// Uses Web Contacts API to fetch contacts from mobile device with pagination support

export interface MobileContact {
  full_name: string;
  phone: string;
  email: string;
}

export interface MobileContactPickerResult {
  success: boolean;
  contacts: MobileContact[];
  total: number;
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

/**
 * Normalize and deduplicate contacts asynchronously to prevent UI freeze
 */
async function normalizeContactsInChunks(
  contacts: any[],
  chunkSize = 500
): Promise<MobileContact[]> {
  const normalized: MobileContact[] = [];
  const phoneSet = new Set<string>(); // Track duplicates

  for (let i = 0; i < contacts.length; i += chunkSize) {
    const chunk = contacts.slice(i, i + chunkSize);

    for (const contact of chunk) {
      const full_name = (contact.name?.[0] || "").trim();
      const phone = (contact.tel?.[0] || "").trim();
      const email = (contact.email?.[0] || "").trim();

      // Only keep contacts with name or phone
      if ((full_name || phone) && !phoneSet.has(phone)) {
        normalized.push({ full_name, phone, email });
        if (phone) phoneSet.add(phone);
      }
    }

    // Yield to browser to keep UI responsive
    if (i + chunkSize < contacts.length) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }

  return normalized;
}

/**
 * Fetch contacts from mobile device with chunked processing to prevent freezing
 * Returns contacts in pages for better UI performance
 */
export const fetchMobileContacts = async (
  progressCallback?: (loaded: number, total: number) => void
): Promise<MobileContactPickerResult> => {
  // Check if contact picker is supported
  if (!isContactPickerSupported()) {
    return {
      success: false,
      contacts: [],
      total: 0,
      error: "Mobile contact picker not supported on this device. Please use a mobile browser like Chrome on Android."
    };
  }

  // Check if running on mobile device
  if (!isMobileDevice()) {
    return {
      success: false,
      contacts: [],
      total: 0,
      error: "This feature only works on mobile devices. Please use a mobile browser."
    };
  }

  try {
    // Show loading indicator
    progressCallback?.(0, 0);

    // Request permission and fetch contacts from mobile device
    const contacts = await (navigator as any).contacts.select(
      ["name", "tel", "email"],
      { multiple: true }
    );

    if (!contacts || contacts.length === 0) {
      return {
        success: true,
        contacts: [],
        total: 0
      };
    }

    // Report that we've fetched contacts
    progressCallback?.(contacts.length, contacts.length);

    // Normalize contacts asynchronously in chunks to prevent UI freeze
    const normalizedContacts = await normalizeContactsInChunks(contacts);

    return {
      success: true,
      contacts: normalizedContacts,
      total: normalizedContacts.length
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
      total: 0,
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
