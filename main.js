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
    this._renderData(data.mastodonPublicTimeline, "mastodonPublicTimelineDoughnut", "mastodonPublicTimelineReport");
    this._renderData(data.userDistribution, "userDistributionDoughnut", "userDistributionReport");
  }

  _renderData(dataset, id1, id2, round) {
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

    const ctx = document.getElementById(id1);
    const chart = new Chart(ctx, {
      type: 'doughnut',
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

const stats = new Stats();