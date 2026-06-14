import { prisma } from '../prisma/client.js';
import { getIpAddress, getUserAgent } from '../utils/request-context.js';
import { toRedactedJson } from '../utils/safe-json.js';

export const auditService = {
  async log(req, { action, entityType, entityId = null, beforeData = null, afterData = null, metadata = null, actorId = undefined, actorEmail = undefined }) {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: actorId === undefined ? (req.user?.id || null) : actorId,
          actorEmail: actorEmail === undefined ? (req.user?.email || null) : actorEmail,
          action,
          entityType,
          entityId: entityId ? String(entityId) : null,
          beforeData: beforeData === undefined ? null : toRedactedJson(beforeData),
          afterData: afterData === undefined ? null : toRedactedJson(afterData),
          metadata: metadata === undefined ? null : toRedactedJson(metadata),
          ipAddress: getIpAddress(req),
          userAgent: getUserAgent(req),
        },
      });
    } catch (error) {
      req.log?.warn?.({ err: error, action, entityType, entityId }, 'Unable to write audit log');
    }
  },
};
