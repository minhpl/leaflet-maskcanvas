$(function() {
  //============
  // Base Layers

  var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  var osmAttrib='Map data © <a href="http://osm.org/copyright">OpenStreetMap</a> contributors';
  var osm = new L.TileLayer(osmUrl, {
    attribution: osmAttrib
  });


  var red_canvas = document.createElement('canvas');
  const RADIUS = 10;
  const NUM_POLYGON = 50;
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

  red_context.strokeStyle = '#003300';
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

  blue_context.strokeStyle = 'blue';
  blue_context.stroke();

  var img_blueCircle = new Image(); 
  img_blueCircle.src = blue_canvas.toDataURL("image/png");


  var map = new L.Map('map', {
    center: new L.LatLng(21.05223312, 105.72597225),
    zoom: 10,
    layers: [osm]
  });

  L.control.scale().addTo(map);

  // var rtree = new rbush(32);
  // var data = [];
  // for (var i =0;i<dataset.length;++i){
  //   var item = dataset[i];
  //   var x = item[0];
  //   var y = item[1];
  //   data.push([x,y,x,y,item]);
  // }

  // rtree.load(data);  

  //================
  // Set up overlays

  var coverageLayer = new L.GridLayer.MaskCanvas({
    opacity: 0.5,
    radius: red_canvas.width,
    useAbsoluteRadius: false,
    // debug:false,
    img_on : img_redCircle,
    img_off : img_blueCircle
  });

  coverageLayer.setData(dataset);

  coverageLayer.on("tileload",function(evt){
    // console.log("Tile ",evt.coords);
    var coords = evt.coords;    
  });



  coverageLayer.setData(dataset);

  map.addLayer(coverageLayer);
  map.fitBounds(coverageLayer.bounds);



  var popup = L.popup();

    function onMouseMove(e) {
      console.log(e);

      var currentPositionPoint = map.project(e.latlng);
      var tileSize = 256;
      console.log(tileSize);

      var x = Math.floor(currentPositionPoint.x/tileSize);
      var y = Math.floor(currentPositionPoint.y/tileSize);
      var zoom = map.getZoom();
      var id = zoom+"_"+x+"_"+y;

      console.log("titles: ",coverageLayer.tiles.get(id));

      console.log("x,y = ",x,y);
      console.log(map.getZoom());
      // console.log()
      // var currentPositonLatLng = e.latlng;
      // // console.
      // var currentPositionPoint = map.project(currentPositonLatLng,map.zoom);

      // popup.setLatLng(e.latlng).setContent("You clicked the map at " +currentPositionPoint.toString()).openOn(map);
    }

     map.on('mousemove', onMouseMove);


});