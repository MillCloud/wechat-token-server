const loadConfig = () => {
  const { env } = process;

  return {
    apps: JSON.parse(env.APPS),
    tokenKeyPrefix: env.TOKEN_KEY_PREFIX,
    tokenIsAutoRefresh:
      env.TOKEN_IS_AUTO_REFRESH.toLowerCase() === 'true' ||
      (env.TOKEN_IS_AUTO_REFRESH === 'boolean' && env.TOKEN_IS_AUTO_REFRESH),
    tokenCheckApi: env.TOKEN_CHECK_API,
    signSalt: env.SIGN_SALT,
    signHashCount: env.SIGN_HASH_COUNT,
    redis: {
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT) || 6379,
    },
  };
};

export default loadConfig;
