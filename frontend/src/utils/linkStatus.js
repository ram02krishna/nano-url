/** active | disabled | expired | limit */
export const getLinkStatus = (url) => {
  if (url.isActive === false) return "disabled";
  if (url.expiresAt && Date.now() > new Date(url.expiresAt).getTime()) return "expired";
  if (url.maxClicks != null && url.clickCount >= url.maxClicks) return "limit";
  return "active";
};
