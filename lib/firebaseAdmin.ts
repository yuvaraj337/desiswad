
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not configured"
    );
  }

  let serviceAccount: Record<string, unknown>;

  try {
    serviceAccount = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON"
    );
  }

  if (typeof serviceAccount.private_key === "string") {
    serviceAccount.private_key =
      serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  return initializeApp({
    credential: cert(
      serviceAccount as Parameters<typeof cert>[0]
    ),
  });
}

export const adminAuth = new Proxy(
  {} as ReturnType<typeof getAdminAuth>,
  {
    get(_target, property) {
      const auth = getAdminAuth(getAdminApp());
      const value = Reflect.get(auth, property, auth);

      return typeof value === "function"
        ? value.bind(auth)
        : value;
    },
  }
);

export const adminDb = new Proxy(
  {} as ReturnType<typeof getFirestore>,
  {
    get(_target, property) {
      const db = getFirestore(getAdminApp());
      const value = Reflect.get(db, property, db);

      return typeof value === "function"
        ? value.bind(db)
        : value;
    },
  }
);
