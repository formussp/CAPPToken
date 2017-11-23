const f = require('lodash/filter');

module.exports = {
  assertEvent(contract, filter) {
    return new Promise((resolve, reject) => {
      const event = contract[filter.event]();
      event.watch();
      event.get((error, logs) => {
        const log = f(logs, filter);
        if (log) {
          return resolve(log);
        }

        reject(new Error(`Failed to find filtered event for ${filter.event}`));
      });
      event.stopWatching();
    });
  },
};
