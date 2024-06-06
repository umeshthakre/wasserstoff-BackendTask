import * as http from "http";
import * as serverConfig from "./config.json" assert { type: "json" };
import httpProxy from "http-proxy";

const proxy = httpProxy.createProxyServer({});

let current = 0;

const servers = serverConfig.default.servers.map((server) => ({
  ...server,
  connections: 0,
}));

const roundRobin = (servers, req, res) => {
  const target = servers[current];

  console.log(target);
  current = (current + 1) % servers.length;

  proxy.web(req, res, { target: `http://${target.host}:${target.port}` });
};

const leastConnections = (servers, req, res) => {
  servers = servers.sort((a, b) => a.connections - b.connections);

  const target = servers[0];

  target.connections++;

  console.log(target);

  proxy.web(req, res, { target: `http://${target.host}:${target.port}` });

  res.on("finish", () => {
    target.connections--;
  });
};

const weightedRoundRobin = (servers, req, res) => {
  servers = servers.sort((a, b) => b.weight - a.weight);
  const target = servers[0];

  target.weight = target.weight + Math.floor(Math.random() * 10);

  servers.map((s, i) => {
    console.log(`${i} ` + s.weight);
  });

  proxy.web(req, res, { target: `http://${target.host}:${target.port}` });

  res.on("finish", () => {
    target.weight = target.weight - Math.floor(Math.random() * 10);
  });
};

const IPHashing = (servers, req, res) => {
 let a= generateRandomIP().split('').map(i => i.charCodeAt(0)).reduce((a, b) => a + b, 0) % 10


  console.log(a)

};

const generateRandomIP = () => {
  const ip =
    Math.floor(Math.random() * 255) +
    1 +
    "." +
    Math.floor(Math.random() * 255) +
    "." +
    Math.floor(Math.random() * 255) +
    "." +
    Math.floor(Math.random() * 255);

  return ip;
};

const loadBalancingAlgorithm = "weightedRoundRobin";

const server = http.createServer((req, res) => {
  if (loadBalancingAlgorithm === "roundRobin") {
    roundRobin(servers, req, res);
  } else if (loadBalancingAlgorithm === "leastConnection") {
    leastConnections(servers, req, res);
  } else if (loadBalancingAlgorithm === "weightedRoundRobin") {
    weightedRoundRobin(servers, req, res);
  } else {
    res.writeHead(500);
    res.end("Load balancing algorithm is not supported");
  }
});

server.listen(3000, () => {
  console.log("load balancer running on port 3000");
});
