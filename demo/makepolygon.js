function envelopeVPoly(poly) {
    var minX = 1000000,
        minY = 1000000,
        maxX = -10000,
        maxY = -10000;
    var x, y;

    for (var i = 0; i < poly.length; i++) {
        var p = poly[i];
        if (minX > p.x) minX = p.x;
        if (minY > p.y) minY = p.y;
        if (maxX < p.x) maxX = p.x;
        if (maxY < p.y) maxY = p.y;
    }

    xCentre = Math.round((minX + maxX) / 2);
    yCentre = Math.round((minY + maxY) / 2);
    var width = maxX - minX;
    var height = maxY - minY;

    return [minX, minY, maxX, maxY, width, height, xCentre, yCentre];
}

function makeVPolygon(width, height, latLng) {
    var random = Math.floor(Math.random() * 2);
    var num = random + 3; //3 hoac 4 diem
    var scale = 10;

    var polygon = [];

    var first = {
        x: Math.floor(Math.random() * width),
        y: Math.floor(Math.random() * height)
    };

    var second = {
        x: first.x + Math.floor(Math.random() * 5 * scale) + 4 * scale,
        y: first.y + Math.floor(Math.random() * 5 * scale) + 6 * scale
    };

    var third = {
        x: first.x - Math.floor(Math.random() * 5 * scale) - 5 * scale,
        y: first.y + Math.floor(Math.random() * 5 * scale) + 4 * scale
    };

    if (num == 4) {
        var forth = {
            x: third.x + Math.floor(Math.random() * 5 * scale) + 6 * scale,
            y: third.y + Math.floor(Math.random() * 5 * scale) + 5 * scale,
        }

        polygon.push(forth);
    }

    polygon.push(second);
    polygon.push(first);
    polygon.push(third);

    //calculate envelope
    bb = envelopeVPoly(polygon);
    polygon.bb = bb;
    polygon.latLng = latLng;
    polygon.canvas = getCanvas(polygon, 'rgba(222, 197, 11, 0.5)');
    polygon.canvas2 = getCanvas(polygon, 'silver');

    polygon.in = function(point)
    {           
        var bb = this.bb;
        var x = point.x - bb[0];
        var y = point.y - bb[1];
        var w = bb[4];
        var h = bb[5];
        var location = (y*w+x)*4;

        // console.log("bb",bb[0],bb[1],bb[2],bb[3]);
        // console.log(x,y);

        var context = polygon.canvas.getContext('2d');
        pix = context.getImageData(0, 0, w, h).data;


        if(pix[location+3] && pix[location+3]>0 ) 
            return true;
        return false;
    }

    polygon.draw = function(ctx)
    {
        var bb = this.bb;
        ctx.drawImage(this.canvas2,bb[0],bb[1]);
    }    

    
    return polygon;
}


function getCanvas(poly, color) {
    var bb = poly.bb;
    var width = bb[4];
    var height = bb[5];
    var minX = bb[0];
    var minY = bb[1];

    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.translate(-minX, -minY);

    ctx.fillStyle = color;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;      

    ctx.beginPath();

    var p0 = poly[0];
    ctx.moveTo(Math.round(p0.x), Math.round(p0.y));

    for (var i = 1; i < poly.length; i++) {
        var p = poly[i];
        ctx.lineTo(Math.round(p.x), Math.round(p.y));
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    return canvas;
}




function randomVPolygons(width, height, num) {
    var polys = []
    for (var i = 0; i < num; i++) {
        var p = makeVPolygon(width, height);
        // console.log("p",p,p.length);
        polys.push(p);
    }
    return polys;
}


function drawPolygon(context) {
    context.beginPath();
    context.moveTo(170, 80);
    context.bezierCurveTo(130, 100, 130, 150, 230, 150);
    context.bezierCurveTo(250, 180, 320, 180, 340, 150);
    context.bezierCurveTo(420, 150, 420, 120, 390, 100);
    context.bezierCurveTo(430, 40, 370, 30, 340, 50);
    context.bezierCurveTo(320, 5, 250, 20, 250, 50);
    context.bezierCurveTo(200, 5, 150, 20, 170, 80);

    // complete custom shape
    context.closePath();
    context.lineWidth = 5;
    context.fillStyle = '#8ED6FF';
    context.fill();
    context.strokeStyle = 'blue';
    context.stroke();
}
