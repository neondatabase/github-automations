export function isDryRun() {
  return process.env.DRY_RUN === 'true';
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}