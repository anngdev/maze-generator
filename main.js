(function() {
  var algorithmCombobox = window.document.getElementById("algorithmCombobox");
  var sizeXTextbox = window.document.getElementById("sizeXTextbox");
  var sizeYTextbox = window.document.getElementById("sizeYTextbox");

  var mazeCanvas = window.document.getElementById("mazeCanvas");

  var stepButton = window.document.getElementById("stepButton");
  var goButton = window.document.getElementById("goButton");
  var beDoneButton = window.document.getElementById("beDoneButton");
  var resetButton = window.document.getElementById("resetButton");

  var shaveButton = window.document.getElementById("shaveButton");
  var caveInButton = window.document.getElementById("caveInButton");

  var doorsPerRoomCheckbox = window.document.getElementById("doorsPerRoomCheckbox");
  var doorsPerRoomCanvas = window.document.getElementById("doorsPerRoomCanvas");
  var wallsPerVertexCheckbox = window.document.getElementById("wallsPerVertexCheckbox");
  var wallsPerVertexCanvas = window.document.getElementById("wallsPerVertexCanvas");

  var algorithms = {
    "KruskalGenerator": KruskalGenerator,
    "PrimGenerator": PrimGenerator,
    "DepthFirstSearchGenerator": DepthFirstSearchGenerator,
    "IvyGenerator": IvyGenerator,
    "DepthFirstIvyGenerator": DepthFirstIvyGenerator,
  };
  var maze;

  var animationInterval = null;
  var wasDone = false;

  initGenerator();
  function initGenerator(refresh) {
    stopIt();
    var algorithmFunction = algorithms[algorithmCombobox.value];
    var sizeX = parseInt(sizeXTextbox.value, 10) || 1;
    var sizeY = parseInt(sizeYTextbox.value, 10) || 1;
    if (!refresh && maze != null) {
      // if nothing's changed, don't reset
      if (maze.constructor === algorithmFunction &&
          maze.sizeX === sizeX &&
          maze.sizeY === sizeY) {
        return;
      }
    }
    maze = new algorithmFunction(sizeX, sizeY);
    mazeCanvas.width = maze.getCanvasWidth();
    mazeCanvas.height = maze.getCanvasHeight();
    refreshDisplay();
  }

  algorithmCombobox.addEventListener("change", function() {
    setTimeout(initGenerator, 0);
  });
  sizeXTextbox.addEventListener("keydown", function() {
    setTimeout(initGenerator, 0);
  });
  sizeYTextbox.addEventListener("keydown", function() {
    setTimeout(initGenerator, 0);
  });

  stepButton.addEventListener("click", function() {
    step();
  });

  goButton.addEventListener("click", function() {
    if (maze.isDone) initGenerator(true);
    if (animationInterval == null) {
      // go
      animationInterval = setInterval(function() {
        step();
      }, 1);
      goButton.textContent = "Stop";
    } else {
      stopIt();
    }
  });
  function stopIt() {
    if (animationInterval == null) return;
    clearInterval(animationInterval);
    animationInterval = null;
    goButton.textContent = "Go";
  }
  beDoneButton.addEventListener("click", function() {
    stopIt();
    if (maze.isDone) initGenerator(true);
    while (!maze.isDone) {
      maze.step();
    }
    refreshDisplay();
  });
  resetButton.addEventListener("click", function() {
    initGenerator(true);
  });

  shaveButton.addEventListener("click", function() {
    maze.shave();
    refreshDisplay();
  });
  caveInButton.addEventListener("click", function() {
    maze.caveIn();
    refreshDisplay();
  });

  doorsPerRoomCheckbox.addEventListener("click", function() {
    setTimeout(updateStatistics, 0);
  });
  wallsPerVertexCheckbox.addEventListener("click", function() {
    setTimeout(updateStatistics, 0);
  });

  function step() {
    maze.step();
    refreshDisplay();
    if (maze.isDone && animationInterval != null) {
      stopIt();
    }
  }

  function refreshDisplay() {
    maze.render(mazeCanvas);
    var nowDone = maze.isDone;
    if (nowDone !== wasDone) {
      setEnabled(stepButton, !nowDone);
      setEnabled(shaveButton, nowDone);
    }
    wasDone = nowDone;
    updateStatistics();
  }

  function updateStatistics() {
    var doorsPerRoom = null;
    if (doorsPerRoomCheckbox.checked) {
      doorsPerRoom = [
        {label: "0", values: []},
        {label: "1", values: []},
        {label: "2", values: []},
        {label: "3", values: []},
        {label: "4", values: []},
      ];
      var roomCount = maze.getRoomCount();
      for (var i = 0; i < roomCount; i++) {
        var room = maze.scalarToRoom(i);
        var doorCount = maze.roomToVectors(room.x, room.y).filter(function(vector) {
          return maze.getWallColor(vector.wall) === MazeGenerator.OPEN;
        }).length;
        doorsPerRoom[doorCount].values.push(room);
      }
    }
    renderHistogram(doorsPerRoomCanvas, doorsPerRoom);

    var wallsPerVertex = null;
    if (wallsPerVertexCheckbox.checked) {
      wallsPerVertex = [
        {label: "0", values: []},
        {label: "1", values: []},
        {label: "2", values: []},
        {label: "3", values: []},
        {label: "4", values: []},
      ];
      var vertexCount = maze.getVertexCount();
      for (var i = 0; i < vertexCount; i++) {
        var vertex = maze.scalarToVertex(i);
        var wallCount = maze.vertexToWalls(vertex.x, vertex.y).filter(function(wall) {
          return maze.getWallColor(wall) === MazeGenerator.FILLED;
        }).length;
        wallsPerVertex[wallCount].values.push(vertex);
      }
    }
    renderHistogram(wallsPerVertexCanvas, wallsPerVertex);
  }

  function renderHistogram(canvas, data) {
    if (data == null) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }
    // figure out how big everything's going to be
    var fontHeight = 12;
    var font = fontHeight + "px sans-serif";
    var measuringContext = canvas.getContext("2d");
    measuringContext.font = font;
    // this is a guess. as of writing this,
    // the api to get the height including low-hanging glyphs like "g" are not supported yet
    // (except for ExperimentalCanvasFeatures in chrome).
    var moreRealisticTextHeight = fontHeight * 1.2;
    var maxLabelWidth = 0;
    var longestPossibleBar = 0;
    for (var i = 0; i < data.length; i++) {
      var textMetrics = measuringContext.measureText(data[i].label);
      // it's too bad this TextMetrics object doesn't have a .height property too.
      maxLabelWidth = Math.max(maxLabelWidth, textMetrics.width);
      longestPossibleBar += data[i].values.length;
    }
    var graphWidth = Math.max(300, maxLabelWidth + 200);
    canvas.height = data.length * moreRealisticTextHeight;
    canvas.width = graphWidth;

    // reget the context after resizing the canvas?
    var context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = font;
    context.textBaseline = "top";
    context.textAlign = "right";
    context.strokeStyle = "#000000";
    for (var i = 0; i < data.length; i++) {
      context.strokeText(data[i].label, maxLabelWidth, moreRealisticTextHeight * i);
    }
    var maxBarLength = graphWidth - maxLabelWidth;
    context.fillStyle = "#8888ff";
    context.textAlign = "left";
    for (var i = 0; i < data.length; i++) {
      var barWidth = maxBarLength * data[i].values.length / longestPossibleBar;
      var x = maxLabelWidth;
      var y = moreRealisticTextHeight * i;
      context.fillRect(x, y, barWidth, moreRealisticTextHeight);
      context.strokeText(data[i].values.length, x + 3, y);
    }
  }

  function setEnabled(button, value) {
    if (value) {
      button.removeAttribute("disabled");
    } else {
      button.setAttribute("disabled", "");
    }
  }
})();
