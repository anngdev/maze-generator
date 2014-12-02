
MazeGenerator.FILLED = "#000000";
MazeGenerator.OPEN = "#ffffff";
function MazeGenerator(x, y, initialWallColor, initialRoomColor) {
  this.cellSize = 10;
  this.cellSizeHalf = this.cellSize / 2;

  this.sizeX = x;
  this.sizeY = y;
  this.horizontalWallColors = [];
  for (var i = 0; i < x; i++) {
    var ladder = [];
    for (var j = 0; j < y - 1; j++) {
      ladder.push(initialWallColor);
    }
    this.horizontalWallColors.push(ladder);
  }
  this.verticalWallColors = [];
  for (var i = 0; i < x - 1; i++) {
    var pole = [];
    for (var j = 0; j < y; j++) {
      pole.push(initialWallColor);
    }
    this.verticalWallColors.push(pole);
  }
  this.roomColors = [];
  for (var x = 0; x < this.sizeX; x++) {
    var column = [];
    for (var y = 0; y < this.sizeY; y++) {
      column.push(initialRoomColor);
    }
    this.roomColors.push(column);
  }

  this.isDone = false;
};

MazeGenerator.prototype.getWallCount = function() {
  return this.sizeX * (this.sizeY - 1) + (this.sizeX - 1) * this.sizeY;
};
MazeGenerator.prototype.wallToScalar = function(wallsArray, i, j) {
  if (wallsArray === this.horizontalWallColors) {
    // horizontalWallColors
    return i * (this.sizeY - 1) + j;
  } else {
    // verticalWallColors
    var horizontalWallsSize = this.sizeX * (this.sizeY - 1);
    return horizontalWallsSize + i * this.sizeY + j;
  }
};
MazeGenerator.prototype.scalarToWall = function(scalar) {
  var wallsArray;
  var i;
  var j;
  var horizontalWallsSize = this.sizeX * (this.sizeY - 1);
  if (scalar < horizontalWallsSize) {
    wallsArray = this.horizontalWallColors;
    i = Math.floor(scalar / (this.sizeY - 1));
    j = scalar % (this.sizeY - 1);
  } else {
    scalar -= horizontalWallsSize;
    wallsArray = this.verticalWallColors;
    i = Math.floor(scalar / this.sizeY);
    j = scalar % this.sizeY;
  }
  return {wallsArray:wallsArray, i:i, j:j};
};
MazeGenerator.prototype.setWallColor = function(wall, color) {
  wall.wallsArray[wall.i][wall.j] = color;
};
MazeGenerator.prototype.getWallColor = function(wall, color) {
  return wall.wallsArray[wall.i][wall.j];
};

MazeGenerator.prototype.getRoomCount = function() {
  return this.sizeX * this.sizeY;
};
MazeGenerator.prototype.roomToScalar = function(x, y) {
  return this.sizeY * x + y;
};
MazeGenerator.prototype.scalarToRoom = function(scalar) {
  var x = Math.floor(scalar / this.sizeY);
  var y = scalar % this.sizeY;
  return {x:x, y:y};
};

MazeGenerator.prototype.roomToVectors = function(x, y) {
  var neighbors = [
    {x:x + 1, y:y - 0},
    {x:x + 0, y:y + 1},
    {x:x - 1, y:y + 0},
    {x:x - 0, y:y - 1},
  ];
  var walls = [
    {wallsArray:this.verticalWallColors,   i:x + 0, j:y + 0},
    {wallsArray:this.horizontalWallColors, i:x + 0, j:y + 0},
    {wallsArray:this.verticalWallColors,   i:x - 1, j:y + 0},
    {wallsArray:this.horizontalWallColors, i:x + 0, j:y - 1},
  ];
  var vectors = [];
  for (var i = 0; i < 4; i++) {
    var neighbor = neighbors[i];
    // bounds check
    if (neighbor.x < 0 || neighbor.x >= this.sizeX) continue;
    if (neighbor.y < 0 || neighbor.y >= this.sizeY) continue;
    vectors.push({wall:walls[i], room:neighbor});
  }
  return vectors;
};

MazeGenerator.prototype.getVertexCount = function() {
  return (this.sizeX - 1) * (this.sizeY - 1);
};
MazeGenerator.prototype.scalarToVertex = function(vertexScalar) {
  var x = Math.floor(vertexScalar / (this.sizeY - 1));
  var y = vertexScalar % (this.sizeY - 1);
  return {x:x, y:y};
};
MazeGenerator.prototype.vertexToScalar = function(x, y) {
  return (this.sizeY - 1) * x + y;
};
MazeGenerator.prototype.vertexToWalls = function(x, y) {
  return [
    {wallsArray:this.verticalWallColors, i:x, j:y},
    {wallsArray:this.verticalWallColors, i:x, j:y + 1},
    {wallsArray:this.horizontalWallColors, i:x, j:y},
    {wallsArray:this.horizontalWallColors, i:x + 1, j:y},
  ];
};
MazeGenerator.prototype.vertexToBranches = function(x, y) {
  var branches = [];
  if (y > 0) {
    branches.push({
      toVertexScalar:this.vertexToScalar(x, y - 1),
      wall:{wallsArray:this.verticalWallColors, i:x, j:y},
    });
  }
  if (y < this.sizeY - 2) {
    branches.push({
      toVertexScalar:this.vertexToScalar(x, y + 1),
      wall:{wallsArray:this.verticalWallColors, i:x, j:y + 1},
    });
  }
  if (x > 0) {
    branches.push({
      toVertexScalar:this.vertexToScalar(x - 1, y),
      wall:{wallsArray:this.horizontalWallColors, i:x, j:y},
    });
  }
  if (x < this.sizeX - 2) {
    branches.push({
      toVertexScalar:this.vertexToScalar(x + 1, y),
      wall:{wallsArray:this.horizontalWallColors, i:x + 1, j:y},
    });
  }
  return branches;
};

