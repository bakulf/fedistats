class Stats {
  constructor() {
    this._intl = new Intl.NumberFormat();

    fetch("./LOG.json").then(r => r.json()).then(data => this._showData(data));
  }

  _showData(data) {
    delete data['egirls.gay'];

    this._totalUsers = Object.keys(data).map(key => parseInt(data[key].nodeInfo.usage?.users?.total || 0)).reduce((partialSum, a) => partialSum + a, 0);
    this._totalServers = Object.keys(data).length;
    this._totalMAU = Object.keys(data).map(key => parseInt(data[key].nodeInfo.usage?.users?.activeMonth || 0)).reduce((partialSum, a) => partialSum + a, 0);

    this._updateStats();
    this._showUsersBySoftware(data);
    this._showActiveUsersBySoftware(data);
    this._showUsersByProtocol(data);
    this._showUsersByInstance(data);
    this._showSoftwaresByInstance(data);
    this._showMastodonPublicTimeline(data);
  }

  _updateStats() {
    document.getElementById("totalUsers").innerText = this._intl.format(this._totalUsers);
    document.getElementById("totalServers").innerText = this._intl.format(this._totalServers);
    document.getElementById("totalMAU").innerText = this._intl.format(this._totalMAU);
  }

  _showUsersBySoftware(data) {
    const dataset = {};
    Object.keys(data).forEach(server => {
      const node = data[server].nodeInfo;
      if (node.software?.name) {
        if (!dataset[node.software.name]) { dataset[node.software.name] = 0; }
        dataset[node.software.name] += parseInt(node.usage?.users?.total || 0);
      }
    });

    this._renderData(dataset, 'usersBySoftwareDoughnut', 'usersBySoftwareReport');
  }

  _showActiveUsersBySoftware(data) {
    const dataset = {};
    Object.keys(data).forEach(server => {
      const node = data[server].nodeInfo;
      if (node.software?.name) {
        if (!dataset[node.software.name]) { dataset[node.software.name] = 0; }

        dataset[node.software.name] += parseInt(node.usage?.users?.activeMonth || 0);
      }
    });

    this._renderData(dataset, "activeUsersBySoftwareDoughnut", "activeUsersBySoftwareReport",);
  }

  _showUsersByProtocol(data) {
    const dataset = {};
    Object.keys(data).forEach(server => {
      const node = data[server].nodeInfo;
      if (!Array.isArray(node.protocols)) { return; }
     
      for (let protocol of node.protocols) {
        if (!dataset[protocol]) { dataset[protocol] = 0; }

        dataset[protocol] += parseInt(node.usage?.users?.total || 0);
      }
    });

    this._renderData(dataset, "usersByProtocolDoughnut", "usersByProtocolReport");
  }

  _showUsersByInstance(data) {
    const dataset = {};
    Object.keys(data).forEach(server => {
      const node = data[server].nodeInfo;
      if (!dataset[server]) dataset[server] = 0;
      dataset[server] += parseInt(node.usage?.users?.total || 0);
    });

    this._renderData(dataset, "usersByInstanceDoughnut", "usersByInstanceReport");
  }

  _showSoftwaresByInstance(data) {
    const dataset = {};
    Object.keys(data).forEach(server => {
      const node = data[server].nodeInfo;
      if (node.software?.name) {
        if (!dataset[node.software.name]) { dataset[node.software.name] = 0; }
        dataset[node.software.name] += 1;
      }
    });

    this._renderData(dataset, "softwareByInstanceDoughnut", "softwareByInstanceReport");
  }

  _showMastodonPublicTimeline(data) {
    const dataset = { public: 0, private: 0};
    Object.keys(data).forEach(server => {
      const node = data[server];
      if ("mastodon_public" in node) {
        if (node.mastodon_public) dataset.public += 1; else dataset.private += 1;
      }
    });

    this._renderData(dataset, "mastodonPublicTimelineDoughnut", "mastodonPublicTimelineReport", 2);
  }

  _renderData(dataset, id1, id2) {
    const labels = Object.keys(dataset).sort((a,b) => dataset[a] < dataset[b]);
    let datasets = Object.keys(dataset).map(key => dataset[key]).sort((a,b) => a < b);
    const total = datasets.reduce((partialSum, a) => partialSum + a, 0);

    if (labels.length > 10) {
      labels.splice(9);
      labels.push("Others");

      const others = datasets.slice(10).reduce((partialSum, a) => partialSum + a, 0);
      datasets.splice(9);
      datasets.push(others);
    }

    datasets = datasets.map(a => a* 100 / total);

    const ctx = document.getElementById(id1);
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: datasets }],
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

new Stats();


function renderData(dataset, id1, id2, tops) {
  const total = Object.keys(dataset).map(key => dataset[key]).reduce((partialSum, a) => partialSum + a, 0);
  const labels = Object.keys(dataset).sort((a,b) => dataset[a] < dataset[b]);
  const datasets = Object.keys(dataset).map(key => dataset[key]).sort((a,b) => a < b);
  const datasets_percent = datasets.map(a => a * 100 / total);

  const ctx = document.getElementById(id1);
  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: datasets_percent }],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  chart.canvas.parentNode.style.height = '500px';
  chart.canvas.parentNode.style.width = '500px';

  const intl = new Intl.NumberFormat();
  const reports = {
    "Total": intl.format(total),
  }

  for (let i = 0; i < tops; ++i) {
    reports[`Top ${i+1}`] = `${labels[i]} - ${intl.format(datasets[i])} (${Math.round(datasets_percent[i])}%)`;
  };

  const ul = document.createElement('ul');
  document.getElementById(id2).appendChild(ul);

  for (const key of Object.keys(reports)) {
    const li = document.createElement('li');
    li.appendChild(document.createTextNode(`${key}: ${reports[key]}`));
    ul.appendChild(li);
  }
}

