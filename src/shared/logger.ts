export const logger = (...args: any) => {
  if (process.env.LOGGER_ENABLED) {
    console.log(...args);
  }
}