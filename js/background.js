chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.get == 'latest_activity') {
    fetch('https://www.strava.com/api/v3/athlete/activities', {
      method: 'GET',
      headers: { Authorization: "Bearer " + request.accessToken }
    }).then((response) => response.json()).then((data) => sendResponse(data[0]))

    return true;
  }
  //TODO: Weights should be cached for an hour at least
  //TODO: Maybe we can put the authentication logic here, that way we can add token refresh + retry !
  if (request.get == 'latest_weight') {
    let date = new Date().toISOString().slice(0, 10)
    fetch('https://api.fitbit.com/1/user/-/body/log/weight/date/' + date + '/1d.json', {
      method: 'GET',
      headers: { Authorization: "Bearer " + request.accessToken }
    }).then((response) => response.json()).then((data) => sendResponse(data.weight[0].weight))

    return true;
  }
})
