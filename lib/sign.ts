/* ------------------------------------------------------------------
   QR imzo — ECDSA P-256
   Kalitlar: .env dagi SIGN_PRIVATE_KEY / SIGN_PUBLIC_KEY (PEM, base64)
   Yaratish:
     openssl ecparam -genkey -name prime256v1 -noout -out ec-priv.pem
     openssl ec -in ec-priv.pem -pubout -out ec-pub.pem
------------------------------------------------------------------ */
import { createSign, createVerify } from "node:crypto";

export interface SignPayload {
  doc: string;        // hujjat turi
  docId: string;      // hujjat ID
  field?: string;     // maydon raqami
  userId: string;
  fio: string;
  lavozim: string;
  tabel: string;
  sana: string;       // ISO
}

const pem = (v?: string) =>
  !v ? "" : v.includes("BEGIN") ? v.replace(/\\n/g, "\n") : Buffer.from(v, "base64").toString("utf8");

export function signPayload(p: SignPayload): string {
  const key = pem(process.env.SIGN_PRIVATE_KEY);
  if (!key) throw new Error("SIGN_PRIVATE_KEY sozlanmagan");
  const s = createSign("SHA256");
  s.update(JSON.stringify(p));
  s.end();
  return s.sign(key, "base64");
}

export function verifyPayload(p: SignPayload, imzo: string): boolean {
  const key = pem(process.env.SIGN_PUBLIC_KEY);
  if (!key) return false;
  const v = createVerify("SHA256");
  v.update(JSON.stringify(p));
  v.end();
  try { return v.verify(key, imzo, "base64"); } catch { return false; }
}

/** QR ichiga yoziladigan havola */
export const verifyUrl = (id: string) =>
  `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/verify/${id}`;
