function graphService(options,findDataCallback) {

  var that = this;

  var settings = options || {};
  settings.graphId = settings.graphId || 'graph';
  settings.crumbsId = settings.crumbsId || 'crumbs';
  settings.lineColor = settings.lineColor || 'black';
  settings.nodeColor = settings.nodeColor || 'black';
  settings.textColor = settings.textColor || 'yellow';
  settings.bubbleColor = settings.bubbleColor || 'yellow';
  settings.bubbleTextColor = settings.bubbleTextColor || 'red';
  settings.blankImage = settings.blankImage || 'libs/graph/images/nav/blank.jpg';
  settings.unknownImage = settings.unknownImage || 'libs/graph/images/nav/unknown.jpg';


  var crumbs = [];
  var selectables = [];
  var dataIndex = new Object();
  var allData = [];

  var loadNewData = function(data) {
    if(data && dataIndex[data.id] == null) {
      allData.push(data);
      dataIndex[data.id] = allData.indexOf(data);
      defineLoadRelations(data);
    }
  };

  var findData = function(aId) {
    if(dataIndex[aId] == null) {
      findDataCallback(aId,loadNewData);
    }
  };

  // canvas objects
  var graphCanvas = document.getElementById(settings.graphId);
  var graphContext = graphCanvas.getContext('2d');
  var crumbsCanvas = document.getElementById(settings.crumbsId);
  var crumbsContext = crumbsCanvas.getContext('2d');

  var findNodeById = function(aId) {
    if(dataIndex[aId]!=undefined) {
      return allData[dataIndex[aId]];
    }

    return null;
  };
  that.findNodeById = findNodeById;

  var getMaxNodesPerPage = function() {
   return 8;
  };
  that.getMaxNodesPerPage = getMaxNodesPerPage();

  var getMaxVisibleCrumbs = function() {
   return 4;
  };
  that.getMaxVisibleCrumbs = getMaxVisibleCrumbs;

  var findXYOn = function(event, currentElement) {
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var graphCanvasY = 0;
    do {
      totalOffsetX += currentElement.offsetLeft;
      totalOffsetY += currentElement.offsetTop;
    }
    while(currentElement = currentElement.offsetParent)

    graphCanvasX = event.pageX - totalOffsetX;
    graphCanvasY = event.pageY - totalOffsetY;

    return {x:graphCanvasX, y:graphCanvasY}
  };
  that.findXYOn = findXYOn;

  var findOnGraphCanvas = function(event){
    return findXYOn(event, graphCanvas);
  };
  that.findOnGraphCanvas = findOnGraphCanvas;

  var findOnCrumbsCanvas = function(event){
    return findXYOn(event, crumbsCanvas);
  };
  that.findOnCrumbsCanvas = findOnCrumbsCanvas;

  var goToCrumb = function(e) {
    var crumb = findCrumbAtXY(findOnCrumbsCanvas(e))

    if(crumb==null || crumbs.indexOf(crumb)==crumbs.length-1) return;

    removeCrumbsUntil(crumb);
    loadData(crumb,0,0,0,crumb.currentPage)
  };
  that.goToCrumb = goToCrumb;

  var addCrumb = function(crumb,img) {
    if(crumbs.indexOf(crumb)!=-1) return;
    
    crumbs.push(crumb);

    // need to adjust if more crumbs than space to display them
    if(crumbs.length>getMaxVisibleCrumbs()) {
      crumbsContext.clearRect(0,0,crumbsCanvas.width,crumbsCanvas.height);
      // redraw the latest crumbs
      for(var i=crumbs.length-getMaxVisibleCrumbs();i<crumbs.length;i++) {
        doAddCrumb(crumbs[i],crumbs[i].image); 
      }
    }
    else {
      doAddCrumb(crumb,img); 
    }
  };
  that.addCrumb = addCrumb;

  var doAddCrumb = function(crumb,img) {
    crumb.crumbX = (crumbsCanvas.width-crumb.width)/2;

    var crumbIndex = crumbs.indexOf(crumb)
    if((crumbIndex==0 && crumbs.length<=getMaxVisibleCrumbs()) ||
       (crumbIndex == crumbs.length-getMaxVisibleCrumbs())) {
      crumb.crumbY=10;
    }
    else {
      crumb.crumbY =  10 + crumbs[crumbIndex-1].crumbY + crumbs[crumbIndex-1].height;
    }
    
    if(crumb.imageUrl==null) {
      drawTextAsImage(crumbsCanvas,crumbsContext,null,crumb.label,crumb.crumbX,crumb.crumbY,crumb.width,crumb.height);
    } 
    else {
      drawImage(crumbsCanvas,crumbsContext,img,null,crumb.crumbX,crumb.crumbY,crumbs.length);
    }
  };
  that.doAddCrumb = doAddCrumb;

  var removeCrumbsUntil = function(crumb) {
    var borderWidth=2;
    var crumbIndex = crumbs.indexOf(crumb);

    if(crumbs.length > getMaxVisibleCrumbs()) {
      crumbs = crumbs.slice(0,crumbIndex);
      crumbsContext.clearRect(0,0,crumbsCanvas.width,crumbsCanvas.height);

      var firstCrumbIndex = crumbs.length>getMaxVisibleCrumbs()?crumbs.length-getMaxVisibleCrumbs():0;
      for(var i=firstCrumbIndex;i<crumbs.length;i++) {
        doAddCrumb(crumbs[i],crumbs[i].image);
      }
    }
    else {
      for(var i=crumbs.length-1;i>crumbIndex;i--) {
        crumbsContext.clearRect(crumbs[i].crumbX-borderWidth,crumbs[i].crumbY-borderWidth,crumbsCanvas.width+(borderWidth*2),crumbsCanvas.height+(borderWidth*2));
        crumbs.pop();
      }
    }
  };
  that.removeCrumbsUntil = removeCrumbsUntil;

  var defineLoadRelations = function(aData) {          
    aData.loadRelations = function() { 
      for(var i=0;i<this.relations.length;i++) {
        if(dataIndex[this.relations[i]]==undefined) {
         findData(this.relations[i]);
        }
      }
    }
  };
  that.defineLoadRelations = defineLoadRelations;

  var loadRelations = function(aData) {
    if(aData.loadRelations != null) {
      //alert('loading relations for ' + aData.id)
      aData.loadRelations();
      aData.loadRelations=null;
    }
  };
  that.loadRelations = loadRelations;

  var loadData = function(aData,startX,startY,relativePosition,pageNum,textLabelOverride, screenLoadedAfter) {
    if(relativePosition==0 && !aData.loadedRelations) {
      for(var i=0;i<aData.relations.length;i++) {
         if(dataIndex[aData.relations[i]]==undefined) {
             
            if(document.location.hash!='#loadingDialog') {
              document.location.hash='#loadingDialog';
            }

            setTimeout(function(){loadData(aData,startX,startY,relativePosition,pageNum,textLabelOverride,screenLoadedAfter);},500);
            return;
         }
      }

      aData.loadedRelations=true;
    }

    doLoadData(aData,startX,startY,relativePosition,pageNum,textLabelOverride);
    loadRelations(aData);

    if(screenLoadedAfter!=undefined && document.location.hash=='#loadingDialog') {
      document.location.hash=screenLoadedAfter;
    }

  };
  that.loadData = loadData;

  var doLoadData = function(aData,startX,startY,relativePosition,pageNum,textLabelOverride) {
    if(pageNum==undefined) { pageNum=1; }
    if(textLabelOverride==undefined) { textLabelOverride=false; }

    var img = document.createElement('IMG');
    
    img.onload = function() {
      
      if(relativePosition==0) {
        if(selectables.length !=0) {
          graphContext.clearRect(0,0,graphCanvas.width,graphCanvas.height);
        }
      }  
      
      if(aData.imageUrl==null || textLabelOverride) {
        if(textLabelOverride) {
          drawTextAsImage(graphCanvas,graphContext,null,aData.label,aData.x,aData.y,aData.width,aData.height);
        } 
        else {
          if(relativePosition==0) {
            drawTextAsImage(graphCanvas,graphContext,aData,aData.label);
          } 
          else {
            drawTextAsImage(graphCanvas,graphContext,aData,aData.label,startX,startY);
          }
        }

        aData.textLabelVisible=true;
        if(textLabelOverride){
          aData.textLabelOverride=true;
        } 
      } 
      else {
        aData.textLabelVisible=false;
        aData.textLabelOverride=false;
        drawImage(graphCanvas,graphContext,img,aData,startX,startY,relativePosition); 
      }
      
      aData.currentPage=pageNum;

      if(relativePosition>=0) {
        aData.relativePosition = relativePosition;
      }

      // don't show relations if this is a relation being shown...
      if(relativePosition!=0) {
        if(aData.relations.length > 0) {   
          var relationX=aData.x;
          var relationY=aData.y;

          if(relationX > graphCanvas.width/2) {
            relationX += aData.width;
          }

          if(relationY > graphCanvas.height/2) {
            relationY += aData.height;
          }

          if(aData.relativePosition!=0) {
            drawTextInCircle(graphContext,aData.relations.length.toString(),relationX,relationY);
          }
        }

        return;
      }

      addCrumb(aData,img);

      selectables = [aData];

      var startPicX = aData.x;
      var startPicY = aData.y;
      var distBetweenNodes= 100; //aData.width;
      var percentTurn = .3;
      var percentTurnPlus = 1 + percentTurn;
      // currently limited to only 8
      for(var r=(aData.currentPage-1)*getMaxNodesPerPage();r<(aData.currentPage*getMaxNodesPerPage()) && r<aData.relations.length;r++) {
        
        var relationData = findNodeById(aData.relations[r]);

        if(relationData==null) {
          continue;
        }
     
        switch(r%getMaxNodesPerPage())
        {
           case 0:
             startPicY -= distBetweenNodes*(percentTurn+percentTurnPlus);
             break;
           case 1:
             startPicX += distBetweenNodes*percentTurnPlus;
             startPicY += distBetweenNodes*percentTurn;
             break;
           case 2:
             startPicX += distBetweenNodes*percentTurn;
             startPicY += distBetweenNodes*percentTurnPlus;
             break;
           case 3:
             startPicX -= distBetweenNodes*percentTurn;
             startPicY += distBetweenNodes*percentTurnPlus;
             break;
           case 4:
             startPicX -= distBetweenNodes*percentTurnPlus;
             startPicY += distBetweenNodes*percentTurn;
             break;
           case 5:
             startPicX -= distBetweenNodes*percentTurnPlus;
             startPicY -= distBetweenNodes*percentTurn;
             break;
           case 6:
             startPicX -= distBetweenNodes*percentTurn;
             startPicY -= distBetweenNodes*percentTurnPlus;
             break;
           case 7:
             startPicX += distBetweenNodes*percentTurn;
             startPicY -= distBetweenNodes*percentTurnPlus;
             break;
         }
    
         selectables.push(relationData);
         drawLine(aData.x+(aData.width/2),aData.y+(aData.height/2),startPicX+(aData.width/2),startPicY+(aData.height/2));

         loadData(relationData,startPicX,startPicY,r+1);  
      } 

      // redraw the image again if there have been lines drawn
      if(aData.relations.length>0) {
        if(aData.imageUrl==null) {
          drawTextAsImage(graphCanvas,graphContext,null,aData.label,aData.x,aData.y,aData.width,aData.height);
        } else {
          drawImage(graphCanvas,graphContext,img,aData,startX,startY,relativePosition);
        }
      }

      if(aData.relations.length>pageNum*getMaxNodesPerPage()) {
        showNextButton();
      }

      if(pageNum>1) {
       showPreviousButton();
      }
    } 
    img.src = (aData.imageUrl==null)?settings.blankImage:aData.imageUrl;
  };
  that.doLoadData = doLoadData;

  var drawLine = function(startX,startY,endX,endY) {
    graphContext.beginPath();
    graphContext.strokeStyle = settings.lineColor;
    graphContext.lineWidth = 2;
    graphContext.moveTo(startX,startY);
    graphContext.lineTo(endX,endY);
    graphContext.stroke();
  };
  that.drawLine = drawLine;

  var showInformation = function(e) {
    var clickXY = findOnGraphCanvas(e);
    
    if(isClickOnNextButton(clickXY)) {
      crumbs[crumbs.length-1].currentPage++;
      loadData(crumbs[crumbs.length-1],0,0,0,crumbs[crumbs.length-1].currentPage);
    }
    else if(isClickOnPreviousButton(clickXY)) {
      crumbs[crumbs.length-1].currentPage--;
      loadData(crumbs[crumbs.length-1],0,0,0,crumbs[crumbs.length-1].currentPage);
    }
    else {
      var selectableAtXY = findSelectableAtXY(clickXY,true);
      if(isClickWithinRefocusCircle(selectableAtXY,clickXY)) {
        loadData(selectableAtXY,0,0,0,1,false,'#');
      }
      else {
        showInformationForData(selectableAtXY);
      }
    }
  };
  that.showInformation = showInformation;

  var showLabel = function(e) {
    var aData = findSelectableAtXY(findOnGraphCanvas(e));
    if(aData!=null) {
      if(!aData.textLabelVisible) {
       showLabelForData(aData);
      } 
    }

    for(var i=0;i<selectables.length;i++) {
      if(selectables[i] != aData && selectables[i].textLabelOverride) {
        loadData(selectables[i],selectables[i].x,selectables[i].y,-1,selectables[i].currentPage);
      }
    }
  };
  that.showLabel = showLabel;

  var findSelectableAtXY = function(clickXY,includeCircle) {
    for(var i=0;i<selectables.length;i++) {
      if(clickXY.x >= selectables[i].x && 
        clickXY.x <= (selectables[i].x+selectables[i].width) &&
        clickXY.y >= selectables[i].y && 
        clickXY.y <= (selectables[i].y+selectables[i].height)) 
      {
        return selectables[i];
      }

      if(includeCircle==true) {
        if(isClickWithinRefocusCircle(selectables[i],clickXY)) {
          return selectables[i];
        }
      }
    }

    return null;
  };
  that.findSelectableAtXY = findSelectableAtXY;

  var findCrumbAtXY = function(clickXY) {
    var firstCrumbIndex = crumbs.length>getMaxVisibleCrumbs()?crumbs.length-getMaxVisibleCrumbs():0;
    for(var i=firstCrumbIndex;i<crumbs.length;i++) {
      if(clickXY.x >= crumbs[i].crumbX && 
        clickXY.x <= (crumbs[i].crumbX+crumbs[i].width) &&
        clickXY.y >= crumbs[i].crumbY && 
        clickXY.y <= (crumbs[i].crumbY+crumbs[i].height)) 
      {
        return crumbs[i];
      }
    }

    return null;
  };
  that.findCrumbAtXY = findCrumbAtXY;

  var getSelectable = function(i) {
    return selectables[i];
  };
  that.getSelectable = getSelectable;

  var getNewSelectable = function(i,parentSelectableIndex) {
    if(parentSelectableIndex != null) {
      loadData(allData[parentSelectableIndex],0,0,0);
    }

    return allData[i];
  };
  that.getNewSelectable = getNewSelectable;

  var showLabelForData = function(aData) {
    if(aData==null || aData.imageUrl==null) return;

    loadData(aData,aData.x,aData.y,-1,aData.currentPage,true);
    loadRelations(aData);
  };
  that.showLabelForData = showLabelForData;

  var showInformationForData = function(aData,ignoreTextLabel) {
    if(aData==null) return;

    if(!aData.loadedRelations) {    
      for(var i=0;i<aData.relations.length;i++) {
         if(dataIndex[aData.relations[i]]==undefined) {
            //alert(aData.relations[i] + " relation is not loaded");

            if(document.location.hash!='#loadingDialog') {
              document.location.hash='#loadingDialog';
            }

            setTimeout(function(){showInformationForData(aData,ignoreTextLabel);},500);
            return;
         }
      }

      // load the relations of these relations
      for(var i=0;i<aData.relations.length;i++) {
          loadRelations(findNodeById(aData.relations[i]));
      }

      aData.loadedRelations=true;
    }
    doShowInformationForData(aData,ignoreTextLabel); 
  };
  that.showInformationForData = showInformationForData;

  var doShowInformationForData = function(aData,ignoreTextLabel) {
    if(aData==null) return;
    if(ignoreTextLabel==undefined) { ignoreTextLabel=false; };

    if(!ignoreTextLabel && aData.imageUrl!=null) {
      if(!aData.textLabelOverride) {
        showLabelForData(aData);
        return;
      }
      else {
        loadData(aData,aData.x,aData.y,-1,aData.currentPage,false);
      }
    }

    var isAtCenter = aData.id == selectables[0].id;

    document.getElementById('title').innerHTML = aData.title;
    document.getElementById('summary').innerHTML = aData.summary;
    document.getElementById('content').innerHTML = aData.content;
    document.getElementById('image').src = aData.imageUrl==null?settings.unknownImage:aData.imageUrl;

    var relationContent = '';
    var startNav=aData.currentPage==undefined?0:((aData.currentPage-1)*getMaxNodesPerPage());
    var endNav = aData.currentPage==undefined?(aData.relations.length>getMaxNodesPerPage()?getMaxNodesPerPage():aData.relations.length):(aData.currentPage*getMaxNodesPerPage());
    for(var j=startNav;j<endNav &&j<aData.relations.length;j++) {
      
      if(isAtCenter) {
        relationContent += '<a href="javascript:showInformationForData(getSelectable('+selectables.indexOf(findNodeById(aData.relations[j]))+'),true);"><li>' + findNodeById(aData.relations[j]).label + '</li></a>';
      }
      else 
      {
        relationContent += '<a href="javascript:showInformationForData(getNewSelectable('+dataIndex[aData.relations[j]]+','+dataIndex[aData.id]+'),true);"><li>' + findNodeById(aData.relations[j]).label + '</li></a>';
      }
    }
    document.getElementById('relations').innerHTML = relationContent;

    window.location.hash = 'modalDialog';
  };
  that.doShowInformationForData = doShowInformationForData;

  var showData = function() {
    if(allData.length==0) {
      findData();
      setTimeout(function(){showData();},500);
      return;
    }

    doShowData(allData);  
  };
  that.showData = showData;

  var doShowData = function(data) {
    var aData = data[0];
    defineLoadRelations(aData);
    loadRelations(aData);
    loadData(aData,0,0,0,undefined,undefined,'#');
  };
  that.doShowData = doShowData;


  var drawImage = function(canvas,context,img,aData,startX,startY,relativePosition) {
     var canvasWidth = canvas.width;
     var canvasHeight = canvas.height;
     var imageWidth = img.width;
     var imageHeight = img.height;

     var forcedImageWidth=100;
     var scalingAdjustment = imageWidth>forcedImageWidth?forcedImageWidth/imageWidth:1+((forcedImageWidth-imageWidth)/forcedImageWidth); 

     if(scalingAdjustment!=1) { 
       imageWidth *= scalingAdjustment;
       imageHeight *= scalingAdjustment;
     }

     if(imageHeight>imageWidth) {
       scalingAdjustment = imageWidth/imageHeight; 

       if(scalingAdjustment!=1) { 
         imageWidth *= scalingAdjustment;
         imageHeight *= scalingAdjustment;
       }
     }

     if(canvas == graphCanvas && relativePosition > 0) {
       if(selectables[0].width != imageWidth) {
         startX -= (imageWidth-selectables[0].width)/2;
       }

       if(selectables[0].height != imageHeight) {
           startY -= (imageHeight-selectables[0].height)/2;
       }
     }

     var startPicX = relativePosition!=0?startX:((canvasWidth/2)-(imageWidth/2));
     var endPicX = startPicX + imageWidth;
     var startPicY = relativePosition!=0?startY:((canvasHeight/2)-(imageHeight/2));
     var endPicY = startPicY + imageHeight;
     var borderWidth = 2;

     if(aData!=null) {
       aData.x=startPicX;
       aData.y=startPicY;
       aData.width=imageWidth;
       aData.height=imageHeight;
       aData.image = img;
     }

     // draw rectangle to border image
     context.save();
     clipRoundedRegion(context,startPicX-borderWidth,startPicY-borderWidth,endPicX+(borderWidth),endPicY+(borderWidth))
     context.fillStyle   = settings.nodeColor;
     context.fillRect(startPicX-borderWidth,startPicY-borderWidth,imageWidth+(borderWidth*2),imageHeight+(borderWidth*2));
     context.restore();

     context.save();
     clipRoundedRegion(context,startPicX,startPicY,endPicX,endPicY)
     context.drawImage(img,startPicX,startPicY,imageWidth,imageHeight);
     context.restore();

  };
  that.drawImage = drawImage;

  var clipRoundedRegion = function(context,startPicX,startPicY,endPicX,endPicY) {
     var cornerRadius = 20;

     context.beginPath();
     context.moveTo(startPicX+cornerRadius, startPicY);
     context.lineTo(endPicX-cornerRadius, startPicY); 
     context.quadraticCurveTo(endPicX,startPicY,endPicX,startPicY+cornerRadius);
     context.lineTo(endPicX,endPicY-cornerRadius);
     context.quadraticCurveTo(endPicX,endPicY,endPicX-cornerRadius,endPicY);
     context.lineTo(startPicX+cornerRadius,endPicY);
     context.quadraticCurveTo(startPicX,endPicY,startPicX,endPicY-cornerRadius);
     context.lineTo(startPicX,startPicY+cornerRadius);
     context.quadraticCurveTo(startPicX,startPicY, startPicX+cornerRadius, startPicY);
     context.clip();
  };
  that.clipRoundedRegion = clipRoundedRegion;

  var drawTextAsImage = function(canvas,context,aData,text,x,y,width,height) {
    if(width==undefined) { width=100; }
    if(height==undefined) { height=100; }
    if(x==undefined) { x=(canvas.width/2)-(width/2); }
    if(y==undefined) { y=(canvas.height/2)-(height/2); }

    var fontSize = 15;
    context.textAlign = "center";
    context.textBaseline = 'middle';
    context.fillStyle = settings.textColor;
    context.font = 'bold '+fontSize+'px sans-serif';

   
    var centerX = x+(width/2);
    var centerY = y+(height/2);

    var textParts = text.split(' '); 

    if(textParts.length > 1) {
     centerY -= fontSize * (textParts.length/4);
    } 

     if(aData!=null) {
             aData.x=x;
                   aData.y=y;
                   aData.width=width;
                   aData.height=height;
     }

     context.save();
     clipRoundedRegion(context,x,y,x+width,y+height);
     context.fillStyle   = settings.nodeColor;
     context.fillRect(x,y,width,height);
     context.restore();

    for(var i=0;i<textParts.length;i++) { 
      context.fillText(textParts[i], centerX, centerY+(i*fontSize));
    }
  };
  that.drawTextAsImage = drawTextAsImage;

  var drawTextInCircle = function(context,text,x,y) {
    context.beginPath();
    context.arc(x, y, 15,0,2*Math.PI);
    context.fillStyle = settings.bubbleColor;
    context.fill();

    context.beginPath();
    context.fillStyle = settings.bubbleTextColor;
    context.font = 'italic bold 15px sans-serif';
    context.textAlign='center';
    context.textBaseline = 'middle';
    context.fillText(text,x,y);
  };
  that.drawTextInCircle = drawTextInCircle;

  var isClickWithinRefocusCircle = function(aData,clickXY) {
    if(aData==null) {
      return false;
    } 

    var circleX=0, circleY=0;
    switch(findQuadrant(aData.x,aData.y)) {
      case 1:
        circleX = aData.x;
        circleY = aData.y;
        break;
      case 2:
        circleX = aData.x+aData.width;
        circleY = aData.y;
        break;
      case 3:
        circleX = aData.x+aData.width;
        circleY = aData.y+aData.height;
        break;
      case 4:
        circleX = aData.x;
        circleY = aData.y+aData.height;
        break;
    }

    var circleRadius=15;

    var innerX = circleX-circleRadius;
    var outerX = circleX+circleRadius;
    var upperY = circleY-circleRadius;
    var lowerY = circleY+circleRadius;

    if(clickXY.x >= innerX && clickXY.x <= outerX 
       && clickXY.y >= upperY && clickXY.y <= lowerY) {
      var color = colorAtXY(clickXY.x,clickXY.y);
      return color !=settings.nodeColor;
    }
  };
  that.isClickWithinRefocusCircle = isClickWithinRefocusCircle;

  var findQuadrant = function(x,y) {
    var widthMiddle = graphCanvas.width/2;
    var heightMiddle = graphCanvas.height/2;

    if(widthMiddle>x) {
      if(heightMiddle<y) {
        return 4;
      } else {
        return 1; 
      }
    } else {
      if(heightMiddle<y) {
        return 3;
      } else {
        return 2;
      }
    }
  };
  that.findQuadrant = findQuadrant;

  var colorAtXY = function(x,y) {
    var p = graphContext.getImageData(x,y, 1, 1);
    var r = p.data[0];
    var g = p.data[1];
    var b = p.data[2];

    if (r > 255 || g > 255 || b > 255) {
      return undefined;
    }

    return d2Hex(r)+d2Hex(g)+d2Hex(b);
  };
  that.colorAtXY = colorAtXY;

  var d2Hex = function(d) {
    var hex = Number(d).toString(16);
    while (hex.length < 2) {
      hex = "0" + hex;
    }
    return hex.toUpperCase();
  };
  that.d2Hex = d2Hex;

  var isClickOnNextButton = function(clickXY) {
    var nextButtonX=graphCanvas.width-55;
    var nextButtonY=graphCanvas.height-55;
    var nextButtonWidth=50;

    if(crumbs[crumbs.length-1].relations.length<=crumbs[crumbs.length-1].currentPage*8) {
      return false;
    }

    if(nextButtonX <= clickXY.x && nextButtonY <= clickXY.y) {
      
      if(nextButtonX+nextButtonWidth>clickXY.x && nextButtonY+nextButtonWidth>clickXY.y) {
        return true;
      }
    }

    return false;
  };
  that.isClickOnNextButton = isClickOnNextButton;

  var showNextButton = function() {
    var nextButtonX=graphCanvas.width-30;
    var nextButtonY=graphCanvas.height-30;

    graphContext.beginPath();
    graphContext.arc(nextButtonX, nextButtonY, 25,0,2*Math.PI);
    graphContext.strokeStyle = settings.lineColor;
    graphContext.stroke();

    graphContext.beginPath();
    graphContext.fillStyle = settings.lineColor;
    graphContext.font = 'bold 25px courier';
    graphContext.textAlign='center';
    graphContext.textBaseline = 'middle';
    graphContext.fillText('>>',nextButtonX,nextButtonY);
  };
  that.showNextButton = showNextButton;

  var isClickOnPreviousButton = function(clickXY) {
    var prevButtonX=5;
    var prevButtonY=graphCanvas.height-55;
    var prevButtonWidth=50;

    if(crumbs[crumbs.length-1].currentPage==1) {
      return false;   
    }

    if(prevButtonX <= clickXY.x && prevButtonY <= clickXY.y) {
      
      if(prevButtonX+prevButtonWidth>clickXY.x && prevButtonY+prevButtonWidth>clickXY.y) {
        return true;
      }
    }

    return false;
  }
  that.isClickOnPreviousButton = isClickOnPreviousButton;

  var showPreviousButton = function() {
    var prevButtonX=30;
    var prevButtonY=graphCanvas.height-30;

    graphContext.beginPath();
    graphContext.arc(prevButtonX, prevButtonY, 25,0,2*Math.PI);
    graphContext.strokeStyle = settings.lineColor;
    graphContext.stroke();

    graphContext.beginPath();
    graphContext.fillStyle = settings.lineColor;
    graphContext.font = 'italic bold 25px courier';
    graphContext.textAlign='center';
    graphContext.textBaseline = 'middle';
    graphContext.fillText('<<',prevButtonX,prevButtonY);
  };
  that.showPreviousButton = showPreviousButton;

  //canvas events
  graphCanvas.addEventListener("click", showInformation, false);
  graphCanvas.addEventListener("mousemove", showLabel, false);
  crumbsCanvas.addEventListener("click", goToCrumb, false);


  return that;
}
