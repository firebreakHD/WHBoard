/** Sends a short tap through the HA Companion bridge, with browser vibration as fallback. */
export function triggerHaptic(enabled = true) {
  if (!enabled || typeof window === "undefined") return;

  const event = new Event("haptic", { bubbles: true, composed: true }) as Event & { detail?: string };
  event.detail = "light";

  try {
    const host = window.parent;
    host.dispatchEvent(event);
    if (host === window && "vibrate" in navigator) navigator.vibrate?.(10);
  } catch {
    try {
      if ("vibrate" in navigator) navigator.vibrate?.(10);
    } catch {
      // Haptic feedback is optional and unsupported devices stay silent.
    }
  }
}
