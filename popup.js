
// Search the bookmarks when entering the search keyword.
'use strict';

var curSelectedIndex = -1;
var searchedResults = [];

function dumpBookmarks(query) {
  // note that the function inside chrome.bookmarks.getTree is run asynchronousely
  chrome.bookmarks.getTree(
    function(bookmarkTreeNodes) {
      // console.log('root bookmark node');
      // dumpTreeNodes(bookmarkTreeNodes, query);

      var searchedResultsHash = {};

      var keyWordsArray = query.split(' ');
      var i;
      for (i = 0; i < keyWordsArray.length; i ++) {
        var keyWord = keyWordsArray[i];
        searchedResults = [];
        dumpTreeNodes(bookmarkTreeNodes, keyWord);

        var searchedResultsCount = searchedResults.length;
        console.log('results count: ' + searchedResultsCount + ' for keyword: ' + keyWord);

        for (var j = 0; j < searchedResultsCount; j++) {
          var searchedResultTitle = searchedResults[j][0].textContent;
          console.log('searchedResutlTitle: ' + searchedResultTitle);
          if (searchedResultsHash.hasOwnProperty(searchedResultTitle)) {
            searchedResultsHash[searchedResultTitle].count += 1;
          } else {
            searchedResultsHash[searchedResultTitle] = {'node': searchedResults[j], 'count': 1};
          }
        }

      }

      var searchedResultsArray = Object.keys(searchedResultsHash);
      var sortedSearchedResultsArray = searchedResultsArray.sort(function(a, b) { 
        return searchedResultsHash[b].count - searchedResultsHash[a].count; 
      });

      for (i = 0; i < sortedSearchedResultsArray.length; i++) {
        $('#bookmarks').append(searchedResultsHash[sortedSearchedResultsArray[i]].node);
        console.log(sortedSearchedResultsArray[i] + ': ' + searchedResultsHash[sortedSearchedResultsArray[i]].count);
      }
      
      // add selected class to the first element
      if (searchedResultsArray.length > 0) {
        curSelectedIndex = 0;
        searchedResultsHash[searchedResultsArray[curSelectedIndex]].node[0].className = 'selected';
      }

    });
}
function dumpTreeNodes(bookmarkNodes, query) {
  var i;
  for (i = 0; i < bookmarkNodes.length; i++) {
    dumpNode(bookmarkNodes[i], query);
  }
}

function dumpNode(bookmarkNode, query) {
  // console.log('leaf node');
  if (bookmarkNode.title && query && !bookmarkNode.children) {
    // TODO
    if (String(bookmarkNode.title).toLowerCase().indexOf(query) !== -1 || 
      (String(bookmarkNode.url).toLowerCase().indexOf(query)) !== -1) {
      var li = $('<li>'),
          anchor = $('<a>');
      anchor.attr('href', bookmarkNode.url);
      anchor.text(bookmarkNode.title);
      anchor.click(function() {
        chrome.tabs.create({url: bookmarkNode.url});
      });
      li.append(anchor);
      searchedResults.push(li);
    }
  } else if (bookmarkNode.children && bookmarkNode.children.length > 0) {
    // console.log('non-leaf node');
    dumpTreeNodes(bookmarkNode.children, query);
  }
}

$(function() {
  var KEY_ENTER = 13,
      KEY_UP = 38,
      KEY_DOWN = 40;
  $('#search').keyup(function(evt) {
    var searchInputIsNotEmpty = $('#search').val() !== '';
    if (evt.which === KEY_ENTER && searchInputIsNotEmpty) {
      if (curSelectedIndex > -1 && curSelectedIndex < searchedResults.length) {
        var url = searchedResults[curSelectedIndex][0].firstChild.getAttribute('href');
        chrome.tabs.create({url: url});
      }
    } else if (evt.which === KEY_UP && searchInputIsNotEmpty) {
      if (curSelectedIndex > 0 && curSelectedIndex < searchedResults.length) {
        searchedResults[curSelectedIndex][0].className = '';
        searchedResults[curSelectedIndex - 1][0].className = 'selected';
        curSelectedIndex -= 1;
      }
    } else if (evt.which === KEY_DOWN && searchInputIsNotEmpty) {
      if (curSelectedIndex > -1 && curSelectedIndex < searchedResults.length - 1) {
        searchedResults[curSelectedIndex][0].className = '';
        searchedResults[curSelectedIndex + 1][0].className = 'selected';
        curSelectedIndex += 1;
      }
    } else {
      $('#bookmarks').empty();
      searchedResults = [];
      curSelectedIndex = -1;
      dumpBookmarks($('#search').val().toLowerCase());
       
      // we have issues by using the following way: duplicated results show
      // chrome.bookmarks.search($('#search').val().toLowerCase(), function (bookmarks) {
      //   var getClickHandler = function (url) {
      //     return function() {
      //       chrome.tabs.create({url: url});
      //     };
      //   };
      //   var i;
      //   for (i = 0; i < bookmarks.length; i++) {
      //     if (!bookmarks[i].children) {
      //       var li = $('<li>'),
      //           anchor = $('<a>'),
      //           url = bookmarks[i].url;
      //       anchor.attr('href', url);
      //       anchor.text(bookmarks[i].title);
      //       anchor.click(getClickHandler(url));
            
      //       // we can not get the right url by the following way
      //       // anchor.click(function () {
      //       //   chrome.tabs.create({url: url});
      //       // });
      //       li.append(anchor);
      //       $('#bookmarks').append(li);
      //       //console.log(bookmarks[i].title);  
      //     }
      //   }
      // });
    }
    
  });
});



// document.addEventListener('DOMContentLoaded', function () {
//   dumpBookmarks();
//   console.log('domcontentloaded!');
// });
