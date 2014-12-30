# Node-VeraSmartHomeServer
A small Node Server to interact with the Vera Smart Home system (http://getvera.com/).

## Features:
- Set device states via command line
- Weekly schedules
- Set schedules at exact times or relative to local sunrise/sunset times
- All times are relative to the Timezone setting in the config file
- Vera UI7 remote url support. Given your vera username/password the system will fetch a remote url session
- API Server. When in server mode you can send RESTful API calls to control your vera system

## Some scheduling examples:
- Turn on the living room light every Tuesday and Thursday at 5pm
- Set the main thermostat to 70 degrees every weekday at 8am


# Global Dependencies
- node/npm http://nodejs.org/
- forever `[sudo] npm install forever -g`


# Setup
- Copy `config/config.sample.js` to `config/config.js` and modify accordingly. See comments in [Sample config](config/config.sample.js) for more details.
- Run the Install/Update script `./bin/update`
- Run `node index.js --help` for usage
- Run `./bin/start` to start the server with forever


# Updating
- Convenient update script that pulls in remote changes and installs any new dependencies `./bin/update`


# Usage
- Start the schedule and API Server: `node index.js --server`
- List all available devices: `node index.js --list`
- Preview the current schedule: `node index.js --preview`
- Change the state of a device: `node index.js [deviceId] [state]`
- Execute a scene: `node index.js [sceneId]`


# API
Set the port in `api.port` section of the config.
Basic Authentication is used to authenticate API calls. Simply pass a valid pre-shared key that you have placed in the `api.accessTokens` section of the config as the username portion and leave the password blank.

Example API Call:
```
curl -u "{accessToken}:" http://{ip-address}:{port}/api/devices

HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 220
Date: Fri, 21 Nov 2014 10:05:47 GMT
Connection: keep-alive

{
  "switches": [
    {
      "id": "1",
      "name": "Den Light"
    },
    {
      "id": "2",
      "name": "Outside Light"
    },
    {
      "id": "3",
      "name": "Master Bedroom"
    }
  ],
  "dimmableSwitches": [
    {
      "id": "4",
      "name": "Dining Room Light"
    }
  ],
  "thermostats": [
    {
      "id": "5",
      "name": "Thermostat"
    }
  ]
}
```

## GET /api/devices
Returns an array of all the devices on your vera system

## POST /api/devices/{deviceId}/{state}
Sets a new state given a device id

## POST /api/scenes/{sceneId}
Runs a scene given a scene id


License
=======

    Copyright 2014 Michael Barany

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
