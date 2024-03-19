class Stats {
  #intl;
  #data;

  constructor() {
    this.#intl = new Intl.NumberFormat();

    fetch("./pre.json").then(r => r.json()).then(data => this.#showData(data));
  }

  usersBySoftwareReport() {
    this.#createCanvas();
    this.#renderData(this.#data.usersBySoftware, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  activeUsersBySoftwareReport() {
    this.#createCanvas();
    this.#renderData(this.#data.activeUsersBySoftware, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  usersByProtocolReport() {
    this.#createCanvas();
    this.#renderData(this.#data.usersByProtocol, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  usersByInstanceReport() {
    this.#createCanvas();
    this.#renderData(this.#data.usersByInstance, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  softwareByInstanceReport() {
    this.#createCanvas();
    this.#renderData(this.#data.softwareByInstance, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  rulesWordsReport() {
    this.#createCanvas();
    this.#renderData(this.#data.ruleWords, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  detectedLanguageDistribution() {
    this.#createCanvas();
    this.#renderData(this.#data.detectedLanguages, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  languageDistribution() {
    this.#createCanvas();
    this.#renderData(this.#data.languages, 'modalDoughnut', 'modalReport', false);
    new bootstrap.Modal('#chartModal', {}).show();
  }

  #createCanvas() {
    const div = document.getElementById("modalCanvas");
    while (div.firstChild) div.firstChild.remove();

    const canvas = document.createElement("canvas");
    canvas.setAttribute('id', 'modalDoughnut');
    div.appendChild(canvas);
  }

  #showData(data) {
    this.#data = data;

    document.getElementById("genStats").innerText = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'long',
      timeStyle: 'long',
    }).format(new Date(this.#data.ctime));

    document.getElementById("totalUsers").innerText = this.#intl.format(this.#data.totalUsers);
    document.getElementById("totalServers").innerText = this.#intl.format(this.#data.totalServers);
    document.getElementById("totalMAU").innerText = this.#intl.format(this.#data.totalMAU);

    this.#renderData(data.usersBySoftware, 'usersBySoftwareDoughnut', 'usersBySoftwareReport', true);
    this.#renderData(data.activeUsersBySoftware, "activeUsersBySoftwareDoughnut", "activeUsersBySoftwareReport", true);
    this.#renderData(data.usersByProtocol, "usersByProtocolDoughnut", "usersByProtocolReport", true);
    this.#renderData(data.usersByInstance, "usersByInstanceDoughnut", "usersByInstanceReport", true);
    this.#renderData(data.softwareByInstance, "softwareByInstanceDoughnut", "softwareByInstanceReport", true);
    this.#renderData(data.mastodonPublicTimeline, "mastodonPublicTimelineDoughnut", "mastodonPublicTimelineReport", false, "bar");
    this.#renderData(data.userDistribution, "userDistributionDoughnut", "userDistributionReport");
    this.#renderData(data.activeUserDistribution, "activeUserDistributionDoughnut", "activeUserDistributionReport");
    this.#renderData(data.activeVsInactive, "activeVsInactiveDoughnut", "activeVsInactiveReport", false, "bar");
    this.#renderData(data.ruleDistribution, "ruleDistributionDoughnut", "ruleDistributionReport");
    this.#renderData(data.ruleWords, "ruleWords", "rulesWordsReport", true, "bar");
    this.#renderData(data.detectedLanguages, "detectedLanguageDistributionLine", "detectedLanguageDistributionReport", true, "bar");
    this.#renderData(data.languages, "languageDistributionLine", "languageDistributionReport", true, "bar");

    this.#showTrends(data.trends);
    this.#showPostTrends(data);
  }

  #renderData(dataset, id1, id2, round = true, type = "doughnut") {
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

  async #showTrends(dataset) {
    this.#renderTrends('userTrendsLine', 'User Trends', 'Number of users', dataset.map(a => a.date),
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

    this.#renderTrends('serverTrendsLine', 'Server Trends', 'Number of servers', dataset.map(a => a.date),
      [{
        label: "Servers",
        data: dataset.map(a => a.totalServers),
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.4
      }]);
  }

  async #showPostTrends(data) {
    const postDataset = data.trends.filter(a => "localPosts" in a);

    let dateCount = {};
    let currentDate = postDataset[0].date;
    for (let i = 1; i < postDataset.length; ++i) {
      let count = 0;
      while (currentDate < postDataset[i].date) {
        var parts = currentDate.split("-");
        var dt = new Date(parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10));
        dt.setDate(dt.getDate() + 1);

        const yyyy = dt.getFullYear();
        let mm = dt.getMonth() + 1; // Months start at 0!
        let dd = dt.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        currentDate = yyyy + '-' + mm + '-' + dd;
        count++;
      }

      dateCount[postDataset[i].date] = count;
    }

    const diffPostDataset = [];
    for (let i = 1; i < postDataset.length; ++i) {
      diffPostDataset.push({
        date: postDataset[i].date,
        value: (postDataset[i].localPosts - postDataset[i - 1].localPosts) / dateCount[postDataset[i].date]
      });
    }

    const dates = postDataset.map(a => a.date);

    const trendData = [];

    for (const instance of data.postsByActiveInstances) {
      let initValue = instance.dataset.find(a => a.date === dates[0])?.localPosts || 0;
      const instanceDataset = [];
      for (let i = 1; i < dates.length; ++i) {
        let currentValue = instance.dataset.find(a => a.date === dates[i])?.localPosts || 0;
        instanceDataset.push({
          date: dates[i],
          value: (currentValue - initValue) / dateCount[dates[i]]
        });
        initValue = currentValue;
      }

      trendData.push({
        label: instance.server,
        data: instanceDataset.map(a => a.value),
        fill: false,
        cubicInterpolationMode: 'monotone',
        tension: 0.4
      });
    }

    let initValue = data.postsByActiveInstances.reduce((partialSum, a) => partialSum + a.dataset.find(a => a.date === dates[0])?.localPosts || 0, 0);
    const instanceDataset = [];
    for (let i = 1; i < dates.length; ++i) {
      let currentValue = data.postsByActiveInstances.reduce((partialSum, a) => partialSum + a.dataset.find(a => a.date === dates[i])?.localPosts || 0, 0);
      instanceDataset.push({
        date: dates[i],
        value: (currentValue - initValue) / dateCount[dates[i]]
      });
      initValue = currentValue;
    }

    trendData.push({
      label: "Total diff",
      data: instanceDataset.map(a => a.value),
      fill: false,
      cubicInterpolationMode: 'monotone',
      tension: 0.4
    });

    this.#renderTrends('postTrendsLine', 'Post Trends', 'Number of new posts', diffPostDataset.map(a => a.date), trendData);
  }

  #renderTrends(id, title, y_title, labels, datasets) {
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
            type: 'time',
            title: {
              display: true
            },
            time: {
              unit: 'day'
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