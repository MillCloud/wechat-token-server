const loadConfig = () => {
  const { env } = process;

  return {
    miniPrograms: JSON.parse(env.MINI_PROGRAMS),
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
