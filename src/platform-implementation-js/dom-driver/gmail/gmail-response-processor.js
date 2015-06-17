import _ from 'lodash';
import htmlToText from '../../../common/html-to-text';

export function interpretSentEmailResponse(responseString) {
  var emailSentArray = deserialize(responseString);

  var gmailMessageId = extractGmailMessageIdFromSentEmail(emailSentArray);
  var gmailThreadId = extractGmailThreadIdFromSentEmail(emailSentArray) || gmailMessageId;
  return {
    gmailThreadId: gmailThreadId,
    gmailMessageId: gmailMessageId,
    threadID: gmailThreadId,
    messageID: gmailMessageId
  };
}

export function extractGmailMessageIdFromSentEmail(emailSentArray) {
  var messageIdArrayMarker = "a";
  var messageIdArray = _searchArray(emailSentArray, messageIdArrayMarker, function(markerArray) {
    return markerArray.length > 3 && _.isArray(markerArray[3]) && markerArray[3].length > 0;
  });

  if(!messageIdArray){
    return null;
  }

  return messageIdArray[3][0];
}

export function extractGmailThreadIdFromSentEmail(emailSentArray) {
  var threadIdArrayMarker = "csd";
  var threadIdArray = _searchArray(emailSentArray, threadIdArrayMarker, function(markerArray) {
    return markerArray.length == 3 && _.isArray(markerArray[2]) && markerArray[2].length > 5;
  });

  if(!threadIdArray){
    return null;
  }

  return threadIdArray[1];
}

// TODO what is this for?
/*export*/ function extractHexGmailThreadIdFromMessageIdSearch(responseString) {
  if(!responseString){
    return null;
  }

  var threadResponseArray = deserialize(responseString);
  var threadIdArrayMarker = "cs";
  var threadIdArray = _searchArray(threadResponseArray, threadIdArrayMarker, function(markerArray){
    return markerArray.length > 20;
  });

  if(!threadIdArray){
    return;
  }

  return threadIdArray[1];
}

