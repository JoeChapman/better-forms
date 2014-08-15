How to
======

### Field types/tags
```
text, checkbox, radio, select, color, date, datetime, datetime-local, email, month, number
range, search, tel, time, url, week
```

### Field attributes
```
autofocus, disabled, form, formaction, formenctype, formmethod, formnovalidate, formtarget, value,
required, selectiondirection, autocomplete, inputmode, list, minlength, maxlength, spellcheck,
readonly, placeholder, pattern, step, match, validateif, name, checked
```

### Special attributes

`match`: takes a string reference to the id of another field. A field with a match
attribute and value will only pass validation if its value matches that of the field referenced.
```
new forms.fields.password({
    id: 'password',
    required: true
});

new forms.fields.password({
    id: 'confirm',
    match: 'password'
    required: true
});
```

`validateif`: takes a string or array of strings that are treated as references to the ids of other fields.
A field with a validateif id reference will only be validated if the value of the referenced field is truthy*
*Unless the reference is prepended with '!' (exclamation), in which case, the inverse is true.
By default a field is validated if any referenced 'validateif' field has a truthy value unless a '&' (ampersand) is supplied.

Confirm password field will be validated if password has a truthy value.
```
new forms.fields.password({
    id: 'password',
    required: true
});

new forms.fields.password({
    id: 'confirm',
    validateif: 'password'
    required: true
});
```

Confirm password field will be validated if password has a truthy value and fname has a falsey value.
```
new forms.fields.string({
    id: 'fname',
    required: true
});
new forms.fields.password({
    id: 'password',
    required: true
});

new forms.fields.password({
    id: 'confirm',
    validateif: 'password, !fname, &'
    required: true
});
```

### Example Field usage
Assuming Better Forms is installed and imported in the project with;
```
var forms = require('better-forms');
```

#### string
```
new forms.fields.string({
    id: 'myInput',
    label: false,
    classes: ['aFormField'],
    required: true,
    minlength: 9
});
```
```
<div class='field aFormField' data-type='string'>
    <input type='text' name='myInput' id='myInput' required='true' minlength='9'>
</div>
```

#### text
```
new forms.fields.text({
    id: 'myInput',
    name: 'inputA',
    label: 'My input',
    optional: true
});
```
```
<div class='field' data-type='string'>
    <label for='myInput'>My input<span class="optionalIndicator">(optional)</span></label>
    <input type='text' name='inputA' id='myInput'>
</div>
```

### email
```
new forms.fields.email({
    id: 'myEmail',
    label: 'Email',
    pattern: /(\+?44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}/,
    required: true
});
```
```
<div class='field' data-type='email'>
    <label for='myEmail'>Email</label>
    <input type='email' name='myEmail' id='myEmail' pattern='\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b' required='true'>
</div>
```

### password
```
new forms.fields.password({
    id: 'myPassword',
    label: 'Please type a password',
    placeholder: 'Your password',
    optional: 'Not required'
});
```
```
<div class='field' data-type='password'>
    <label for='myEmail'>Please type a password<span class="optionalIndicator">Not required</span></label>
    <input type='password' name='myPassword' id='myPassword' placeholder="Your placeholder">
</div>
```

### checkbox
```
new forms.fields.checkbox({
    id: 'myCheckbox',
    checked: true,
    label: 'Click here'
});
```
```
<div class='field' data-type='checkbox'>
    <label for='myCheckbox'>Click here</label>
    <input type='checkbox' name='myCheckbox' id='myCheckbox' checked='true'>
</div>
```

#### radio
```
new forms.fields.radio({
    id: 'myRadio-foo',
    checked: false,
    value: 'foo',
    name: 'myRadio',
    label: 'Radio foo'
});

new forms.fields.radio({
    id: 'myRadio-bar',
    checked: false,
    value: 'bar',
    name: 'myRadio',
    label: 'Radio bar'
});
```
```
<div class='field' data-type='radio'>
    <input type='radio' value='foo' name='myRadio' id='myRadio-foo' checked='false'>
    <label for='myRadio'>Radio foo</label>
</div>

<div class='field' data-type='radio'>
    <input type='radio' value='bar' name='myRadio' id='myRadio-bar' checked='false'>
    <label for='myRadio'>Radio bar</label>
</div>
```

#### select
```
new forms.fields.select({
    id: 'mySelect',
    label: false,
    selected: 'two',
    choices: [{ 'Choose': '' }, { 'One': 'one' }, { 'Two': 'two' }, { 'Three': 'three' }]
});
```
```
<div class='field' data-type='select'>
     <select name='mySelect' id='mySelect'>
        <option>Choose</option>
        <option value='one'>One</option>
        <option value='two' selected>Two</option>
        <option value='three'>Three</option>
     </select>
</div>
```

#### number
```
new forms.fields.number({
    id: 'number4',
    value: '4',
    label: 'Is this your number?'
});
```
```
<div class='field' data-type='number'>
    <label for='number4'>Is this your number?</label>
    <input type='number' value='4' name='number4' id='number4'>
</div>
```


