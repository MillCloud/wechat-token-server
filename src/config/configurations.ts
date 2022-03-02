const loadConfig = () => {
  const { env } = process;

  return {
    apps: JSON.parse(env.APPS),
    tokenSalt: env.TOKEN_SALT,
    hashCount: env.HASH_COUNT,
    tokenKeyPrefix: env.TOKEN_KEY_PREFIX,
    redis: {
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT) || 6379,
    },
  };
};

export default loadConfig;
