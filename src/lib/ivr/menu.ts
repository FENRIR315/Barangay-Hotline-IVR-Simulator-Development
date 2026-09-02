// ============================================================================
// IVR MENU DEFINITIONS
// ============================================================================
// All spoken prompts and keypad menus for the IVR are defined here so the
// state machine stays data-driven. This file is shared by:
//   - the web simulator
//   - the future real telephony adapter
//   - automated tests
// ============================================================================

import type { DtmfDigit, IvrPrompt } from "@/types/ivr";

type MenuOptions = Partial<Record<DtmfDigit, string>>;

export const MENU = {
  WELCOME:
    "Welcome to BarangayConnect Hotline. You have reached the Barangay Automated Hotline and Emergency Assistance System. Please listen carefully and select an option.",
  MAIN_MENU: "Main menu.",
  MAIN_MENU_OPTIONS: {
    text: "Press 1 for Emergency Assistance. Press 2 for Barangay Services. Press 3 to report a community problem. Press 4 for Barangay Announcements. Press 5 to speak with a Barangay Official. Press 0 to repeat this menu.",
    options: {
      "1": "Emergency Assistance",
      "2": "Barangay Services",
      "3": "Report a Community Problem",
      "4": "Barangay Announcements",
      "5": "Speak with a Barangay Official",
      "0": "Repeat Menu",
    } as MenuOptions,
  },

  EMERGENCY_SELECTED: "You have selected Emergency Assistance.",
  EMERGENCY_MENU: {
    text: "Press 1 for Medical Emergency. Press 2 for Fire. Press 3 for Flood or Disaster. Press 4 for Other Emergency. Press 9 to return to the main menu.",
    options: {
      "1": "Medical Emergency",
      "2": "Fire",
      "3": "Flood or Disaster",
      "4": "Other Emergency",
      "9": "Return to Main Menu",
    } as MenuOptions,
  },

  MEDICAL:
    "For immediate life-threatening emergencies, please contact the national emergency hotline 9 1 1. If you require barangay assistance, remain on the line. We are connecting you to a barangay emergency official. Please hold.",
  FIRE:
    "You selected Fire Emergency. We are alerting the barangay emergency officer. Please do not hang up.",
  DISASTER:
    "You selected Flood or Disaster. Please state or enter your location, then remain on the line. We are creating an emergency report and connecting you to the appropriate barangay official.",
  OTHER_EMERGENCY:
    "You selected Other Emergency. Please describe the situation, then remain on the line. We are creating an emergency report for the barangay official.",

  SERVICES_SELECTED: "You have selected Barangay Services.",
  SERVICES_MENU: {
    text: "Press 1 for Barangay Clearance. Press 2 for Certificate of Residency. Press 3 for Certificate of Indigency. Press 4 for Business Clearance. Press 5 for Other Services. Press 9 to return to the main menu.",
    options: {
      "1": "Barangay Clearance",
      "2": "Certificate of Residency",
      "3": "Certificate of Indigency",
      "4": "Business Clearance",
      "5": "Other Services",
      "9": "Return to Main Menu",
    } as MenuOptions,
  },

  SERVICE_INFO: (service: string) =>
    `${service} requests are processed during office hours. Please visit the barangay hall or use the online service portal if available. Thank you for contacting the BarangayConnect Hotline. Goodbye.`,

  REPORT_SELECTED: "You have selected to report a community problem.",
  REPORT_MENU: {
    text: "Press 1 for a Noise Complaint. Press 2 for Garbage. Press 3 for Broken Streetlight. Press 4 for Road Damage. Press 5 for Flooding. Press 6 for a Public Disturbance. Press 7 for Other Community Problem. Press 9 to return to the main menu.",
    options: {
      "1": "Noise Complaint",
      "2": "Garbage",
      "3": "Broken Streetlight",
      "4": "Road Damage",
      "5": "Flooding",
      "6": "Public Disturbance",
      "7": "Other Community Problem",
      "9": "Return to Main Menu",
    } as MenuOptions,
  },

  REPORT_LOCATION:
    "Please provide your location. Enter a number from zero to nine to confirm when you have indicated the location.",
  REPORT_DESCRIPTION:
    "Please briefly describe the problem. Enter any number from zero to nine when you have finished speaking to record your description.",

  ANNOUNCEMENTS:
    "You have selected Barangay Announcements. The following announcements are currently active.",
  ANNOUNCEMENT_NONE:
    "There are no active announcements at this time. Thank you for calling the BarangayConnect Hotline. Goodbye.",
  ANNOUNCEMENT_END: "That concludes the barangay announcements. Goodbye.",

  OFFICIAL_SELECTED: "You have selected to speak with a Barangay Official.",
  OFFICIAL_CHECKING:
    "Please hold while we check the availability of our barangay officials.",
  OFFICIAL_AVAILABLE:
    "A barangay official is available. We are connecting your call now.",
  OFFICIAL_NONE:
    "All available barangay officials are currently assisting other callers.",
  QUEUE_MENU: {
    text: "Press 1 to remain in the queue. Press 2 to leave a voice message. Press 9 to return to the main menu.",
    options: {
      "1": "Remain in the Queue",
      "2": "Leave a Voice Message",
      "9": "Return to Main Menu",
    } as MenuOptions,
  },

  VOICE_MESSAGE:
    "Please speak clearly after the tone, then hang up or press any key to finish. Your message will be reviewed by a barangay official.",
  MESSAGE_RECORDED:
    "Your voice message has been recorded. Thank you for contacting the BarangayConnect Hotline. Goodbye.",
  UNABLE_TO_CONNECT:
    "We are unable to connect you to a barangay official at this time. Please leave a message. Your message will be reviewed by a barangay official.",
  GOODBYE: "Thank you for calling the BarangayConnect Hotline. Goodbye.",
  INVALID:
    "Sorry, that selection is not valid. Please try again.",

  RECORD_CONFIRMATION: (reportNumber: string) =>
    `Your report has been recorded. Your report number is ${reportNumber}. Thank you for contacting the BarangayConnect Hotline. Goodbye.`,
};

