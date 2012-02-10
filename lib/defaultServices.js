const {Cc,Ci,Cu} = require("chrome");
const addon = require("self");
const url = require("url");

var tmp = {};
Cu.import("resource://gre/modules/PlacesUtils.jsm", tmp);
var { PlacesUtils } = tmp;
var loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);


function hasLogin(hostname) {
  try {
    var loginManager = Cc["@mozilla.org/login-manager;1"].getService(Ci.nsILoginManager);
    return loginManager.countLogins(hostname, "", "") > 0; 
  } catch(e) {
    console.log(e);
  }
  return false;
}

function reverse(s){
    return s.split("").reverse().join("");
}

function frecencyForUrl(host)
{
  // XXX there has got to be a better way to do this!
  let dbconn = PlacesUtils.history.QueryInterface(Ci.nsPIPlacesDatabase)
                                  .DBConnection;
  let frecency = 0;
  let stmt = dbconn.createStatement(
    "SELECT frecency FROM moz_places WHERE rev_host = ?1"
  );
  try {
    stmt.bindByIndex(0, reverse(host)+'.');
    if (stmt.executeStep())
      frecency = stmt.getInt32(0);
  } finally {
    stmt.finalize();
  }

  return frecency;
}

function shouldRegister(host) {
  
}

function shouldAskRegister(host) {
  
}

var builtin = [
  {
    login: "https://twitter.com",
    services: [
      {
        action: "share",
        url: "https://twitter.com/intent/tweet",
        contentScriptFile: addon.data.url("fakers/twitter.js")
      }
    ]
  },
  {
    login: "https://www.facebook.com",
    services: [
      {
        action: "share",
        url: "https://www.facebook.com/sharer/sharer.php",
        contentScriptFile: addon.data.url("fakers/facebook.js")
      }
    ]
  },
  {
    login: "https://www.google.com",
    services: [
      {
        action: "share",
        url: "https://plusone.google.com/_/+1/confirm",
        contentScriptFile: addon.data.url("fakers/plus.js")
      },
      {
        action: "share",
        url: "https://mail.google.com/mail/?view=cm&ui=2&tf=0&fs=1",
        contentScriptFile: addon.data.url("fakers/gmail.js")
      }
    ]
  },
  {
    login: "https://www.yammer.com",
    services: [
      {
        action: "share",
        url: "https://www.yammer.com/home/bookmarklet",
        contentScriptFile: addon.data.url("fakers/yammer.js")
      }
    ]
  },
  {
    login: "http://digg.com",
    services: [
      {
        action: "share",
        url: "http://digg.com/submit", 
        contentScriptFile: addon.data.url("fakers/digg.js")
      }
    ]
  }
];

exports.registerDefaultServices = function() {
  let { activityRegistry } = require("activities/services");
  builtin.forEach(function(svc) {
    let host = url.URL(svc.login).host;
    console.log("frecency for "+svc.login+" is "+frecencyForUrl(host));
    if (hasLogin(svc.login)) {
      svc.services.forEach(function(activity) {
        activityRegistry.registerActivityHandler(activity.action, activity.url, activity);
      });
    }
  });
}
