// frontend/src/lib/notifications/notify.js
/**
 * NotificationService re-export facade
 *
 * This file re-exports NotificationService from @/lib/notify
 * to maintain backward compatibility for existing imports.
 *
 * Rule F4 Compliance: This file does NOT import from "sonner".
 * The sonner import is only allowed in @/lib/notify.js
 */
export { NotificationService } from "@/lib/notify";
