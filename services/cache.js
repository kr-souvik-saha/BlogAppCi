const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

// const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
    console.log('Cache activation called');
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || '');
    return this
}

mongoose.Query.prototype.exec = async function () {

    if (!this.useCache) {
        console.log('cache not activated');
        return exec.apply(this, arguments);
    } else {
        console.log('cache activated');
    }

    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }));

    const cacheValue = await client.hget(this.hashKey, key);

    if (cacheValue) {
        console.log('From cache');
        const doc = JSON.parse(cacheValue);

        Array.isArray(doc) ?
            doc.map(d => new this.model(d)) :
            new this.model(doc);

        return doc;
    }

    const result = await exec.apply(this, arguments);

    client.hset(this.hashKey, JSON.stringify(result), 10)

    return result;

};

module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey));
    }
}