// generate-features.js
const fs = require('fs');
const bcd = require('@mdn/browser-compat-data');

const START_YEAR = 2018;
const END_YEAR = new Date().getUTCFullYear();

const { browsers, css } = bcd;
const { chrome, safari, firefox } = browsers;

// Helper function to update dates for GMT
const updateForGMT = (date) => {
  date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
  return date;
};

// Process browser release dates
for (const browser of [chrome, safari, firefox]) {
  for (const release of Object.values(browser.releases)) {
    if (release.release_date) {
      const [YYYY, MM, DD] = release.release_date.split("-");
      release.release_date = updateForGMT(new Date(+YYYY, MM - 1, +DD));
    }
  }
}

// Collect features by year
const allSupportedFeatures = {};

for (const [category, features] of Object.entries(css)) {
  const featuresEntries = [...Object.entries(features)];
  
  for (const [featureName, feature] of featuresEntries) {
    if (!feature?.__compat) {
      Object.entries(feature).forEach(([otherName, data]) => {
        featuresEntries.push([`${featureName}: ${otherName}`, data]);
      });
      continue;
    }

    const support = feature.__compat.support;
    if (!support) continue;

    const versions = {
      chrome: support.chrome?.version_added,
      firefox: support.firefox?.version_added,
      safari: support.safari?.version_added
    };

    // Skip if any browser doesn't support or if versions are non-numeric
    if (!versions.chrome || !versions.firefox || !versions.safari) continue;
    if (!/^\d/.test(versions.chrome) || !/^\d/.test(versions.firefox) || !/^\d/.test(versions.safari)) continue;

    const releaseDates = new Map();
    
    // Get release dates for each browser version
    for (const [browser, version] of Object.entries(versions)) {
      const browserObj = { chrome, firefox, safari }[browser];
      const releaseDate = browserObj.releases[version]?.release_date;
      if (releaseDate) {
        releaseDates.set(Number(releaseDate), `${browser} ${version}`);
      }
    }

    if (releaseDates.size === 0) continue;

    const generalAvailabilityTime = Math.max(...releaseDates.keys());
    const generalAvailability = new Date(generalAvailabilityTime);
    const year = generalAvailability.getUTCFullYear();
    
    if (year < START_YEAR) continue;

    // Store feature information
    allSupportedFeatures[year] = allSupportedFeatures[year] || {};
    allSupportedFeatures[year][category] = allSupportedFeatures[year][category] || [];
    allSupportedFeatures[year][category].push({
      feature: featureName,
      description: feature.__compat.description || featureName,
      mdn_url: feature.__compat.mdn_url,
      support: versions
    });
  }
}

// Generate README content
let readmeContent = '# CSS Features Timeline\n\n';
readmeContent += 'A comprehensive list of CSS features by year of general availability across major browsers.\n\n';
readmeContent += '_This document is automatically generated weekly._\n\n';

let totalFeatures = 0;

for (let year = END_YEAR; year >= START_YEAR; year--) {
  if (!allSupportedFeatures[year]) continue;
  
  readmeContent += `## ${year}\n\n`;
  
  for (const [category, features] of Object.entries(allSupportedFeatures[year])) {
    if (features.length === 0) continue;
    
    readmeContent += `### ${category}\n\n`;
    
    features.forEach(feature => {
      totalFeatures++;
      const mdnLink = feature.mdn_url ? `[${feature.description}](${feature.mdn_url})` : feature.description;
      readmeContent += `- ${mdnLink} (Chrome ${feature.support.chrome}, Firefox ${feature.support.firefox}, Safari ${feature.support.safari})\n`;
    });
    
    readmeContent += '\n';
  }
}

readmeContent += `\n## Summary\n\n`;
readmeContent += `Total features tracked: ${totalFeatures}\n`;
readmeContent += `\nLast updated: ${new Date().toISOString().split('T')[0]}\n`;

// Write to README.md
fs.writeFileSync('README.md', readmeContent);

console.log('README.md has been generated successfully!');