MazeGenerator.prototype.shave = function() {
  var self = this;
  var wallsToDelete = [];
  for (var x = 0; x < self.sizeX - 1; x++) {
    for (var y = 0; y < self.sizeY - 1; y++) {
      var walls = self.vertexToWalls(x, y).filter(function(wall) {
        return self.getWallColor(wall) === MazeGenerator.FILLED;
      });
      if (walls.length === 1) {
        // this is a hair
        wallsToDelete.push(walls[0]);
      }
    }
  }
  for (var i = 0; i < wallsToDelete.length; i++) {
    self.setWallColor(wallsToDelete[i], MazeGenerator.OPEN);
  }
};
MazeGenerator.prototype.caveIn = function() {
  var self = this;
  var roomsToFill = [];
  var wallsToClose = [];
  for (var x = 0; x < self.sizeX; x++) {
    for (var y = 0; y < self.sizeY; y++) {
      var openVectors = self.roomToVectors(x, y).filter(function(vector) {
        return self.getWallColor(vector.wall) === MazeGenerator.OPEN;
      });
      if (openVectors.length === 1) {
        // this is a dead end
        roomsToFill.push({x:x, y:y});
        wallsToClose.push(openVectors[0].wall);
      } else if (openVectors.length === 0 && self.roomColors[x][y] === MazeGenerator.OPEN) {
        // isolated room.
        // this can happen if 3 rooms were the last 3 rooms for the previous caveIn.
        // then 1 room is left alone with no doors.
        roomsToFill.push({x:x, y:y});
      }
    }
  }
  for (var i = 0; i < roomsToFill.length; i++) {
    var room = roomsToFill[i];
    self.roomColors[room.x][room.y] = MazeGenerator.FILLED;
  }
  for (var i = 0; i < wallsToClose.length; i++) {
    self.setWallColor(wallsToClose[i], MazeGenerator.FILLED);
  }
};

MazeGenerator.prototype.getCanvasWidth = function() {
  return (this.sizeX + 1) * this.cellSize;
};
MazeGenerator.prototype.getCanvasHeight = function() {
  return (this.sizeY + 1) * this.cellSize;
};
MazeGenerator.prototype.render = function(canvas) {
  var context = canvas.getContext("2d");
  var cellSize = this.cellSize;
  var cellSizeHalf = this.cellSizeHalf;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // roomColors
  for (var x = 0; x < this.sizeX; x++) {
    for (var y = 0; y < this.sizeY; y++) {
      var color = this.roomColors[x][y];
      if (color !== MazeGenerator.OPEN) {
        context.fillStyle = color;
        context.fillRect(x * cellSize + cellSize - cellSizeHalf, y * cellSize + cellSize - cellSizeHalf, cellSize, cellSize);
      }
    }
  }

  // walls
  // horizontalWallColors
  for (var i = 0; i < this.sizeX; i++) {
    var ladder = this.horizontalWallColors[i];
    for (var j = -1; j < this.sizeY - 1 + 1; j++) {
      var color = ladder[j];
      if (color == null) color = MazeGenerator.FILLED;
      if (color !== MazeGenerator.OPEN) {
        context.strokeStyle = color;
        context.beginPath();
        context.moveTo(i * cellSize + cellSize + cellSizeHalf, j * cellSize + cellSize + cellSizeHalf);
        context.lineTo(i * cellSize + cellSize - cellSizeHalf, j * cellSize + cellSize + cellSizeHalf);
        context.stroke();
      }
    }
  }
  // verticalWallColors
  for (var i = -1; i < this.sizeX - 1 + 1; i++) {
    var pole = this.verticalWallColors[i];
    for (var j = 0; j < this.sizeY; j++) {
      var color = pole == null ? MazeGenerator.FILLED : pole[j];
      if (color !== MazeGenerator.OPEN) {
        context.strokeStyle = color;
        context.beginPath();
        context.moveTo(i * cellSize + cellSize + cellSizeHalf, j * cellSize + cellSize + cellSizeHalf);
        context.lineTo(i * cellSize + cellSize + cellSizeHalf, j * cellSize + cellSize - cellSizeHalf);
        context.stroke();
      }
    }
  }
};
