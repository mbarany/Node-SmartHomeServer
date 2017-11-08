// Rename to config.js and modify to your liking

module.exports = {
    vera: {
        api: {
            url: 'http://192.168.1.X/port_3480/data_request',
            useRemote: true, // whether the remoteUrl should be used or not
            remoteUrl: 'https://vera-us-oem-relay41.mios.com/relay/relay/relay/device/{{unitId}}/session/{{session}}/port_3480/data_request',
            // vera unit id (aka serial number)
            unitId: '123456',
            // home.getvera.com credentials
            username: 'bob',
            password: 'pa$$word1',
        },
    },
    api: {
        //disabled: true, // optionally disable web server
        accessTokens: [ // used for API authentication
            'fn38g7ghg93hg98rhg7gh3r7g73hg'
        ],
        port: 443,
        // The following options are optional for SSL protection
        forceHttps: true,
        key: 'local/server.key',
        cert: 'local/server.cert',
        // A CA bundle usually contains multiple certificate.
        // They need to be in their own file here.
        caBundle: [
            'local/ca_intermediate1.cert',
            'local/ca_intermediate2.cert',
        ]
    },
    location: {
        lat: 40.7056308, //Used for getting Sunrise/Sunset times
        lon: -73.9780035, //Used for getting Sunrise/Sunset times
        timezone: 'America/New_York', //Used for setting schedule
    }
};
