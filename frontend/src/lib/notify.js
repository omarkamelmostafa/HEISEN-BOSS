// frontend/src/lib/notify.js
/**
 * NotificationService — Static Facade over Sonner toast library.
 *
 * Architecture rules:
 * - This is the ONLY file (alongside sonner.jsx for the Toaster component)
 *   that may import from "sonner" (Constitution Rule F4).
 * - All other files must use:
 *     import { NotificationService } from "@/lib/notify"
 * - Pattern: Static class, no instantiation, no instance state.
 * - Parameter forwarding: explicit destructuring only (Rule F9 — no spread to Sonner API).
 */
import { toast } from "sonner";

export class NotificationService {
  /** @private Global toast position — read by Toaster component via getter */
  static #position = "top-center";

  /** @private Per-type duration defaults (ms) */
  static #durations = {
    success: 3500,
    error: 6000,
    warn: 5000,
    info: 4000,
  };

  /** Static-only class — prevent instantiation */
  constructor() {
    throw new Error(
      "NotificationService is a static class and cannot be instantiated."
    );
  }

  /**
   * Success toast — 3500ms default duration
   * @param {string} message
   * @param {{ id?: string, description?: string, duration?: number, action?: object }} [options]
   */
  static success(message, options = {}) {
    const { id, description, duration, action } = options;
    return toast.success(message, {
      id,
      description,
      duration: duration ?? NotificationService.#durations.success,
      action,
    });
  }

  /**
   * Error toast — 6000ms default duration (errors need more reading time)
   * @param {string} message
   * @param {{ id?: string, description?: string, duration?: number, action?: object }} [options]
   */
  static error(message, options = {}) {
    const { id, description, duration, action } = options;
    return toast.error(message, {
      id,
      description,
      duration: duration ?? NotificationService.#durations.error,
      action,
    });
  }

  /**
   * Warning toast — 5000ms default duration
   * Public method name is "warn"; internally calls Sonner's toast.warning().
   * @param {string} message
   * @param {{ id?: string, description?: string, duration?: number, action?: object }} [options]
   */
  static warn(message, options = {}) {
    const { id, description, duration, action } = options;
    return toast.warning(message, {
      id,
      description,
      duration: duration ?? NotificationService.#durations.warn,
      action,
    });
  }

  /**
   * Info toast — 4000ms default duration
   * @param {string} message
   * @param {{ id?: string, description?: string, duration?: number, action?: object }} [options]
   */
  static info(message, options = {}) {
    const { id, description, duration, action } = options;
    return toast.info(message, {
      id,
      description,
      duration: duration ?? NotificationService.#durations.info,
      action,
    });
  }

  /**
   * Promise toast — wraps Sonner's native toast.promise()
   * @param {Promise} promise
   * @param {{ loading?: string, success?: string, error?: string }} [messages]
   */
  static promise(promise, messages = {}) {
    const { loading, success, error } = messages;
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  }

  /**
   * Loading toast — persistent, never auto-dismisses.
   * Must be dismissed manually via NotificationService.dismiss(id).
   * Duration is intentionally NOT accepted to enforce persistence.
   * @param {string} message
   * @param {{ id?: string, description?: string, action?: object }} [options]
   */
  static loading(message, options = {}) {
    const { id, description, action } = options;
    return toast.loading(message, {
      id,
      description,
      action,
    });
  }

  /**
   * Dismiss a specific toast by ID, or all toasts if no ID provided.
   * @param {string} [id]
   */
  static dismiss(id) {
    return toast.dismiss(id);
  }

  /**
   * Public getter — used by Toaster component (sonner.jsx) for position sync.
   * Change #position above to update position globally.
   */
  static get position() {
    return NotificationService.#position;
  }
}
