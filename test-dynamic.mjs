import "dotenv/config";
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === "development") {
    await import("some-missing-package");
}
console.log("Success");
