class StravaAPI {
  constructor() {
  }

  get credentials() {
    return JSON.parse(localStorage.getItem('stravaCredentials'))
  }

  get tokens() {
    return JSON.parse(localStorage.getItem('stravaTokens'))
  }

  async login() {
    if(!localStorage.hasOwnProperty("stravaTokens")) {
      let tokens = await (await this.getTokens()).json();
      this.setTokens(_.pick(tokens, ['expires_at', 'access_token', 'refresh_token']));
    }

    await this.loadTokens()
  }

  getTokens() {
    let formData = new FormData();
    formData.append('client_id', this.credentials.clientId)
    formData.append('code', this.credentials.code)
    formData.append('client_secret', this.credentials.secret)
    formData.append('grant_type', 'authorization_code')

    return fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      body: formData
    })
  }

  setTokens(tokens) {
    if(!_.isEmpty(tokens)) {
      localStorage.setItem('stravaTokens', JSON.stringify(tokens))
    }
  }

  async loadTokens() {
    if(this.tokens.expires_at - (_.now() / 1000) < (10 * 60)) {
      let newTokens = await (await this.getRefreshedTokens()).json();
      this.setTokens(_.pick(newTokens, ['expires_at', 'access_token', 'refresh_token']));
    }
    this.accessToken = this.tokens.access_token;
  }

  async getRefreshedTokens() {
    let formData = new FormData();
    formData.append('client_id', this.credentials.clientId)
    formData.append('client_secret', this.credentials.secret)
    formData.append('grant_type', 'refresh_token')
    formData.append('refresh_token', this.tokens.refresh_token)

    return fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      body: formData
    })
  }

  async getLatestActivityTimestamp() {
    let response = await (await (fetch('https://www.strava.com/api/v3/athlete/activities', {
      method: 'GET',
      headers: { Authorization: "Bearer " + this.accessToken }
    }))).json()

    return Date.parse(response[0].start_date) + (response[0].elapsed_time * 1000)
  }
}
