
import { createHash, randomBytes } from "crypto";
export const getNonce = () => randomBytes(16).toString("base64");
export const getMd5 = (data: string | Uint8Array, encoding: "base64" | "hex") => createHash("md5").update(data).digest(encoding);
// export const getUuid = () => randomUUID(); // <---  randomUUID() not added until Node v14.17, VSCode Version 1.67 and lower will fail
export const getUuid = () => randomBytes(24).toString("hex");
