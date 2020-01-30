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
    //TODO: add plural support (1 day, 2 days)
    output.push(days.toString() + ' days')
  }

  if(hours > 0) {
    output.push(hours.toString() + ' hours')
  }

  output.push(minutes.toString() + ' minutes and ' + seconds.toString() + ' seconds')

  return output.join(", ")
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

async function main() {
  if(localStorage.hasOwnProperty("stravaCredentials") && localStorage.hasOwnProperty("fitbitCredentials")) {
    document.querySelector('#settings').addEventListener('click', () => {
      renderSettings();
    })

    templateLoader.load('home_page', { last_ride_time: '...' })

    chrome.runtime.sendMessage('getLatestActivityTimestamp', function(timestamp) {
      templateLoader.load('home_page', { last_ride_time: timeDiffToString(timestamp) })

      setInterval(function() {
        templateLoader.load('home_page', { last_ride_time: timeDiffToString(timestamp) })
      }, 1000);
    })

    chrome.runtime.sendMessage('getLastMonthOfWeights', function(result) {
      console.log('result', result);
    });
  }
  else {
    renderSettings();
  }
}

main();
