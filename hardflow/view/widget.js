Widget = Backbone.View.extend({
	initialize: function(a, b) {
		this._template = a,
		this._data = {},
		this._readonly = !1,
		b ? this._filter = b : (this._filter = new AcceptAllInputFilter)
	},
	setValue: function(a) {},
	render: function(a) {
		var b = "#template-widget-" + this._template,
			c = _.template($(b).html()),
			d = c($.extend(this._data, {
				_wid: this.cid,
				_property_title: a,
				_readonly: this._readonly
			}));
			
		$(this.el).html(d),
		this.delegateEvents()
	},
	setReadonly:function(a){
	  this._readonly = a  
	},
	onAttach: function() {}
});

NullWidget = Widget.extend({
	initialize: function() {
		Widget.prototype.initialize.call(this, "nullwidget", new AcceptAllInputFilter)
	}
}),

TextWidget = Widget.extend({
	initialize: function(a, b) {
		Widget.prototype.initialize.call(this, "singletext", a),
		this._delay = b,
		this._data = {text: ""}
	},
	events: {
        "keydown input": "onKeyDown",
		"keyup input": "onKeyPress"
	},
	setValue: function(a) {
		this._data.text = a,
		$("input[type=text]", this.el).val(a)
	},
	updateValue: function(a) {
		this._data.text = a
	},
	onKeyDown: function(a) {
        
    },
    onKeyPress: function(a) {
        var b = this,
        c = $(a.currentTarget);
        this._delay ? (clearTimeout(this._delayTimeout), this._delayTimeout = setTimeout(function() {
            b.trigger("valueChanged", c.val())
        }, this._delay)) : this.trigger("valueChanged", c.val())
    }
}),

TextAreaWidget = Widget.extend({
    initialize: function(a, b) {
        Widget.prototype.initialize.call(this, "multitext", a),
        this._delay = b,
        this._data = {text: ""}
    },
    events: {
        "keydown textarea": "onKeyDown",
        "keyup textarea": "onKeyPress"
    },
    setValue: function(a) {
        this._data.text = a,
        $("textarea", this.el).val(a)
    },
    updateValue: function(a) {
        this._data.text = a
    },
    onKeyDown: function(a) {
        
    },
    onKeyPress: function(a) {
        var b = this,
        c = $(a.currentTarget);
        this._delay ? (clearTimeout(this._delayTimeout), this._delayTimeout = setTimeout(function() {
            b.trigger("valueChanged", c.val())
        }, this._delay)) : this.trigger("valueChanged", c.val())
    }
}),

RadioButtonsWidget = Widget.extend({
	initialize: function(a, b) {
		Widget.prototype.initialize.call(this, "radiobuttons", a),
		this._data = {
			options: b
		}
	},
	events: {
		"click input": "onValueChanged"
	},
	onValueChanged: function(a) {
		var b = $(a.currentTarget);
		this.trigger("valueChanged", b.val())
	},
	setValue: function(a) {
		for (var b in this._data.options) {
			var c = this._data.options[b];
			c.checked = !1,
			c.value == a && (c.checked = !0)
		}
	},
	updateValue: function(a) {
		this.setValue(a)
	}
}),

SelectOneWidget = Widget.extend({
    initialize: function(a, b) {
        Widget.prototype.initialize.call(this, "selectone", a),
        this._data = {
            options: b
        }
    },
    events: {
        "change select": "onValueChanged"
    },
    onValueChanged: function(a) {
        var b = $(a.currentTarget);
        this.trigger("valueChanged", b.val())
    },
    setValue: function(a) {
        for (var b in this._data.options) {
            var c = this._data.options[b];
            c.selected = !1,
            c.value == a && (c.selected = !0)
        }
    },
    updateValue: function(a) {
        this.setValue(a)
    }
}),

CheckBoxWidget = Widget.extend({
    initialize: function(a, b) {
        Widget.prototype.initialize.call(this, "checkbox", a),
        this._data = {
            options: b
        }
    },
    events: {
        "change input": "onValueChanged"
    },
    onValueChanged: function(a) {
        var b = $(a.currentTarget);
        var opt = [];
        for (var d in this._data.options) {
            var c = this._data.options[d],o = null;
            ((c.value == b.val() && !c.checked) || (c.value != b.val() && c.checked)) && (o = _.clone(c), o.checked = !0, opt.push(o))
        }
        this.trigger("valueChanged", opt)
    },
    setValue: function(a) {
        for (var b in this._data.options) {
            var c = this._data.options[b];
            c.checked = !1
            for (var d in a){
                var e = a[d];
                c.value == e.value && e.checked && (c.checked = !0)
            }
        }
    },
    updateValue: function(a) {
        this.setValue(a)
    }
}),

DateWidget = TextWidget.extend({
    initialize: function(a, b) {
        Widget.prototype.initialize.call(this, "datetext", a),
        this._delay = b,
        this._data = {time: ""}
    },
    events: {
        "keydown .laydate-icon": "onKeyDown",
        //"keyup .laydate-icon": "onKeyPress",
        "mouseover .laydate-icon": "createLaydate"
    },
    setValue: function(a) {
        this._data.time = a,
        $("input[type=text]", this.el).val(a)
    },
    updateValue: function(a) {
        this._data.time = a
    },
    onKeyDown: function(a) {
        
    },
    onKeyPress: function(a) {
        var b = this,
        c = $(a.currentTarget);
        this._delay ? (clearTimeout(this._delayTimeout), this._delayTimeout = setTimeout(function() {
            b.trigger("valueChanged", c.val())
        }, this._delay)) : this.trigger("valueChanged", c.val())
    },
    createLaydate: function(a){
        var widget = this;
        laydate({elem: "#date-" + this.cid, choose: function(datas){ //选择日期完毕的回调
            widget.onKeyPress(a)
        }})
    }
});