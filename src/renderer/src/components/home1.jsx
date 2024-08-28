import React, { useEffect, useRef, useState } from 'react'
import { ButtonGroup, Button, Slider } from '@material-tailwind/react'
import eraser_icon from '../assets/eraser.png'
import color_pallete_icon from '../assets/pallete.png'
import line_width_icon from '../assets/line_width.png'
import { BsThreeDotsVertical } from 'react-icons/bs'
import pencil_icon from '../assets/pencil.png'
import { HexColorPicker } from 'react-colorful'
import { IoIosSave, IoIosOpen, IoIosUndo, IoIosRedo } from 'react-icons/io'
import { EraserBrush, ClippingGroup } from '@erase2d/fabric'
import { FaFolderOpen } from "react-icons/fa6"
import {
    Menu,
    MenuHandler,
    MenuList,
    MenuItem
  } from "@material-tailwind/react"
import * as fabric from 'fabric'
import { XMLSerializer } from 'xmldom'
import { PiHandTapBold } from "react-icons/pi"

export default function Home1() {
    const canvasRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [strokeColor, setStrokeColor] = useState("#000000")
    const [lineWidth, setLineWidth] = useState(5)
    const [lineWidthMenuActive, setLineWidthMenuActive] = useState(false)
    const [colorPaletteMenuActive, setColorPaletteMenuActive] = useState(false)
    const [eraserMode, setEraserMode] = useState(false)
    const [BrushType, setBrushType] = useState('PencilBrush')
    const [redoStack, setRedoStack] = useState([])
    const [isPanning, setIsPanning] = useState(false)
    var isPanningActive = useRef(false)

    useEffect(() => {
        // Initialize fabric canvas
        const canvas = new fabric.Canvas(canvasRef.current, {
          isDrawingMode: true, // Enable drawing mode
          width: 800,          // Set canvas width
          height: 500,         // Set canvas height
          backgroundColor: '#fff', // Background color of canvas
        });
    
        // Set the PencilBrush as the drawing brush
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.width = 5; // Set the width of the brush
        canvas.freeDrawingBrush.color = '#000000'; // Set the color of the brush

        canvas.getObjects().forEach((obj) => {
            console.log('obj', obj, 'Erasable', obj.erasable)
            obj.set('ersable',true)
            console.log("after update.",obj.erasable)
        })

        canvas.on('selection:created', (e) => {
            const obj = e.selected
            console.log("selection pressed",e.selected)
        })

        isPanningActive.current = false


        let startPoint = null;

        canvas.on('mouse:down', (e) => {
            console.log("panning inside mouse down",isPanningActive.current)
            if (isPanningActive.current) {
                console.log("inside mouse down if block")
                startPoint = { x: e.viewportPoint.x, y: e.viewportPoint.y };
                console.log("Panning started at:", startPoint);
                canvas.setCursor("grab");
            }
        });
        
        canvas.on('mouse:move', (e) => {
            if (isPanningActive.current && startPoint) {
                const deltaX = e.viewportPoint.x - startPoint.x;
                const deltaY = e.viewportPoint.y - startPoint.y;
                console.log("Panning movement - Delta X:", deltaX, "Delta Y:", deltaY);
                canvas.relativePan({ x: deltaX, y: deltaY });
                startPoint = { x: e.viewportPoint.x, y: e.viewportPoint.y };
            }
        });
        
        canvas.on('mouse:up', (e) => {
            if (isPanningActive.current) {
                canvas.setCursor("default");
                startPoint = null;
                console.log("Panning stopped");
            }
        });


        canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY
            let zoom = canvas.getZoom()
            zoom *= 0.999 ** delta
            if (zoom > 20){
                zoom = 20
            }
            if(zoom < 0.01){
                zoom = 0.01
            }
            canvas.setZoom(zoom)
            opt.e.preventDefault()
            opt.e.stopPropagation()
        
        })
        
        // canvas scroll working but with keys
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                scrollCanvas(canvas, 'up');
            } else if (e.key === 'ArrowDown') {
                scrollCanvas(canvas, 'down');
            } else if (e.key == 'ArrowLeft'){
                scrollCanvas(canvas, 'left')
            }
        });

        // window.addEventListener('')
        //for collaborative pad few good tries objects
        // canvas.on('path:created',(path) => {
        //     console.log("path",path)
        //     console.log("actual path", path.path.path)
        //     const Patht = new fabric.Path([])

        //     Patht.set('path', path.path)
        //     console.log("saved path",Patht)
        //     console.log("stroke color", path.path.stroke)
        //     console.log("stroke width", path.path.strokeWidth)

        //     const drawobj = {
        //         Path : "",
        //         stroke : "",
        //         strokewidth : "",
        //         freeDrawingBrushType : "" 
        //     }

        //     drawobj['Path'] = path.path.path
        //     drawobj['freeDrawingBrushType'] = BrushType
        //     drawobj['stroke'] = path.path.stroke
        //     drawobj['strokewidth'] = path.path.strokeWidth
            
        //     console.log('pathobj',drawobj)
        // })


        canvas.on('object:added', (target) => {
            console.log("target", target)
        })
    
        // Save the canvas instance to the state
        setFabricCanvas(canvas);

    
        return () => {
            if (canvas) {
                canvas.clear(); // Clears all objects from the canvas
                if (canvasRef.current) {
                    canvas.dispose(); // Dispose of the Fabric.js canvas
                }
            }
        };
      }, []);

      const scrollCanvas = (canvas, direction) => {
        const delta = direction === 'up' ? -10 : 10;
        const vpt = canvas.viewportTransform;
        vpt[5] += delta; // Modify the y component of the viewportTransform matrix
        canvas.requestRenderAll();
    };

      const deleteLastObject = () => {
        const objects = fabricCanvas.getObjects()

        if(objects.length > 0) {
            const lastObject = objects[objects.length - 1]
            fabricCanvas.remove(lastObject)
            setRedoStack(prevStack => [...prevStack, lastObject])
            fabricCanvas.renderAll()
        }
        else {
            console.log("Nothing To delete on canvas.")
        }

      }

      const BackLastDeletedObject = () => {
        if(redoStack.length > 0){
            const redoObject = redoStack.pop()
            fabricCanvas.add(redoObject)
            fabricCanvas.renderAll()
            setRedoStack(redoStack)
        }
      }


      const handleSave = async () => {
        console.log('window.api:', window.api)                  //debug
        const svg = fabricCanvas.toSVG()
        console.log("Json Stringify", JSON.stringify(fabricCanvas))                 //debug
        console.log("url of svg")            //debug
        console.log("save svg format",svg)         //debug
        if (window.electron && window.electron.ipcRenderer) {
            const result = await window.electron.ipcRenderer.invoke('dialog:save', svg)
            // const result = await window.api.invoke('save-svg', svgData)
        // const result = await window.api.invoke('save-svg', svgData)
            if(result.success){
                console.log('svg saved successfully.')
            }
            else{
                console.log('Failed to save svg.')
            }
        }
      }

      const handleOpen = async () => {
        console.log("window.api:", window.api)                //debug
        const svgData = await window.electron.ipcRenderer.invoke('open-svg')
        console.log("open svgData", svgData)                //debug

        console.log("file type", typeof svgData)             //debug

        const parser = new DOMParser()
        const doc = parser.parseFromString(svgData, 'image/svg+xml')
        console.log("SvgString",doc)                  //debug
        const svgElement = doc.querySelectorAll('path, rect, circle, line, polyline, polygon, ellipse, pattern')
        // const svgElement = doc.querySelectorAll('path')
        console.log("svgElement",svgElement)             //debug

        const fabricObjs = fabric.parseSVGDocument(doc , async (options, object ) => {
            console.log("object",object)
            console.log("object stroke", object.stroke)

            const patternId = object.stroke.slice(5,-1)
            console.log("object stroke patternId",patternId)

            //below 6 lines are perfect
            // const pattern = doc.querySelector(`#SVGID_0`)
            // console.log("object stroke style element",pattern)

            // const imageElement = new Image()
            // const xLinkHref = pattern.querySelector('image').getAttribute('xlink:href')

            // imageElement.src = xLinkHref
            // await new Promise((resolve) => (imageElement.onload = resolve))


            const pattern = doc.querySelector(`#${patternId}`)
            if(pattern){
                console.log("object stroke style element",pattern)
    
                const imageElement = new Image()
                const xLinkHref = pattern.querySelector('image').getAttribute('xlink:href')

                console.log("pattern href",xLinkHref)
    
                imageElement.src = xLinkHref
                await new Promise((resolve) => (imageElement.onload = resolve))
    
                const fabricPattern = new fabric.Pattern({
                    source: imageElement,
                    repeat : 'repeat'
                })
                object.set('fill', fabricPattern)
            }

        }

        



    )

        // const fabob = fabric.parseSVGDocument(doc)
        // console.log("fabob[0]",fabob)

        //below two line are needed to uncomment because they work well
        console.log("fabricObjs", fabricObjs)                 //debug

        // console.log("Type of fabricObjs", typeof fabricObjs)             //debug

        // console.log("fabricobjs structure decode 1",typeof ((await fabricObjs).allElements))          //debug

        // console.log("fabric.js", (await fabricObjs).objects)   //debug

        fabricCanvas.add(...((await fabricObjs).objects))   

        // fabricCanvas.renderAll()   // if problem occurs uncomment it
      }


      const togglePanningMode = () => {
        if(fabricCanvas){
            const isPanningAct = isPanningActive.current
            console.log("isPanning before Click.",isPanningAct)
            isPanningActive.current = !isPanningAct
            console.log("After Change PanningMode", isPanningActive.current)
            isPanningActive.current && fabricCanvas.setCursor("grab")
            const nowIsSelecting = !isPanningActive.current
            fabricCanvas.selection = nowIsSelecting
            fabricCanvas.isDrawingMode = isPanningActive.current ? false : fabricCanvas.isDrawingMode
            if(isPanningActive.current){
                fabricCanvas.forEachObject((obj) => {
                    obj.selectable = nowIsSelecting
                })
            }
        }
      }



      const toggleDrawMode = () => {
        fabricCanvas.forEachObject((obj)=>{
            obj.selectable = true
        })
        if(fabricCanvas){
            console.log(fabricCanvas.get('isDrawingMode'))          //debug
            fabricCanvas.isDrawingMode = !fabricCanvas.isDrawingMode
            setIsPanning(false)
            console.log(fabricCanvas.get('isDrawingMode'))          //debug
            isPanningActive.current = fabricCanvas.isDrawingMode ? false : isPanningActive.current
            fabricCanvas.selection = true
        }
      }

      const toggleColorPaletteMenu = () => {
        setColorPaletteMenuActive(!colorPaletteMenuActive)
        console.log(colorPaletteMenuActive)    //debug
      }

      const toggleLineWidthMenu = () => {
        setLineWidthMenuActive(!lineWidthMenuActive)
        console.log(lineWidthMenuActive)      //debug
      }

      const brushColorChangeHandler = (value) => {
        if(fabricCanvas){
            console.log("brush color value",value)    //debug
            setStrokeColor(value)
            fabricCanvas.freeDrawingBrush.color = value
            console.log("fabric color value",fabricCanvas.freeDrawingBrush.color)    //febug
        }
      }

      const brushWidthChangeHandler = (e) => {
        if(fabricCanvas){
            var brushWidth = parseInt(e.target.value,10)   //base 10 decimal
            console.log("brush size value",brushWidth)    //debug
            setLineWidth(brushWidth)
            fabricCanvas.freeDrawingBrush.width = brushWidth
            console.log("fabric width value",fabricCanvas.freeDrawingBrush.width)      //debug
        }
      }



      const setBrush = (brushtype) => {
        if(fabricCanvas){
            // console.log('')
            if(brushtype == 'PencilBrush'){
                fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas)
                setBrushType(brushtype)
            }
            else if(brushtype == 'CircleBrush'){
                fabricCanvas.freeDrawingBrush = new fabric.CircleBrush(fabricCanvas)
                setBrushType(brushtype)
                
            }
            else if(brushtype == 'SprayBrush'){
                fabricCanvas.freeDrawingBrush = new fabric.SprayBrush(fabricCanvas)
                setBrushType(brushtype)
            }
            else if(brushtype == 'PatternBrush'){
                fabricCanvas.freeDrawingBrush = new fabric.PatternBrush(fabricCanvas)
                setBrushType(brushtype)
            }
            else if(brushtype == 'hlineBrush'){
                var hLinePatternBrush = new fabric.PatternBrush(fabricCanvas)
                hLinePatternBrush.getPatternSrc = () => {
                    var patternCanvas = document.createElement('canvas')
                    patternCanvas.width = patternCanvas.height = 10
                    const ctx = patternCanvas.getContext('2d')
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(0, 5);
                    ctx.lineTo(10, 5);
                    ctx.closePath();
                    ctx.stroke();
                    return patternCanvas
                }
                fabricCanvas.freeDrawingBrush = hLinePatternBrush
                setBrushType(brushtype)
            }
            else if(brushtype == 'vlineBrush'){
                var vLinePatternBrush = new fabric.PatternBrush(fabricCanvas)
                vLinePatternBrush.getPatternSrc = () => {
                    var patternCanvas = document.createElement('canvas')
                    patternCanvas.width = patternCanvas.height = 10
                    const ctx = patternCanvas.getContext('2d')
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(5, 0);
                    ctx.lineTo(5, 10);
                    ctx.closePath();
                    ctx.stroke();
                    return patternCanvas
                }
                fabricCanvas.freeDrawingBrush = vLinePatternBrush
                setBrushType(brushtype)
            }
            else if(brushtype == 'SquareBrush'){
                var squarePatternBrush = new fabric.PatternBrush(fabricCanvas)
                squarePatternBrush.getPatternSrc = () => {
                    var patternCanvas = document.createElement('canvas')
                    var squareWidth = 10
                    var squareDistance = 2
                    patternCanvas.width = patternCanvas.height = squareWidth + squareDistance
                    var ctx = patternCanvas.getContext('2d')
    
                    ctx.fillStyle = strokeColor
                    ctx.strokeStyle = strokeColor
                    ctx.fillRect(0, 0, squareWidth, squareWidth)
    
                    return patternCanvas
                }
                fabricCanvas.freeDrawingBrush = squarePatternBrush
                setBrushType(brushtype)
            }
            else if(brushtype == 'DiamondBrush'){
                var diamondPatternBrush = new fabric.PatternBrush(fabricCanvas)
                diamondPatternBrush.getPatternSrc = () => {
                    var squareWidth = 10, squareDistance = 5
                    var patternCanvas = document.createElement('canvas')
                    var rect = new fabric.Rect({
                        width: squareWidth,
                        height: squareWidth,
                        angle: 45,
                        fill: strokeColor
                    })
                    var canvasWidth = rect.getBoundingRect().width
    
                    patternCanvas.width = patternCanvas.height = canvasWidth + squareDistance
                    rect.set({
                        left: canvasWidth / 2,
                        top: canvasWidth / 2
                    })
    
                    var ctx = patternCanvas.getContext('2d')
                    rect.render(ctx)
    
                    return patternCanvas
                }

                fabricCanvas.freeDrawingBrush = diamondPatternBrush
                fabricCanvas.freeDrawingBrush.color = strokeColor
                setBrushType(brushtype)
                
            }
        }
        fabricCanvas.freeDrawingBrush.color = strokeColor
        fabricCanvas.freeDrawingBrush.width = lineWidth
    }

    return (
        <div className='bg-[#e1d4f1]'>
            <div className='flex justify-between'>
                <Button className='w-[63px] h-[62px] m-2 justify-center bg-[#9b6ae0]' >
                    <Menu animate={{
                        mount: { y: 58 },
                        unmount: { y: 25 },
                    }} placement='bottom-end' >
                        <MenuHandler placement='bottom-end'>
                            <BsThreeDotsVertical className='w-[18px] h-[18px]  '/>
                        </MenuHandler >
                        <MenuList>
                            <MenuItem>DarkMode</MenuItem>
                            <MenuItem onClick={handleSave} >
                                <div className='flex justify-between'>
                                    <div>Save</div>
                                    <IoIosSave/>
                                </div>
                            </MenuItem>
                            <MenuItem onClick={handleOpen}>
                                <div className='flex justify-between'>
                                    <div>Load</div>
                                    <IoIosOpen/>
                                </div>
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </Button>
                {/* <IoIosSave className='h-[50px] w-[50px] m-2 rounded-sm hover:scale-125' onClick={handleSave} />
                <FaFolderOpen className='h-[50px] w-[50px] m-2 rounded-sm hover:scale-125 mr-4' onClick={handleOpen} /> */}
            </div>
            <div className='grid items-center justify-items-center justify-center gap-5 relative' style={{ backgroundColor: '#e1d4f1', padding: '20px' }}>
                <div className='relative' style={{ backgroundColor: '#c7b9db', padding: '10px', borderRadius: '8px' }}>
                    <canvas className='rounded-sm shadow-sm' ref={canvasRef} style={{background : 'ffffff'}}/>
                    {colorPaletteMenuActive &&
                    <div className='absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10' style={{ pointerEvents: 'auto' }}>
                        <HexColorPicker color={strokeColor} onChange={brushColorChangeHandler}/>
                    </div>
                    }
                    {lineWidthMenuActive && 
                    <Slider className='absolute bottom-20 left-1/2 transform -translate-x-1/2' value={lineWidth} step={1} min={1} onChange={brushWidthChangeHandler}/>
                    }
                </div>
                <div className='flex gap-2'>
                    <ButtonGroup clasName='absolute bottom-0 flex gap-2 mb-2'>
                        <Button className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]'>
                            <PiHandTapBold className='w-7 h-7' color="black" onClick={togglePanningMode}/>
                        </Button>
                        <Button className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]' onClick={toggleDrawMode}>
                            <img src={pencil_icon} width={20} height={20} alt="Pencil(Draw mode on-off)"/>
                        </Button>
                        <Button className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]' onClick={toggleColorPaletteMenu}>
                            <img src={color_pallete_icon} width={20} height={20} alt="Color Palette" />
                        </Button>
                        <Button className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]' onClick={toggleLineWidthMenu}>
                            <img src={line_width_icon} width={20} height={20} alt="Line Width" />
                        </Button>
                        <Button className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]'>
                            <IoIosUndo className='w-7 h-7' color='Black' onClick={deleteLastObject}/>
                            {/* <img src={eraser_icon} width={20} height={20} alt={"Eraser"} onClick={deleteLastObject}/> */}
                        </Button>
                        <Button className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]'>
                            <IoIosRedo className='w-7 h-7' color='Black' onClick={BackLastDeletedObject}/>
                            {/* <img src={eraser_icon} width={20} height={20} alt={"Eraser"} onClick={deleteLastObject}/> */}
                        </Button>
                        <Button className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]'>
                            <Menu >
                                <MenuHandler className='w-15 h-15 bg-[#9b6ae0]'>
                                    <Button className='w-15 h-15 bg-[#9b6ae0]'>
                                        {BrushType}
                                    </Button>
                                </MenuHandler>
                                <MenuList>
                                    <MenuItem className={BrushType == 'PencilBrush' ? `bg-blue-gray-50 text-blue-gray-900` : null} onClick={()=>setBrush('PencilBrush')}>PencilBrush</MenuItem>
                                    <MenuItem className={BrushType == 'CircleBrush' ? `bg-blue-gray-50 text-blue-gray-900` : null} onClick={()=>setBrush('CircleBrush')}>CircleBrush</MenuItem>
                                    <MenuItem className={BrushType == 'SprayBrush' ? `bg-blue-gray-50 text-blue-gray-900` : null} onClick={()=>setBrush('SprayBrush')}>SprayBrush</MenuItem>
                                    <MenuItem className={BrushType == 'PatternBrush' ? `bg-blue-gray-50 text-blue-gray-900` : null} onClick={()=>setBrush('PatternBrush')}>PatternBrush</MenuItem>
                                    <MenuItem className={BrushType == 'hlineBrush' ? `bg-blue-gray-50 text-blue-gray-900` : null} onClick={()=>setBrush('hlineBrush')}>hlineBrush</MenuItem>
                                    <MenuItem className={BrushType == 'vlineBrush' ? `bg-blue-gray-50 text-blue-gray-900` : null} onClick={()=>setBrush('vlineBrush')}>vlineBrush</MenuItem>
                                    <MenuItem className={BrushType == 'SquareBrush' ? `bg-blue-gray-50 text-blue-gray-900` : null} onClick={()=>setBrush('SquareBrush')}>SquareBrush</MenuItem>
                                    <MenuItem className={BrushType == 'DiamondBrush' ? `bg-blue-gray-50 text-blue-gray-900` : null} onClick={()=>setBrush('DiamondBrush')}>DiamondBrush</MenuItem>
                                    {/* <MenuItem className={BrushType == 'TextureBrush' ? `bg-blue-gray-50 text-blue-gray-900` : null} onClick={()=>setBrushType('TextureBrush')}>TextureBrush</MenuItem> */}
                                </MenuList>
                            </Menu>
                    </Button>
                    </ButtonGroup>
                </div>
            </div>
        </div>
    )
}
