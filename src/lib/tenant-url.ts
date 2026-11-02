export function getTenantUrlPrefix() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://instruct-hub.vercel.app';
  return `${appUrl.replace(/\/+$/, '')}/tenants/`;
}

export function getTenantUrl(subdomain: string) {
  return `${getTenantUrlPrefix()}${encodeURIComponent(subdomain)}`;
}
