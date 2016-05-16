Control = Backbone.View.extend({
    _container: {},
	initialize: function(controlType, controlName){
		this._id = controlType + this._getRandomNumber(),
		this._name = controlName || "Control",
		this._type = controlType,
		this._childrens = [],
		this._childrensLookup = {},
		this._parentControl = null,
		this._properties = {}
	},
	setContainer: function(c){
        this._container = c
    },
    getContainer: function(){
        return this._container
    },
	setId: function(a){
		this._id = a
	},
	getId: function(){
		return this._id
	},
	setName: function(a){
		this._name = a
	},
	getName: function(){
		return this._name
	},
	setControlType: function(a){
		this._type = a
	},
	getControlType: function(){
		return this._type
	},
	_getRandomNumber: function(){
		return parseInt(Math.random() * 1000000 + 1, 10)
	},
	/**
	 * a, key
	 * b, Property Object
	 * c, other value
	 */
	addProperty: function (a, b, c) {
        this._properties[a] = {},
        $.extend(this._properties[a], {
            property: b
        }, c);
        var d = this;
        //绑定Property的changed事件（由它的widget触发）
        b.bind("propertyChanged", function (a, b, c, e) {
           d.onPropertyChanged(a, b, c, e)
        })
    },
    getProperties: function () {
        return this._properties
    },
	getSerializedProperties: function() {
		var a = {};
		for (var b in this._properties) {
			var c = this._properties[b].property;
			a[b] = c.getValue()
		}
		return a
	},
	//获取排序（由它的pos进行排序）后属性集合
    getPropertiesSorted: function () {
        return this._sortProperties()
    },
	_sortProperties: function () {
        var a = [];
        for (var b in this._properties) a.push($.extend({
            propertyName: b
        }, this._properties[b]));
        var c = a.sort(function (a, b) {
            if (a.pos > b.pos) return 1;
            if (a.pos === b.pos) return 0;
            if (a.pos < b.pos) return -1
        });
        return c
    },
	/**
     * 属性值发生变更
     * a, 属性对象
     * b, 属性原来的值
     * c, 属性变更后的值
     * d, 标识是否需重新渲染PropertyView
     */
    onPropertyChanged: function (a, b, c, d) {
        this.trigger("controlUpdated", this, d)
    },
    addChild: function(a){
    	a._parentControl = this,
    	this._childrens.push(a),
        this._childrensLookup[a.getId()] = a,
        this.trigger("childAdded", a)
    },
    removeChild: function (a) {
        var b = -1,
            c = null;
        for (var d = 0; d < this._childrens.length; d++) {
            var e = this._childrens[d];
            if (e.getId() === a.getId()) {
                e._parentControl = null,
                c = e,
                b = d;
                break
            }
        }
        return b < 0 ? c : (this._childrens.splice(b, 1), delete this._childrensLookup[a.getId()], this.trigger("childRemoved", a), c)
    },
    hasChildren: function(){
    	return this._childrens.length > 0
    },
    getChildrens: function(){
    	return this._childrens
    },
    getChildren: function(a){
    	return this._childrensLookup[a]
    },
    getParentControl: function(){
    	return this._parentControl
    },
    onAfterBind: function () {},
    setAlreadyAfterBound: function (a) {
        this._alreadyAfterBound = a
    },
    hasAlreadyAfterBound: function () {
        return this._alreadyAfterBound
    },
	cloneControl: function () {
        var b = ControlFactory.newControl(this._type),
			c = b.getProperties(),
			d = this.getProperties(),
			e,
			f;
        for (var i in c) {
            e = d[i].property,
            f = c[i].property;
            if (!f) {
                continue
            }
            $.isArray(e.getValue()) ? f.setValue($.extend(!0, [], e.getValue())) : typeof e.getValue() == "object" ? f.setValue($.extend(!0, {}, e.getValue())) : f.setValue(e.getValue())
        }
        for (var g = 0; g < this._childrens.length; g++) {
            var h = this._childrens[g],
                i = h.cloneControl();           
            i._parentControl = b,
            b._childrens.push(i),
            b._childrensLookup[i.getId()] = i
        }
        return b
    },
	initFromSerialized: function (a) {
        this.setId(a.id),
        this.initFromSerializedProperties(a.properties)
    },
    //初始化控件的属性集合
    initFromSerializedProperties: function (a) {
        if (!a) return;
        for (var b in a) {
            var c = this._properties[b];
            c && c.property.setValue(a[b])
        }
    },
});

