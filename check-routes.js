const http = require("http");

const routes = ["/", "/login", "/register", "/dashboard", "/menu", "/rooms", "/orders", "/kitchen", "/menu/hotel-lux"];

Promise.all(
    routes.map(
        (path) =>
            new Promise((resolve) => {
                const req = http.get({ hostname: "localhost", port: 3001, path }, (res) => {
                    resolve(`${res.statusCode} ${path}`);
                });
                req.on("error", (e) => resolve(`ERR ${path}: ${e.message}`));
                req.setTimeout(5000, () => { req.destroy(); resolve(`TIMEOUT ${path}`); });
            })
    )
).then((results) => {
    console.log("\n=== Frontend Route Health Check ===");
    results.forEach((r) => console.log(r));
    const allOk = results.every((r) => r.startsWith("200") || r.startsWith("307") || r.startsWith("308"));
    console.log(`\n${allOk ? "ALL ROUTES OK" : "SOME ROUTES HAVE ISSUES"}`);
});
