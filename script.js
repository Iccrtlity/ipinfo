const ipInput = document.getElementById('ip-input');
const lookupBtn = document.getElementById('lookup-btn');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const result = document.getElementById('result');
const ipSpan = document.getElementById('ip');
const detailsUl = document.getElementById('details');
const copyAll = document.getElementById('copy-all');
const refresh = document.getElementById('refresh');

const API_BASE = 'https://ip-api.com/json/';

async function fetchIpInfo(ip = '') {
  loading.classList.remove('hidden');
  errorDiv.classList.add('hidden');
  result.classList.add('hidden');

  try {
    const url = ip ? `${API_BASE}${ip}` : API_BASE;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');

    const data = await res.json();

    if (data.status === 'fail') {
      throw new Error(data.message || 'Invalid IP or API issue');
    }

    renderInfo(data);
    result.classList.remove('hidden');
  } catch (err) {
    errorDiv.textContent = err.message || 'Something went wrong – check your connection';
    errorDiv.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
  }
}

function renderInfo(data) {
  ipSpan.textContent = data.query;

  const fields = [
    { label: 'Status', value: data.status },
    { label: 'Country', value: `${data.country} (${data.countryCode})` },
    { label: 'Region', value: `${data.regionName} (${data.region})` },
    { label: 'City', value: data.city },
    { label: 'ZIP', value: data.zip },
    { label: 'Lat / Lon', value: `${data.lat}, ${data.lon}` },
    { label: 'Timezone', value: data.timezone },
    { label: 'ISP', value: data.isp },
    { label: 'Organization', value: data.org },
    { label: 'AS', value: data.as },
    { label: 'Mobile?', value: data.mobile ? 'Yes' : 'No' },
    { label: 'Proxy/VPN?', value: data.proxy ? 'Yes' : 'No' },
    { label: 'Hosting?', value: data.hosting ? 'Yes' : 'No' }
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