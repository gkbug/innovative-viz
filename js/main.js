var svg, scale;
var size = 300, offset = Math.PI;
var range =  0.8 * size / 2;
var center = {x: size / 2,y: size / 2};
var start, end;
var angle = (2*Math.PI)/3
var margin = 50;

// This function is called once the HTML page is fully loaded by the browser
document.addEventListener('DOMContentLoaded', function () {

	svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")

    scale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, range])
        .nice();

    // This will load the CSV files and store them into an array.
    Promise.all([d3.csv('data/data_1.csv')]).then(function (values) {

        // Filter only those planets which are within 50 Light years
        var data = values[0].filter((d) => {return d['distance'] != "" && d['distance']<=50})
        

        var dataset = [];
        // Group data by discovery_year
        dataset = data.reduce((g, d) => {
            const year = d['discovery_year']
            if (!g[year]) {
                g[year] = [];
            }
            g[year].push(d);
            return g;
        }, {});
        dataset = Object.keys(dataset).map((year) => {
            return { year,value: dataset[year]};
        });

        dataset.forEach(d => {d.value = generateData(d.value)})

        // Add a mock image for user understanding
        addMockImage()
        
        // Add listener for the year input
        start = document.getElementById("startYear");
        end = document.getElementById("endYear");

        start.oninput = function() {drawRadarChart(dataset); }
        end.oninput = function() {drawRadarChart(dataset);}

        // Draw the radar charts
        drawRadarChart(dataset);
    });
});

// Add a mock marker for viewer explanantion
function addMockImage() {
    var point, points;
    mockData = [generatePoint(70, 0), generatePoint(30, 2*Math.PI/3), generatePoint(45, 4*Math.PI/3)]
    var header = d3.select(".header")
        .append("svg").attr("width", 300).attr("height", 300)
        .style("display", "block")
        .style("margin-left", "auto")
        .style("margin-right", "auto")

        for (let i = 1; i <= 4; i++) {
            const len = (i/4)*range;
            points = [];
            for (let i = 0; i< 3; i++) {
                points.push(generatePoint(len,i*angle));
            }
            drawPath([...points, points[0]], header.append( "g" ).attr("class", "lvs"));
        }
        
        for (let i = 1; i <= 3; i++) {
            point = generatePoint(range,i*angle);
            drawPath([center,point], header.append("g").attr("class", "grids"));
        }

        var lines = header.append( "g" ).attr("class", "ticks");
        point = generatePoint(range, 0);
        drawPath([center, point], lines);

        var ticks = [];
        for ( let i = 0; i <= 4; i++ ) {
            ticks.push(25 * i);
        }

        ticks.forEach((d,i) =>{
            var r = (i / 4) * range;
            point = generatePoint(r, 0);
            points =[point, {...point,x: point.x - 10}];
            drawPath(points, lines);
            
            header.append("g").attr("class", "ticks").append( "text" )
                .attr("x", point.x - 22)
                .attr("y", point.y + 5)
                .html(d)
                .style("text-anchor", "middle")
                .attr("fill", "darkgrey")
                .style("font-size", "12px")
                .style("font-family", "sans-serif");
        } );
        
        var g = header.append("g").attr( "class", "group" )
        drawPath([...mockData, mockData[0]], g);
        drawPoints(mockData, g);

        var labels = ["Radius", "Mass", "Distance"]
        for ( let i = 0; i < 3; i++ ) {
            var label = labels[i];
            var point = generatePoint(0.9 * ( size / 2 ), i*angle);

            header.append( "g" ).attr( "class", "labels" ).append( "text" )
            .attr("x", point.x)
            .attr("y", point.y)
            .html(label)
            .style("text-anchor", "middle")
            .attr("fill", "darkgrey")
            .style("font-size", "12px")
            .style("font-family", "sans-serif")
        }
}

// Plot a point at given length and angle
function generatePoint(length,angle){
    return {
        x: center.x + (length * Math.sin( Math.PI - angle)),
        y: center.y + (length * Math.cos( Math.PI - angle))
    };
}

