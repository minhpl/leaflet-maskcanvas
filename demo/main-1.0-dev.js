$(function() {
 //update again
    var map = new L.Map('map', {
        center: new L.LatLng(21.05223312, 105.72597225),
        zoom: 10,
        //layers: [osm]
    });

    var ggUrl = 'http://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    var ggl = new L.TileLayer(ggUrl, {
        subdomains: "0123"
    });

    if (window.CanvasPixelArray) {
        CanvasPixelArray.prototype.set = function(arr) {
            var l = this.length,
                i = 0;
            for (; i < l; i++) {
                this[i] = arr[i];
            }
        };
    }

    map.addLayer(ggl);

    var isInsideObject = false;
    var canvas;
    var remoteCouch = false;

    var red_canvas = document.createElement('canvas');
    const RADIUS = 10;
    const NUM_POLYGON = 50;
    const TILESIZE = 256;

    var numCircles = 10000;
    var WIDTH = 2000;
    var HEIGHT = 2000;

    red_canvas.width = 20;
    red_canvas.height = 20;
    var red_context = red_canvas.getContext('2d');
    red_context.beginPath();

    red_context.arc(10, 10, 10, 0, 2 * Math.PI, false);
    red_context.fillStyle = 'red';
    red_context.fill();
    red_context.lineWidth = 1;

    red_context.strokeStyle = 'black';
    red_context.stroke();

    var img_redCircle = new Image();
    img_redCircle.src = red_canvas.toDataURL("image/png");


    var blue_canvas = document.createElement('canvas');
    blue_canvas.width = 20;
    blue_canvas.height = 20;
    var blue_context = blue_canvas.getContext('2d');
    blue_context.beginPath();

    blue_context.arc(10, 10, 10, 0, 2 * Math.PI, false);
    blue_context.fillStyle = 'blue';
    blue_context.fill();
    blue_context.lineWidth = 1;

    blue_context.strokeStyle = 'black';
    blue_context.stroke();

    var img_blueCircle = new Image();
    img_blueCircle.src = blue_canvas.toDataURL("image/png");

    var coverageLayer = new L.GridLayer.MaskCanvas({
        opacity: 0.5,
        radius: red_canvas.width,
        useAbsoluteRadius: false,
        img_on: img_redCircle,
        img_off: img_blueCircle,
        debug: true,
        map: map
    });

    coverageLayer.setData(dataset);

    map.addLayer(coverageLayer);
    map.fitBounds(coverageLayer.bounds);

    function alpha(point, canvas) {
        if (!canvas) {
            // console.log("Here");
            return -1;
        }

        var context = canvas.getContext('2d');

        var buffer;

        if (!canvas.imgData) {
            // console.log("Create new ImageData");
            var pix = context.getImageData(0, 0, TILESIZE, TILESIZE);
            canvas.imgData = new ImageBuffer(pix);
            buffer = canvas.imgData
        } else {
            buffer = canvas.imgData;
        }

        var x = (point.x + 0.5) >> 0;
        var y = (point.y + 0.5) >> 0;

        var i = ~~(x + (y * TILESIZE));
        var location = (i << 2) + 3;

        var alpha = buffer.uint8[location]
            // var color = ImageBuffer.createColor();
            // buffer.getPixel(i,color);
            // if (color.a) return color.a;

        return (!alpha) ? -1 : alpha;
    }

    var MEM;

    function cropImage(canvas, centrePoint, WIDTH, HEIGHT, alph) {
        var context = canvas.getContext('2d');
        // w = w << 1;
        // h = h << 1;
        // var WIDTH = (w << 1);
        // var HEIGHT = (h << 1);

        w = WIDTH >> 1;
        h = HEIGHT >> 1;

        // var imgSize = (WIDTH * HEIGHT) << 2;

        // if (!MEM || MEM.byteLength < imgSize)
        //     MEM = new ArrayBuffer(imgSize);

        var minX = (centrePoint[0] - w);
        var minY = (centrePoint[1] - h);
        minX = (minX < 0) ? (minX - 0.5) >> 0 : (minX + 0.5) >> 0;
        minY = (minY < 0) ? (minY - 0.5) >> 0 : (minY + 0.5) >> 0;


        // var maxX = Math.round(centrePoint[0] + w+2*w);
        var maxX = minX + WIDTH + 1;
        // var maxY = Math.round(centrePoint[1] + h+2*h);
        var maxY = minY + HEIGHT + 1;

        if (minX < 0)
            minX = 0;

        if (minY < 0)
            minY = 0;

        if (maxX > TILESIZE)
            maxX = TILESIZE;

        if (maxY > TILESIZE)
            maxY = TILESIZE;

        // console.log(minX, minY, maxX, maxY);

        var width = maxX - minX;
        var height = maxY - minY;
        var subCanvas = document.createElement('canvas');
        subCanvas.width = width;
        subCanvas.height = height;
        var subContext = subCanvas.getContext('2d');

        if (!canvas.imgData) {
            var start = new Date().getTime();
            // var img = new Image();

            // console.log("Create new ImageData");
            var pix = context.getImageData(0, 0, TILESIZE, TILESIZE);
            canvas.imgData = new ImageBuffer(pix);
            var end = new Date().getTime();
            var time = end - start;
            console.log("Traditional way : ", end - start);
        }

        var start = new Date().getTime();
        var img = new Image();
        // for (var j = 0;j<100;++j){          

        // var sz = ((width*height) << 2) >> 0;
        // console.log("Array length ",sz);
        // var buf = new Uint8ClampedArray(MEM, 0, sz );
        var imgData = subContext.createImageData(width, height);

        var buffer = new ImageBuffer(imgData);

        var color = {};
        var data = canvas.imgData;
        for (var i = 0; i < width * height; ++i) {
            var y = (i / width) >> 0; //floor cua i/width
            var x = (i - width * y) >> 0; // 
            // x += minX;
            // y += minY;

            data.getPixelAt(x + minX, y + minY, color);
            var a = color.a;
            if (a != alph) a = 0;
            buffer.setPixelAt(x, y, color.r, color.g, color.b, a);
        }

        // imgData.data.set(buf);

        subContext.putImageData(imgData, 0, 0);
        img.src = subCanvas.toDataURL("image/png");

        // if (img.complete) {
        // context.drawImage(img, 0, 0);
        // }
        // else {
        //   img.onload = function(){
        //     context.drawImage(img, 0, 0);
        //   }
        // }
        var end = new Date().getTime();
        var time = end - start;
        // console.log("New way : ", end - start);
        // }

        return img;

    }

    var popup = L.popup();

    var i = 0;

    var lastRecentPoint;
    var lastRecentInfo;


    function getID(zoom, x, y) {
        var _x = x < 0 ? 0 : x;
        var _y = y < 0 ? 0 : y;
        var result = {};

        result.id = zoom + "_" + _x + "_" + _y;
        var canvas = coverageLayer.tiles.get(result.id).canvas;
        result.canvas = canvas;
        result.coords = L.point(_x, _y);
        result.coords.zoom = zoom;

        return result;
    }

    function getIntersectPoly(tilePoint, tileID) {
        var rtree = coverageLayer.rtreeLCTilePoly.get(tileID);
        if (rtree) {
            var result = rtree.search([tilePoint.x, tilePoint.y, tilePoint.x, tilePoint.y]);

            if (result.length > 0) {
                var polys = [];
                var topPoly, id = -1;
                for (var i = 0; i < result.length; i++) {
                    var r = result[i];
                    // console.log(result.length, "inbox", x);
                    var xmin = r[0],
                        ymin = r[1],
                        xmax = r[2],
                        ymax = r[3];
                    var xcenter = ((xmin + xmax) >> 1) | 0,
                        ycenter = ((ymin + ymax) >> 1) | 0;
                    var width = xmax - xmin,
                        height = ymax - ymin;

                    var poly = r[4];
                    poly.bb = [xmin, ymin, xmax, ymax, width, height, xcenter, ycenter];

                    if (poly.in(tilePoint)) {
                        polys.push(poly);
                        if (r[5] > id) {
                            topPoly = poly;
                            id = r[5];
                        }
                    }
                }
                polys.topPoly = topPoly;
                polys.topPolyID = id;

                return polys;
            }
        }
        return [];
    }

    function getInfo(e) {
        // calulate ID
        var currentlatlng = e.latlng;
        var currentPoint = map.project(currentlatlng);

        var x = (currentPoint.x / TILESIZE) >> 0;
        var y = (currentPoint.y / TILESIZE) >> 0;
        var zoom = map.getZoom();
        //
        var tileID = zoom + "_" + x + "_" + y;

        //get tile
        //

        //calculate Point relative to Tile
        var tileTop = x * TILESIZE;
        var tileLeft = y * TILESIZE;
        var point = L.point(tileTop, tileLeft);
        var coords = L.point(x, y);
        coords.z = zoom;
        var tilePoint = coverageLayer._tilePoint(coords, [currentlatlng.lat, currentlatlng.lng]);
        //
        tilePoint = L.point(tilePoint[0], tilePoint[1]);
        var result = {};
        var intersectPolys = getIntersectPoly(tilePoint, tileID);
        result.intersectPolys = intersectPolys;
        //calculate alpha
        //

        var tile = coverageLayer.tiles.get(tileID);
        // console.log(tilePoint);
        var alph = (tile) ? alpha(tilePoint, tile.canvas) : -1;

        //calculate points and top point.
        var pointslatlng = circleCentrePointCover(currentPoint);
        //calculate TopPoints
        // if(pointslatlng.length!=0){}
        var topPointlatlng = getTopPoint(pointslatlng);
        var topPointTile;
        var topCircleID;
        if (topPointlatlng) {
            topPointTile = coverageLayer._tilePoint(coords, [topPointlatlng[0], topPointlatlng[1]]);
            topCircleID = topPointlatlng[5];
        }

        // var topPoint = getTopPoint(points);                
        result.tileIDX = x;
        result.tileIDY = y;
        result.tileIDZoom = zoom;
        result.tileID = tileID;
        result.coords = coords;
        result.tile = tile;
        result.tilePoint = tilePoint; //current point relative with tile
        result.alpha = alph;
        result.pointslatlng = pointslatlng; //[]

        result.topPointlatlng = topPointlatlng; //[lat,lng,lat,lng,item,id] or undefined
        result.topCircleID = topCircleID; //id of top points or undefined        
        result.topPointTile = topPointTile; //top points relative with tile, [x,y,z]

        return result;
    }


    function getTileIDs(centrePoint, WIDTH, HEIGHT, coords) {
        // var TopPoint = info.topPointTile;
        // console.log("--------",info)
        var radius = coverageLayer.options.radius >> 1;
        w = WIDTH >> 1;
        h = HEIGHT >> 1;
        var minX = centrePoint[0] - w;
        var minY = centrePoint[1] - h;
        var maxX = centrePoint[0] + w;
        var maxY = centrePoint[1] + h;

        // console.log(minX,minY,maxX,maxY);
        var tileIDX = coords.x;
        var tileIDY = coords.y;
        var zoom = coords.z;

        var tileIDs = [getID(zoom, tileIDX, tileIDY)];

        if (minX < 0) {
            tileIDs.push(getID(zoom, tileIDX - 1, tileIDY)) //8
            if (minY < 0) { //1,2
                tileIDs.push(getID(zoom, tileIDX - 1, tileIDY - 1));
                tileIDs.push(getID(zoom, tileIDX, tileIDY - 1));
            }
            if (maxY > TILESIZE) { //7,6                
                tileIDs.push(getID(zoom, tileIDX - 1, tileIDY + 1));
                tileIDs.push(getID(zoom, tileIDX, tileIDY + 1));
            }
        }
        if (maxX > TILESIZE) {
            tileIDs.push(getID(zoom, tileIDX + 1, tileIDY)); //4            
            if (minY < 0) { //2,3
                tileIDs.push(getID(zoom, tileIDX + 1, tileIDY - 1));
                tileIDs.push(getID(zoom, tileIDX, tileIDY - 1));
            }
            if (maxY > TILESIZE) { //6,5
                tileIDs.push(getID(zoom, tileIDX, tileIDY + 1));
                tileIDs.push(getID(zoom, tileIDX + 1, tileIDY + 1));
            }
        }
        if (minX > 0 && maxX < TILESIZE) {
            if (minY < 0) { //2
                tileIDs.push(getID(zoom, tileIDX, tileIDY - 1));
            }
            if (maxY > TILESIZE) { //6
                tileIDs.push(getID(zoom, tileIDX, tileIDY + 1));
            }
        }

        return tileIDs;
    }


    function draw(topPointlatlng, WIDTH, HEIGHT, coords, img) {
        var w = WIDTH >> 1;
        var h = HEIGHT >> 1;

        var lat = topPointlatlng[0];
        var lng = topPointlatlng[1];
        var topPts = [lat, lng];

        // var WIDTH,HEIGHT;
        // WIDTH = HEIGHT = coverageLayer.options.radius;

        var topPointTile = coverageLayer._tilePoint(coords, [topPointlatlng[0], topPointlatlng[1]]);

        var tileIDs = getTileIDs(topPointTile, WIDTH, HEIGHT, coords);

        for (var i = 0; i < tileIDs.length; i++) {
            var tile = tileIDs[i];
            var canvas = tile.canvas;
            var coords = tile.coords;
            var tilePoint = coverageLayer._tilePoint(coords, [topPointlatlng[0], topPointlatlng[1]]);
            var ctx = canvas.getContext('2d');
            // img.onload= function(){
            ctx.drawImage(img, tilePoint[0] - w, tilePoint[1] - h);
            // }
            // ctx.drawImage(img, 0, 0);
        }
    }

    function redraw(imgs) {
        for (var i = 0; i < imgs.length; i++) {
            var image = imgs[i];
            image.draw();
        }
    }

    //crop images at Position
    function cropImgBoxs(centreLatLng, WIDTH, HEIGHT, coords) {
        var topPointTile = coverageLayer._tilePoint(coords, [centreLatLng[0], centreLatLng[1]]);

        var w = WIDTH >> 1; //  mean  w/=2
        var h = HEIGHT >> 1; //  mean  w/=2        

        var tileIDs = getTileIDs(topPointTile, WIDTH, HEIGHT, coords);

        var result = [];
        // if (globalResults.length > 0)
        //     console.log("Heep heep hurayyyyyyyyy ", globalResults.length);
        var lat = centreLatLng[0];
        var lng = centreLatLng[1];
        var topPts = [lat, lng];

        for (var i = 0; i < tileIDs.length; i++) {
            var tile = tileIDs[i];
            var canvas = tile.canvas;
            var coords = tile.coords;
            var tilePoint = coverageLayer._tilePoint(coords, topPts);
            var img = cropImage(canvas, tilePoint, WIDTH, HEIGHT, 255);

            var o = {};
            o.canvas = canvas;
            o.tilePoint = tilePoint;
            o.img = img;
            o.ctx = canvas.getContext('2d');
            // globalResults.push(o);

            o.draw = function() {

                // var WIDTH = (w << 1);
                // var HEIGHT = (h << 1);

                var minX = (this.tilePoint[0] - w);
                var minY = (this.tilePoint[1] - h);
                minX = (minX < 0) ? (minX - 0.5) >> 0 : (minX + 0.5) >> 0;
                minY = (minY < 0) ? (minY - 0.5) >> 0 : (minY + 0.5) >> 0;


                // var maxX = Math.round(TopPoint[0] + w+2*w);
                var maxX = minX + WIDTH;
                // var maxY = Math.round(TopPoint[1] + h+2*h);
                var maxY = minY + HEIGHT;

                if (minX < 0)
                    minX = 0;

                if (minY < 0)
                    minY = 0;

                if (maxX > TILESIZE)
                    maxX = TILESIZE;

                if (maxY > TILESIZE)
                    maxY = TILESIZE;

                var self = this;

                if (self.img.complete) {
                    self.ctx.drawImage(self.img, minX, minY);
                } else {
                    self.img.onload = function() {
                        self.ctx.drawImage(self.img, minX, minY);
                    }
                }

            }

            result.push(o);
        }

        return result;
    }

    var count = 0;



    function onMouseMove(e) {
        var info = getInfo(e);
        var radius = coverageLayer.options.radius >> 1;

        if (info.intersectPolys && info.intersectPolys.length > 0) {

            var poly = info.intersectPolys.topPoly;
            var canvas = info.tile.canvas;
            var context = canvas.getContext('2d');

            var polyPos = poly.latLng;
            var polyWith = poly.bb[4];
            var polyHeight = poly.bb[5];
            var polyImg = poly.canvas2;

            var insideTheSamePoly = function(info, lastRecentInfo) {
                return lastRecentInfo && lastRecentInfo.intersectPolys && info.intersectPolys && (lastRecentInfo.intersectPolys.topPolyID == info.intersectPolys.topPolyID);
            }

            if (insideTheSamePoly(info, lastRecentInfo)) {
                return;
            }

            if (lastRecentInfo && lastRecentInfo.imgsPolyCropped) {
                redraw(lastRecentInfo.imgsPolyCropped);
            }


            var imgsPolyCropped = cropImgBoxs([polyPos.lat, polyPos.lng], polyWith, polyHeight, info.coords);
            info.imgsPolyCropped = imgsPolyCropped;

            draw([polyPos.lat, polyPos.lng], polyWith, polyHeight, info.coords, polyImg);
            lastRecentInfo = info;


        } else {
            if (lastRecentInfo && lastRecentInfo.imgsPolyCropped) {
                redraw(lastRecentInfo.imgsPolyCropped);
                lastRecentInfo = null;
            }
        }

        // isInsideObject = false;
        // if (info.alpha == 255) {
        //     $('.leaflet-container').css('cursor', 'pointer');
        //     isInsideObject = true;

        //     if (info.topCircleID && lastRecentInfo &&
        //         lastRecentInfo.topCircleID && info.topCircleID == lastRecentInfo.topCircleID) {
        //         return;
        //     }

        //     if (lastRecentInfo) {
        //         var lastTopPointTile = lastRecentInfo.topPointTile;
        //         if (lastTopPointTile) {
        //             // console.log("Redraw ",count);
        //             redraw(lastRecentInfo.img);
        //         }
        //     }

        //     var topPointTile = info.topPointTile;

        //     if (topPointTile) {
        //         var WIDTH, HEIGHT;
        //         WIDTH = HEIGHT = info.topPointlatlng.radius;
        //         var imgs = cropImgBoxs(info.topPointlatlng, WIDTH, HEIGHT, info.coords);
        //         info.img = imgs;
        //         // console.log("Draw ",++count);
        //         var WIDTH, HEIGHT;
        //         WIDTH = HEIGHT = coverageLayer.options.radius;
        //         console.log(info.topPointlatlng);
        //         draw(info.topPointlatlng, WIDTH, HEIGHT, info.coords, img_blueCircle);
        //     }

        //     lastRecentInfo = info;
        // } else {
        //     if (lastRecentInfo) {
        //         // console.log(lastRecentInfo.img);                         
        //         var topPointTileRecent = lastRecentInfo.topPointTile;
        //         if (topPointTileRecent) {
        //             // console.log("Redraw ",count);
        //             redraw(lastRecentInfo.img);
        //         }
        //         lastRecentInfo = undefined;
        //     }
        //     $('.leaflet-container').css('cursor', 'auto');
        // }
        // console.log("Done mousemove");
    }

    function squaredistance(point1, point2) {
        return (point1.x - point2.x) * (point1.x - point2.x) + (point1.y - point2.y) * (point1.y - point2.y);
    }

    function circleCentrePointCover(currentPositionPoint) {
        var rtree = coverageLayer._rtree;

        var topLeft = currentPositionPoint.subtract(L.point(RADIUS, RADIUS));
        var nw = map.unproject(topLeft);
        var bottemRight = currentPositionPoint.add(L.point(RADIUS, RADIUS));
        var se = map.unproject(bottemRight);

        var box = [se.lat, nw.lng, nw.lat, se.lng];

        var result = rtree.search(box);

        var a = [];
        var radius = coverageLayer.options.radius / 2;
        for (var i = 0; i < result.length; i++) {
            var r = result[i];
            var latLng = L.latLng(r[0], r[1]);
            var point = map.project(latLng);

            if (squaredistance(currentPositionPoint, point) <= radius * radius) {
                a.push(r);
            }
        }
        return a;
    }

    function getTopPoint(Points) {
        var maxId = -1;
        var TopPoint;
        for (var i = 0; i < Points.length; i++) {
            var p = Points[i];
            if (p[5] > maxId) {
                maxId = p[5];
                TopPoint = p;
            }
        }

        return TopPoint;
    }

    function onMouseClick(e) {
        var currentPositionPoint = map.project(e.latlng);
        var Points = circleCentrePointCover(currentPositionPoint);
        if (!isInsideObject) {
            alert("Not inside object");
            return;
        }
        var TopPoint = getTopPoint(Points);

        var latLng = new L.LatLng(TopPoint[0], TopPoint[1]);
        var message = latLng.toString();
        popup.setLatLng(latLng).setContent(message).openOn(map);
    }

    $('.leaflet-container').css('cursor', 'auto');

    map.on('mousemove', onMouseMove);

    map.on('click', onMouseClick);
});
