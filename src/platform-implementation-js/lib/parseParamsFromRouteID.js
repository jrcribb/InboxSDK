/* @flow */

import zip from 'lodash/zip';

export default function parseParamsFromRouteID(routeID: string, hash: string): {[ix:string]: string} {
  const params = Object.create(null);
  zip(routeID.split('/'), hash.split('/')).forEach(([routePart, hashPart], i) => {
    if (routePart[0] === ':') {
      params[routePart.slice(1)] = decodeURIComponent(hashPart.replace(/\+/g, ' '));
    }
  });
  return Object.freeze(params);
}
