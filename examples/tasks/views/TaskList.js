var Class = require('shipyard/class/Class'),
    ListView = require('shipyard/view/ListView'),
    TaskView = require('./TaskView');

module.exports = new Class({

    Extends: ListView,

    itemView: TaskView

});
