import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect, useMemo, useRef, useContext, createContext, useCallback, createRef } from 'react';
import { fabric } from "fabric";
import { analytics } from 'firebase-functions/v1';
import { Line } from 'fabric/fabric-impl';
import { NextUIProvider } from '@nextui-org/react';
import { Navbar, Button, Link, Text, Card, Radio } from "@nextui-org/react";
import { render } from 'react-dom';
import { stringify } from 'querystring';


function App(this: any) {
  var canvas: fabric.Canvas;
  var line: any;
  var isDown: any;
  var objectList: Line[] = []
  var grammarList: Set<string> = new Set<string>();
  var checkSet: Set<string> = new Set<string>();
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const [objects, setObjects] = useState<Line[]>([]);
  const [variant, setVariant] = React.useState("static");
  const variants = ["static", "floating", "sticky"];
  const [grammarObjs, setGrammarObjs] = useState<string[]>([]);


  function componentDidMount() {
    updateWindowDimensions();
    window.addEventListener('resize', updateWindowDimensions);
  }
  
  function componentWillUnmount() {
    window.removeEventListener('resize', updateWindowDimensions);
  }
  
  function updateWindowDimensions() {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  }


  useEffect(() => {
    canvas = new fabric.Canvas('my-canvas', { selection: false, height: height - 76, width: 800, backgroundColor: 'gray'});
    canvas.on('mouse:down', function(o: any){
      isDown = true;
      var pointer = canvas.getPointer(o.e);
      var points = [ pointer.x, pointer.y, pointer.x, pointer.y ];
      line = new fabric.Line(points, {
        strokeWidth: 5,
        fill: 'black',
        stroke: 'black',
        originX: 'center',
        originY: 'center'
      });
      
      canvas.add(line);
      // setGrammarObjs(Array.from(grammarList));
    });
    
    canvas.on('mouse:move', function(o: any){
      if (!isDown) return;
      var pointer = canvas.getPointer(o.e);
      line.set({ x2: pointer.x, y2: pointer.y });
      canvas.renderAll();
    });
    
    canvas.on('mouse:up', function(o: any){
      isDown = false;
      objectList = [...objectList, line]
      let temp2 = objectList;
      console.log(objectList)
      for(let i = 0; i < objectList.length-1; i++) {
        for(let j = i + 1; j < objectList.length; j++) {
          console.log(i,j);
          let obj1: any = temp2[i]
          let obj2: any= temp2[j]
          if (!checkSet.has(i.toString() + ',' + j.toString())) {
            checkSet.add(i.toString() + ',' + j.toString());
            console.log(obj1, obj2);
            let intersect = intersection({x: obj1.x1, y: obj1.y1}, {x: obj1.x2, y: obj1.y2}, {x: obj2.x1, y: obj2.y1}, {x: obj2.x2, y: obj2.y2})
            console.log(intersect);
            if (intersect !== undefined) {
              var segment_endpoints = intersect !== undefined && ((Math.abs(obj1.x1 - intersect.x) < 15 && Math.abs(obj1.y1 - intersect.y) < 15) || (Math.abs(obj1.x2 - intersect.x) < 15 && Math.abs(obj1.y2 - intersect.y) < 15) || (Math.abs(obj2.x1 - intersect.x) < 15 && Math.abs(obj2.y1 - intersect.y) < 15) || (Math.abs(obj2.x2 - intersect.x) < 15 && Math.abs(obj2.y2 - intersect.y) < 15));
              var ortho = checkOrtho(obj1.x1 || 0, obj1.y1 || 0, obj1.x2 || 0, obj1.y2 || 0, obj2.x1 || 0, obj2.y1 || 0, obj2.x2 || 0, obj2.y2 || 0, 0.2);
              var not_ortho = checkNotOrtho(obj1.x1 || 0, obj1.y1 || 0, obj1.x2 || 0, obj1.y2 || 0, obj2.x1 || 0, obj2.y1 || 0, obj2.x2 || 0, obj2.y2 || 0, 0.7);
              var l_shape = intersect !== undefined && ((Math.abs(obj1.x1 - intersect.x) < 15 && Math.abs(obj1.y1 - intersect.y) < 15 && Math.abs(obj2.x1 - intersect.x) < 15 && Math.abs(obj2.y1 - intersect.y) < 15) || (Math.abs(obj1.x1 - intersect.x) < 15 && Math.abs(obj1.y1 - intersect.y) < 15 && (Math.abs(obj2.x2 - intersect.x) < 15 && Math.abs(obj2.y2 - intersect.y) < 15)) || (Math.abs(obj1.x2 - intersect.x) < 15 && Math.abs(obj1.y2 - intersect.y) < 15 && Math.abs(obj2.x1 - intersect.x) < 15 && Math.abs(obj2.y1 - intersect.y) < 15) || (Math.abs(obj1.x2 - intersect.x) < 15 && Math.abs(obj1.y2 - intersect.y) < 15 && Math.abs(obj2.x2 - intersect.x) < 15 && Math.abs(obj2.y2 - intersect.y) < 15));
              console.log(l_shape)
              if (ortho && segment_endpoints && !l_shape) {
                grammarList.add('4a');
                grammarList.add('4b');
              }
              if (not_ortho || !ortho) {
                grammarList.add('9');
                grammarList.add('13');
              }
              if (ortho && l_shape && segment_endpoints) {
                grammarList.add('1');
                grammarList.add('3');
                grammarList.add('6');
              }
              if (!ortho && l_shape) {
                grammarList.add('11')
              }
              if (ortho && !segment_endpoints && !l_shape) {
                grammarList.add('8')
              }
            } else {
              grammarList.add('2');
              grammarList.add('12');
              grammarList.add('7');
            }
          }
        }
      }
      console.log(grammarList);
    });
  })


  // useEffect(() => {
  //   let temp2 = objectList;
  //   console.log(objectList)
  //   for(let i = 0; i < objectList.length-1; i++) {
  //     for(let j = i + 1; j < objectList.length; j++) {
  //       let obj1: any = temp2[i]
  //       let obj2: any= temp2[j]
  //       console.log(intersection({x: obj1.x1 || 0, y: obj1.y1 || 0}, {x: obj1.x2 || 0, y: obj1.y2 || 0}, {x: obj2.x1 || 0, y: obj2.y1 || 0}, {x: obj2.x2 || 0, y: obj2.y2 || 0}))
  //       if (intersection({x: obj1.x1 || 0, y: obj1.y1 || 0}, {x: obj1.x2 || 0, y: obj1.y2 || 0}, {x: obj2.x1 || 0, y: obj2.y1 || 0}, {x: obj2.x2 || 0, y: obj2.y2 || 0}) != undefined) {
  //         console.log("FOUND")
  //       }
  //     }
  //   }
  // }, [objects])

  const handleClick = (e: any) => {
    if (canvas != null) {
      e.preventDefault();
      isDown = true;
      var pointer = canvas.getPointer(e);
      var points = [pointer.x, pointer.y, pointer.x, pointer.y];
      line = new fabric.Line(points, {
        strokeWidth: 10,
        fill: 'black',
        stroke: 'black',
        originX: 'center',
        originY: 'center'
      });
        
      canvas.add(line);
    } 
  }

  const onMouseUp = (e: any) => {
    
    isDown = false;
    console.log(canvas?.getObjects())
  }

  const onMouseMove = (e: any) => {
    if (!isDown) return;
    if (canvas != null) {
      var pointer = canvas.getPointer(e);
      line.set({ x2: pointer.x, y2: pointer.y });
      canvas.renderAll();
    }
  }

  interface Point2D {
    x: number;
    y: number;
  }

  function findSlope(a: number, b: number, c: number, d: number) {
    if (c - a === 0) {
      return 0;
    } else if (c - a !== 0) {
      let slope = (d - b) / (c - a);
      let answer = slope;
      return answer;
    } else {
      return 0;
    }
  }


  function checkOrtho(x1: number, y1: number, x2: number, y2: number, 
    x3: number, y3: number, x4: number, y4: number,
    theta_thresh: number) 
    {
      // center around 0
      var h1 = y2 - y1;
      var w1 = x2 - x1;
      var h2 = y4 - y3;
      var w2 = x4 - x3;
      // normalize to unit vectors
      var h1u = h1 / Math.sqrt(Math.pow(h1,2) + Math.pow(w1,2));
      var w1u = w1 / Math.sqrt(Math.pow(h1,2) + Math.pow(w1,2));
      var h2u = h2 / Math.sqrt(Math.pow(h2,2) + Math.pow(w2,2));
      var w2u = w2 / Math.sqrt(Math.pow(h2,2) + Math.pow(w2,2));

      var cos_theta = h1u*h2u + w1u*w2u;
      console.log(Math.abs(cos_theta))
      return Math.abs(cos_theta) < theta_thresh;
    }

    function checkNotOrtho(x1: number, y1: number, x2: number, y2: number, 
      x3: number, y3: number, x4: number, y4: number,
      theta_thresh: number) 
      {
        // center around 0
        var h1 = y2 - y1;
        var w1 = x2 - x1;
        var h2 = y4 - y3;
        var w2 = x4 - x3;
        // normalize to unit vectors
        var h1u = h1 / Math.sqrt(Math.pow(h1,2) + Math.pow(w1,2));
        var w1u = w1 / Math.sqrt(Math.pow(h1,2) + Math.pow(w1,2));
        var h2u = h2 / Math.sqrt(Math.pow(h2,2) + Math.pow(w2,2));
        var w2u = w2 / Math.sqrt(Math.pow(h2,2) + Math.pow(w2,2));
  
        var cos_theta = h1u*h2u + w1u*w2u;
        console.log(Math.abs(cos_theta))
        return Math.abs(cos_theta) > theta_thresh;
      }
    

  function updateGrammarObjects(e: any) {
    setGrammarObjs(Array.from(grammarList));
    console.log(grammarList);
  }

  
  function intersection(from1: Point2D, to1: Point2D, from2: Point2D, to2: Point2D): Point2D | undefined{
    const dX: number = to1.x - from1.x;
    const dY: number = to1.y - from1.y;
  
    const determinant: number = dX * (to2.y - from2.y) - (to2.x - from2.x) * dY;
    if (determinant === 0) return undefined; // parallel lines
  
    const lambda: number = ((to2.y - from2.y) * (to2.x - from1.x) + (from2.x - to2.x) * (to2.y - from1.y)) / determinant;
    const gamma: number = ((from1.y - to1.y) * (to2.x - from1.x) + dX * (to2.y - from1.y)) / determinant;
  
    // check if there is an intersection
    if (!(0 <= lambda && lambda <= 1) || !(0 <= gamma && gamma <= 1)) return undefined;
  
    return {
      x: from1.x + lambda * dX,
      y: from1.y + lambda * dY,
    };
  }

  return (
    <NextUIProvider>
      <Navbar className="w-full" isBordered variant={'sticky'}>
        <Navbar.Brand>
          <Text b color="inherit" hideIn="xs">
            Wirebending Bailey-Derek Grammar Converter
          </Text>
        </Navbar.Brand>
        <Navbar.Content hideIn="xs">
          <Navbar.Link isActive href="#">Home</Navbar.Link>
          <Navbar.Link href="#">About Wirebending</Navbar.Link>
          <Navbar.Link href="https://github.com/k-lombard/react-wirebending">Source Code</Navbar.Link>
        </Navbar.Content>
        <Navbar.Content>

        </Navbar.Content>
      </Navbar>
      <div className="flex flex-row">
        <canvas id='my-canvas' onClick={handleClick} onMouseUp={onMouseUp} onMouseMove={onMouseMove} width={800} height={height-76} style={{border: '1px solid #ccc'}}></canvas>
        <div className="flex flex-col w-full overflow-auto">
          <Button className="w-full" onPress={updateGrammarObjects}>Update Grammar Output</Button>
          {grammarObjs.map(function(element, index){return (<img key={index} height={50} src={require("./assets/grammar-" + element + ".png")}/>);})}
        </div>
      </div>
      </NextUIProvider>
  )};

export default App;
