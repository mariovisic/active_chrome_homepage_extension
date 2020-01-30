chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request == 'getLatestActivityTimestamp') {
    let api = new StravaAPI();

    api.login()
      .then(function() { return api.getLatestActivityTimestamp(); })
      .then(function(result) { sendResponse(result); })

    return true;
  }

  if (request == 'getLastMonthOfWeights') {
    let api = new FitbitAPI();

    api.login()
      .then(function() { return api.getLastMonthOfWeights(); })
      .then(function(result) { sendResponse(result); })

    return true;
  }
})