// Draw lines to connect the points and fill the space
function drawPath(points, parent) {
    var lines = d3.line().x(d => d.x).y(d => d.y);

    return parent.append("path").attr( "d", lines(points));
};

// Draws points at the given locations
function drawPoints(points, parent) {
        return parent.append( "g" )
        .attr( "class", "pointer" )
        .selectAll( "circle" )
        .data( points )
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r",2)
}

// Draws the custom glypf radar chart
function drawRadarChart(dataset) {
    
    svg.selectAll("*").remove()

    var offsetx=0, offsety = 150;
    
    // Tool tip
    var tip = d3.select("#my_dataviz").append("div")
    .attr("class", "tooltip")
    .style('padding', '10px')
    .style("opacity", 0);

    svg.append("text")
        .text("Year")
        .attr("x", 50)
        .attr("y", 50)
        .style("font-weight", "bold")

    svg.append("text")
        .text("Exo-planets")
        .attr("x", 450)
        .attr("y", 50)
        .style("text-anchor", "middle")
        .style("font-weight", "bold")

	dataset.forEach(data => {
        if(parseInt(data.year) > end.value || parseInt(data.year)<start.value) {return;}

        offsetx = 0;
        var count = 0;

        svg.append("text")
        .text(data.year)
        .attr("x", 50)
        .attr("y", offsety+50)

        data.value.forEach(d => {
            var points = []

            d.values.forEach((p, i)=> {
                points.push(generatePoint(scale(p.value), i * angle));
            });
            
            if(count !=0 && count%5==0) {
                offsetx = 150;
                offsety+=150;
            } else {
                offsetx+=150
            }
            const group = svg.append( "g" )
            
            group.attr( "class", "group" )
                .attr("transform","translate(" + offsetx + "," + (offsety-100) + ")")

            drawPath([...points, points[0]], group);

            group.on("mouseover", function (event) {
                    tip.style("opacity", 1.0)
                    tip.html("<b>"+d.name+"</b>" + "<br/>" +"Radius: "+ d.values[0].real_value+" * Radius of Earth"+"<br/>" +"Mass: "+ d.values[1].real_value+" * Mass of Earth"+"<br/>" +"Distance: "+ d.values[2].real_value+" Light years from Earth").style("left", (event.pageX) + "px").style("top", (event.pageY - 28) + "px");
                })
                .on('mouseout', function (_, _) {
                    tip.style("opacity", 0)
                })
                drawPoints( points, group);
                count++; 
        })
        offsety+=150
    })
    svg.attr("height", offsety+100)
}

// Wrangles the dataset to generate usable data
function generateData(data) {
    var res =[]

	var radius = data.map((d)=> {
		if(d['radius_wrt']=='Jupiter') {
		return 11.2*d['radius_multiplier'] 
	} else{
		return d['radius_multiplier']
	}
	})
	var maxRad = d3.max(radius)
	radius = radius.map((d)=>{
		return Math.ceil(d/maxRad)*50
	})

	var mass = data.map((d)=> {
		if(d['mass_wrt']=='Jupiter') {
		return 318*d['mass_multiplier'] 
	} else{
		return d['mass_multiplier']
	}
	})
	var maxMass = d3.max(mass)
	mass = mass.map((d)=>{
		return Math.ceil(d/maxMass)*50
	})

	var distance = data.map((d)=> {return d['distance']})

	for(let i=0; i<data.length; i++) {
		var dataset=[], dt = [];
		dataset.push({name: "Radius",value: radius[i], real_value:data[i].radius_multiplier});
        dataset.push({name: "Mass",value: mass[i], real_value:data[i].mass_multiplier});
        dataset.push({name: "Distance",value: distance[i], real_value:data[i].distance});
		dt['values'] = dataset
        dt['name'] = data[i].name
        res.push(dt)
	}
	return res
}
