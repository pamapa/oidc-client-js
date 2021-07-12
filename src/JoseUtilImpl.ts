// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from './Log';

export default function getJoseUtil({ jws, KeyUtil, X509, crypto, hextob64u, b64tohex, AllowedSigningAlgs }: any) {
    return class JoseUtil {

        static parseJwt(jwt: any) {
            Log.debug("JoseUtil.parseJwt");
            try {
                var token = jws.JWS.parse(jwt);
                return {
                    header: token.headerObj,
                    payload: token.payloadObj
                }
            } catch (e) {
                Log.error(e);
                return null;
            }
        }

        static validateJwt(jwt: any, key: any, issuer: string, audience: string, clockSkew: number, now?: number, timeInsensitive = false) {
            Log.debug("JoseUtil.validateJwt");

            try {
                if (key.kty === "RSA") {
                    if (key.e && key.n) {
                        key = KeyUtil.getKey(key);
                    } else if (key.x5c && key.x5c.length) {
                        var hex = b64tohex(key.x5c[0]);
                        key = X509.getPublicKeyFromCertHex(hex);
                    } else {
                        Log.error("JoseUtil.validateJwt: RSA key missing key material", key);
                        return Promise.reject(new Error("RSA key missing key material"));
                    }
                } else if (key.kty === "EC") {
                    if (key.crv && key.x && key.y) {
                        key = KeyUtil.getKey(key);
                    } else {
                        Log.error("JoseUtil.validateJwt: EC key missing key material", key);
                        return Promise.reject(new Error("EC key missing key material"));
                    }
                } else {
                    Log.error("JoseUtil.validateJwt: Unsupported key type", key && key.kty);
                    return Promise.reject(new Error("Unsupported key type: " + key && key.kty));
                }

                return JoseUtil._validateJwt(jwt, key, issuer, audience, clockSkew, now, timeInsensitive);
            } catch (e) {
                Log.error(e && e.message || e);
                return Promise.reject("JWT validation failed");
            }
        }

        static validateJwtAttributes(jwt: any, issuer: string, audience: string, clockSkew: number, now?: number, timeInsensitive=false) {
            if (!clockSkew) {
                clockSkew = 0;
            }

            if (!now) {
                now = Date.now() / 1000;
            }

            const parsedJwt = JoseUtil.parseJwt(jwt);
            if (!parsedJwt || !parsedJwt.payload) {
                return Promise.reject(new Error("Failed to parse token"));
            }

            var payload = parsedJwt.payload;

            if (!payload.iss) {
                Log.error("JoseUtil._validateJwt: issuer was not provided");
                return Promise.reject(new Error("issuer was not provided"));
            }
            if (payload.iss !== issuer) {
                Log.error("JoseUtil._validateJwt: Invalid issuer in token", payload.iss);
                return Promise.reject(new Error("Invalid issuer in token: " + payload.iss));
            }

            if (!payload.aud) {
                Log.error("JoseUtil._validateJwt: aud was not provided");
                return Promise.reject(new Error("aud was not provided"));
            }
            var validAudience = payload.aud === audience || (Array.isArray(payload.aud) && payload.aud.indexOf(audience) >= 0);
            if (!validAudience) {
                Log.error("JoseUtil._validateJwt: Invalid audience in token", payload.aud);
                return Promise.reject(new Error("Invalid audience in token: " + payload.aud));
            }
            if (payload.azp && payload.azp !== audience) {
                Log.error("JoseUtil._validateJwt: Invalid azp in token", payload.azp);
                return Promise.reject(new Error("Invalid azp in token: " + payload.azp));
            }

            if (!timeInsensitive) {
                var lowerNow = now + clockSkew;
                var upperNow = now - clockSkew;

                if (!payload.iat) {
                    Log.error("JoseUtil._validateJwt: iat was not provided");
                    return Promise.reject(new Error("iat was not provided"));
                }
                if (lowerNow < payload.iat) {
                    Log.error("JoseUtil._validateJwt: iat is in the future", payload.iat);
                    return Promise.reject(new Error("iat is in the future: " + payload.iat));
                }

                if (payload.nbf && lowerNow < payload.nbf) {
                    Log.error("JoseUtil._validateJwt: nbf is in the future", payload.nbf);
                    return Promise.reject(new Error("nbf is in the future: " + payload.nbf));
                }

                if (!payload.exp) {
                    Log.error("JoseUtil._validateJwt: exp was not provided");
                    return Promise.reject(new Error("exp was not provided"));
                }
                if (payload.exp < upperNow) {
                    Log.error("JoseUtil._validateJwt: exp is in the past", payload.exp);
                    return Promise.reject(new Error("exp is in the past:" + payload.exp));
                }
            }

            return Promise.resolve(payload);
        }

        static _validateJwt(jwt: any, key: string, issuer: string, audience: string, clockSkew: number, now?: number, timeInsensitive = false) {

            return JoseUtil.validateJwtAttributes(jwt, issuer, audience, clockSkew, now, timeInsensitive).then(payload => {
                try {
                    if (!jws.JWS.verify(jwt, key, AllowedSigningAlgs)) {
                        Log.error("JoseUtil._validateJwt: signature validation failed");
                        return Promise.reject(new Error("signature validation failed"));
                    }

                    return payload;
                } catch (e) {
                    Log.error(e && e.message || e);
                    return Promise.reject(new Error("signature validation failed"));
                }
            });
        }

        static hashString(value: any, alg: string) {
            try {
                return crypto.Util.hashString(value, alg);
            } catch (e) {
                Log.error(e);
            }
        }

        static hexToBase64Url(value: any) {
            try {
                return hextob64u(value);
            } catch (e) {
                Log.error(e);
            }
        }
    }
}
