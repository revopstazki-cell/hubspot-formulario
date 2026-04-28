export function getHubSpotToken() {
  return process.env.HUBSPOT_PRIVATE_APP_TOKEN ?? "";
}
