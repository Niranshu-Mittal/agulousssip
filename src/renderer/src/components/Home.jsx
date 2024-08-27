import React, { useEffect, useRef, useState } from 'react';
import { ButtonGroup, Button, Slider } from '@material-tailwind/react';
import eraser_icon from '../assets/eraser.png';
import color_pallete_icon from '../assets/pallete.png';
import line_width_icon from '../assets/line_width.png';
import pencil_icon from '../assets/pencil.png';
import { HexColorPicker } from 'react-colorful';
import { IoIosSave } from 'react-icons/io';
import { FaFolderOpen } from 'react-icons/fa6';
import {
    Menu,
    MenuHandler,
    MenuList,
    MenuItem
} from '@material-tailwind/react';
import * as fabric from 'fabric';

export default function Home() {
    const canvasRef = useRef(null);
    const [fabricCanvas, setFabricCanvas] = useState(null);
    const [strokeColor, setStrokeColor] = useState("#000000");
    const [lineWidth, setLineWidth] = useState(5);
    const [lineWidthMenuActive, setLineWidthMenuActive] = useState(false);
    const [colorPaletteMenuActive, setColorPaletteMenuActive] = useState(false);
    const [eraserMode, setEraserMode] = useState(false);
    const [brushType, setBrushType] = useState('PencilBrush');

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

    const patternBrushes = {
        hlineBrush: () => {
            const patternCanvas = document.createElement('canvas');
            patternCanvas.width = patternCanvas.height = 10;
            const ctx = patternCanvas.getContext('2d');
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(0, 5);
            ctx.lineTo(10, 5);
            ctx.closePath();
            ctx.stroke();
            return patternCanvas;
        },
        vlineBrush: () => {
            const patternCanvas = document.createElement('canvas');
            patternCanvas.width = patternCanvas.height = 10;
            const ctx = patternCanvas.getContext('2d');
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(5, 0);
            ctx.lineTo(5, 10);
            ctx.closePath();
            ctx.stroke();
            return patternCanvas;
        },
        squareBrush: () => {
            const patternCanvas = document.createElement('canvas');
            patternCanvas.width = patternCanvas.height = 12;
            const ctx = patternCanvas.getContext('2d');
            ctx.fillStyle = strokeColor;
            ctx.fillRect(0, 0, 12, 12);
            return patternCanvas;
        },
        diamondBrush: () => {
            const patternCanvas = document.createElement('canvas');
            patternCanvas.width = patternCanvas.height = 12;
            const ctx = patternCanvas.getContext('2d');
            ctx.fillStyle = strokeColor;
            ctx.save();
            ctx.translate(6, 6);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-6, -6, 12, 12);
            ctx.restore();
            return patternCanvas;
        }
    };

    const setBrush = (brushType) => {
        if (fabricCanvas) {
            let newBrush;
            switch (brushType) {
                case 'PencilBrush':
                    newBrush = new fabric.PencilBrush(fabricCanvas);
                    break;
                case 'CircleBrush':
                    newBrush = new fabric.CircleBrush(fabricCanvas);
                    break;
                case 'SprayBrush':
                    newBrush = new fabric.SprayBrush(fabricCanvas);
                    break;
                case 'PatternBrush':
                case 'hlineBrush':
                case 'vlineBrush':
                case 'squareBrush':
                case 'diamondBrush':
                    newBrush = new fabric.PatternBrush(fabricCanvas);
                    newBrush.getPatternSrc = patternBrushes[brushType];
                    break;
                default:
                    newBrush = new fabric.PencilBrush(fabricCanvas);
            }
            newBrush.color = strokeColor;
            newBrush.width = lineWidth;
            fabricCanvas.freeDrawingBrush = newBrush;
            setBrushType(brushType);
        }
    };

    const handleSave = async () => {
        if (fabricCanvas) {
            const svg = fabricCanvas.toSVG();
            if (window.electron && window.electron.ipcRenderer) {
                const result = await window.electron.ipcRenderer.invoke('dialog:save', svg);
                if (result.success) {
                    console.log('SVG saved successfully.');
                } else {
                    console.log('Failed to save SVG.');
                }
            }
        }
    };

    const handleOpen = async () => {
        if (window.electron && window.electron.ipcRenderer) {
            const svgData = await window.electron.ipcRenderer.invoke('open-svg');
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgData, 'image/svg+xml');

            const fabricObjs = fabric.parseSVGDocument(doc, (options) => {
                // Optionally handle options here if needed
            });

            fabricObjs.then((objs) => {
                objs.objects.forEach((obj) => {
                    console.log("pattern brush log",obj instanceof fabric.PatternBrush)
                    if (obj instanceof fabric.PatternBrush) {
                        const patternName = obj.getPatternSrc().patternName;
                        if (patternBrushes[patternName]) {
                            obj.getPatternSrc = patternBrushes[patternName];
                        }
                    }
                });
                fabricCanvas.add(...objs.objects);
                fabricCanvas.renderAll(); // Ensure canvas is rendered correctly
            });
        }
    };

    const toggleDrawMode = () => {
        if (fabricCanvas) {
            fabricCanvas.isDrawingMode = !fabricCanvas.isDrawingMode;
        }
    };

    const toggleColorPaletteMenu = () => {
        setColorPaletteMenuActive(!colorPaletteMenuActive);
    };

    const toggleLineWidthMenu = () => {
        setLineWidthMenuActive(!lineWidthMenuActive);
    };

    const brushColorChangeHandler = (value) => {
        if (fabricCanvas) {
            setStrokeColor(value);
            fabricCanvas.freeDrawingBrush.color = value;
        }
    };

    const brushWidthChangeHandler = (e) => {
        if (fabricCanvas) {
            const brushWidth = parseInt(e.target.value, 10);
            setLineWidth(brushWidth);
            fabricCanvas.freeDrawingBrush.width = brushWidth;
        }
    };

    return (
        <div>
            <div className='flex justify-between'>
                <IoIosSave className='h-[50px] w-[50px] m-2 rounded-sm hover:scale-125' onClick={handleSave} />
                <FaFolderOpen className='h-[50px] w-[50px] m-2 rounded-sm hover:scale-125 mr-4' onClick={handleOpen} />
            </div>
            <div className='grid items-center justify-items-center justify-center gap-5 relative' style={{ backgroundColor: '#e0f7fa', padding: '20px' }}>
                <div className='relative' style={{ backgroundColor: '#b2ebf2', padding: '10px', borderRadius: '8px' }}>
                    <canvas className='rounded-sm shadow-sm' ref={canvasRef} />
                    {colorPaletteMenuActive &&
                        <div className='absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10' style={{ pointerEvents: 'auto' }}>
                            <HexColorPicker color={strokeColor} onChange={brushColorChangeHandler} />
                        </div>
                    }
                    {lineWidthMenuActive &&
                        <Slider className='absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 z-10'
                            value={lineWidth}
                            min={1}
                            max={100}
                            onChange={brushWidthChangeHandler}
                        />
                    }
                </div>
                <ButtonGroup>
                    <Menu>
                        <MenuHandler>
                            <Button className='bg-white hover:bg-gray-200'>
                                <img src={color_pallete_icon} alt="Color Palette" />
                            </Button>
                        </MenuHandler>
                        <MenuList>
                            <MenuItem onClick={toggleColorPaletteMenu}>Show Color Palette</MenuItem>
                        </MenuList>
                    </Menu>
                    <Menu>
                        <MenuHandler>
                            <Button className='bg-white hover:bg-gray-200'>
                                <img src={line_width_icon} alt="Line Width" />
                            </Button>
                        </MenuHandler>
                        <MenuList>
                            <MenuItem onClick={toggleLineWidthMenu}>Show Line Width</MenuItem>
                        </MenuList>
                    </Menu>
                    <Button onClick={() => setBrush('PencilBrush')} className='bg-white hover:bg-gray-200'>
                        <img src={pencil_icon} alt="Pencil" />
                    </Button>
                    <Button onClick={() => setBrush('hlineBrush')} className='bg-white hover:bg-gray-200'>
                        <span>Horizontal Line Brush</span>
                    </Button>
                    <Button onClick={() => setBrush('vlineBrush')} className='bg-white hover:bg-gray-200'>
                        <span>Vertical Line Brush</span>
                    </Button>
                    <Button onClick={() => setBrush('squareBrush')} className='bg-white hover:bg-gray-200'>
                        <span>Square Brush</span>
                    </Button>
                    <Button onClick={() => setBrush('diamondBrush')} className='bg-white hover:bg-gray-200'>
                        <span>Diamond Brush</span>
                    </Button>
                    <Button onClick={() => setEraserMode(!eraserMode)} className='bg-white hover:bg-gray-200'>
                        <img src={eraser_icon} alt="Eraser" />
                    </Button>
                </ButtonGroup>
                <Button onClick={toggleDrawMode} className='bg-white hover:bg-gray-200'>
                    {fabricCanvas && fabricCanvas.isDrawingMode ? 'Disable Drawing Mode' : 'Enable Drawing Mode'}
                </Button>
            </div>
        </div>
    );
}
