// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from './Log';
import { Global } from './Global';
import { Event } from './Event';

const TimerDuration = 5; // seconds

export class Timer extends Event {
    private _timer: { setInterval: (cb: (...args: any[]) => void, duration?: number | undefined) => NodeJS.Timeout; clearInterval: (handle: NodeJS.Timeout) => void; };
    private _nowFunc: () => number;
    private _timerHandle: NodeJS.Timeout | null;
    private _expiration: number;

    constructor(name: string, timer = Global.timer, nowFunc?: (() => number)) {
        super(name);
        this._timer = timer;

        if (nowFunc) {
            this._nowFunc = nowFunc;
        }
        else {
            this._nowFunc = () => Date.now() / 1000;
        }

        this._timerHandle = null;
        this._expiration = 0;
    }

    get now() {
        return this._nowFunc();
    }

    init(duration: number) {
        if (duration <= 0) {
            duration = 1;
        }

        var expiration = this.now + duration;
        if (this.expiration === expiration && this._timerHandle) {
            // no need to reinitialize to same expiration, so bail out
            Log.debug("Timer.init timer " + this._name + " skipping initialization since already initialized for expiration:", this.expiration);
            return;
        }

        this.cancel();

        Log.debug("Timer.init timer " + this._name + " for duration:", duration);
        this._expiration = expiration;

        // we're using a fairly short timer and then checking the expiration in the
        // callback to handle scenarios where the browser device sleeps, and then
        // the timers end up getting delayed.
        var timerDuration = TimerDuration;
        if (duration < timerDuration) {
            timerDuration = duration;
        }
        this._timerHandle = this._timer.setInterval(this._callback.bind(this), timerDuration * 1000);
    }

    get expiration() {
        return this._expiration;
    }

    cancel() {
        if (this._timerHandle) {
            Log.debug("Timer.cancel: ", this._name);
            this._timer.clearInterval(this._timerHandle);
            this._timerHandle = null;
        }
    }

    _callback() {
        var diff = this._expiration - this.now;
        Log.debug("Timer.callback; " + this._name + " timer expires in:", diff);

        if (this._expiration <= this.now) {
            this.cancel();
            super.raise();
        }
    }
}