export const REPEAT_LIMIT = 3;
export const DEFAULT_TIMEOUT_SEC = 10;

export function welcomePrompt(): IvrPrompt {
  return {
    text: `${MENU.WELCOME}. ${MENU.MAIN_MENU_OPTIONS.text}`,
    options: MENU.MAIN_MENU_OPTIONS.options,
  };
}

export function mainMenuPrompt(repeat = false): IvrPrompt {
  return {
    text: `${repeat ? "" : MENU.MAIN_MENU + " "}${MENU.MAIN_MENU_OPTIONS.text}`,
    options: MENU.MAIN_MENU_OPTIONS.options,
  };
}

export function emergencyMenuPrompt(): IvrPrompt {
  return {
    text: `${MENU.EMERGENCY_SELECTED}. ${MENU.EMERGENCY_MENU.text}`,
    options: MENU.EMERGENCY_MENU.options,
  };
}

export function servicesMenuPrompt(): IvrPrompt {
  return {
    text: `${MENU.SERVICES_SELECTED}. ${MENU.SERVICES_MENU.text}`,
    options: MENU.SERVICES_MENU.options,
  };
}

export function reportMenuPrompt(): IvrPrompt {
  return {
    text: `${MENU.REPORT_SELECTED}. ${MENU.REPORT_MENU.text}`,
    options: MENU.REPORT_MENU.options,
  };
}

export function queueMenuPrompt(): IvrPrompt {
  return {
    text: MENU.QUEUE_MENU.text,
    options: MENU.QUEUE_MENU.options,
  };
}

export function invalidPrompt(): IvrPrompt {
  return {
    text: `${MENU.INVALID} ${MENU.MAIN_MENU_OPTIONS.text}`,
    options: MENU.MAIN_MENU_OPTIONS.options,
  };
}
