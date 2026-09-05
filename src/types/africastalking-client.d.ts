// Minimal typing for Africa's Talking's browser softphone SDK (no types
// shipped). Surface limited to what PlaceCallDialog uses; see
// https://developers.africastalking.com/docs/voice/webRTC_client/usage
declare module "africastalking-client" {
  export type ClientEvent =
    | "ready"
    | "notready"
    | "calling"
    | "incomingcall"
    | "callaccepted"
    | "hangup"
    | "offline"
    | "closed";

  export interface HangupCause {
    code?: string | number;
    reason?: string;
  }

  export class Client {
    constructor(token: string, params?: { sounds?: { dialing?: string; ringing?: string } });
    on(event: ClientEvent, handler: (payload?: unknown) => void, useCapture?: boolean): void;
    call(numberOrClient: string): void;
    answer(): void;
    hangup(): void;
    dtmf(digit: string): void;
    muteAudio(): void;
    unmuteAudio(): void;
    hold(): void;
    unhold(): void;
  }

  const Africastalking: { Client: typeof Client };
  export default Africastalking;
}
