const loadConfig = () => {
  const { env } = process;

  return {
    appId: env.APP_ID,
    appSecret: env.APP_SECRET,
    redis: {
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT) || 6379,
    },
  };
};

export default loadConfig;
