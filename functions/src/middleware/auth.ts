import * as admin from "firebase-admin";
import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";

const db = admin.firestore();

export interface AuthenticatedRequest extends Request {
  companyId?: string;
  apiKeyId?: string;
  permissions?: string[];
  userId?: string;
}

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function authenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid API key" });
      return;
    }

    const apiKey = authHeader.substring(7);

    const snapshot = await db
      .collectionGroup("api_keys")
      .where("keyHash", "==", hashKey(apiKey))
      .limit(1)
      .get();

    if (snapshot.empty) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }

    const keyDoc = snapshot.docs[0];
    const keyData = keyDoc.data();
    const companyId = keyDoc.ref.parent.parent?.id;

    if (!companyId) {
      res.status(401).json({ error: "Invalid API key structure" });
      return;
    }

    if (keyData.expiresAt && keyData.expiresAt.toDate() < new Date()) {
      res.status(401).json({ error: "API key expired" });
      return;
    }

    if (keyData.ipWhitelist && keyData.ipWhitelist.length > 0) {
      const clientIp = req.ip || "";
      if (!keyData.ipWhitelist.includes(clientIp)) {
        res.status(403).json({ error: "IP address not whitelisted" });
        return;
      }
    }

    await keyDoc.ref.update({
      lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    req.companyId = companyId;
    req.apiKeyId = keyDoc.id;
    req.permissions = keyData.permissions || [];

    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing authentication token" });
      return;
    }

    const token = authHeader.substring(7);

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;

    const userDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const userData = userDoc.data();
    req.companyId = userData?.companyId;

    next();
  } catch (error) {
    console.error("User auth error:", error);
    res.status(401).json({ error: "Invalid authentication token" });
  }
}

export function hasPermission(requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userPermissions = req.permissions || [];
    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasPermission) {
      res.status(403).json({
        error: "Insufficient permissions",
        required: requiredPermissions,
      });
      return;
    }

    next();
  };
}
