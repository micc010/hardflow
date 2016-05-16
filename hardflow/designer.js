Designer = Backbone.View.extend({
	_document: {
		root: null,
		lookup: {},
		pathLookup: {}
	},
	_views: {},
	_designMode: null,
	_sourceNode: null,
	_dragDropTarget: null,
	_selectedControl: null,
	_loading: !1,
	initialize: function(){},
	render: function(){
		var win = $(window);		
		this._renderHeaderView(),
		this._renderControlView(),
		this._renderPropertyView(),
		this._renderDeviceView(),
		this._bindDeviceEvents(),
		this._bindEvents(),
		this._paper = Raphael($(this.getDevice().el).get(0), win.width() * 1.5, win.height() * 1.5),
		this.trigger("appInited")
	},
	getHeaderView: function(){
		return this._views.headerview
	},
	getControlView: function(){
		return this._views.controlview
	},
	getPropertyView: function(){
		return this._views.propertyview
	},
	getDevice: function(){
		return this._views.deviceview
	},
	_renderHeaderView: function(){
		this._views.headerview = new HeaderView;
		this._views.headerview.setContainer(this);
	},
	_renderControlView: function(){
		var a = new ControlView();
		a.setContainer(this);
		a.render(),
		this._views.controlview = a
	},
	_renderPropertyView: function(){
		var a = new PropertyView();
		a.setContainer(this);
		a.render(),
		this._views.propertyview = a
	},
	_renderDeviceView: function(){
		this._views.deviceview = new DeviceView;
		this._views.deviceview.setContainer(this),
		this._views.deviceview.initEvents()//切记在设置完deviceview的container后要初始化deviceview的事件
	},
	_bindDeviceEvents: function(){
		var a = this._views.deviceview, b = this;
		
		a.bind("controlSelected", function(c){
			var d = b.getControl(c);
			d && b.onControlSelected(d)
		}).bind("locationUpdated", function(c, x, y){
			var d = b.getControl(c);
			d && d.setLocation([x, y])
		}).bind("controlDuplicated", function(c){
			var d = b.getControl(c);
			d && b.onControlDuplicated(d)
		}).bind("controlDeleted", function(c){
			var d = b.getControl(c);
			d && b.onControlDeleted(d)
		}).bind("pathSelected", function(c){
			var d = b.getControl(c);
			d && b.onPathSelected(d)
		})
	},
	_bindEvents: function(){
		var a = this;
		this.bind("appLoading", function(){
			a._loading = !0
		}).bind("appLoaded", function(){
			a._loading = !1
		})
	},
	changeDesignMode: function(a){
		this._designMode = a,
		a === null && (this._sourceNode = null)
	},
	getDesignMode: function(){
		return this._designMode
	},
	setSourceNode: function(a){
		this._sourceNode = a
	},
	getSourceNode: function(){
		return this._sourceNode
	},
	isLoading: function(){
		return this._loading
	},
	_bindAddControlEvents: function(a){
		var b = this;
		a.bind("controlRendered", function(){
			b.getControlView().refrash()
		}).bind("controlUpdated", function(a, c) {			
			//if(b.isLoading()) return;
			b.getDevice().updateControl(a),			
			c && b.getPropertyView().refresh()
		}).bind("childAdded", function(a){
			b._document.lookup[a.getId()] = a,
			b._bindAddControlEvents(a)
		}).bind("childRemoved", function(a) {
			delete b._document.lookup[a.getId()]		
		})
	},
	addControl: function(controlType, point){
	    ControlFactory.setContainer(this);
		var control = ControlFactory.newControl(controlType);
		if(!control){
			return;
		}
		this._addControl(control, point)
	},
	_addControl: function(control, point){
		control.hasAlreadyAfterBound() || (this._bindAddControlEvents(control), control.onAfterBind(), control.setAlreadyAfterBound(!0)),
		this.getDevice().addControlToDevice(control, point || [control.x.getValue(), control.y.getValue()]),
		this.onControlSelected(control),
		this._addChildControl(control)
	},
	_addChildControl: function(a){
		this._document.root.addChild(a),
		this._document.lookup[a.getId()] = a
	},
	onControlDeleted: function(control){
		this.deselectAllControls(),
		control.getControlType() === "sequenceflow" ? this._resetControlFromRemovedPath(control) : this._cleanupPathFromRemovedControl(control),
		this._cleanupChildrenFromRemovedControl(control)	
	},
	_cleanupChildrenFromRemovedControl: function(a){
		var b = [], c, device = this.getDevice();
		b.push(a);
		while (b.length) {
			//返回数组中的第一个元素，并删除它
			c = b.shift(),
			delete this._document.lookup[c.getId()],
			device.removeControl(c),
			c.getParentControl() && c.getParentControl().removeChild(c)
			for (var d = 0; d < c._childrens.length; d++) {
				var e = c._childrens[d];
				//向数据里添加元素，以便循环
				b.splice(0, 0, e)
			}
		}
	},
	_cleanupPathFromRemovedControl: function(a){
		var b, c = a.getId(), d = this._document.pathLookup, f, g, h;
		for(var n in d){
			f = d[n], g = f.sourceRef.getValue(), h = f.targetRef.getValue();
			if(g === c || h === c){
				delete this._document.pathLookup[f.getId()],
				this._cleanupChildrenFromRemovedControl(f);

				//重置连线的sourceRef, targetRef控件属性
				if(g === c){
					b = this.getControl(h),
					b && b.sourceRef.setValue("")
				}else{
					b = this.getControl(g),
					b && b.targetRef.setValue("")
				}
			}
		}
		
	},
	_resetControlFromRemovedPath: function(a){
		var b;
		b = this.getControl(a.sourceRef.getValue()),
		b && b.targetRef.setValue(""),
		b = this.getControl(a.targetRef.getValue()),
		b && b.sourceRef.setValue("")
	},
	onControlDuplicated: function(control){
		var a = control.cloneControl(),
			el = control.getRenderEl();
		a.setAlreadyAfterBound(!0),
		this._addControl(a, [el.attr("x") + 20, el.attr("y") + 20])
	},
	getControl: function(a){
		return this._document.lookup[a]
	},
	_bindAddPathEvents: function(a){
		var b = this;
		a.bind("pathAdded", function(from, to){
			var fromControl = b.getControl(from),
				toControl = b.getControl(to);
			//保存节点的path信息	
			fromControl.targetRef.setValue(to),
			toControl.sourceRef.setValue(from)
		})
	},
	acceptAddPath: function(from, to){
		var fromControl = this.getControl(from),
			// fromType = fromControl.getControlType(),
			// ft = fromControl.targetRef.getValue(),
			toControl = this.getControl(to),
			// toType = toControl.getControlType(),
			// ts = toControl.sourceRef.getValue(),
			result = !0;
			
	    result = result && this.validateOnlyOnePath(from,to) && (typeof fromControl != "undefined") && (typeof toControl != "undefined") && fromControl.validateSequence(toControl);
		
		return result
	},
	validateOnlyOnePath: function(from,to){
	    for (var i=0; i < this._document.root.getChildrens().length; i++) {
	        var c = this._document.root.getChildrens()[i];
	        if(c.getControlType() === "sequenceflow" && c.sourceRef.getValue() === from && c.targetRef.getValue() === to){
	            return !1
	        }
	    }
	    return 1
	},
	validateAccessPath: function(cid,type,count){
	    var totalCount = 0;
	    for (var i=0; i < this._document.root.getChildrens().length; i++) {
		    var c = this._document.root.getChildrens()[i];
		    if(c.getControlType() === "sequenceflow"){
                if(type === "in" && c.targetRef.getValue() === cid){
                    totalCount ++
                }else{
                    continue;
                }
                if(totalCount > count){
                    return !1
                }
		    }
		};
		return 1
	},
	addPath: function(from, to){
	    ControlFactory.setContainer(this);
		var control = ControlFactory.newControl("sequenceflow");
		this.acceptAddPath(from, to) && this._addPath(control, from, to)
	},
	_addPath: function(control, from, to){
		var from = from || control.sourceRef.getValue(), to = to || control.targetRef.getValue();		
		control.hasAlreadyAfterBound() || (this._bindAddControlEvents(control), control.onAfterBind(from ,to), control.setAlreadyAfterBound(!0)),
		this.getDevice().addPathToDevice(control, from, to),
		this._addChildControl(control),
		this._document.pathLookup[control.getId()] = control
	},
	deselectAllControls: function(){
		this.hidePropertyDialog(),
		this.getDevice().deselectAllControls()
	},
	onControlSelected: function(a){
		if (this.isLoading()) return;

		//节点连接
		if(this.getDesignMode() === "sequenceflow"){
			var from = this.getSourceNode(), to = a.getId();
			if(from && from !== to){
				this.addPath(from, to)
			}
			this.setSourceNode(to)
		}
		
		this.setSelectedControl(a),
		
		// TODO 此时异步加载
		
		this.getPropertyView().renderForControl(a),
		this.showPropertyDialogForControl(a),
		this.getDevice().selecteControl(a)
	},
	onPathSelected: function(a){
		this.getDesignMode() === "sequenceflow" || (this.deselectAllControls(), this.getDevice().selecteControl(a, !0));
		
		if(a.sourceRef && a.sourceRef.getValue().indexOf("conditionnode") != -1){
		    this.getPropertyView().renderForControl(a),
            this.showPropertyDialogForControl(a)
		}
	},
	setSelectedControl: function(a){
		this._selectedControl = a
	},
	getSelectedControl: function(){
		return this._selectedControl
	},
	hidePropertyDialog: function(){
		this._propertyDialog && this._propertyDialog.dialog("close")
	},
	showPropertyDialogForControl: function(a){
		var b = this, dlg = this._propertyDialog, dialogWidth = 316, maxHeight = 500;						
		if (!dlg) {
			dlg = this._propertyDialog = $("#property-dialog").dialog({				
				autoOpen: !1,
				resizable: !1,
				width: dialogWidth,
				maxHeight: maxHeight,
				dialogClass: "property-dialog",
				position: [$(window).width() - dialogWidth - 40, 100],
				create: function(ev, ui) {
					var c = $(this).closest(".ui-dialog"),
					e = $(".ui-dialog-titlebar", c);
					$(".ui-dialog-titlebar-close", e).html('<span class="bui-icon-dialogclose"></span>')
				}
			})
		}
						
		dlg.dialog("open")
		
		//重设dialog标题等属性
		dlg.dialog("option", {
			title: a.getName().toUpperCase(),
			//position: [$(window).width() - dialogWidth - 40, 100],
			height: Math.min($("#userview-property .overview").height() + 55, maxHeight)
		})
	},
	validateApp: function(){
	    //TODO 校验规则
	    // 1、只能有一个开始一个结束
	    // 2、不存在孤立的元素
	    // 3、fork并发和join汇聚的对应关系
	    
	},
	publishApp: function(options, callback){
		
		var obj = this.validateApp();
		if(!obj.isValid){
		    alert(obj.msg);
		    return;
		}
		
		var a = this, 
            b = new ControlOutputVisitor,
            back = typeof options === "function" ? options : callback,
            o = typeof options === "function" || !options ? {} : options,
            data = $.extend({}, {
                doc: JSON.stringify(b.getAppDocument(this._document.root))
            }, o);
        back && back.call(data)            
	},
	saveApp: function(){
		var b = new ControlOutputVisitor;
        var win = window.open("", "保存流程");
        if(typeof win === "undefined"){
            alert("请设置浏览器允许弹出窗口！设置完毕后再保存流程。");
            return false;
        }
        var doc = win.document;
        var content = JSON.stringify(b.getAppDocument(this._document.root));
        doc.write(content);
        doc.close();
	},
	loadApp: function(doc){
	    
	    if(!doc){
	        doc = {doc: {"type": "designer","id": "1001","properties": {},"children": []}};
	    }
	    
		this.trigger("appLoading"),
		this.openFromObject(doc),
		this.trigger("appLoaded")
	},
	_newAppFromObject: function(a, b) {
		var d = new DesignerControl;
		return d.initFromSerialized(b), d
	},
	_addControlFromObject: function(a){
	    ControlFactory.setContainer(this);
		var b = ControlFactory.newControl(a.type), c, d;
		if(!b){
			return;
		}

		this._bindAddControlEvents(b);

		for(var i = 0; i < a.children.length; i++){
			c = a.children[i],
			d = ControlFactory.newControl(c.type),
			d.initFromSerialized(c),
			b.addChild(d)
		}
		
		b.initFromSerialized(a),
		b.setAlreadyAfterBound(!0),
		a.type === "sequenceflow" ? this._addPath(b) : this._addControl(b)
	},
	openFromObject: function(a){
		var d = a.doc; // app node
		if (!d) {
			return
		}

		this._document.root = this._newAppFromObject(d.id, d);
		
		this._sithPath = d.sitePath;
		
		for (var e = 0; e < d.children.length; e++) {			
			this._addControlFromObject(d.children[e])
		}
	},
	getSitePath: function() {
		if(!this._sitePath){
			var a = window.document.location.pathname, b = a.substring(0, a.substr(1).indexOf('/') + 2);
			this._sitePath = (b == "/hardflow/" ? "/" : b);
		}
		return this._sitePath
	},
	onDropActivate: function(a, b){
	},
	onDropDeactivate: function(a, b){
		this.onDropFinished()
	},
	onDropOver: function(a, b){
		var c = $(b.draggable).attr("type");
		this._dragDropTarget = c
	},
	onDropOut: function(a, b){
		this._dragDropTarget = null
	},
	onDrop: function(a, b){
		if(!this._dragDropTarget) return;
		this.addControl(this._dragDropTarget, [a.pageX, a.pageY - 40]),
		this.onDropFinished()
	},
	onDropTargetMouseMove: function(a){
		if(!this._dragDropTarget) return;
	},
	onDropFinished: function(){
		this._dragDropTarget = null
	}
});