DesignerControl = Control.extend({
    initialize: function () {
		Control.prototype.initialize.call(this, "designer")
    }
});

ProcessNode = Control.extend({
	_el: null,
	_attrs: {},
    initialize: function (a, b, c) {
		Control.prototype.initialize.call(this, a, b),
		c && (this._attrs = c),
		this._initDefaultProperties()
    },
    _initDefaultProperties: function(){
		this.x = new ScalarProperty("X座标", new NullWidget(new AcceptAllInputFilter, !1), 0),
		this.y = new ScalarProperty("Y座标", new NullWidget(new AcceptAllInputFilter, !1), 0),
		this.name = new ScalarProperty("节点名称", new TextWidget(new AcceptAllInputFilter, !1), ""),
		this.sourceRef = new ScalarProperty("sourceRef", new NullWidget(new AcceptAllInputFilter, !1), ""),
		this.targetRef = new ScalarProperty("targetRef", new NullWidget(new AcceptAllInputFilter, !1), ""),
		this.ended = new ScalarProperty("ended", new NullWidget(new AcceptAllInputFilter, !1), ""),
		
		this.addProperty("x", this.x, {pos: 0}),
		this.addProperty("y", this.y, {pos: 1}),
		this.addProperty("name", this.name, {pos: 2}),
		this.addProperty("sourceRef", this.sourceRef, {pos: 3}),
		this.addProperty("targetRef", this.targetRef, {pos: 4}),
		this.addProperty("ended", this.ended, {pos: 5})
	},
	renderTo: function(point){
		this.render(),
		this.setLocation(point),
		this.relocation(point)
	},
	redraw: function(){},
	getRenderEl: function(){
		return this._el
	},
	setLocation: function(point){
    	this.x.setValue(point[0]),
    	this.y.setValue(point[1])
    },
    getLocation: function(){
    	return [this.x.getValue(), this.y.getValue()]
    },
    relocation: function(point){
    	this.location(point);
		for (var i = 0; i < this._childrens.length; i++) {
			var a = this._childrens[i];
			a.relocationToContainer()
		};
    },
    relocationToContainer: function(){},
    location: function(point){
		//只更新当前el的坐标位置，不保存位置信息
    	//this.setLocation(point),
    	this.getRenderEl().attr({x: point[0], y: point[1]})
    },
    isPath: function(){
    	return this._type === "sequenceflow"
    },
    markEnded: function(){
        this._attrs.stroke && (this._attrs.stroke = "#0000CC");
        return this._attrs;
    }
});

StartEvent = ProcessNode.extend({
	initialize: function(){
		ProcessNode.prototype.initialize.call(this, "startevent", "开始节点", {
			src: "hardflow/images/start_event.png",
			width: 48,
			height: 48
		}),
		this.name.setValue("开始"),
        this.name.getWidget().setReadonly(1)
	},
	render: function(){
		var paper = this.getContainer()._paper, attrs = this._attrs;
		attrs = (this.ended.getValue() === 1 ? this.markEnded() : this._attrs);
		this._el = paper.image("", this.x.getValue(), this.y.getValue(), 0, 0).attr(attrs),
		$(this._el.node).attr("id", this._id),
		this.trigger("controlRendered")
	},
	validateSequence: function (toControl){
	    var fromType = this.getControlType(),
            ft = this.targetRef.getValue(),
            toType = toControl.getControlType(),
            ts = toControl.sourceRef.getValue(),
            result = !0;
	    result = ft === "" ? (toType === "endevent" ? !1 : ts === "") : !1;
	    
	    // startevent 只允许一条出线
	    result = (result && this.getContainer().validateAccessPath(this.getId(),"out",1));
	    
        return result
    },
    markEnded: function(){
        this._attrs.src && (this._attrs.src = "hardflow/images/start_event_done.png");
        return this._attrs;
    }
});

