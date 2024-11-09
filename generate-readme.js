// generate-readme.js
import fetch from 'node-fetch';

const data = await (await fetch("https://unpkg.com/@mdn/browser-compat-data")).json();

const START_YEAR = 2013;
const CURRENT_YEAR = new Date().getFullYear();

const { browsers, css } = data;

// Helper functions (simplified from original)
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

// ... (rest of the logic similar to original code, but using START_YEAR) ...

// Replace date comparison logic with year comparison
if (generalAvailability.getUTCFullYear() < START_YEAR) continue;

// ... (rest of the logic remains the same) ...

// Convert DOM to Markdown string
const readmeContent = document.body.innerHTML.replace(/<\/?code>/g, '`'); // Replace code tags with backticks

console.log(readmeContent);
