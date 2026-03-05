import { Redis } from "ioredis"

type RedisLike = Pick<Redis, "get" | "set" | "del" | "incr" | "expire" | "lpush" | "ltrim" | "lrange" | "on">

const createInMemoryRedis = (): RedisLike => {
  const kv = new Map<string, string>()
  const lists = new Map<string, string[]>()
  const expiry = new Map<string, number>()

  const isExpired = (key: string) => {
    const exp = expiry.get(key)
    if (exp && Date.now() > exp) {
      kv.delete(key)
      lists.delete(key)
      expiry.delete(key)
      return true
    }
    return false
  }

  return {
    async get(key: string) {
      if (isExpired(key)) return null
      return kv.has(key) ? kv.get(key)! : null
    },
    async set(key: string, value: string, ...args: unknown[]) {
      // Soportar firmas: set key value ["EX", ttl] ["NX"]
      const parts = args.flat().map(String)
      const hasNx = parts.includes("NX")
      const exIndex = parts.indexOf("EX")
      const ttlSeconds = exIndex !== -1 ? Number(parts[exIndex + 1]) : undefined

      if (hasNx && kv.has(key) && !isExpired(key)) {
        return null
      }

      kv.set(key, value)
      if (ttlSeconds && Number.isFinite(ttlSeconds)) {
        expiry.set(key, Date.now() + ttlSeconds * 1000)
      }
      return "OK" as const
    },
    async del(...keys: string[]) {
      let removed = 0
      for (const key of keys) {
        removed += kv.delete(key) ? 1 : 0
        removed += lists.delete(key) ? 1 : 0
        expiry.delete(key)
      }
      return removed
    },
    async incr(key: string) {
      if (isExpired(key)) {
        kv.delete(key)
        expiry.delete(key)
      }
      const current = Number(kv.get(key) || "0") + 1
      kv.set(key, String(current))
      return current
    },
    async expire(key: string, seconds: number) {
      if (!kv.has(key)) return 0
      expiry.set(key, Date.now() + seconds * 1000)
      return 1
    },
    async lpush(key: string, value: string) {
      if (isExpired(key)) {
        lists.delete(key)
        expiry.delete(key)
      }
      const arr = lists.get(key) || []
      arr.unshift(value)
      lists.set(key, arr)
      return arr.length
    },
    async ltrim(key: string, start: number, stop: number) {
      if (isExpired(key)) return
      const arr = lists.get(key) || []
      lists.set(key, arr.slice(start, stop + 1))
    },
    async lrange(key: string, start = 0, stop = -1) {
      if (isExpired(key)) return []
      const arr = lists.get(key) || []
      if (stop === -1) return arr.slice(start)
      return arr.slice(start, stop + 1)
    },
    on() {
      return this
    },
  }
}

// En test usamos un mock en memoria para evitar dependencia externa.
const redis: RedisLike =
  process.env.NODE_ENV === "test"
    ? createInMemoryRedis()
    : new Redis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
      })

redis.on("error", (err) => console.error("Redis Error:", err))

export { redis }
