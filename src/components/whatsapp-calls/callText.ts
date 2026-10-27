import { appLanguage } from "@/utils/appLocale";

const SW = {
  incoming: "Simu ya WhatsApp inaingia", outgoing: "Simu ya WhatsApp", answer: "Pokea", decline: "Kataa", end: "Maliza", mute: "Nyamazisha", unmute: "Washa sauti",
  available: "Niko tayari", away: "Sipo", offline: "Nje ya mtandao", busy: "Kwenye simu", setAvailable: "Weka uko tayari ili upokee", onAnother: "Uko kwenye simu nyingine.",
  allowMic: "Inaomba maikrofoni...", taking: "Inachukua simu...", connecting: "Inaunganisha...", ringing: "Inaita...", connected: "Imeunganishwa", audioConnecting: "Inaunganisha sauti...",
  audioLost: "Mtandao umekatika, inajaribu tena...", audioFailed: "Sauti imeshindwa kuunganishwa", openChat: "Fungua mazungumzo", mic: "Maikrofoni", handling: "anashughulikia",
  ringingNow: "Inaita", whatsappCall: "Simu ya WhatsApp",
};
const EN = {
  incoming: "Incoming WhatsApp call", outgoing: "WhatsApp call", answer: "Answer", decline: "Decline", end: "End call", mute: "Mute", unmute: "Unmute",
  available: "Available", away: "Away", offline: "Offline", busy: "On a call", setAvailable: "Set yourself Available to answer", onAnother: "You are on another call.",
  allowMic: "Waiting for the microphone...", taking: "Taking the call...", connecting: "Connecting...", ringing: "Ringing...", connected: "Connected", audioConnecting: "Connecting audio...",
  audioLost: "Connection lost, trying to recover...", audioFailed: "The audio connection failed", openChat: "Open conversation", mic: "Microphone", handling: "is handling",
  ringingNow: "Ringing", whatsappCall: "WhatsApp call",
};
export const callText = () => (appLanguage() === "sw" ? SW : EN);
