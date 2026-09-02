import { prisma } from "@/lib/prisma";

/**
 * Record an administrative action in the audit log (spec §34).
 * Audit logs are append-only: no update/delete is exposed by this service.
 */
export async function logAudit(params: {
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  detail?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        detail: params.detail ?? null,
      },
    });
  } catch (error) {
    // Never crash the user-facing flow because audit logging failed.
    console.error("Audit log write failed:", error);
  }
}