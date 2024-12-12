// influxdb.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:mock';
import { InfluxDB } from '@influxdata/influxdb-client';

// Mock the InfluxDB client
mock('#/node_modules/@influxdata/influxdb-client', {
  InfluxDB: class {
    getWriteApi() {
      return {
        writeRecord: async () => Promise.resolve(),
        close: async () => Promise.resolve(),
      };
    }

    getQueryApi() {
      return {
        queryRows: (query, { next, complete }) => {
          next({ _value: 23.5 }); // Simulate a query result
          complete();
        },
      };
    }
  },
});

test('should write a record successfully', async (t) => {
  const influxDB = new InfluxDB({ url: 'http://localhost:8086', token: 'mock-token' });
  const writeApi = influxDB.getWriteApi('org', 'bucket');

  // Call the mocked writeRecord method
  await writeApi.writeRecord('temperature,location=office value=23.5');

  assert.ok(writeApi.writeRecord); // Ensure the method exists
});

test('should query data successfully', (t) => {
  const influxDB = new InfluxDB({ url: 'http://localhost:8086', token: 'mock-token' });
  const queryApi = influxDB.getQueryApi('org');

  let result;
  queryApi.queryRows('from(bucket: "bucket") |> range(start: -1h)', {
    next: (row) => {
      result = row;
    },
    error: (err) => {
      throw err;
    },
    complete: () => {
      assert.deepEqual(result, { _value: 23.5 }); // Validate the mocked result
    },
  });
});
