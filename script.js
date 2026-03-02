const ipInput = document.getElementById('ip-input');
const lookupBtn = document.getElementById('lookup-btn');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const result = document.getElementById('result');
const ipSpan = document.getElementById('ip');
const detailsUl = document.getElementById('details');
const copyAll = document.getElementById('copy-all');
const refresh = document.getElementById('refresh');

const providers = [
  {
    buildUrl: ip => ip ? `https://ipwho.is/${encodeURIComponent(ip)}` : 'https://ipwho.is/',
    parse: async res => {
      if (!res.ok) throw new Error('Provider unavailable');
      const data = await res.json();
      if (data.success === false) throw new Error(data.message || 'Lookup failed');
      return {
        ip: data.ip || '',
        country: data.country || '',
        countryCode: data.country_code || '',
        region: data.region || '',
        city: data.city || '',
        postal: data.postal || '',
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone?.id || '',
        org: data.connection?.org || '',
        asn: data.connection?.asn ? `AS${data.connection.asn}` : ''
      };
    }
  },
  {
    buildUrl: ip => ip ? `https://ipapi.co/${encodeURIComponent(ip)}/json/` : 'https://ipapi.co/json/',
    parse: async res => {
      if (!res.ok) throw new Error('Provider unavailable');
      const data = await res.json();
      if (data.error) throw new Error(data.reason || 'Lookup failed');
      return {
        ip: data.ip || '',
        country: data.country_name || '',
        countryCode: data.country_code || '',
        region: data.region || '',
        city: data.city || '',
        postal: data.postal || '',
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone || '',
        org: data.org || '',
        asn: data.asn || ''
      };
    }
  },
  {
    buildUrl: ip => ip ? `https://ipinfo.io/${encodeURIComponent(ip)}/json` : 'https://ipinfo.io/json',
    parse: async res => {
      if (!res.ok) throw new Error('Provider unavailable');
      const data = await res.json();
      if (data.bogon) throw new Error('Private or invalid IP');
      const [lat, lon] = (data.loc || '').split(',');
      return {
        ip: data.ip || '',
        country: data.country || '',
        countryCode: data.country || '',
        region: data.region || '',
        city: data.city || '',
        postal: data.postal || '',
        latitude: lat ? Number(lat) : null,
        longitude: lon ? Number(lon) : null,
        timezone: data.timezone || '',
        org: data.org || '',
        asn: data.org ? data.org.split(' ')[0] : ''
      };
    }
  }
];

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function lookupIpInfo(ip = '') {
  let lastError = new Error('API error');
  for (const provider of providers) {
    try {
      const res = await fetchWithTimeout(provider.buildUrl(ip));
      const normalized = await provider.parse(res);
      return normalized;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

async function fetchIpInfo(ip = '') {
  loading.classList.remove('hidden');
  errorDiv.classList.add('hidden');
  result.classList.add('hidden');

  try {
    const data = await lookupIpInfo(ip);
    renderInfo(data);
    result.classList.remove('hidden');
  } catch (err) {
    errorDiv.textContent = err.name === 'TypeError' || err.name === 'AbortError'
      ? 'Failed to fetch. Check network, VPN/adblock, or CORS policy.'
      : (err.message || 'API error');
    errorDiv.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
  }
}

function renderInfo(data) {
  ipSpan.textContent = data.ip || 'Unknown';
  const countryValue = data.country && data.countryCode
    ? `${data.country} (${data.countryCode})`
    : data.country || data.countryCode || '';
  const regionValue = data.region || '';

  const fields = [
    { label: 'Country', value: countryValue },
    { label: 'Region', value: regionValue },
    { label: 'City', value: data.city },
    { label: 'ZIP', value: data.postal },
    { label: 'Lat / Lon', value: (data.latitude != null && data.longitude != null) ? `${data.latitude}, ${data.longitude}` : '' },
    { label: 'Timezone', value: data.timezone || '' },
    { label: 'Organization', value: data.org || '' },
    { label: 'AS', value: data.asn || '' }
  ];

  detailsUl.innerHTML = fields
    .filter(f => f.value) 
    .map(f => `<li><strong>${f.label}:</strong> ${f.value}</li>`)
    .join('');
}

lookupBtn.addEventListener('click', () => {
  const ip = ipInput.value.trim();
  fetchIpInfo(ip);
});

refresh.addEventListener('click', () => {
  ipInput.value = '';
  fetchIpInfo();
});

copyAll.addEventListener('click', () => {
  const text = `IP: ${ipSpan.textContent}\n` +
    Array.from(detailsUl.querySelectorAll('li'))
      .map(li => li.textContent.replace(':', ': '))
      .join('\n');
  navigator.clipboard.writeText(text).then(() => {
    copyAll.textContent = 'Copied!';
    setTimeout(() => copyAll.textContent = 'Copy all info', 2000);
  });
});


fetchIpInfo();