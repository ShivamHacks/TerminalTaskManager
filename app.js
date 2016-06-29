var readline = require('readline');
var colors = require('colors');
var moment = require('moment');
var fs = require('fs');

var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('user> ');
rl.prompt();
rl.on('line', function(line) {
  commands[findCommand(line)](line);
  rl.prompt();
}).on('close',function(){
  process.exit(0);
});

/*

var user = {
  currentProject: 'project name',
  nextAlertTime: 'end time of currentProject',
  projects: {
    project_name: {
      description: [ 'creative', 'difficult', 'etc' ],
      hoursWorked: totalHoursWorked (sume of all log hours)
      log: [
        {
          start_time: 'start_time',
          end_time: 'end_time',
          goal: 'goal of this task (before starting)',
          accomplished: 'accomplished (after ending)',
          classification: 'good, ok, bad (classification of progress)'
        }
      ]
    }
  }
}

*/
init();
function init() {
  var user = {
    currentProject: '',
    nextAlertTime: 0,
    projects: {}
  };
  commit(user);
}

function findCommand(line) {
  var commandNames = [ 'LOGIN', 'START', 'END', 'EXTEND', 'EARLY', 'PROGRESS', 'DOING', 'DONE', 'QUIT' ];
  for (var i = 0; i < commandNames.length; i++)
    if (line.indexOf(commandNames[i]) == 0) return commandNames[i];
  return 'NOTFOUND';
}

var commands = {
  START: function(line) {
    var project = line.substring('START'.length).trim();
    var user = require('./user.json');
    user.projects[project] = {
      description: [],
      hoursWorked: 0,
      logs: []
    };
    commit(user);
    log('starting project: ' + project, 0);
  },
  DOING: function(line) {
    var data = line.substring('DOING'.length).trim().split(',');
    var projectName = data[0].trim();
    var tStart = Math.round(Date.now() / 60000) * 60000;
    var tEnd = Math.round(new moment(data[1].trim(), ['h:m a', 'H:m']).valueOf() / 60000) * 60000;
    var goal = data[2].trim();
    var logObj = {
      start_time: tStart,
      end_time: tEnd,
      goal: goal
    };
    var user = require('./user.json');
    user.currentProject = projectName;
    user.nextAlertTime = tEnd;
    user.projects[projectName].logs.push(logObj);
    commit(user);
    log('doing: ' + projectName + ' from ' + tStart + ' to ' + tEnd + ' trying to ' + goal, 0);
  },
  DONE: function(line) {
    var data = line.substring('DONE'.length).trim().split(',');
    var accomplished = data[0].trim();
    var classification = data[1].trim();
    var endTime = Math.round(Date.now() / 60000) * 60000;
    var user = require('./user.json');
    var currentLog = getCurrentLog(user);
    currentLog.end_time = endTime;
    currentLog.accomplished = accomplished;
    currentLog.classification = classification;
    user.currentProject = '';
    user.nextAlertTime = 0; // need to make sure when 0, no alerts
    commit(user);
  },
  NOTFOUND: function(line) {
    log('command not found: ' + line, 1);
  }
}

function getCurrentLog(user) {
  return user.projects[user.currentProject].logs[user.projects[user.currentProject].logs.length-1];
}

function commit(user) {
  fs.writeFile('./user.json', JSON.stringify(user), function (err) {
    if (err) console.log(err);
    else ;
  });
}

function log(line, type) {
  // green - positive
  // red - danger
  // blue - informational
  var colors = [ 'green', 'red', 'blue' ];
  console.log(line[colors[type]]);
}


/*
// http://stackoverflow.com/questions/15083548/convert-12-hour-hhmm-am-pm-to-24-hour-hhmm
// http://jsfiddle.net/L2y2d/1/
 //var tEnd = new moment(to24Hour(data[1].trim()), 'HH:mm:ss');
function to24Hour(time) {
  try {
    var hours = Number(time.match(/^(\d+)/)[1]);
    var minutes = Number(time.match(/:(\d+)/)[1]);
    var AMPM = time.match(/\s(.*)$/)[1];
    if (AMPM == "PM" && hours < 12) hours = hours + 12;
    if (AMPM == "AM" && hours == 12) hours = hours - 12;
    var sHours = hours.toString();
    var sMinutes = minutes.toString();
    if (hours < 10) sHours = "0" + sHours;
    if (minutes < 10) sMinutes = "0" + sMinutes;
    return sHours + ":" + sMinutes + ":" + "00";
  } catch(err) {
    return null; // return current date
  }
}*/