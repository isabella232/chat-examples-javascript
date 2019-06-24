/* global test, describe, expect, jasmine, beforeEach, afterEach */
import PubNub from 'pubnub';
import loadEnvironment from '../load-env';

loadEnvironment();

const subscribeKey = process.env.PAM_SUBSCRIBE_KEY || 'demo';
const publishKey = process.env.PAM_PUBLISH_KEY || 'demo';
const secretKey = process.env.PAM_SECRET_KEY || 'demo';

describe('Authorization', () => {
  let observerPubNubClient = null;
  let pubNubClient = null;

  beforeEach(() => {
    let uuid = PubNub.generateUUID();
    pubNubClient = new PubNub({
      uuid,
      subscribeKey,
      publishKey,
      secretKey,
    });

    uuid = PubNub.generateUUID();
    observerPubNubClient = new PubNub({
      uuid,
      authKey: uuid,
      subscribeKey,
      publishKey,
    });

    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    observerPubNubClient.removeAllListeners();
    observerPubNubClient.unsubscribeAll();
    pubNubClient.removeAllListeners();
    pubNubClient.unsubscribeAll();
    pubNubClient.stop();
  });

  test('Connect admin mode', () => {
    // tag::PAM-1[]
    const pubnub = new PubNub({
      subscribeKey: 'mySubscribeKey',
      publishKey: 'myPublishKey',
      secretKey: 'mySecretKey',
    });
    // end::PAM-1[]

    expect(pubnub).toBeDefined();
  });

  test('Grant read/write access', (done) => {
    const expectedAuthKey = observerPubNubClient.getUUID();
    const expectedChannel = PubNub.generateUUID();
    const pubnub = pubNubClient;

    const handleGrant = (grantStatus) => {
      if (grantStatus.error) {
        console.log('#1 ERROR:', grantStatus);
      }

      expect(grantStatus.error).toBeFalsy();

      observerPubNubClient.publish({
        channel: expectedChannel,
        message: {
          senderId: 'user123',
          text: 'Hello, hoomans!',
        },
      }, (status, response) => {
        if (status.error) {
          console.log('#2 ERROR:', status);
        }
        expect(status.error).toBeFalsy();
        expect(response.timetoken).toBeDefined();

        done();
      });
    };

    // tag::PAM-2[]
    pubnub.grant({
      // tag::ignore[]
      channels: [expectedChannel],
      authKeys: [expectedAuthKey],
      ttl: 10,
      /**
      // end::ignore[]
      channels: ['room-1'],
      authKeys: ['abcxyz123-auth-key'],
      ttl: 1440,  // 0 for no expiration
      // tag::ignore[]
       */
      // end::ignore[]
      read: true, // false to disallow
      write: true, // false to disallow
    }, (status) => {
      // handle status
      // tag::ignore[]

      setTimeout(() => {
        handleGrant(status);
      }, 5000);
      // end::ignore[]
    });
    // end::PAM-2[]
  });

  test('Granting read-only access', (done) => {
    const expectedAuthKey = observerPubNubClient.getUUID();
    const expectedChannel = PubNub.generateUUID();
    const pubnub = pubNubClient;

    const handleGrant = (grantStatus) => {
      if (grantStatus.error) {
        console.log('#1 ERROR:', grantStatus);
      }

      expect(grantStatus.error).toBeFalsy();

      observerPubNubClient.publish({
        channel: expectedChannel,
        message: {
          senderId: 'user123',
          text: 'Hello, hoomans!',
        },
      }, (status, response) => {
        expect(status.error).toBeTruthy();
        expect(response).not.toBeDefined();

        done();
      });
    };

    // tag::PAM-3[]
    pubnub.grant({
      // tag::ignore[]
      channels: [expectedChannel],
      authKeys: [expectedAuthKey],
      ttl: 10,
      /**
      // end::ignore[]
      channels: ['room-1'],
      authKeys: ['abcxyz123-auth-key'],
      ttl: 1440,  // 0 for no expiration
      // tag::ignore[]
       */
      // end::ignore[]
      read: true, // false to disallow
      write: false, // false to disallow
    }, (status) => {
      // handle status
      // tag::ignore[]

      setTimeout(() => {
        handleGrant(status);
      }, 5000);
      // end::ignore[]
    });
    // end::PAM-3[]
  });

  test('Granting write-only access', (done) => {
    const expectedAuthKey = observerPubNubClient.getUUID();
    const expectedChannel = PubNub.generateUUID();
    const pubnub = pubNubClient;

    const handleGrant = (grantStatus) => {
      if (grantStatus.error) {
        console.log('#1 ERROR:', grantStatus);
      }

      expect(grantStatus.error).toBeFalsy();

      observerPubNubClient.history({
        channel: expectedChannel,
      }, (status, response) => {
        expect(status.error).toBeTruthy();
        expect(response).not.toBeDefined();

        done();
      });
    };

    // tag::PAM-4[]
    pubnub.grant({
      // tag::ignore[]
      channels: [expectedChannel],
      authKeys: [expectedAuthKey],
      ttl: 10,
      /**
      // end::ignore[]
      channels: ['room-1'],
      authKeys: ['abcxyz123-auth-key'],
      ttl: 1440,  // 0 for no expiration
      // tag::ignore[]
       */
      // end::ignore[]
      read: false, // false to disallow
      write: true, // false to disallow
    }, (status) => {
      // handle status
      // tag::ignore[]

      setTimeout(() => {
        handleGrant(status);
      }, 5000);
      // end::ignore[]
    });
    // end::PAM-4[]
  });

  test('Revoking access', (done) => {
    const expectedAuthKey = observerPubNubClient.getUUID();
    const expectedChannel = PubNub.generateUUID();
    const channels = [expectedChannel];
    const authKeys = [expectedAuthKey];
    const pubnub = pubNubClient;

    const handleGrant = (revoking) => {
      if (revoking) {
        observerPubNubClient.history({
          channel: expectedChannel,
        }, (status, response) => {
          expect(status.error).toBeTruthy();
          expect(response).not.toBeDefined();

          done();
        });
      } else {
        // tag::PAM-5[]
        pubnub.grant({
          // tag::ignore[]
          channels,
          authKeys,
          /**
           // end::ignore[]
           channels: ['room-1'],
           authKeys: ['abcxyz123-auth-key'],
           // tag::ignore[]
           */
          // end::ignore[]
          read: false, // false to disallow
          write: false, // false to disallow
        }, (status) => {
          // handle status
          // tag::ignore[]

          if (status.error) {
            console.log('#2 ERROR:', status);
          }

          expect(status.error).toBeFalsy();
          setTimeout(() => {
            handleGrant(true);
          }, 10000);
          // end::ignore[]
        });
        // end::PAM-5[]
      }
    };

    pubnub.grant({
      channels, authKeys, ttl: 10, read: true, write: true,
    }, (status) => {
      if (status.error) {
        console.log('#1 ERROR:', status);
      }

      expect(status.error).toBeFalsy();

      setTimeout(() => {
        handleGrant(false);
      }, 5000);
    });
  });

  test('Managing access with channel groups', (done) => {
    const expectedAuthKey = observerPubNubClient.getUUID();
    const expectedChannelGroup = PubNub.generateUUID();
    const expectedChannel = PubNub.generateUUID();
    const pubnub = pubNubClient;

    const handleGrant = (grantStatus) => {
      if (grantStatus.error) {
        console.log('#1 ERROR:', grantStatus);
      }

      expect(grantStatus.error).toBeFalsy();

      observerPubNubClient.channelGroups.addChannels({
        channels: [expectedChannel],
        channelGroup: [expectedChannelGroup],
      }, (status) => {
        if (status.error) {
          console.log('#2 ERROR:', status);
        }
        expect(status.error).toBeFalsy();

        done();
      });
    };

    // tag::PAM-6[]
    pubnub.grant({
      // tag::ignore[]
      channelGroups: [expectedChannelGroup],
      authKeys: [expectedAuthKey],
      ttl: 10,
      /**
      // end::ignore[]
      channelGroups: ['family'],
      authKeys: ['abcxyz123-auth-key'],
      ttl: 1440,  // 0 for no expiration
      // tag::ignore[]
       */
      // end::ignore[]
      read: true, // false to disallow
      write: true, // false to disallow
      manage: true, // false to disallow
    }, (status) => {
      // handle status
      // tag::ignore[]

      setTimeout(() => {
        handleGrant(status);
      }, 5000);
      // end::ignore[]
    });
    // end::PAM-6[]
  });

  test('Connecting to PubNub from a client', () => {
    const myAuthKey = PubNub.generateUUID();
    const myUUID = PubNub.generateUUID();

    // tag::PAM-7[]
    const pubnub = new PubNub({
      subscribeKey: 'mySubscribeKey',
      publishKey: 'myPublishKey',
      authKey: myAuthKey, // generated by security authority
      uuid: myUUID,
    });
    // end::PAM-7[]

    expect(pubnub).toBeDefined();
    expect(pubnub.getUUID()).toEqual(myUUID);
  });

  test('Handling "permission denied" errors', (done) => {
    const expectedAuthKey = observerPubNubClient.getUUID();
    const expectedChannel = PubNub.generateUUID();
    const channels = [expectedChannel];
    const authKeys = [expectedAuthKey];

    const handlePublishError = () => {
      observerPubNubClient.setAuthKey(expectedAuthKey);

      observerPubNubClient.publish({
        channel: expectedChannel,
        message: {
          senderId: 'user123',
          text: 'Hello, hoomans!',
        },
      }, (status, response) => {
        if (status.error) {
          console.log('#2 ERROR:', status);
        }

        expect(status.error).toBeFalsy();
        expect(response.timetoken).toBeDefined();

        done();
      });
    };

    const handleGrant = () => {
      observerPubNubClient.setAuthKey('my_new_auth_key');
      const pubnub = observerPubNubClient;

      // tag::PAM-8[]
      pubnub.publish({
        // tag::ignore[]
        channel: expectedChannel,
        /**
         // end::ignore[]
        channel: 'room-1',
         // tag::ignore[]
         */
        // end::ignore[]
        message: {
          senderId: 'user123',
          text: 'Hello, hoomans!',
        },
      }, (status) => {
        // tag::ignore[]
        expect(status.error).toBeTruthy();

        // end::ignore[]
        if (status.category === 'PNAccessDeniedCategory') {
          // tag::ignore[]
          /**
           // end::ignore[]
           pubnub.setAuthKey('my_new_auth_key');
           // tag::ignore[]
           */

          handlePublishError();
          // end::ignore[]
        }
      });
      // end::PAM-8[]
    };

    pubNubClient.grant({
      channels, authKeys, ttl: 10, read: true, write: true,
    }, (status) => {
      if (status.error) {
        console.log('#1 ERROR:', status);
      }

      expect(status.error).toBeFalsy();

      setTimeout(() => {
        handleGrant();
      }, 5000);
    });
  });
});
