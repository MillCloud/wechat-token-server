const loadConfig = () => {
  const { env } = process;

  return {
    apps: JSON.parse(env.APPS),
    tokenKeyPrefix: env.TOKEN_KEY_PREFIX,
    signSalt: env.SIGN_SALT,
    signHashCount: env.SIGN_HASH_COUNT,
    redis: {
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT) || 6379,
    },
  };
};

export default loadConfig;
