
export const encodeUtf8Hex = (s: string): string => Buffer.from(s, "utf8").toString("hex");

// export const decodeUtf8Hex = (hex: string): string => Buffer.from(hex, "hex").toString("utf8");
