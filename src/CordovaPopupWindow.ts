// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from './Log';

const DefaultPopupFeatures = 'location=no,toolbar=no,zoom=no';
const DefaultPopupTarget = "_blank";

export class CordovaPopupWindow {
    private _promise: Promise<unknown>;
    private _resolve!: (value: unknown) => void;
    private _reject!: (reason?: any) => void;
    private features: string;
    private target: string;
    private redirect_uri: string;
    private _popup: any;
    private _exitCallbackEvent?: (message: any) => void;
    private _loadStartCallbackEvent?: (event: any) => void;

    constructor(params: any) {
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });

        this.features = params.popupWindowFeatures || DefaultPopupFeatures;
        this.target = params.popupWindowTarget || DefaultPopupTarget;

        this.redirect_uri = params.startUrl;
        Log.debug("CordovaPopupWindow.ctor: redirect_uri: " + this.redirect_uri);
    }

    _isInAppBrowserInstalled(cordovaMetadata: any) {
        return ["cordova-plugin-inappbrowser", "cordova-plugin-inappbrowser.inappbrowser", "org.apache.cordova.inappbrowser"].some(function (name) {
            return cordovaMetadata.hasOwnProperty(name)
        })
    }

    navigate(params: any) {
        if (!params || !params.url) {
            this._error("No url provided");
        } else {
            // @ts-ignore
            if (!window.cordova) {
                return this._error("cordova is undefined")
            }

            // @ts-ignore
            var cordovaMetadata = window.cordova.require("cordova/plugin_list").metadata;
            if (this._isInAppBrowserInstalled(cordovaMetadata) === false) {
                return this._error("InAppBrowser plugin not found")
            }

            // @ts-ignore
            this._popup = cordova.InAppBrowser.open(params.url, this.target, this.features);
            if (this._popup) {
                Log.debug("CordovaPopupWindow.navigate: popup successfully created");

                this._exitCallbackEvent = this._exitCallback.bind(this);
                this._loadStartCallbackEvent = this._loadStartCallback.bind(this);

                this._popup.addEventListener("exit", this._exitCallbackEvent, false);
                this._popup.addEventListener("loadstart", this._loadStartCallbackEvent, false);
            } else {
                this._error("Error opening popup window");
            }
        }
        return this.promise;
    }

    get promise() {
        return this._promise;
    }

    _loadStartCallback(event: any) {
        if (event.url.indexOf(this.redirect_uri) === 0) {
            this._success({ url: event.url });
        }
    }
    _exitCallback(message: string) {
        this._error(message);
    }

    _success(data: any) {
        this._cleanup();

        Log.debug("CordovaPopupWindow: Successful response from cordova popup window");
        this._resolve(data);
    }
    _error(message: string) {
        this._cleanup();

        Log.error(message);
        this._reject(new Error(message));
    }

    close() {
        this._cleanup();
    }

    _cleanup() {
        if (this._popup){
            Log.debug("CordovaPopupWindow: cleaning up popup");
            this._popup.removeEventListener("exit", this._exitCallbackEvent, false);
            this._popup.removeEventListener("loadstart", this._loadStartCallbackEvent, false);
            this._popup.close();
        }
        this._popup = null;
    }
}
