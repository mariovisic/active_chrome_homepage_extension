var templateLoader = {
  load: (id, data = {}) => {
    let source = document.getElementById(id).innerHTML;
    let template = Handlebars.compile(source);
    document.getElementById('app').innerHTML = template(data);
  }
}

function timeDiffToString(timestamp) {
  var dateNow = new Date().getTime();
  var output = [];

  var delta = Math.abs(timestamp - dateNow) / 1000;
  var days = Math.floor(delta / 86400);
  delta -= days * 86400;

  var hours = Math.floor(delta / 3600) % 24;
  delta -= hours * 3600;

  var minutes = Math.floor(delta / 60) % 60;
  delta -= minutes * 60;

  var seconds = Math.floor(delta % 60);

  if(days > 0) {
    output.push(days.toString() + ' days')
  }

  if(hours > 0) {
    output.push(hours.toString() + ' hours')
  }

  output.push(minutes.toString() + ' minutes and ' + seconds.toString() + ' seconds')

  return output.join(", ")
}


function StravaAuth() {
  let stravaCredentials = JSON.parse(localStorage.getItem('stravaCredentials'))
  this.clientId = stravaCredentials.clientId;
  this.secret = stravaCredentials.secret;
  this.code = stravaCredentials.code;

  this.login = () => {
    formData = new FormData();
    formData.append('client_id', stravaAuth.clientId)
    formData.append('code', stravaAuth.code)
    formData.append('client_secret', stravaAuth.secret)
    formData.append('grant_type', 'authorization_code')

    return fetch('https://www.strava.com/api/v3/oauth/token', {
      method: 'POST',
      body: formData
    }).then((response) => response.json()).then((data) => stravaAuth.accessToken = data.access_token)
  }
}

function StravaAPI(accessToken) {
  this.accessToken = accessToken;

  this.getLatestActivityTimestamp = () => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ get: 'latest_activity', accessToken: this.accessToken }, (response) => {
        resolve(Date.parse(response.start_date) + (response.elapsed_time * 1000))
      })
    })
  }
}

function FitbitAuth() {
  let fitbitCredentials = JSON.parse(localStorage.getItem('fitbitCredentials'))
  this.clientId = fitbitCredentials.clientId;
  this.secret = fitbitCredentials.secret;
  this.code = fitbitCredentials.code;

  this.login = () => {
    //TODO: store all the data back from the fitbit API, so we can use it to send requests rather than oauthing every time
    //TODO: Also need to implement token refresh !!!
    headers = {
      'Authorization': "Basic " + window.btoa([fitbitAuth.clientId, fitbitAuth.secret].join(':'))
    }

    params = new URLSearchParams();
    params.append('clientId', fitbitAuth.clientId)
    params.append('code', fitbitAuth.code)
    params.append('grant_type', 'authorization_code')
    params.append('redirect_uri', 'http://localhost/')

    return fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: headers,
      body: params
    }).then((response) => response.json()).then((data) => fitbitAuth.accessToken = data.access_token)
  }
}

function FitbitAPI(accessToken) {
  this.accessToken = accessToken;

  this.getLastWeight = () => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ get: 'latest_weight', accessToken: this.accessToken }, (response) => {
        resolve(response)
      })
    })
  }
}

function renderSettings() {
  var data = { }

  if(localStorage.hasOwnProperty("stravaCredentials") && localStorage.hasOwnProperty("fitbitCredentials"))
  {
    let stravaCredentials = JSON.parse(localStorage.getItem('stravaCredentials'))
    let fitbitCredentials = JSON.parse(localStorage.getItem('fitbitCredentials'))
    data.stravaClientId = stravaCredentials.clientId;
    data.stravaSecret = stravaCredentials.secret;
    data.stravaCode = stravaCredentials.code;
    data.fitbitClientId = fitbitCredentials.clientId;
    data.fitbitSecret = fitbitCredentials.secret;
    data.fitbitCode = fitbitCredentials.code;
  }

  templateLoader.load('setup_page', data);
  document.querySelector('#setup_form').addEventListener('submit', (event) => {
    event.preventDefault();
    data = new FormData(event.target);
    localStorage.setItem('stravaCredentials', JSON.stringify({
      clientId: data.get('stravaClientId'),
      secret: data.get('stravaSecret'),
      code: data.get('stravaCode'),
    }))

    localStorage.setItem('fitbitCredentials', JSON.stringify({
      clientId: data.get('fitbitClientId'),
      secret: data.get('fitbitSecret'),
      code: data.get('fitbitCode'),
    }))

    location.reload();
  })
}

if(localStorage.hasOwnProperty("stravaCredentials") && localStorage.hasOwnProperty("fitbitCredentials")) {
  document.querySelector('#settings').addEventListener('click', () => {
    renderSettings();
  })

  var stravaAuth = new StravaAuth();

  templateLoader.load('home_page', { last_ride_time: '...' })

  stravaAuth.login().then(() => {
    api = new StravaAPI(stravaAuth.accessToken)
    api.getLatestActivityTimestamp().then((timestamp) => {
      console.log(timeDiffToString(timestamp));
      templateLoader.load('home_page', { last_ride_time: timeDiffToString(timestamp) })
    })
  })

  var fitbitAuth = new FitbitAuth();

  fitbitAuth.login().then(() => {
    api = new FitbitAPI(fitbitAuth.accessToken)
    api.getLastWeight().then((weight) => {
      console.log(weight);
    })
  })
}
else {
  renderSettings();
}