EndEvent = ProcessNode.extend({
	initialize: function(){
		ProcessNode.prototype.initialize.call(this, "endevent", "结束节点", {
			src: "hardflow/images/end_event.png",
			width: 48,
			height: 48
		}),
		this.name.setValue("结束"),
		this.name.getWidget().setReadonly(1)
	},
	render: function(){
		var paper = this.getContainer()._paper, attrs = this._attrs;
		attrs = (this.ended.getValue() === 1 ? this.markEnded() : this._attrs);
		this._el = paper.image("", this.x.getValue(), this.y.getValue(), 0, 0).attr(attrs),
		$(this._el.node).attr("id", this._id),
		this.trigger("controlRendered")
	},
    validateSequence: function (toControl){
        return !1
    },
    markEnded: function(){
        this._attrs.src && (this._attrs.src = "hardflow/images/end_event_done.png");
        return this._attrs;
    }
});

TextNode = ProcessNode.extend({
	initialize: function(){
		ProcessNode.prototype.initialize.call(this, "textnode", "文本节点", {"font-size": 12}),
		this.text = new ScalarProperty("text", new TextWidget(new AcceptAllInputFilter, !1), ""),
		this.addProperty("text", this.text, {pos: 6})
	},
	render: function(){
		var paper = this.getContainer()._paper, attrs = this._attrs;
		this._el = paper.text(this.x.getValue(), this.y.getValue(), this.text.getValue()).attr(attrs),
		$(this._el.node).attr("id", this._id),
		this.trigger("controlRendered")
	},
	relocationToContainer: function(){
		var parentEl = this.getParentControl().getRenderEl(), parentBox = parentEl.getBBox(),
			point = [parentBox.x + parentBox.width / 2, parentBox.y + parentBox.height / 2];
		this.location(point)
	},
	changeTextValue: function(a){
		this.text.setValue(a),
		this._el.attr({text: a})
	}
});

UserTask = ProcessNode.extend({
	initialize: function(){
		var self = this;
		ProcessNode.prototype.initialize.call(this, "usertask", "任务节点", {
			width: 120,
			height: 50,
			radius: 5,
			fill: "#fff",
			stroke: "#333333",
			"stroke-width": 2
		}),

		this.name.setValue("任务"),
		this.assigneeType = new ScalarProperty("任务委派人", new CheckBoxWidget(new AcceptAllInputFilter, [{
            text: "单位",
            value: "organ"
        },{
            text: "用户",
            value: "user"
        }, {
            text: "角色",
            value: "role"
        }])),
        this.assignee = new ScalarProperty("", new TextAreaWidget(new AcceptAllInputFilter, !1), ""),
		this.active = new ScalarProperty("", new NullWidget(new AcceptAllInputFilter, !1), 0),
		
		this.addProperty("assigneeType", this.assigneeType, {pos: 6}),
		this.addProperty("assignee", this.assignee, {pos: 7}),
		this.addProperty("active", this.active, {pos: 8}),

		this.name.bind("valueChanged", function(a){
			//更新子控件textnode的text值
			for (var i = 0; i < self._childrens.length; i++) {
				var b = self._childrens[i];
				b.name.getValue() === "name" && b.changeTextValue(a)    
			};
		})

	},
	render: function(){
		var paper = this.getContainer()._paper, attrs = this._attrs;
		attrs = (this.active.getValue() === 1 ? this.markActive() : (this.ended.getValue() === 1 ? this.markEnded() : this._attrs));
		this._el = paper.rect(this.x.getValue(), this.y.getValue(), 0, 0, attrs.radius).attr(attrs),
		$(this._el.node).attr("id", this._id);

		for (var i = 0; i < this._childrens.length; i++) {
			var a = this._childrens[i];
			a.render()
		};
		this.trigger("controlRendered")
	},
	onAfterBind: function(){
		//添加文本图形，把其作为usertask的一个属性来处理，和name进行关联
		var a = ControlFactory.newControl("textnode");
		a.name.setValue("name"),
		a.text.setValue(this.name.getValue()),
		this.addChild(a)
	},
    validateSequence: function (toControl){
        var ft = this.targetRef.getValue(),
            toType = toControl.getControlType(),
            ts = toControl.sourceRef.getValue(),
            result = !0;
        result = ft === "" ? (toType === "startevent" ? !1 : ts === "") : !1;
        
        //usertask 只允许一条出线
        result = (result && this.getContainer().validateAccessPath(this.getId(),"out",1));
        
        return result
    },
    markActive: function(){
        this._attrs.stroke = "#CC0000";
        return this._attrs;
    }
});

