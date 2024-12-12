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
export const getEnvs = () => {
    if (ENV.PORT == -1) { // not initialized
        try {
            // Load host address
            ENV.HOST = process.env.HOST !== undefined ? process.env.HOST : (() => { throw new Error('HOST is not defined in the environment'); })();
            // Load and validate PORT
            const port = parseInt(process.env.PORT, 10);
            if (isNaN(port) || port < 1024 || port > 65535) {
                throw new Error('PORT must be a number between 1024 and 65535');
            }
            ENV.PORT = port;
            // Load INFLUX configuration
            ENV.INFLUX.HOST = process.env.DB_INFLUX_HOST || 'http://localhost:8086';
            ENV.INFLUX.ORG = process.env.DB_INFLUX_ORG || (() => { throw new Error('INFLUX_ORG is not defined'); })();
            ENV.INFLUX.BUCKET = process.env.DB_INFLUX_BUCKET || (() => { throw new Error('INFLUX_BUCKET is not defined'); })();
            ENV.INFLUX.TOKEN = process.env.DB_INFLUX_TOKEN || (() => { throw new Error('INFLUX_TOKEN is not defined'); })();
            return ENV;
        } catch (err) {
            console.error(err);
            throw new Error('Exiting program.');
        }
    } else {
        return ENV;
    }
}
