// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { UrlUtility } from './UrlUtility';

const OidcScope = "openid";

export class SigninResponse {
    public readonly error: string;
    public readonly error_description: string;
    public readonly error_uri: string;

    public readonly code: string;
    public state: string;
    public readonly id_token: string;
    public readonly session_state: string;
    public readonly access_token: string;
    public readonly token_type: string;
    public scope: string;
    public profile: any |  undefined; // will be set from ResponseValidator

    private expires_at: number | undefined

    constructor(url: string, delimiter = "#") {

        var values = UrlUtility.parseUrlFragment(url, delimiter);

        this.error = values.error;
        this.error_description = values.error_description;
        this.error_uri = values.error_uri;

        this.code = values.code;
        this.state = values.state;
        this.id_token = values.id_token;
        this.session_state = values.session_state;
        this.access_token = values.access_token;
        this.token_type = values.token_type;
        this.scope = values.scope;
        this.profile = undefined; // will be set from ResponseValidator

        this.expires_at = undefined
        let expires_in = parseInt(values.expires_in);
        if (expires_in > 0) {
            let now = Date.now() / 1000;
            this.expires_at = now + expires_in;
        }
    }

    get expires_in(): number | undefined {
        if (this.expires_at) {
            let now = Date.now() / 1000;
            return this.expires_at - now;
        }
        return undefined;
    }

    get expired() {
        let expires_in = this.expires_in;
        if (expires_in !== undefined) {
            return expires_in <= 0;
        }
        return undefined;
    }

    get scopes() {
        return (this.scope || "").split(" ");
    }

    get isOpenIdConnect() {
        return this.scopes.indexOf(OidcScope) >= 0 || !!this.id_token;
    }
}
