// eslint-disable-next-line @typescript-eslint/no-var-requires
const environments = require(`../../config/${process.env.NODE_ENV || 'DEV'}.json`);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultJSON = require('../../config/default.json');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { port, version, description, name } = require('../../package.json');

export default () => ({
  ...defaultJSON,
  version,
  description,
  name,
  ...environments,
  port,
});
