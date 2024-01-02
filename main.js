class Stats {
  constructor() {
    this._intl = new Intl.NumberFormat();

    fetch("./pre.json").then(r => r.json()).then(data => this._showData(data));
  }

  usersBySoftwareReport() {
    this._createCanvas();
    this._renderData(this._data.usersBySoftware, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  activeUsersBySoftwareReport() {
    this._createCanvas();
    this._renderData(this._data.activeUsersBySoftware, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  usersByProtocolReport() {
    this._createCanvas();
    this._renderData(this._data.usersByProtocol, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  usersByInstanceReport() {
    this._createCanvas();
    this._renderData(this._data.usersByInstance, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  softwareByInstanceReport() {
    this._createCanvas();
    this._renderData(this._data.softwareByInstance, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  rulesWordsReport() {
    this._createCanvas();
    this._renderData(this._data.ruleWords, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  detectedLanguageDistribution() {
    this._createCanvas();
    this._renderData(this._data.detectedLanguages, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  languageDistribution() {
    this._createCanvas();
    this._renderData(this._data.languages, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  _createCanvas() {
    const div = document.getElementById("modalCanvas");
    while (div.firstChild) div.firstChild.remove();

    const canvas = document.createElement("canvas");
    canvas.setAttribute('id', 'modalDoughnut');
    div.appendChild(canvas);
  }

  _showData(data) {
    this._data = data;

    document.getElementById("genStats").innerText = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeStyle: 'long',
    }).format(new Date(this._data.ctime));

    document.getElementById("totalUsers").innerText = this._intl.format(this._data.totalUsers);
    document.getElementById("totalServers").innerText = this._intl.format(this._data.totalServers);
    document.getElementById("totalMAU").innerText = this._intl.format(this._data.totalMAU);

    this._renderData(data.usersBySoftware, 'usersBySoftwareDoughnut', 'usersBySoftwareReport', true);
    this._renderData(data.activeUsersBySoftware, "activeUsersBySoftwareDoughnut", "activeUsersBySoftwareReport", true);
    this._renderData(data.usersByProtocol, "usersByProtocolDoughnut", "usersByProtocolReport", true);
    this._renderData(data.usersByInstance, "usersByInstanceDoughnut", "usersByInstanceReport", true);
    this._renderData(data.softwareByInstance, "softwareByInstanceDoughnut", "softwareByInstanceReport", true);
    this._renderData(data.mastodonPublicTimeline, "mastodonPublicTimelineDoughnut", "mastodonPublicTimelineReport", false, "bar");
    this._renderData(data.userDistribution, "userDistributionDoughnut", "userDistributionReport");
    this._renderData(data.activeUserDistribution, "activeUserDistributionDoughnut", "activeUserDistributionReport");
    this._renderData(data.activeVsInactive, "activeVsInactiveDoughnut", "activeVsInactiveReport", false, "bar");
    this._renderData(data.ruleDistribution, "ruleDistributionDoughnut", "ruleDistributionReport");
    this._renderData(data.ruleWords, "ruleWords", "rulesWordsReport", true, "bar");
    this._renderData(data.detectedLanguages, "detectedLanguageDistributionLine", "detectedLanguageDistributionReport", true, "bar");
    this._renderData(data.languages, "languageDistributionLine", "languageDistributionReport", true, "bar");

    this._showTrends(data.trends);
  }

  _renderData(dataset, id1, id2, round = true, type = "doughnut") {
    const labels = Object.keys(dataset).sort((a, b) => dataset[a] < dataset[b]);
    let datasets = Object.keys(dataset).map(key => dataset[key]).sort((a, b) => a < b);
    const total = datasets.reduce((partialSum, a) => partialSum + a, 0);

    if (round && labels.length > 10) {
      labels.splice(9);
      labels.push("Others");

      const others = datasets.slice(10).reduce((partialSum, a) => partialSum + a, 0);
      datasets.splice(9);
      datasets.push(others);
    }

    datasets = datasets.map(a => a * 100 / total);

    if (id1) {
      const ctx = document.getElementById(id1);
      const chart = new Chart(ctx, {
        type,
        data: {
          labels,
          datasets: [{
            data: datasets
          }],
        },
        options: {
          plugins: {
            legend: {
              display: false
            },
          },
        }
      });
    }

    if (id2) {
      const report = document.getElementById(id2);
      while (report.firstChild) report.firstChild.remove();

      const table = document.createElement('table');
      table.setAttribute('class', 'table');
      report.appendChild(table);

      for (let i = 0; i < labels.length; ++i) {
        const tr = document.createElement('tr');
        tr.setAttribute('class', "trst-group-item");

        const tdLabel = document.createElement('td');
        tdLabel.appendChild(document.createTextNode(labels[i]));
        tr.append(tdLabel);

        const tdValue = document.createElement('td');
        tdValue.appendChild(document.createTextNode(`${Math.round(datasets[i] * 100) / 100}%`));
        tr.append(tdValue);

        table.appendChild(tr);
      }
    }
  }

  async _showTrends(dataset) {
    this._renderTrends('userTrendsLine', 'User Trends', 'Number of users', dataset.map(a => a.date),
      [{
        label: "Users",
        data: dataset.map(a => a.totalUsers),
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.4
      }, {
        label: "Active Users",
        data: dataset.map(a => a.totalMAU),
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.4
      }]);

    this._renderTrends('serverTrendsLine', 'Server Trends', 'Number of servers', dataset.map(a => a.date),
      [{
        label: "Servers",
        data: dataset.map(a => a.totalServers),
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.4
      }]);
  }

  _renderTrends(id, title, y_title, labels, datasets) {
    const ctx = document.getElementById(id);
    const chart = new Chart(ctx, {
      type: "line",
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: title,
          },
        },
        interaction: {
          intersect: false,
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: y_title,
            },
          }
        }
      },
      data: {
        labels,
        datasets,
      },
    });
  }
}

const stats = new Stats();