SequenceFlow = ProcessNode.extend({
	initialize: function(a, b, c){
	    var self = this;
		ProcessNode.prototype.initialize.call(this, a || "sequenceflow", b || "连接", c || {
			fill: "none",
			stroke: "#333333",
			"stroke-width": 2
		}),
		this.name.setValue("连接"),
        this.name.getWidget().setReadonly(1),
		this.path = new ScalarProperty("path", new NullWidget(new AcceptAllInputFilter, !1), "M10 10L10 10"),
		this.addProperty("path", this.path, {pos: 1}),
        this.conditionDisc = new ScalarProperty("显示", new TextWidget(new AcceptAllInputFilter, !1), ""),
        this.condition = new ScalarProperty("条件表达式", new TextWidget(new AcceptAllInputFilter, !1), ""),
        this.addProperty("conditionDisc", this.conditionDisc, {pos: 6}),
        this.addProperty("condition", this.condition, {pos: 7}),
        this.conditionDisc.bind("valueChanged", function(a){
            //更新子控件textnode的text值
            for (var i = 0; i < self._childrens.length; i++) {
                var b = self._childrens[i];
                if(b.getControlType() === "textnode"){
                    b.name.getValue() === "conditionDisc" && b.changeTextValue(a);
                    b.relocation([(parseInt(self.x.getValue()) - 8),(parseInt(self.y.getValue()) - 8)])                                 
                }
            };
        })
	},
	render: function(){
		var app = this.getContainer(), paper = app._paper, attrs = this._attrs;
        attrs = (this.ended.getValue() === 1 ? this.markEnded() : this._attrs);
		this._el = paper.path(this.path.getValue()).attr(attrs)	

		$(this._el.node).attr("id", this._id);

		if(this.hasChildren()){
			for (var i = 0; i < this._childrens.length; i++) {
				var a = this._childrens[i];
				a.render()
			};
		}
		this.trigger("controlRendered"),
		this.trigger("pathAdded", this.sourceRef.getValue(), this.targetRef.getValue())
	},
	renderTo: function(from, to){		
		this.sourceRef.setValue(from),
		this.targetRef.setValue(to),
		this.render(),
		this.relocation()		
	},
	onAfterBind: function(from, to){
		//添加线的箭头
		var a = ControlFactory.newControl("arrownode");
		this.addChild(a);
		
		//如果从conditionnode发出，则可以编辑线的名称
		if(from.indexOf("conditionnode") != -1){
            //添加文本图形，把其作为usertask的一个属性来处理，和name进行关联
            var b = ControlFactory.newControl("textnode");
            b.setLocation({x:this.x,y:this.y}),
            b.name.setValue("conditionDisc"),
            b.text.setValue(this.conditionDisc.getValue()),
            this.addChild(b)		    
		}
	},
	relocation: function(){
		this._location(this.sourceRef.getValue(), this.targetRef.getValue())
	},
	_location: function(from, to){
		var app = this.getContainer(),
			fromControl = app.getControl(from),
			fromEl = fromControl.getRenderEl(),
			fromBox = fromEl.getBBox(),
			toControl = app.getControl(to),
			toEl = toControl.getRenderEl(),
			toBox = toEl.getBBox(),
			fp,
			tp,
			pathStr;
		
		fp = this._connPoint(fromBox, {
			x: toBox.x + toBox.width / 2,
			y: toBox.y + toBox.height / 2
		});
		tp = this._connPoint(toBox, fp);
		pathStr = "M" + fp.x + "," + fp.y + " L" + tp.x + "," + tp.y;
		
		this.x.setValue((tp.x + fp.x)/2);
		this.y.setValue((tp.y + fp.y)/2);
		
		this.getRenderEl().attr("path", pathStr);
		this.getRenderEl().show();
		this.path.setValue(pathStr);

		for (var i = 0; i < this._childrens.length; i++) {
		    var a = this._childrens[i];
		    if(a.getControlType() === "textnode"){
		        a.relocation([(parseInt(this.x.getValue()) - 8),(parseInt(this.y.getValue()) - 8)]);
		        continue
		    }
		    var ap = this._arrowPoint(fp, tp, 5);
			// var a = this._childrens[i], 
				// ap = this._arrowPoint(fp, tp, 5);
			pathStr = "M" + ap[0].x + "," + ap[0].y + " L" + ap[1].x + "," + ap[1].y + " L" + ap[2].x + "," + ap[2].y + "z";
			a.getRenderEl().attr("path", pathStr);
			a.getRenderEl().show(),
			a.path.setValue(pathStr)
		};		
	},
	_arrowPoint: function(leftPoint, rightPoint, radius) {
		var area = Math.atan2(leftPoint.y - rightPoint.y, rightPoint.x - leftPoint.x) * (180 / Math.PI);
		
		var x = rightPoint.x - radius * Math.cos(area * (Math.PI / 180));
		var y = rightPoint.y + radius * Math.sin(area * (Math.PI / 180));
		
		var x1 = x + radius * Math.cos((area + 120) * (Math.PI / 180));
		var y1 = y - radius * Math.sin((area + 120) * (Math.PI / 180));
		var x2 = x + radius * Math.cos((area + 240) * (Math.PI / 180));
		var y2 = y - radius * Math.sin((area + 240) * (Math.PI / 180));
		
		return [rightPoint, {
				x : x1,
				y : y1
			}, {
				x : x2,
				y : y2
			}]
	},
	_connPoint : function(j, d) {
		var c = d, e = {
			x : j.x + j.width / 2,
			y : j.y + j.height / 2
		};
		var l = (e.y - c.y) / (e.x - c.x);
		l = isNaN(l) ? 0 : l;
		var k = j.height / j.width;
		var h = c.y < e.y ? -1 : 1, f = c.x < e.x ? -1 : 1, g = c.y, i = c.x;
		if (Math.abs(l) > k && h == -1) {
			g = e.y - j.height / 2;
			i = e.x + h * j.height / 2 / l;
		} else {
			if (Math.abs(l) > k && h == 1) {
				g = e.y + j.height / 2;
				i = e.x + h * j.height / 2 / l;
			} else {
				if (Math.abs(l) < k && f == -1) {
					g = e.y + f * j.width / 2 * l;
					i = e.x - j.width / 2;
				} else {
					if (Math.abs(l) < k && f == 1) {
						g = e.y + j.width / 2 * l;
						i = e.x + j.width / 2
					}
				}
			}
		}
		
		return {x: parseInt(i), y: parseInt(g)}
	}
});

