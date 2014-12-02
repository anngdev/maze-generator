function DepthFirstSearchGenerator(x, y) {
  this.maze = new Maze(x, y, Maze.FILLED, Maze.FILLED);
  this.isDone = false;

  this.stack = [];
  this.doneRooms = [];

  // pick a starting room
  var startingRoom = Math.floor(Math.random() * this.maze.getRoomCount());
  this.addRoomToMaze(startingRoom);
}

DepthFirstSearchGenerator.CONSIDERING = "#8888ff";

DepthFirstSearchGenerator.prototype.addRoomToMaze = function(room) {
  this.stack.push(room);
  this.maze.roomColors[room] = DepthFirstSearchGenerator.CONSIDERING;
};

DepthFirstSearchGenerator.prototype.step = function() {
  var self = this;
  while (self.stack.length > 0) {
    var room = self.stack[self.stack.length - 1];
    var vectors = self.maze.roomToVectors(room).filter(function(vector) {
      // make sure we're not creating a loop
      if (self.maze.roomColors[vector.room] !== Maze.FILLED) return false;
      return true;
    });
    if (vectors.length === 0) {
      // back out
      self.maze.roomColors[room] = Maze.OPEN;
      self.stack.pop();
      return;
    }
    // go in a random direction
    var vector = vectors[Math.floor(Math.random() * vectors.length)];
    self.maze.edgeColors[vector.edge] = Maze.OPEN;
    self.maze.roomColors[vector.room] = DepthFirstSearchGenerator.CONSIDERING;
    self.stack.push(vector.room);
    return;
  }
  self.isDone = true;
};
