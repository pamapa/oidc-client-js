// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Log } from './Log';
import { OidcClient } from './OidcClient';
import { OidcClientSettings } from './OidcClientSettings';
import { WebStorageStateStore } from './WebStorageStateStore';
import { InMemoryWebStorage } from './InMemoryWebStorage';
import { UserManager } from './UserManager';
import { AccessTokenEvents } from './AccessTokenEvents';
import { MetadataService } from './MetadataService';
import { CordovaPopupNavigator } from './CordovaPopupNavigator';
import { CordovaIFrameNavigator } from './CordovaIFrameNavigator';
import { CheckSessionIFrame } from './CheckSessionIFrame';
import { TokenRevocationClient } from './TokenRevocationClient';
import { SessionMonitor } from './SessionMonitor';
import { Global } from './Global';
import { User } from './User';

import { Version } from './Version';

export default {
    Version,
    Log,
    OidcClient,
    OidcClientSettings,
    WebStorageStateStore,
    InMemoryWebStorage,
    UserManager,
    AccessTokenEvents,
    MetadataService,
    CordovaPopupNavigator,
    CordovaIFrameNavigator,
    CheckSessionIFrame,
    TokenRevocationClient,
    SessionMonitor,
    Global,
    User
};