ArrowNode = SequenceFlow.extend({
	initialize: function(){
		SequenceFlow.prototype.initialize.call(this, "arrownode", "arrownode", {
			fill: "#333333",
			stroke: "#333333",
			"stroke-width": 2,
			radius: 4
		}),
		this.path = new ScalarProperty("path", new NullWidget(new AcceptAllInputFilter, !1), "M10 10L10 10"),		
		this.addProperty("path", this.path, {pos: 1})
	},
    markEnded: function(){
        this._attrs.stroke && (this._attrs.stroke = "#0000CC");
        this._attrs.fill && (this._attrs.fill = "#0000CC"); 
        return this._attrs;
    }
});

ConditionNode = ProcessNode.extend({
    initialize: function(){
        var self = this;
        ProcessNode.prototype.initialize.call(this, "conditionnode", "条件分支", {
            src: "hardflow/images/condition_event.png",
            width: 48,
            height: 48
        }),

        this.name.setValue("条件分支"),
        this.name.bind("valueChanged", function(a){
            //更新子控件textnode的text值
            for (var i = 0; i < self._childrens.length; i++) {
                var b = self._childrens[i];
                b.name.getValue() === "name" && b.changeTextValue(a)
            };
        })
    },
    render: function(){
        var paper = this.getContainer()._paper, attrs = this._attrs;
        attrs = (this.ended.getValue() === 1 ? this.markEnded() : this._attrs);
        // this._el = paper.rect(this.x.getValue(), this.y.getValue(), 0, 0, attrs.radius).attr(attrs),
        this._el = paper.image("", this.x.getValue(), this.y.getValue(), 0, 0).attr(attrs),
        $(this._el.node).attr("id", this._id);

        for (var i = 0; i < this._childrens.length; i++) {
            var a = this._childrens[i];
            a.render()
        };

        this.trigger("controlRendered")
    },
    validateSequence: function (toControl){
        var ft = this.targetRef.getValue(),
            toType = toControl.getControlType(),
            ts = toControl.sourceRef.getValue(),
            result = !0;
        result = ft === "" ? (toType === "startevent" ? !1 : ts === "") : !1;
        
        return result
    },
    markEnded: function(){
        this._attrs.src && (this._attrs.src = "hardflow/images/condition_event_done.png"); 
        return this._attrs;
    }
});

