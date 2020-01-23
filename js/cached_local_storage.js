class CachedLocalStorage {
  static get(key) {
    let item = localStorage.getItem(key)
    if(item == undefined) {
      return undefined;
    } else {
      let parsedItem = JSON.parse(item)
      if(parsedItem.expiry < _.now()) {
        return undefined;
      } else {
        return parsedItem.value;
      }
    }
  }

  static set(key, value, expiry = 30 * 60) {
    localStorage.setItem(key, JSON.stringify({ value: value, expiry: (_.now() + (expiry * 1000))}));
  }
}
