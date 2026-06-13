fetch("http://localhost:3000/api/data/reset", {method: "POST"}).then(res => res.json()).then(console.log).catch(console.error);
