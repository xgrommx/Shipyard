var Person = require('./models/Person');
var View = require('shipyard/view/View'),
    Container = require('shipyard/view/Container'),
    TextFieldView = require('shipyard/view/TextFieldView');

person = new Person({name: 'Sean'});
whoAreYou = new TextFieldView({ 
    placeholder: 'What is your name',
    id: 'whoAreYou'
}).bind(person, { value: 'name' });
whoAreYou.attach();
hello = new Container();
hello.addView(new View({data: 'Hello '}));
hello.addView(new View().bind(person, { data: 'name' }));
hello.attach();
