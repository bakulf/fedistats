const report = {};
const fs = require('fs');

async function process(server) {
  console.log(`Processing ${server}...`);
  let data;
  try {
    data = await fetch(`https://${server}/.well-known/nodeinfo`).then(r => r.json());
  } catch(e) {
    console.log(`Failed to fetch nodeinfo for ${server}`);
    return;
  }

  if (!Array.isArray(data.links)) {
    console.log(`Invalid nodeinfo for server ${server}`);
    return;
  }

  obj = data.links.find(a => a.rel === "http://nodeinfo.diaspora.software/ns/schema/2.1");
  if (!obj) {
    obj = data.links.find(a => a.rel === "http://nodeinfo.diaspora.software/ns/schema/2.0");
  }

  if (!obj) {
    console.log(`Invalid schema for server ${server}`);
    return;
  }

  let nodeInfo;
  try {
    nodeInfo = await fetch(obj.href).then(r => r.json());
  } catch(e) {
    console.log(`Failed to fetch the nodeinfo endpoint for ${server}`);
    return;
  }

  report[server] = { nodeInfo };

  if (nodeInfo.software?.name === "mastodon") {
    try {
      report[server].mastodon = await fetch(`https://${server}/api/v1/instance`).then(r => r.json());
    } catch(e) {
      console.log(`Failed to fetch the mastodon instance endpoint for server ${server}`);
    }

    try {
      const public_timeline = await fetch(`https://${server}/api/v1/timelines/public`).then(r => r.json());
      report[server].mastodon_public = Array.isArray(public_timeline);
    } catch(e) {
      report[server].mastodon_public = false;
    }
  }

  fs.writeFileSync("LOG.json", JSON.stringify(report));
}

async function worker(servers) {
  while(servers.length) {
    const server = servers.splice(0, 1);
    await process(server);
  }
}

async function magic() {
  const servers = await fetch("https://nodes.fediverse.party/nodes.json").then(r => r.json());

  const p = [];
  for (let i = 0; i < 25; ++i) {
    p.push(worker(servers));
  }

  await Promise.all(p);

  console.log(report);
}

magic()
