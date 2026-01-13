/**
 * Background service worker for the Aegis Phishing Detector extension.
 */

// The URL of your project website.
const AEGIS_WEBSITE_URL = 'https://phishing-backend-api-ghb2abdha5fsadbb.canadacentral-01.azurewebsites.net/';

// Listen for messages from the content script.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // Handle the request to open your website.
  if (request.action === "openAegisWebsite") {
    chrome.tabs.create({ url: AEGIS_WEBSITE_URL });
  }

  // This is the placeholder logic for your API call.
  // You can integrate it later.
  if (request.action === "checkUrl") {
    console.log("Checking URL:", request.url);
    const apiUrl = "https://phishing-backend-api-ghb2abdha5fsadbb.canadacentral-01.azurewebsites.net/api/predict";

    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: request.url })
    })
      .then(response => response.json())
      .then(data => {
        console.log("API Response:", data);
        sendResponse(data);
      })
      .catch(error => {
        console.error("API Error:", error);
        sendResponse({ error: error.message });
      });

    return true; // Keep the message channel open for async response
  }

  return true; // Indicates an async response, which is good practice.
});