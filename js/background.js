chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.get == 'lastest_activity') {
    fetch('https://www.strava.com/api/v3/athlete/activities', {
      method: 'GET',
      headers: { Authorization: "Bearer " + request.accessToken }
    }).then((response) => response.json()).then((data) => sendResponse(data[0]))

    return true;
  }
})
