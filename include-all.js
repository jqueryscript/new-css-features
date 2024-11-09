// generate-features.js
const fs = require('fs');
const bcd = require('@mdn/browser-compat-data');

const START_YEAR = 2013;
const END_YEAR = new Date().getUTCFullYear();

const { browsers, css } = bcd;
const { chrome, safari, firefox } = browsers;

// Helper function to update dates for GMT
const updateForGMT = (date) => {
  date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
  return date;
};

// CSS feature categories we want to track
const CSS_CATEGORIES = {
  PROPERTIES: 'CSS Properties',
  SELECTORS: 'CSS Selectors',
  AT_RULES: 'CSS At-Rules',
  UNITS: 'CSS Units',
  FUNCTIONS: 'CSS Functions',
  TYPES: 'CSS Types',
  MEDIA_FEATURES: 'CSS Media Features',
  PSEUDO_CLASSES: 'CSS Pseudo-classes',
  PSEUDO_ELEMENTS: 'CSS Pseudo-elements',
  VALUES: 'CSS Values'
};

// Helper function to categorize CSS features
function categorizeFeature(path, feature) {
  if (path.startsWith('css.properties')) return CSS_CATEGORIES.PROPERTIES;
  if (path.startsWith('css.selectors')) return CSS_CATEGORIES.SELECTORS;
  if (path.startsWith('css.at-rules')) return CSS_CATEGORIES.AT_RULES;
  if (path.startsWith('css.types')) return CSS_CATEGORIES.TYPES;
  if (path.includes('units')) return CSS_CATEGORIES.UNITS;
  if (path.includes('function')) return CSS_CATEGORIES.FUNCTIONS;
  if (path.startsWith('css.media')) return CSS_CATEGORIES.MEDIA_FEATURES;
  if (path.startsWith('css.pseudo-classes')) return CSS_CATEGORIES.PSEUDO_CLASSES;
  if (path.startsWith('css.pseudo-elements')) return CSS_CATEGORIES.PSEUDO_ELEMENTS;
  if (feature.__compat?.status?.experimental) return 'Experimental Features';
  return CSS_CATEGORIES.VALUES;
}

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

// Helper function to process features recursively
function processFeatures(obj, path = '') {
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (value.__compat) {
      const support = value.__compat.support;
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

      const category = categorizeFeature(currentPath, value);
      
      // Store feature information
      allSupportedFeatures[year] = allSupportedFeatures[year] || {};
      allSupportedFeatures[year][category] = allSupportedFeatures[year][category] || [];
      
      const featureInfo = {
        name: key,
        path: currentPath,
        description: value.__compat.description || key,
        mdn_url: value.__compat.mdn_url,
        support: versions,
        status: value.__compat.status
      };

      // Add syntax if available
      if (value.syntax) {
        featureInfo.syntax = value.syntax;
      }

      allSupportedFeatures[year][category].push(featureInfo);
    }

    // Recursively process nested features
    if (typeof value === 'object' && !value.__compat) {
      processFeatures(value, currentPath);
    }
  }
}

// Process all CSS features
processFeatures(css);

// Generate README content
let readmeContent = '# CSS Features Timeline\n\n';
readmeContent += 'A comprehensive list of new CSS features, properties, selectors, and values by year of general availability across major browsers.\n\n';
readmeContent += '_This document is automatically generated weekly._\n\n';

let totalFeatures = 0;
const categoryTotals = {};

for (let year = END_YEAR; year >= START_YEAR; year--) {
  if (!allSupportedFeatures[year]) continue;
  
  readmeContent += `## ${year}\n\n`;
  
  const sortedCategories = Object.keys(allSupportedFeatures[year]).sort();
  
  for (const category of sortedCategories) {
    const features = allSupportedFeatures[year][category];
    if (features.length === 0) continue;
    
    readmeContent += `### ${category}\n\n`;
    categoryTotals[category] = (categoryTotals[category] || 0) + features.length;
    
    features.sort((a, b) => a.name.localeCompare(b.name));
    
    features.forEach(feature => {
      totalFeatures++;
      const mdnLink = feature.mdn_url ? `[${feature.name}](${feature.mdn_url})` : feature.name;
      let featureDescription = `- ${mdnLink}`;
      
      // Add syntax if available
      if (feature.syntax) {
        featureDescription += `\n  - Syntax: \`${feature.syntax}\``;
      }
      
      // Add browser support
      featureDescription += `\n  - Browser Support: Chrome ${feature.support.chrome}, Firefox ${feature.support.firefox}, Safari ${feature.support.safari}`;
      
      // Add status badges if experimental or deprecated
      if (feature.status?.experimental) {
        featureDescription += ' 🧪';
      }
      if (feature.status?.deprecated) {
        featureDescription += ' ⚠️';
      }
      
      readmeContent += featureDescription + '\n\n';
    });
  }
}

// Add summary section
readmeContent += `## Summary\n\n`;
readmeContent += `Total new features since ${START_YEAR}: ${totalFeatures}\n\n`;
readmeContent += `### Features by Category:\n`;
Object.entries(categoryTotals)
  .sort(([,a], [,b]) => b - a)
  .forEach(([category, count]) => {
    readmeContent += `- ${category}: ${count}\n`;
  });

readmeContent += `\n### Legend\n`;
readmeContent += `- 🧪 Experimental feature\n`;
readmeContent += `- ⚠️ Deprecated feature\n`;

readmeContent += `\nLast updated: ${new Date().toISOString().split('T')[0]}\n`;

// Write to README.md
fs.writeFileSync('README.md', readmeContent);

console.log('README.md has been generated successfully!');