TimeTask = ProcessNode.extend({
    initialize: function(){
        var self = this;
        ProcessNode.prototype.initialize.call(this, "timetask", "定时任务", {
            src: "hardflow/images/timetask_event.png",
            width: 48,
            height: 48
        }),

        this.name.setValue("定时任务"),
        this.name.getWidget().setReadonly(1),
        this.time = new ScalarProperty("结束时间", new DateWidget(new AcceptAllInputFilter, !1), ""),
        this.time.getWidget().setReadonly(1),
        this.active = new ScalarProperty("", new NullWidget(new AcceptAllInputFilter, !1), ""),
        this.addProperty("time", this.time, {pos: 6}),
        this.addProperty("active", this.active, {pos: 7})
    },
    render: function(){
        var paper = this.getContainer()._paper, attrs = this._attrs;
        attrs = (this.active === "1" ? this.markActive() : (this.ended === "1" ? this.markEnded() : this._attrs));
        // this._el = paper.rect(this.x.getValue(), this.y.getValue(), 0, 0, attrs.radius).attr(attrs),
        this._el = paper.image("", this.x.getValue(), this.y.getValue(), 0, 0).attr(attrs),
        $(this._el.node).attr("id", this._id);

        for (var i = 0; i < this._childrens.length; i++) {
            var a = this._childrens[i];
            a.render()
        };

        this.trigger("controlRendered")
    },
    validateSequence: function (toControl){
        var ft = this.targetRef.getValue(),
            toType = toControl.getControlType(),
            ts = toControl.sourceRef.getValue(),
            result = !0;
        result = ft === "" ? (toType === "startevent" ? !1 : ts === "") : !1;
        return result
    },
    markEnded: function(){
        this._attrs.src && (this._attrs.src = "hardflow/images/timetask_event_done.png");
        return this._attrs;
    },
    markActive: function(){
        this._attrs.src && (this._attrs.src = "hardflow/images/timetask_event_now.png");
        return this._attrs;
    }
});