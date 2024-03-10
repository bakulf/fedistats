const fs = require('fs');
const cld = require('cld');

class Stats {
  async run() {
    const data = JSON.parse(fs.readFileSync("./LOG.json"));
    const stat = fs.statSync("./LOG.json");
    delete data['egirls.gay'];

    const trends = [];
    fs.readdirSync("./old").filter(f => f.endsWith(".json")).forEach(file => {
      trends.push({
        date: file.slice(0, file.indexOf('.')),
        data: JSON.parse(fs.readFileSync(`./old/${file}`))
      })
    });
    trends.sort((a, b) => a.date > b.date);

    const report = {
      ctime: stat.ctimeMs,
      totalUsers: Object.keys(data).map(key => parseInt(data[key].nodeInfo.usage?.users?.total || 0)).reduce((partialSum, a) => partialSum + a, 0),
      totalServers: Object.keys(data).length,
      totalMAU: Object.keys(data).map(key => parseInt(data[key].nodeInfo.usage?.users?.activeMonth || 0)).reduce((partialSum, a) => partialSum + a, 0),
      localPosts: Object.keys(data).map(key => parseInt(data[key].nodeInfo.usage?.localPosts || 0)).reduce((partialSum, a) => partialSum + a, 0),

      usersBySoftware: this._showUsersBySoftware(data),
      activeUsersBySoftware: this._showActiveUsersBySoftware(data),
      usersByProtocol: this._showUsersByProtocol(data),
      usersByInstance: this._showUsersByInstance(data),
      softwareByInstance: this._showSoftwaresByInstance(data),
      mastodonPublicTimeline: this._showMastodonPublicTimeline(data),
      userDistribution: this._showUserDistribution(data),
      activeUserDistribution: this._showActiveUserDistribution(data),
      activeVsInactive: this._showActiveVsInactive(data),
      ruleDistribution: this._showRuleDistribution(data),
      ruleWords: this._showRuleWords(data),
      detectedLanguages: await this._showDetectedLanguages(data),
      languages: this._showLanguages(data),
      trends: this._showTrends(trends),
    }

    fs.writeFileSync("pre.json", JSON.stringify(report));
    fs.writeFileSync(`old/${new Date().toISOString().replace(/T.*/,'').split('-').join('-')}.json`, JSON.stringify(report));

    fs.writeFileSync("rule_archive.json", JSON.stringify(this._ruleArchive(data)));
  }

  _showTrends(trends) {
    return trends.map(a => ({
      date: a.date,
      totalUsers: a.data.totalUsers,
      totalMAU: a.data.totalMAU,
      localPosts: a.data.localPosts,
      totalServers: a.data.totalServers
    }));
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

  _showUserDistribution(data) {
    const dataset = {
      "up to 0": 0,
      "up to 1": 0,
      "up to 10": 0,
      "up to 100": 0,
      "up to 1000": 0,
      "more than 1000": 0,
    };
    Object.keys(data).forEach(server => {
      const node = data[server].nodeInfo;
      if (data[server].nodeInfo.usage?.users?.total <= 0) dataset["up to 0"] += 1;
      else if (data[server].nodeInfo.usage?.users?.total <= 1) dataset["up to 1"] += 1;
      else if (data[server].nodeInfo.usage?.users?.total <= 10) dataset["up to 10"] += 1;
      else if (data[server].nodeInfo.usage?.users?.total <= 100) dataset["up to 100"] += 1;
      else if (data[server].nodeInfo.usage?.users?.total <= 1000) dataset["up to 1000"] += 1;
      else dataset["more than 1000"] += 1;
    });
    return dataset;
  }

  _showRuleDistribution(data) {
    const dataset = {};
    Object.keys(data).filter(server => data[server].mastodon).forEach(server => {
      let count = 0;
      if (Array.isArray(data[server].mastodon.rules) && data[server].mastodon.rules.length > 0) {
        count = data[server].mastodon.rules.length;
      }

      if (!dataset[count]) dataset[count] = 0;
      dataset[count] += 1;
    });
    return dataset;
  }

  _showRuleWords(data) {
    const dataset = {};
    Object.keys(data).filter(server => data[server].mastodon).forEach(server => {
      if (!Array.isArray(data[server].mastodon.rules)) return;

      data[server].mastodon.rules.forEach(rule => {
        rule.text.split(/[ ,.]+/).filter(word => word.length >= 10).forEach(word => {
          word = word.trim();
          if (word.length > 3) {
            if (!dataset[word]) dataset[word] = 0;
            dataset[word] += 1;
          }
        });
      });
    });

    const labels = Object.keys(dataset).sort((a, b) => {
      if (dataset[a] > dataset[b]) return -1;
      if (dataset[b] < dataset[a]) return 1;
      return 0;
    });
    labels.splice(100);

    Object.keys(dataset).forEach(key => {
      if (!labels.includes(key)) delete dataset[key];
    });

    return dataset;
  }

  _showActiveUserDistribution(data) {
    const dataset = {
      "up to 0": 0,
      "up to 1": 0,
      "up to 10": 0,
      "up to 100": 0,
      "up to 1000": 0,
      "more than 1000": 0,
    };
    Object.keys(data).forEach(server => {
      const node = data[server].nodeInfo;
      if (data[server].nodeInfo.usage?.users?.activeMonth <= 0) dataset["up to 0"] += 1;
      else if (data[server].nodeInfo.usage?.users?.activeMonth <= 1) dataset["up to 1"] += 1;
      else if (data[server].nodeInfo.usage?.users?.activeMonth <= 10) dataset["up to 10"] += 1;
      else if (data[server].nodeInfo.usage?.users?.activeMonth <= 100) dataset["up to 100"] += 1;
      else if (data[server].nodeInfo.usage?.users?.activeMonth <= 1000) dataset["up to 1000"] += 1;
      else dataset["more than 1000"] += 1;
    });
    return dataset;
  }

  _showActiveVsInactive(data) {
    const dataset = {
      active: 0,
      inactive: 0
    };
    Object.keys(data).forEach(server => {
      if (data[server].nodeInfo.usage?.users?.activeMonth > 0) dataset.active += 1;
      else dataset.inactive += 1;
    });
    return dataset;
  }

  _ruleArchive(data) {
    const dataset = {};
    Object.keys(data).filter(server => data[server].mastodon && Array.isArray(data[server].mastodon.rules)).forEach(server => dataset[server] = data[server].mastodon.rules);
    return dataset;
  }

  async _showDetectedLanguages(data) {
    const dataset = {};

    await Promise.all(Object.keys(data).filter(server => data[server].mastodon && data[server].mastodon.description).map(async server => {
      let languages = null;
      try {
        languages = (await cld.detect(data[server].mastodon.description))?.languages;
      } catch (e) {}

      if (!Array.isArray(languages)) return;

      for (const language of languages) {
        const lang = new Intl.DisplayNames(['en'], {
          type: 'language'
        }).of(language.code);
        if (!dataset[lang]) dataset[lang] = 0;
        dataset[lang] += 1;
      }
    }));

    return dataset;
  }

  _showLanguages(data) {
    const dataset = {};

    Object.keys(data).filter(server => data[server].mastodon && data[server].mastodon.languages).forEach(async server => {
      for (const language of data[server].mastodon.languages) {
        const lang = new Intl.DisplayNames(['en'], {
          type: 'language'
        }).of(language);
        if (!dataset[lang]) dataset[lang] = 0;
        dataset[lang] += 1;
      }
    });

    return dataset;
  }
}

const stats = new Stats();
stats.run();