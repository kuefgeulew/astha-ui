// src/types/global.d.ts
export {};

declare global {
  interface Window {
    Vapi?: any; // exposed by the Vapi CDN script
  }
}
