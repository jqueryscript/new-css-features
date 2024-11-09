// generate-readme.js
import fetch from 'node-fetch';

const data = await (await fetch("https://unpkg.com/@mdn/browser-compat-data")).json();
const START_YEAR = 2013;
const CURRENT_YEAR = new Date().getFullYear();
const { browsers, css } = data;

// Helper functions
const h = (name, attrs = {}, ...children) => {
  const el = document.createElement(name);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  el.append(...children);
  return el;
};

const c = (parent, ...children) => {
  parent.append(...children);
  return parent;
};


for (const feature of features) { 
  const generalAvailability = getFeatureAvailability(feature); 
  if (generalAvailability.getUTCFullYear() < START_YEAR) {
    continue; 
  }
}

const readmeContent = document.body.innerHTML.replace(/<\/?code>/g, '`');
console.log(readmeContent);
