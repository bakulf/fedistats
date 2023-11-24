const fs = require('fs');

class Stats {
  run() {
    const data = JSON.parse(fs.readFileSync("./LOG.json"));
    delete data['egirls.gay'];

    const report = {
      totalUsers: Object.keys(data).map(key => parseInt(data[key].nodeInfo.usage?.users?.total || 0)).reduce((partialSum, a) => partialSum + a, 0),
      totalServers: Object.keys(data).length,
      totalMAU: Object.keys(data).map(key => parseInt(data[key].nodeInfo.usage?.users?.activeMonth || 0)).reduce((partialSum, a) => partialSum + a, 0),

      usersBySoftware: this._showUsersBySoftware(data),
      activeUsersBySoftware: this._showActiveUsersBySoftware(data),
      usersByProtocol: this._showUsersByProtocol(data),
      usersByInstance: this._showUsersByInstance(data),
      softwareByInstance: this._showSoftwaresByInstance(data),
      mastodonPublicTimeline: this._showMastodonPublicTimeline(data),
    }

    fs.writeFileSync("pre.json", JSON.stringify(report));
  }

  _showUsersBySoftware(data) {
    const dataset = {};
    Object.keys(data).forEach(server => {
      const node = data[server].nodeInfo;
      if (node.software?.name) {
        if (!dataset[node.software.name]) {
          dataset[node.software.name] = 0;
        }
        dataset[node.software.name] += parseInt(node.usage?.users?.total || 0);
      }
    });
    return dataset;
  }

  _showActiveUsersBySoftware(data) {
    const dataset = {};
    Object.keys(data).forEach(server => {
      const node = data[server].nodeInfo;
      if (node.software?.name) {
        if (!dataset[node.software.name]) {
          dataset[node.software.name] = 0;
        }

        dataset[node.software.name] += parseInt(node.usage?.users?.activeMonth || 0);
      }
    });
    return dataset;
  }

  _showUsersByProtocol(data) {
    const dataset = {};
    Object.keys(data).forEach(server => {
      const node = data[server].nodeInfo;
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

    return dataset;
  }

  _showUsersByInstance(data) {
    const dataset = {};
    Object.keys(data).forEach(server => {
      const node = data[server].nodeInfo;
      if (!dataset[server]) dataset[server] = 0;
      dataset[server] += parseInt(node.usage?.users?.total || 0);
    });
    return dataset;
  }

  _showSoftwaresByInstance(data) {
    const dataset = {};
    Object.keys(data).forEach(server => {
      const node = data[server].nodeInfo;
      if (node.software?.name) {
        if (!dataset[node.software.name]) {
          dataset[node.software.name] = 0;
        }
        dataset[node.software.name] += 1;
      }
    });
    return dataset;
  }

  _showMastodonPublicTimeline(data) {
    const dataset = {
      public: 0,
      private: 0
    };
    Object.keys(data).forEach(server => {
      const node = data[server];
      if ("mastodon_public" in node) {
        if (node.mastodon_public) dataset.public += 1;
        else dataset.private += 1;
      }
    });
    return dataset;
  }
}

const stats = new Stats();
stats.run();
