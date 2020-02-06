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
  // TODO: Move this into its own class (maybe main page or something?
  if(localStorage.hasOwnProperty("stravaCredentials") && localStorage.hasOwnProperty("fitbitCredentials")) {
    document.querySelector('#settings').addEventListener('click', () => {
      renderSettings();
    })

  // TODO: Move this into its own class (maybe strava lastest workout widget?)
    templateLoader.load('home_page', { last_ride_time: '...' })

    chrome.runtime.sendMessage('getLatestActivityTimestamp', function(timestamp) {
      templateLoader.load('home_page', { last_ride_time: timeDiffToString(timestamp) })

      setInterval(function() {
        if(document.querySelector('#home_page_inner')) {
          templateLoader.load('home_page', { last_ride_time: timeDiffToString(timestamp) })
        }
      }, 1000);
    })

    // TODO: Move this into its own class (maybe fitbit weight widget?)
    chrome.runtime.sendMessage('getLastMonthOfWeights', function(result) {
      let data = _.uniqBy(result, _.iteratee('date')).map((log) => ({ x: log.date, y: log.weight}))

      // Get mean of first 7 and last 7 data points
      let trendStart = _.meanBy(data.slice(0, 6), (dataPoint) => dataPoint.y);
      let trendFinish = _.meanBy(data.slice(-7), (dataPoint) => dataPoint.y);

      let trendData = _.map(data, function(dataPoint, index) {
        return {
          x: dataPoint.x,
          y: _.round(trendStart + ((index/(data.length-1)) * (trendFinish - trendStart)), 2)
        }
      })

      let trendColor = trendFinish < (trendStart + 0.5) ? '#26E7A6' : '#ff0000'

      var options = {
        colors: ['#008FFB', trendColor],
        fill: { type: ['gradient', 'solid'] },
        stroke: { dashArray: [0, 8] },
        series: [{
          name: "Weight",
          type: 'line',
          data: data,
        }, {
          name: "Weight Trend",
          type: 'line',
          data: trendData,
        }],
        chart: {
          animations: { enabled: false },
          sparkline: { enabled: true },
          type: 'line',
          height: 250,
        },
        tooltip: {
          enabledOnSeries: [0],
        }
      }

      var chart = new ApexCharts(document.querySelector('.weight_chart'), options);
      chart.render();
    });
  }
  else {
    renderSettings();
  }
}

main();
