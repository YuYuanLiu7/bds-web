import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// NextAuth 設定已移至 src/lib/auth.ts，讓其他模組不必 import 這條 route
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
