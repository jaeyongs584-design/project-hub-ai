import { withAuth } from "next-auth/middleware";

export default withAuth;

export const config = {
    // Matches all paths except for login, signup, api, _next/static, _next/image, favicon.ico, and manifest.json
    matcher: ["/((?!login|signup|api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)"],
};
