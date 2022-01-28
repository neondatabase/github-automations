export function isDryRun() {
  return process.env.DRY_RUN === 'true';
}