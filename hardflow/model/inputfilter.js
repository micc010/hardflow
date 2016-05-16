InputFilter = Backbone.Model.extend({
    accept: function() {}
}),

AcceptAllInputFilter = InputFilter.extend({
    accept: function() {
        return ! 0
    }
});