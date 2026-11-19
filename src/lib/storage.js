// Safe storage helpers. Private windows and blocked site data make these throw; the site must not care.
const read = (store, key) => {
  try {
    return window[store].getItem(key);
  } catch {
    return null;
  }
};
const write = (store, key, value) => {
  try {
    window[store].setItem(key, value);
  } catch {
    /* storage unavailable: keep going in memory */
  }
};

export const local = {
  get: (key) => read('localStorage', key),
  set: (key, value) => write('localStorage', key, value),
};
export const session = {
  get: (key) => read('sessionStorage', key),
  set: (key, value) => write('sessionStorage', key, value),
};

/** URL query flags used for QA: ?lang=id ?tier=low ?nowebgl=1 ?nointro=1 ?debug=maxone ?perf=1 */
export const query = (name) => {
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
};
