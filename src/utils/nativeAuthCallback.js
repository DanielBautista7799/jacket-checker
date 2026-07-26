import { supabase } from "../lib/supabaseClient";
import {
consumePendingAuthIntent,
getAuthDestination,
isNativeAuthCallbackUrl,
normalizeAuthIntent,
readPendingAuthIntent,
} from "./authRedirects";

function getCallbackParameters(url) {
const hashParameters = new URLSearchParams(
url.hash.replace(/^#/, ""),
);

return {
get(name) {
    return (
    url.searchParams.get(name) ||
    hashParameters.get(name) ||
    ""
    );
},
};
}

function getSafeCallbackError(parameters) {
const errorCode = parameters
.get("error_code")
.toLowerCase();

const errorDescription = parameters
.get("error_description")
.toLowerCase();

if (
errorCode.includes("expired") ||
errorCode.includes("otp_expired") ||
errorDescription.includes("expired")
) {
return "This authentication link has expired. Request a new link and try again.";
}

return "The authentication link could not be completed. Request a new link and try again.";
}

function getSafeExchangeError(error) {
const message = String(
error?.message || "",
).toLowerCase();

if (
message.includes("expired") ||
message.includes("already been used")
) {
return "This authentication link has expired or already been used. Request a new link and try again.";
}

if (
message.includes("code verifier") ||
message.includes("auth code") ||
message.includes("pkce")
) {
return "This authentication link must be opened on the same device where it was requested.";
}

return "Jacket Checker could not complete authentication. Request a new link and try again.";
}

export async function completeNativeAuthCallback(
value,
) {
if (!isNativeAuthCallbackUrl(value)) {
return {
    handled: false,
};
}

const callbackUrl = new URL(value);
const parameters =
getCallbackParameters(callbackUrl);

if (
parameters.get("error") ||
parameters.get("error_code")
) {
throw new Error(
    getSafeCallbackError(parameters),
);
}

const authorizationCode =
parameters.get("code");

const accessToken =
parameters.get("access_token");

const refreshToken =
parameters.get("refresh_token");

const hasImplicitSession =
Boolean(accessToken) &&
Boolean(refreshToken);

if (!authorizationCode && !hasImplicitSession) {
throw new Error(
    "This authentication link is incomplete. Request a new link and try again.",
);
}

const callbackType = normalizeAuthIntent(
parameters.get("type"),
);

const intent =
callbackType ||
readPendingAuthIntent() ||
"sign-up";

let session = null;

try {
if (authorizationCode) {
    const { data, error } =
    await supabase.auth.exchangeCodeForSession(
        authorizationCode,
    );

    if (error) {
    throw error;
    }

    session = data.session;
} else {
    const { data, error } =
    await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    if (error) {
    throw error;
    }

    session = data.session;
}
} catch (error) {
throw new Error(
    getSafeExchangeError(error),
);
}

if (!session) {
throw new Error(
    "The authentication link did not create a valid session. Request a new link and try again.",
);
}

consumePendingAuthIntent();

return {
handled: true,
intent,
destination: getAuthDestination(intent),
session,
};
}