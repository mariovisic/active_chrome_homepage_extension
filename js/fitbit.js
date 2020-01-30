class FitbitAPI {
  constructor() {
  }

  get credentials() {
    return JSON.parse(localStorage.getItem('fitbitCredentials'))
  }

  get tokens() {
    return JSON.parse(localStorage.getItem('fitbitTokens'))
  }

  async login() {
    if(!localStorage.hasOwnProperty("fitbitTokens")) {
      let tokens = await (await this.getTokens()).json();
      this.setTokens(_.pick(tokens, ['expires_at', 'access_token', 'refresh_token']));
    }

    await this.loadTokens()
  }

  getTokens() {
    let headers = {
      'Authorization': "Basic " + window.btoa([this.credentials.clientId, this.credentials.secret].join(':'))
    }

    let formData = new URLSearchParams();
    formData.append('clientId', this.credentials.clientId)
    formData.append('code', this.credentials.code)
    formData.append('grant_type', 'authorization_code')
    formData.append('redirect_uri', 'http://localhost/')

    return fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: headers,
      body: formData
    })
  }

  setTokens(tokens) {
    if(!_.isEmpty(tokens)) {
      localStorage.setItem('fitbitTokens', JSON.stringify(tokens))
    }
  }

  async loadTokens() {
    if(this.tokens.expires_at - (_.now() / 1000) < (30 * 60)) {
      let newTokens = await (await this.getRefreshedTokens()).json();
      this.setTokens(_.pick(newTokens, ['expires_at', 'access_token', 'refresh_token']));
    }
    this.accessToken = this.tokens.access_token;
  }

  async getRefreshedTokens() {
    let headers = {
      'Authorization': "Basic " + window.btoa([this.credentials.clientId, this.credentials.secret].join(':'))
    }

    let formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token')
    formData.append('refresh_token', this.tokens.refresh_token)

    return fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: headers,
      body: formData
    })
  }

  async getLastMonthOfWeights() {
    let cachedResponse = CachedLocalStorage.get('fitbitLastMonthWeights');
    if(cachedResponse != undefined) {
      return cachedResponse;
    } else {
      let date = new Date().toISOString().slice(0, 10);

      let response = await (await (fetch('https://api.fitbit.com/1/user/-/body/log/weight/date/' + date + '/1m.json', {
        method: 'GET',
        headers: { Authorization: "Bearer " + this.accessToken }
      }))).json()

      let weights = response.weight;
      CachedLocalStorage.set('fitbitLastMonthWeights', weights);

      return weights;
    }
  }
}
