"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
class InMemoryCache {
    store = new Map();
    isRealRedis = false;
    async get(key) {
        const item = this.store.get(key);
        if (!item)
            return null;
        if (item.expiry && Date.now() > item.expiry) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, mode, duration) {
        const expiry = duration && mode?.toUpperCase() === 'EX' ? Date.now() + duration * 1000 : undefined;
        this.store.set(key, { value, expiry });
        return 'OK';
    }
    async del(key) {
        const existed = this.store.delete(key);
        return existed ? 1 : 0;
    }
}
let cacheClient;
if (env_1.ENV.REDIS_URL && env_1.ENV.REDIS_URL.trim().length > 0) {
    try {
        const redis = new ioredis_1.default(env_1.ENV.REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 1
        });
        redis.connect().catch((err) => {
            console.warn('⚠️ Redis connection failed. Falling back to in-memory caching.', err.message);
        });
        cacheClient = {
            get: (k) => redis.get(k),
            set: (k, v, m, d) => (m && d ? redis.set(k, v, m, d) : redis.set(k, v)),
            del: (k) => redis.del(k),
            isRealRedis: true
        };
        console.log('✅ Connected to external Redis instance.');
    }
    catch (err) {
        console.warn('⚠️ Could not initialize Redis client, using in-memory store:', err.message);
        cacheClient = new InMemoryCache();
    }
}
else {
    console.log('ℹ️ No REDIS_URL supplied; using fast in-memory key-value cache.');
    cacheClient = new InMemoryCache();
}
exports.cache = cacheClient;
