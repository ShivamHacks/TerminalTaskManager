var readline = require('readline');
var colors = require('colors');
var moment = require('moment');
var fs = require('fs');
var player = require('play-sound')(opts = {});
//var _ = require('underscore');

var rl = readline.createInterface(process.stdin, process.stdout);
rl.setPrompt('user> ');
rl.prompt();
rl.on('line', function(line) {
  if (line != "") commands[findCommand(line)](line);
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
      timeWorked: totalHoursWorked (sume of all log hours)
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
  completed_projects: {}
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
  // add DESCRIBE and EARLY
  var commandNames = [ 'LOGIN', 'START', 'END', 'EXTEND', 'PROGRESS', 'DOING', 'DONE', 'QUIT' ];
  for (var i = 0; i < commandNames.length; i++) {
    if (line.toUpperCase().indexOf(commandNames[i]) == 0) return commandNames[i];
  }
  return 'NOTFOUND';
}

var commands = {
  LOGIN: function(line) {
    rl.setPrompt(line.substring('LOGIN'.length).trim() + '> ');
  },
  START: function(line) {
    try {
      var project = line.substring('START'.length).trim();
      var user = require('./user.json');
      user.projects[project] = { time_worked: 0, logs: [] };
      commit(user);
      log('starting project: ' + project, 0);
    } catch (err) { log('Error. Please try again.', 1); }
  },
  DOING: function(line) {
    try {
      var data = line.substring('DOING'.length).trim().split(',');
      var projectName = data[0].trim();
      var tStart = Math.round(Date.now() / 60000) * 60000;
      var tEnd = Math.round(new moment(data[1].trim(), ['h:m a', 'H:m']).valueOf() / 60000) * 60000;
      var goal = data[2].trim();
      var logObj = { start_time: tStart, goal: goal };

      var user = require('./user.json');
      changeObj(user, { currentProject: projectName, nextAlertTime: tEnd });
      user.projects[projectName].logs.push(logObj);

      commit(user);
      setTimer();
      log('recorded', 0);
    } catch (err) { log('Error. Please try again.', 1); }
  },
  // TODO, allow for more than one project at one time
  DONE: function(line) {
    try {
      var data = line.substring('DONE'.length).trim().split(',');
      var accomplished = data[0].trim();
      var classification = data[1].trim();
      var endTime = Math.round(Date.now() / 60000) * 60000;

      var user = require('./user.json');
      var currentProject = user.projects[user.currentProject];
      var currentLog = currentProject.logs[currentProject.logs.length - 1];

      changeObj(currentProject, { time_worked: endTime - currentLog.start_time });
      changeObj(currentLog, { end_time: endTime, accomplished: accomplished, classification: classification });
      changeObj(user, { currentProject: '', nextAlertTime: 0 });

      commit(user);
      setTimer();
      log('recorded', 0);
    } catch (err) { log('Error. Please try again.', 1); }
  },
  EXTEND: function(line) {
    try {
      var extension = line.substring('EXTEND'.length).trim();
      var extendToTime = Math.round(moment(extension, ['h:m a', 'H:m']).valueOf() / 60000) * 60000;
      var currentProject = user.projects[user.currentProject];
      changeObj(currentProject, { nextAlertTime: extendToTime });

      commit(user);
      setTimer();
      log('recorded', 0);
    } catch (err) { log('Error. Please try again.', 1); }
  },
  NOTFOUND: function(line) {
    log('command not found: ' + line, 1);
  }
}

function changeObj(obj, changes) {
  for (key in changes)
    obj[key] = changes[key];
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

var timeout;
function setTimer() {
  if (timeout) clearTimeout(timeout);
  var user = require('./user.json');
  if (user.nextAlertTime != 0) {
    timeout = setTimeout(function () {
      log('Alert for: ' + user.currentProject + ' at ' + moment().format('LT'), 0);
      player.play('./ding.mp3', function(err){});
    }, user.nextAlertTime - Date.now());
  }
}

// TODO
// find function that creates alerts
// its an interval that occurs at nextalerttime


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

  DESCRIBE: function(line) {
    var data = line.substring('DESCRIBE'.length).trim().split(',');
    var projectName = data[0].trim();
    var description = data[1].trim().split('/');
    for (var i = 0; i < description.length; i++)
      description[i] = description[i].trim();
    var user = require('./user.json');
    var currentProject = user.projects[projectName];
    changeObj(currentProject, { description: description });
    commit(user);
    log('recorded', 0);
  },
}*/