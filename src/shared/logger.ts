const LEVELS = ["info", "error"];

const LOG_LEVEL_IDX = LEVELS.indexOf(process.env.LOGGER_LEVEL ?? "info");

export const logger = (level: typeof LEVELS[number], ...args: any) => {
  if (process.env.LOGGER_LEVEL && LEVELS.indexOf(level) < LOG_LEVEL_IDX) {
    return;
  }
  if (process.env.LOGGER_ENABLED) {
    console.log(...args);
  }
}