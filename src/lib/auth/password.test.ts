import { expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";
import { isSameOrigin } from "./origin";
it("salts passwords and rejects incorrect or malformed credentials",async()=>{
 const first=await hashPassword("test-password-123");
 expect(await hashPassword("test-password-123")).not.toBe(first);
 expect(await verifyPassword("test-password-123",first)).toBe(true);
 expect(await verifyPassword("wrong-password",first)).toBe(false);
 expect(await verifyPassword("test-password-123","bad")).toBe(false);
});
it("rejects absent and foreign origins for cookie-authenticated writes",()=>{
 expect(isSameOrigin(new Request("http://localhost:5026/api/missions",{headers:{origin:"https://attacker.example"}}))).toBe(false);
 expect(isSameOrigin(new Request("http://localhost:5026/api/missions"))).toBe(false);
 expect(isSameOrigin(new Request("http://localhost:5026/api/missions",{headers:{origin:"http://localhost:5026"}}))).toBe(true);
});
