var dataPath = "./data.csv";

var svgWidth = 800;
var svgHeight = 550;

var margin = {
    top: 50,
    right: 50,
    bottom: 100,
    left: 100
};

var height = svgHeight - margin.top - margin.bottom;
var width = svgWidth - margin.left - margin.right;

var circleColor = 'rgba(40,160,230,0.8)';
var circleColorHover = 'rgba(20,140,240,0.95)';
var textColor = "rgb(240,240,240)";
var labelColorActive = "black";
var labelColorInactive = "grey";
var labelColorHover = "black";
var circleRadius = 14;

var xBuffer = 0.05;
var yBuffer = 0.08;

var graphDuration = 500;

var $svg = d3.select(".chart")
    .append("svg")
    .attr("height", svgHeight)
    .attr("width", svgWidth);

var $chartGroup = $svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

var abbr = [];
d3.csv(dataPath, (error, response)=>{
    if(error) throw error;
    
    var keyList = Object.keys(response[0]);
    var xChoices = ["hsCompletion", "poverty", "disabilityEmployment", "whiteCollar"];
    var yChoices = ["goodHealth", "drExpensive", "obesity"];

    var xLabels = ["% of Adults Who Completed High School","% of Residents in Poverty",
        "% of Disabled Residents Who are Employed", "% of Residents in White-Collar Jobs"];
    var yLabels = ["% of Residents in Good Health", "% of Residents Who Could Not See a Doctor Due to Cost",
        "% of Residents Who are Obese"]
    
    var xTags = ["High School Completion", "Poverty", "Disability Employment", "White-Collar"];
    var yTags = ["Good Health", "Doctor too Expensive", "Obesity"]

    for (var i=0;i<keyList.length;i++){
        let key = keyList[i];
        
        eval(`var ${key} = response.map(x=>x.${key})`);
    }
    var chooseX = 0;
    var chooseY = 0;

    var xData = eval(xChoices[chooseX]).map(d=>+d);
    var yData = eval(yChoices[chooseY]).map(d=>+d);

    var xScale = d3.scaleLinear()
        .domain(buffer(d3.extent(xData),xBuffer))
        .range([0, width]);

    var yScale = d3.scaleLinear()
        .domain(buffer(d3.extent(yData),yBuffer))
        .range([height, 0]);

    var xyData = xData.map((d,i)=>[d,yData[i],abbr[i]]);

    var xAxis = d3.axisBottom(xScale)
    var yAxis = d3.axisLeft(yScale)

    $chartGroup.append("g")
        .attr("id","xAxis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);
    
    $chartGroup.append("g")
        .attr("id","yAxis")
        .call(yAxis);

    var $dataPoints = $chartGroup.selectAll(".point")
        .data(xyData)
        .enter()
        .append("g")
        .attr("class","point")
        .attr("id", d=>d[2])
        .attr("transform", d=>`translate(${xScale(d[0])},${yScale(d[1])})`);

    $dataPoints.append("circle")
        .attr("cx",0)
        .attr("cy",0)
        .attr("r", circleRadius)
        .attr("fill", circleColor)
        .attr("stroke","none");
        
    $dataPoints.append("text")
        .attr("class","pointText")
        .attr("fill",textColor)
        // .attr("style","font-size:14px; text-anchor:middle; font-family:sans-serif; font-weight:bold")
        .attr("dy","0.35em")
        .text(d=>d[2]);

    $chartGroup.append("g")
        .attr("id","xLabels")
        .attr("transform",`translate(${width/2},${height})`)
        .attr("text-anchor","middle")
        .selectAll(".xLabel")
        .data(xLabels)
        .enter()
        .append("text")
        .attr("class", "xLabel axisText")
        .attr("id", (d,i)=>xChoices[i])
        .attr("dy",(d,i)=>`${i*1.2+2.2}em`)
        .classed("activeAxis", (d,i)=>i==chooseX)
        .attr("fill", (d,i)=>(i==chooseX?labelColorActive:labelColorInactive))
        .style("font-weight", (d,i)=>(i==chooseX?"bold":""))
        .text(d=>d)
    
    $chartGroup.append("g")
        .attr("id","yLabels")
        .attr("transform",`translate(0,${height/2}) rotate(-90)`)
        .attr("text-anchor","middle")
        .selectAll(".yLabel")
        .data(yLabels)
        .enter()
        .append("text")
        .attr("class", "yLabel axisText")
        .attr("id", (d,i)=>yChoices[i])
        .attr("dy",(d,i)=>`-${i*1.2+2.2}em`)
        .classed("activeAxis", (d,i)=>i==chooseY)
        .attr("fill", (d,i)=>(i==chooseY?labelColorActive:labelColorInactive))
        .style("font-weight", (d,i)=>(i==chooseY?"bold":""))
        .text(d=>d)
    
    var toolTip = d3.tip()
        .attr("class","tooltip")
        .offset([-10,30])
        .html((d,i)=>{
            return `<strong>${state[i]}</strong>
                <br>${xTags[chooseX]}: ${d[0].toFixed(1)} %
                <br>${yTags[chooseY]}: ${d[1].toFixed(1)} %`
            })
      
    // toolTip($dataPoints);

    $dataPoints.call(toolTip)
        .on("mouseover", function (d,i) {
            toolTip.show(d,i);
            d3.select(this).select("circle")
                .transition()
                .duration(200)
                .attr("fill", circleColorHover)
        })
        .on("mouseout", function () {
            toolTip.hide();
            d3.select(this).select("circle")
                .transition()
                .duration(200)
                .attr("fill", circleColor)
            })

    $chartGroup.selectAll(".xLabel")
        .on("click", handleDataSelect)
        .on("mouseover", textHover)
        .on("mouseout", textOut)
    
    $chartGroup.selectAll(".yLabel")
        .on("click", handleDataSelect)
        .on("mouseover", textHover)
        .on("mouseout", textOut)

    function handleDataSelect(){
        let label = d3.select(this);

        if (label.classed("activeAxis")){return}
        
        let axisID = label.attr("id");

        if (label.classed("xLabel")){
            chooseX = xChoices.indexOf(axisID);
            d3.selectAll(".xLabel")
                .classed("activeAxis", (d,i)=>i==chooseX)
                .attr("fill", (d,i)=>(i==chooseX?labelColorActive:labelColorInactive))
                .style("font-weight", (d,i)=>(i==chooseX?"bold":""))
            // console.log(chooseX);
            xData = eval(xChoices[chooseX]).map(d=>+d);

            xScale = d3.scaleLinear()
                .domain(buffer(d3.extent(xData),xBuffer))
                .range([0, width]);

            xAxis = d3.axisBottom(xScale);
            d3.select("#xAxis").transition().duration(graphDuration).call(xAxis);
        }
        if (label.classed("yLabel")){
            chooseY = yChoices.indexOf(axisID);
            d3.selectAll(".yLabel")
                .classed("activeAxis", (d,i)=>i==chooseY)
                .attr("fill", (d,i)=>(i==chooseY?labelColorActive:labelColorInactive))
                .style("font-weight", (d,i)=>(i==chooseY?"bold":""))

            yData = eval(yChoices[chooseY]).map(d=>+d);

            yScale = d3.scaleLinear()
                .domain(buffer(d3.extent(yData),yBuffer))
                .range([height, 0]);

            yAxis = d3.axisLeft(yScale);
            d3.select("#yAxis").transition().duration(graphDuration).call(yAxis);
        }

        xyData = xData.map((d,i)=>[d,yData[i],abbr[i]]);

        $dataPoints.data(xyData)
            .transition()
            .duration(graphDuration)
            .attr("transform",d=>`translate(${xScale(d[0])},${yScale(d[1])})`)
        
        label.attr("fill", labelColorInactive)
            .transition()
            .duration(200)
            .attr("fill", labelColorActive)
    }

    function textHover(){
        let label = d3.select(this);
        label.transition()
            .duration(200)
            .attr("fill",labelColorHover);
    }
    function textOut(){
        let label = d3.select(this);
        label.transition()
            .duration(200)
            .attr("fill", label.classed("activeAxis")?labelColorActive:labelColorInactive);
    }
    
})

function buffer(domainArray, ratio=0.05){
    var diff = domainArray[1]-domainArray[0];
    return [domainArray[0]-diff*ratio, domainArray[1]+diff*ratio]
}