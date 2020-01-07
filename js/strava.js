class StravaAPI {
  constructor() {
  }

  get credentials() {
    return JSON.parse(localStorage.getItem('stravaCredentials'))
  }

  login() {
    let formData = new FormData();

    formData.append('client_id', this.credentials.clientId)
    formData.append('code', this.credentials.code)
    formData.append('client_secret', this.credentials.secret)
    formData.append('grant_type', 'authorization_code')

    return fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      body: formData
    }).then((response) => response.json()).then((data) => this.setAccessToken(data.access_token))
  }

  setAccessToken(accessToken) {
    this.accessToken = accessToken;
  }

  // FIXME: Rather than sending a message here, maybe consider sending the message in the index instead
  // and having the background.js use this method to obtain data
  //
  // ...
  //
  // I think it might be tricky though and won't be any better, as then the main JS file now has to send messages
  // worth a shot though :)
  getLatestActivityTimestamp() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ get: 'latest_activity', accessToken: this.accessToken }, (response) => {
        resolve(Date.parse(response.start_date) + (response.elapsed_time * 1000))
      })
    })
  }
}
