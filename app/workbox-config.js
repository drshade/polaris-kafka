module.exports = {
  "globDirectory": "build/",
  "globPatterns": [
    "index.html",
    "static/**/*.{json,ico,html,js,css}"
  ],
  "swSrc": "src/sw.js",
  "swDest": "build/sw.js",
  "injectionPointRegexp": /(const precacheManifest = )\[\](;)/
};