export function rewriteSingleQuotes(s) {
  // The input string contains unquoted, double-quoted, and single-quoted
  // parts. Parse the string for these parts, and transform the single-
  // quoted part into a double-quoted part by swapping the quotes, and
  // escaping any double-quotes inside of it with backslashes.

  // i is our position in the input string. result is our result string that
  // we'll copy the parts of the input to as we interpret them.
  var i = 0, result = "";
  while (true) {
    // Find the position of the next singly or doubly quoted part.
    var m = s.substr(i).match(/['"]/);
    if (!m) {
      result += s.substr(i);
      break;
    }
    // Copy the unquoted part preceding the quoted section we found into the
    // result, and put a double-quote into the result to begin the quoted
    // section we found.
    result += s.substr(i,m.index) + '"';
    i += m.index + 1;
    if (m[0] == '"') {
      // Match the contents (and end quote) of the entire double-quoted part that
      // we found. Match as many non-double-quote and non-backslash characters as
      // we can, and also match any character (including a double-quote) that
      // follows a backslash. Then these tokens must be followed by a double
      // quote. This allows us to correctly detect the end of the quoted part,
      // without stopping early on an escaped double quote.
      m = s.substr(i).match(/^([^"\\]|\\.)*"/);
      if (!m) {
        throw new Error("Unclosed double quote");
      }
      // Add that entire double-quoted part to the result.
      result += s.substr(i,m[0].length);
      i += m[0].length;
    } else {
      // Same logic as above, but for a single-quoted part.
      m = s.substr(i).match(/^([^'\\]|\\.)*'/);
      if (!m) {
        throw new Error("Unclosed single quote");
      }
      // Escape all double-quotes inside the part, and then write it out
      // into the result with the ending single-quote replaced with a
      // double-quote.
      var part = s.substr(i,m[0].length-1).replace(/"/g, '\\"');
      result += part + '"';
      i += m[0].length;
    }
  }
  return result;
}

export function deserialize(threadResponseString) {
  var VIEW_DATA = threadResponseString.substring(
    threadResponseString.indexOf('['), threadResponseString.lastIndexOf(']')+1);

  VIEW_DATA = VIEW_DATA.replace(/[\r\n\t]/g, '');

  // Change all the singly quoted parts to use double-quotes so that the
  // data can be JSON-decoded instead of eval'd. (Also necessary for the
  // next step.)
  VIEW_DATA = rewriteSingleQuotes(VIEW_DATA);

  // Fix some things with the data. (It's in a weird minified JSON-like
  // format). Make sure we don't modify any data inside of strings!
  var in_string = false;
  VIEW_DATA = VIEW_DATA.replace(/(^|")([^"\\]|\\.)*/g, function(match) {
    if (!in_string) {
      match = match
      .replace(/\]\d+\[/g, '],[') // ignore those length values
      .replace(/,\s*(?=,|\])/g, ',null') // fix implied nulls
      .replace(/\[\s*(?=,)/g, '[null'); // "
    }
    in_string = !in_string;
    return match;
  });

  VIEW_DATA = '[' + VIEW_DATA + ']';

  var vData;
  try {
    vData = JSON.parse(VIEW_DATA);
  }
  catch(err){
    throw new Error('deserialization error');
  }

  return vData;
}

export function threadListSerialize(threadResponseArray, dontIncludeNumbers) {
  var response = ")]}'\n\n";
  for(var ii=0; ii<threadResponseArray.length; ii++){
    var arraySection = threadResponseArray[ii];
    var arraySectionString = serializeArray(arraySection);

    if(dontIncludeNumbers){
      response += arraySectionString;
      continue;
    }
    var length = arraySectionString.length + 1;
    response += length + '\n' + arraySectionString;
  }

  if(dontIncludeNumbers){
    var lines = response.split(/\r|\n/);
    var firstLines = _.dropRight(lines, 3);
    var lastLines = _.takeRight(lines, 3);
    response = firstLines.join('\n');
    response += '\n' + lastLines[0] + lastLines[1].replace(/\"/g, "'");
  }

  return response;
}

export function suggestionSerialize(suggestionsArray) {
  var response = "5\n)]}'\n";
  for(var ii=0; ii<suggestionsArray.length; ii++){
    var arraySection = suggestionsArray[ii];
    var arraySectionString = serializeArray(arraySection);

    var length = arraySectionString.length;
    response += length + '\r\n' + arraySectionString;
  }

  return response;
}

export function serializeArray(array) {
  var response = '[';
  for(var ii=0; ii<array.length; ii++){
    var item = array[ii];

    var addition;
    if(_.isArray(item)){
      addition = serializeArray(item);
    }
    else if(item == null) {
      addition = '';
    }
    else {
      addition = JSON.stringify(item)
        .replace(/</igm, '\\u003c')
        .replace(/=/igm, '\\u003d')
        .replace(/>/igm, '\\u003e')
        .replace(/&/igm, '\\u0026');
    }

    if(ii > 0){
      response += ',';
    }
    response += addition;
  }

  response += ']\n';

  return response;
}

export function replaceThreadsInResponse(response, replacementThreads) {
  const parsed = deserialize(response);
  const firstTbIndex = _.findIndex(parsed, item => item[0] && item[0][0] === 'tb');
  const [parsedTb, parsedNoTb] = _.partition(parsed, item => item[0] && item[0][0] === 'tb');
  const tbFollowers = _.chain(parsedTb).flatten().filter(item => item[0] !== 'tb').value();
  const newTbs = _threadsToTbStructure(replacementThreads, tbFollowers);
  const parsedNew = _.flatten([
    parsedNoTb.slice(0, firstTbIndex),
    newTbs,
    parsedNoTb.slice(firstTbIndex)
  ]);
  return threadListSerialize(parsedNew);
}

export function extractThreads(response) {
  const crapFormatThreads = deserialize(response);
  return _extractThreadArraysFromResponseArray(crapFormatThreads).map(thread =>
    Object.freeze(Object.defineProperty({
      subject: htmlToText(thread[9]),
      shortDate: htmlToText(thread[14]),
      timeString: htmlToText(thread[15]),
      peopleHtml: cleanupPeopleLine(thread[7]),
      timestamp: thread[16] / 1000,
      isUnread: thread[9].indexOf('<b>') > -1,
      lastEmailAddress: thread[28],
      bodyPreviewHtml: thread[10],
      someGmailMessageIds: [thread[1], thread[2]],
      gmailThreadId: thread[0]
    }, '_originalGmailFormat', {value: thread}))
  );
}

export function cleanupPeopleLine(peopleHtml) {
  // Removes possible headings like "To: " that get added on the Sent page, and
  // removes a class that's specific to the current preview pane setting.
  return peopleHtml
    .replace(/^[^<]*/, '')
    .replace(/(<span[^>]*) class="[^"]*"/g, '$1');
}

function _extractThreadArraysFromResponseArray(threadResponseArray){
  return _.chain(threadResponseArray)
    .flatten()
    .filter(item => item[0] === 'tb')
    .map(item => item[2])
    .flatten()
    .value();
}

function _threadsToTbStructure(threads, followers=[]) {
  const tbs = _.chain(threads)
    .map(thread => thread._originalGmailFormat)
    .chunk(10)
    .map((threadsChunk, i) => [['tb', i*10, threadsChunk]])
    .value();
  if (tbs.length > 0) {
    tbs[tbs.length-1] = tbs[tbs.length-1].concat(followers);
  } else if (followers.length > 0) {
    tbs.push(followers);
  }
  return tbs;
}

function _doesResponseUseFormatWithSectionNumbers(responseString){
  var lines = responseString.split(/\n|\r/);
  return !!lines[2].match(/^\d/);
}

function _searchArray(responseArray, marker, markerArrayValidator){
  var pathArray = _searchObject(responseArray, marker, 100);

  for(var ii=0; ii<pathArray.length; ii++){
    var pathToMarkerArray = _.initial(pathArray[ii].path);
    var markerArray = _getArrayValueFromPath(responseArray, pathToMarkerArray);

    if(markerArrayValidator(markerArray)){
      return markerArray;
    }
  }
}

function _searchObject(element, query, maxDepth) {
  var retVal = [];
  var initialNode = {
    el: element,
    path: []
  };
  var nodeList = [initialNode];

  while (nodeList.length > 0) {
    var node = nodeList.pop();
    if (node.path.length <= maxDepth) {
      if(node.el !== null && typeof node.el === 'object'){
        var keys = Object.keys(node.el);
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          var newNode = {
            el: node.el[key],
            path: node.path.concat([key])
          };
          nodeList.push(newNode);
        }
      } else {
        if (node.el === query) {
          retVal.push(node);
        }
      }
    }
  }
  return retVal;
}

function _getArrayValueFromPath(responseArray, path){
  var currentArray = responseArray;
  for(var ii=0; ii<path.length; ii++){
    currentArray = currentArray[ path[ii] ];
  }
  return currentArray;
}
