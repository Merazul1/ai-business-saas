import Redis from 'ioredis';
import { ENV } from './env';

interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<string | null>;
  del(key: string): Promise<number>;
  isRealRedis: boolean;
}

class InMemoryCache implements CacheClient {
  private store = new Map<string, { value: string; expiry?: number }>();
  public isRealRedis = false;

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string | null> {
    const expiry = duration && mode?.toUpperCase() === 'EX' ? Date.now() + duration * 1000 : undefined;
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key);
    return existed ? 1 : 0;
  }
}

let cacheClient: CacheClient;

if (ENV.REDIS_URL && ENV.REDIS_URL.trim().length > 0) {
  try {
    const redis = new Redis(ENV.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });

    redis.connect().catch((err) => {
      console.warn('⚠️ Redis connection failed. Falling back to in-memory caching.', err.message);
    });

    cacheClient = {
      get: (k) => redis.get(k),
      set: (k, v, m, d) => (m && d ? (redis.set(k, v, m as any, d) as any) : redis.set(k, v)),
      del: (k) => redis.del(k),
      isRealRedis: true
    };
    console.log('✅ Connected to external Redis instance.');
  } catch (err: any) {
    console.warn('⚠️ Could not initialize Redis client, using in-memory store:', err.message);
    cacheClient = new InMemoryCache();
  }
} else {
  console.log('ℹ️ No REDIS_URL supplied; using fast in-memory key-value cache.');
  cacheClient = new InMemoryCache();
}

export const cache = cacheClient;
