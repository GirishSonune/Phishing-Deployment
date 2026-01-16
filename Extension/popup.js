document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const messageInput = document.getElementById('messageInput');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');

    analyzeBtn.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        if (!message) {
            errorDiv.textContent = "Please enter some text to analyze.";
            return;
        }

        // Reset UI
        errorDiv.textContent = "";
        resultDiv.style.display = 'block';
        resultDiv.className = '';
        resultDiv.innerHTML = '<div class="result-content"><span class="loading-pulse"></span><span style="margin-top:8px; font-size:12px;">Analyzing content...</span></div>';
        analyzeBtn.disabled = true;

        try {
            const response = await fetch('https://smishing-backend-api-arandsfxhwcxaxc4.canadacentral-01.azurewebsites.net/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();

            const isSmishing = data.prediction === 'Smishing';
            const riskScore = data.riskScore !== undefined ? data.riskScore.toFixed(1) : '—';

            // Update classes for new UI
            resultDiv.className = isSmishing ? 'phishing-result' : 'safe-result';

            const scoreLabel = isSmishing ? 'Risk Score' : 'Confidence';
            const scoreValue = isSmishing ? `${riskScore}%` : `${(data.confidence * 100).toFixed(1)}%`;

            // Inject new HTML structure
            resultDiv.innerHTML = `
        <div class="result-content">
          <span class="status-badge">${data.prediction}</span>
          <div class="score-display">${scoreValue}</div>
          <div style="font-size: 12px; opacity: 0.8;">${scoreLabel}</div>
        </div>
      `;

        } catch (err) {
            console.error('Smishing check error:', err);
            resultDiv.style.display = 'none';
            errorDiv.textContent = "Error connecting to analysis server.";
        } finally {
            analyzeBtn.disabled = false;
        }
    });
});
