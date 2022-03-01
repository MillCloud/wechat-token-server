const loadConfig = () => {
  const { env } = process;

  return {
    appId: env.APP_ID,
    appSecret: env.APP_SECRET,
    tokenSalt: env.TOKEN_SALT,
    hashCount: env.HASH_COUNT,
    redis: {
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT) || 6379,
    },
  };
};

export default loadConfig;
