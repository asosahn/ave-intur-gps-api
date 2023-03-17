// eslint-disable-next-line @typescript-eslint/no-var-requires
const environments = require(`../../config/${process.env.NODE_ENV}.json`);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultJSON = require('../../config/default.json');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { port, version, description, name } = require('../../package.json');

process.env.MONGO_DATABASE = environments.MONGO_DATABASE;
process.env.API_CLIENT_URL = environments.API_CLIENT_URL;
process.env.API_LOCATION_URL = environments.API_LOCATION_URL;
process.env.API_ITEM_URL = environments.API_ITEM_URL;
process.env.API_MASTER_URL = environments.API_MASTER_URL;
process.env.API_WAREHOUSE_URL = environments.API_WAREHOUSE_URL;
process.env.LogStashServer = defaultJSON.LogStashServer;
process.env.LogStashPort = defaultJSON.LogStashPort;

export default () => ({
  ...defaultJSON,
  port,
  version,
  description,
  name,
  ...environments,
});
