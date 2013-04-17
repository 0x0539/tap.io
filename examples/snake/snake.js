var Extension = function() {
  this.FOOD_COUNT = 5;
};
Extension.prototype.update = function(state) {
  while(state.food.length < this.FOOD_COUNT){
    this.placeFood(state);
  }
};
Extension.prototype.validate = function(state, event) { 

};
Extension.prototype.handle = function(state, event) { 

};
Extension.prototype.placeFood = function(state) {
  var foodX = state.left + state.random.random() * state.width;
  var foodY = state.top + state.random.random() * state.height;
  var food = new Food(foodX, foodY);
  state.food.push(food);
};

exports.Extension = Extension;
