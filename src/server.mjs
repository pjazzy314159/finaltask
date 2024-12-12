// 1. import express & influx
import express from 'express';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { getEnvs } from './envs.mjs';

// 1. Initialize
const ENV = getEnvs();
console.log({ENV});
const app = express();

// 2.2. Initialise DB connection
const DB_CLIENT = new InfluxDB({
    url: ENV.INFLUX.HOST,
    token: ENV.INFLUX.TOKEN,
});
const DB_WRITE_POINT = DB_CLIENT.getWriteApi(ENV.INFLUX.ORG, ENV.INFLUX.BUCKET);
DB_WRITE_POINT.useDefaultTags({ app: "query-param-app" });

// 3. Endpoints
app.get('/', (_, res) => res.send('ok'));

app.get('/api/v1', (_, res) => res.send('API V1'));

// Consider organizing route code into separate files...
// import { route_v1 } from 'routes/v1';
// app.use(route_v1);...
app.get('/test', (req, res) => {
    console.log({ queryparams: req.query });
    // for (const key in req.query) {
    //     if (Object.prototype.hasOwnProperty.call(req.query, key)) {
    //         const element = req.query[key];
    //         console.log({ key: element });
    //     }
    // }
    res.send('received data!');
});

app.get('/api/v1/data', async (req, res) => {
    try {
        const queryApi = DB_CLIENT.getQueryApi(ENV.INFLUX.ORG);
        const query = `from(bucket: "${ENV.INFLUX.BUCKET}")
                            |> range(start: -30d)
                            |> filter(fn: (r) => r._measurement == "qparams")
                            |> filter(fn: (r) => r._field == "value")`;
        const data = [];

        await queryApi.queryRows(query, {
            next(row, tableMeta) {
                const res = tableMeta.toObject(row);
                data.push(res);
            },
            error(error) {
                console.error('Error quering:', error);
                res.status(500).send('Error fetching data.');
            },
            complete() {
                if (data.length === 0) {
                    res.status(404).send('No data found.');
                } else {
                    res.json(data);
                }
            }
        });
    } catch (error) {
        console.error('Error in /get/data:', error);
        res.status(500).send('Error querying data');
    }
});


// http://ip/embed?value=1234 => to database
app.get('/embed', async (req, res) => {
    try {
        const value = req.query.value;
        const numeric_value = parseFloat(value);
        const point = new Point("qparams");
        point.floatField("value", numeric_value)
        DB_WRITE_POINT.writePoint(point);
        await DB_WRITE_POINT.flush();
        res.send(`Value: '${value}' written.`);
    } catch(err) {
        console.error(err);
        res.sendStatus(500);
    }
});
// 4. listen express
app.listen(ENV.PORT, ENV.HOST, () => {
    console.log(`Listening at http://${ENV.HOST}:${ENV.PORT}`);
});
