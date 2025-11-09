document.getElementById('btn-imos').addEventListener('click', () => {
    chrome.tabs.create({ url: 'imos.html' });
});

document.getElementById('btn-recon').addEventListener('click', () => {
    chrome.tabs.create({ url: 'recon.html' });
});

document.getElementById('btn-fund').addEventListener('click', () => {
    // Currently uses the same recon tool, but you can customize a separate working_fund.html later
    chrome.tabs.create({ url: 'recon.html#working_fund' });
});