class Stats {
  constructor() {
    this._intl = new Intl.NumberFormat();

    fetch("./LOG.json").then(r => r.json()).then(data => this._showData(data));
  }

  usersBySoftwareReport() {
    this._createCanvas();
    this._showUsersBySoftware('modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  activeUsersBySoftwareReport() {
    this._createCanvas();
    this._showActiveUsersBySoftware('modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  usersByProtocolReport() {
    this._createCanvas();
    this._showUsersByProtocol('modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  usersByInstanceReport() {
    this._createCanvas();
    this._showUsersByInstance('modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  softwareByInstanceReport() {
    this._createCanvas();
    this._showSoftwaresByInstance('modalDoughnut', 'modalReport', false);
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
    delete data['egirls.gay'];

    this._totalUsers = Object.keys(data).map(key => parseInt(data[key].nodeInfo.usage?.users?.total || 0)).reduce((partialSum, a) => partialSum + a, 0);
    this._totalServers = Object.keys(data).length;
    this._totalMAU = Object.keys(data).map(key => parseInt(data[key].nodeInfo.usage?.users?.activeMonth || 0)).reduce((partialSum, a) => partialSum + a, 0);

    this._data = data;

    this._updateStats();
    this._showUsersBySoftware('usersBySoftwareDoughnut', 'usersBySoftwareReport', true);
    this._showActiveUsersBySoftware("activeUsersBySoftwareDoughnut", "activeUsersBySoftwareReport", true);
    this._showUsersByProtocol("usersByProtocolDoughnut", "usersByProtocolReport", true);
    this._showUsersByInstance("usersByInstanceDoughnut", "usersByInstanceReport", true);
    this._showSoftwaresByInstance("softwareByInstanceDoughnut", "softwareByInstanceReport", true);
    this._showMastodonPublicTimeline("mastodonPublicTimelineDoughnut", "mastodonPublicTimelineReport");
  }

  _updateStats() {
    document.getElementById("totalUsers").innerText = this._intl.format(this._totalUsers);
    document.getElementById("totalServers").innerText = this._intl.format(this._totalServers);
    document.getElementById("totalMAU").innerText = this._intl.format(this._totalMAU);
  }

  _showUsersBySoftware(id1, id2, round) {
    const dataset = {};
    Object.keys(this._data).forEach(server => {
      const node = this._data[server].nodeInfo;
      if (node.software?.name) {
        if (!dataset[node.software.name]) {
          dataset[node.software.name] = 0;
        }
        dataset[node.software.name] += parseInt(node.usage?.users?.total || 0);
      }
    });

    this._renderData(dataset, id1, id2, round);
  }

  _showActiveUsersBySoftware(id1, id2, round) {
    const dataset = {};
    Object.keys(this._data).forEach(server => {
      const node = this._data[server].nodeInfo;
      if (node.software?.name) {
        if (!dataset[node.software.name]) {
          dataset[node.software.name] = 0;
        }

        dataset[node.software.name] += parseInt(node.usage?.users?.activeMonth || 0);
      }
    });

    this._renderData(dataset, id1, id2, round);
  }

  _showUsersByProtocol(id1, id2, round) {
    const dataset = {};
    Object.keys(this._data).forEach(server => {
      const node = this._data[server].nodeInfo;
      if (!Array.isArray(node.protocols)) {
        return;
      }

      for (let protocol of node.protocols) {
        if (!dataset[protocol]) {
          dataset[protocol] = 0;
        }

        dataset[protocol] += parseInt(node.usage?.users?.total || 0);
      }
    });

    this._renderData(dataset, id1, id2, round);
  }

  _showUsersByInstance(id1, id2, round) {
    const dataset = {};
    Object.keys(this._data).forEach(server => {
      const node = this._data[server].nodeInfo;
      if (!dataset[server]) dataset[server] = 0;
      dataset[server] += parseInt(node.usage?.users?.total || 0);
    });

    this._renderData(dataset, id1, id2, round);
  }

  _showSoftwaresByInstance(id1, id2, round) {
    const dataset = {};
    Object.keys(this._data).forEach(server => {
      const node = this._data[server].nodeInfo;
      if (node.software?.name) {
        if (!dataset[node.software.name]) {
          dataset[node.software.name] = 0;
        }
        dataset[node.software.name] += 1;
      }
    });

    this._renderData(dataset, id1, id2, round);
  }

  _showMastodonPublicTimeline(id1, id2) {
    const dataset = {
      public: 0,
      private: 0
    };
    Object.keys(this._data).forEach(server => {
      const node = this._data[server];
      if ("mastodon_public" in node) {
        if (node.mastodon_public) dataset.public += 1;
        else dataset.private += 1;
      }
    });

    this._renderData(dataset, id1, id2, false);
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