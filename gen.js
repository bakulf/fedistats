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

  report[server] = nodeInfo;

  fs.writeFileSync("LOG.json", JSON.stringify(report));
}

async function magic() {
  const servers = await fetch("https://nodes.fediverse.party/nodes.json").then(r => r.json());

  const chunkSize = 100;
  for (let i = 0; i < servers.length; i += chunkSize) {
    const chunk = servers.slice(i, i + chunkSize);
    await Promise.all(chunk.map(server => process(server)));
  }

  console.log(report);
}

magic()
