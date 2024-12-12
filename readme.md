# Initial setup

Initialise NPM project

```bash
npm init -y
npm install express @influxdata/influxdb-client

mkdir src
touch src/{server,envs}.mjs

npm pkg set type="module"
npm pkg set scripts.start="node --env-file=.env src/server.mjs"
npm pkg set scripts.dev="node --env-file=.env --watch-path=src src/server.mjs"
# set also "module" type for EcmaScript (example uses ES imports)

```

# Setup environment variables

1. Copy `dotenv` to `.env`
2. Change `.env` variable names
3. Test setup with `npm run start`

```bash
user@host:~/projects/db_api
$ cp dotenv .env # Copy environment variable template
user@host:~/projects/db_api
$ code .env # Fill in the actual environment variables
user@host:~/projects/db_api
$ npm run start # Test that the environment variables are loaded
```

# Start SSH tunnel to the InfluxDB for development purposes

```
Host server-with-influx
  HostName ip.addr.to.server
  User remoteuser
  IdentityFile ~/.ssh/remotekeyfilename
  LocalForward 8086 localhost:8086
```

```bash
user@host:~/projects/db_api
$ ssh server-with-influx
```

# Coding

Create server-side application, which collects query parameters and stores the results in InfluxDB.

```js
// Import Express and InfluxDB 
import express from 'express';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
// ...
// 1. Initialize
// Express app, Environment variables and DB related aspects

// 2. Define endpoints
app.get('/', (_, res) => res.send('ok')); // Endpoint example
// Endpoint to test query param test endpoint
// Api V1 endpoint (will be exposed to the internet)
app.get('/test', (req, res) => {
    console.log({ queryparams: req.query });
    res.send('received data!');
});

// 3. Start listening
app.listen(ENV.PORT, ENV.HOST, () => {});

```

To load environment variables reliably, write functionality to parse `.env` file. One example below.

```js
/**
 * @typedef {object} INFLUX_CONF
 * @property {string} HOST Default 'http://localhost:8086'
 * @property {string} ORG Organization name
 * @property {string} BUCKET Bucket name
 * @property {string} TOKEN Token name
 */

/**
 * @typedef {object} ENV
 * @property {number} PORT Service port number <1024-65535>
 * @property {number} HOST Service host address e.g., "127.0.0.1"
 * @property {INFLUX_CONF} INFLUX
 */

/** @type {ENV} */
const ENV = {
    PORT: -1, // Initialized as -1, invalid value
    HOST: '',
    INFLUX: {
        HOST: '',
        ORG: '',
        BUCKET: '',
        TOKEN: ''
    }
};


/**
 * Get environment variables.
 * @returns {ENV}
 * @throws {Error} for invalid environment variables
 */
export const getEnvs = () => {}; // Define logic
```

# Deploy

Transfer the code to your server by pushing changes first to a remote repository and then pull the changes from it into the production server.

## Local machine

Local machine preparative steps if project is cloned:

```bash
user@host:~/projects/db_api
$ git remote -v # Check remote repository
origin  https://example.com/group/orig_proj (fetch)
origin  https://example.com/group/orig_proj (pull)
user@host:~/projects/db_api
$ git remote set-url origin https://example.com/group/project_name # Point the repository to your own repository ("fork")
user@host:~/projects/db_api
$ git remote -v # Check remote repository
origin  https://example.com/group/project_name (fetch)
origin  https://example.com/group/project_name (push)
user@host:~/projects/db_api
$ git push -u origin main # May require  
```

Add changes to the repository:

```bash
git status # check git tree status
git add . # add all files to the staging zone
git commit -m "COMMIT_MESSAGE_HERE" # Save changes to the git history
git push # Push changes to the remote
```

## Remote machine

Clone repository somewhere in your system e.g.,

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://example.com/group/project_name
cd project_name
```

Now that the working directory is within the project directory, prepare files into a propriet place in the operating system. In Ubuntu, this could be at `/opt/project_name`.

```bash
PROJ_NAME="db_api"
PROJ_DIR="/opt/$PROJ_NAME"
PROJ_USER="apiuser"
PROJ_GROUP="apigroup"
# user and group name
sudo groupadd $PROJ_GROUP
sudo useradd -r -s /usr/sbin/nologin -g $PROJ_GROUP $PROJ_USER
# prepare project dir with privileges
sudo mkdir -p $PROJ_DIR
sudo chown -R $PROJ_USER:$PROJ_GROUP $PROJ_DIR
# copy required files
sudo cp package.json $PROJ_DIR
cp package.json $PROJ_DIR
cp dotenv $PROJ_DIR/.env
# Remember to modify .env values
cp -r src $PROJ_DIR
# Install dependencies
sudo -u $PROJ_USER /bin/bash
cd /opt/proj_name
npm i
# test service
npm run start
# Interrupt with CTRL+C
exit # to get back to the sudo user
# Move to the service definition once confirmed working.
```

Once the service is placed appropriately, then define service file for the systemd, which ensures service operation 24/7

```service
[Unit]
Description=DB_API Service
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/PROJ_NAME_HERE/src/server.mjs
WorkingDirectory=/opt/PROJ_NAME_HERE
Restart=always
RestartSec=10
User=PROJ_USER_HERE
Group=PROJ_GROUP_HERE
EnvironmentFile=PROJ_DIR/.env
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=dbapi-service

[Install]
WantedBy=multi-user.target

```




