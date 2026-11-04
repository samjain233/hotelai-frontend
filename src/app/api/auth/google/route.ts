import { NextRequest } from "next/server";
import { startGoogleOAuth } from "@/lib/googleOAuthStart";

export async function GET(request: NextRequest) {
    return startGoogleOAuth(request, { platform: false });
}
