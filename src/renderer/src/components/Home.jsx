import React, { useEffect, useRef, useState } from 'react'
import { ButtonGroup, Button, Slider } from '@material-tailwind/react'
import color_pallete_icon from '../assets/pallete.png'
import line_width_icon from '../assets/line_width.png'
import eraser_icon from '../assets/eraser.png'
import pencil_icon from '../assets/pencil.png'
import { HexColorPicker } from 'react-colorful'
import redo_icon from '../assets/redo.png'
import undo_icon from '../assets/undo.png'
import { IoIosSave, IoIosOpen } from 'react-icons/io'

const MAX_STACK_SIZE = 50;

export default function Home() {
    const canvasRef = useRef(null)
    const [drawing, setDrawing] = useState(false)
    const [strokeColor, setStrokeColor] = useState("#000000")
    const [linewidth, setLineWidth] = useState(5)
    const [line_width_menu_active, set_line_width_Menu_Active] = useState(false)
    const [Color_pallete_menu_active, set_Color_Pallete_Menu_Active] = useState(false)
    const [eraserMode, setEraserMode] = useState(false)
    const [undoStack, setUndoStack] = useState([]) // Stack for undo
    const [redoStack, setRedoStack] = useState([]) // Stack for redo

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")
        let is_drawing = false
        context.lineCap = 'round'
        context.lineJoin = 'round'

        const getCanvasPosition = (e) => {
            const rect = canvas.getBoundingClientRect()
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            }
        }

        const handleMouseDown = (e) => {
            if (e.button === 0) {

                // Save current state to undo stack
                setUndoStack(prevStack => {
                    const newStack = [...prevStack, canvas.toDataURL()];
                    if (newStack.length > MAX_STACK_SIZE) newStack.shift();
                    return newStack;
                });
                setRedoStack([]); // Clear redo stack

                // Close all menus when drawing or erasing starts
                set_line_width_Menu_Active(false)
                set_Color_Pallete_Menu_Active(false)
                
                is_drawing = true
                const { x, y } = getCanvasPosition(e)
                context.beginPath()
                context.moveTo(x, y)
                e.preventDefault()
            }
        }

        const handleMouseMove = (e) => {
            if (is_drawing) {
                
                const { x, y } = getCanvasPosition(e)
                context.lineWidth = linewidth
                context.strokeStyle = strokeColor
                if (eraserMode) {
                    context.strokeStyle = '#ffffff'
                }
                context.lineTo(x, y)
                context.stroke()
            }
        }

        const handleMouseUp = () => {
            is_drawing = false
        }

        const handleMouseOut = () => {
            is_drawing = false
       
        }

        canvas.addEventListener('mousedown', handleMouseDown)
        canvas.addEventListener('mousemove', handleMouseMove)
        canvas.addEventListener('mouseup', handleMouseUp)
        canvas.addEventListener('mouseout', handleMouseOut)

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown)
            canvas.removeEventListener('mousemove', handleMouseMove)
            canvas.removeEventListener('mouseup', handleMouseUp)
            canvas.removeEventListener('mouseout', handleMouseOut)
        }
    }, [linewidth, strokeColor, eraserMode])

    const handleUndo = () => {
        if (undoStack.length > 0) {
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");

            // Save current state to redo stack
            setRedoStack(prevStack => {
                const newStack = [...prevStack, canvas.toDataURL()];
                if (newStack.length > MAX_STACK_SIZE) newStack.shift();
                return newStack;
            });

            // Restore last state from undo stack
            const lastState = undoStack.pop();
            setUndoStack([...undoStack]); // Update undo stack

            const img = new Image();
            img.src = lastState;
            img.onload = () => {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(img, 0, 0);
            };
        }
    };

    const handleRedo = () => {
        if (redoStack.length > 0) {
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");

            // Save current state to undo stack
            setUndoStack(prevStack => {
                const newStack = [...prevStack, canvas.toDataURL()];
                if (newStack.length > MAX_STACK_SIZE) newStack.shift();
                return newStack;
            });

            // Restore last state from redo stack
            const nextState = redoStack.pop();
            setRedoStack([...redoStack]); // Update redo stack

            const img = new Image();
            img.src = nextState;
            img.onload = () => {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(img, 0, 0);
            };
        }
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
    
        // Convert canvas content to a PNG data URL
        const imageData = canvas.toDataURL('image/png');
    
        // Create a Blob from the data URL
        const blob = dataURLToBlob(imageData);
    
        // Create a temporary link element
        const link = document.createElement('a');
    
        // Create a file name with a timestamp to avoid overwriting
        const fileName = `drawing_${Date.now()}.png`;
    
        // Use the Blob URL
        link.href = URL.createObjectURL(blob);
    
        // Set the download attribute with the filename
        link.download = fileName;
    
        // Append the link to the document
        document.body.appendChild(link);
    
        // Trigger the download
        link.click();
    
        // Clean up
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
    }
    
    const dataURLToBlob = (dataURL) => {
        const binary = atob(dataURL.split(',')[1]);
        const array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type: 'image/png' });
    }
    
    const handleLoad = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    const canvas = canvasRef.current;
                    const context = canvas.getContext('2d');
                    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
                    canvas.width = img.width; // Adjust canvas size to image size
                    canvas.height = img.height;
                    context.drawImage(img, 0, 0); // Draw the image on the canvas
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const SliderValueChangeHandler = (e) => {
        const newValue = parseInt(e.target.value, 10)
        setLineWidth(newValue)
    }

    const StrokeColorChangeHandler = (value) => {
        setStrokeColor(value)
    }

    const toggleLineWidthMenu = () => {
        set_line_width_Menu_Active(!line_width_menu_active)
        set_Color_Pallete_Menu_Active(false)
    }

    const toggleColorPaletteMenu = () => {
        set_Color_Pallete_Menu_Active(!Color_pallete_menu_active)
        set_line_width_Menu_Active(false)
    }

    const toggleEraserMode = () => {
        setEraserMode(!eraserMode)
        set_line_width_Menu_Active(false)
        set_Color_Pallete_Menu_Active(false)
    }

    return (
        <div>
            <div className='grid items-center justify-items-center justify-center gap-5 relative' style={{ backgroundColor: '#e1d4f1', padding: '20px', height: '100vh' }}>
                <div className='relative' style={{ backgroundColor: '#c7b9db', padding: '10px', borderRadius: '8px' }}>
                    <canvas
                        className='rounded-sm shadow-sm'
                        width={800}
                        height={500}
                        ref={canvasRef}
                        style={{ backgroundColor: '#ffffff' }} 
                    >
                    </canvas>
                    {line_width_menu_active && 
                        <Slider 
                            className='absolute bottom-20 left-1/2 transform -translate-x-1/2' 
                            value={linewidth} 
                            onChange={SliderValueChangeHandler} 
                            step={1} 
                            min={1} 
                        />
                    }
                    {Color_pallete_menu_active && 
                        <div 
                            className='absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10' 
                            style={{ pointerEvents: 'auto' }} 
                        >
                            <HexColorPicker 
                                color={strokeColor} 
                                onChange={StrokeColorChangeHandler} 
                            />
                        </div>
                    }
                </div>
                
                <div className='absolute bottom-0 flex gap-2 mb-2'>
                    <ButtonGroup>
                        <Button 
                            className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]' 
                            onClick={toggleColorPaletteMenu}
                        >
                            <img src={color_pallete_icon} width={20} height={20} alt="Color Palette" />
                        </Button>
                        <Button 
                            className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]' 
                            onClick={toggleLineWidthMenu}
                        >
                            <img src={line_width_icon} width={20} height={20} alt="Line Width" />
                        </Button>
                        <Button 
                            className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]' 
                            onClick={toggleEraserMode}
                        >
                            <img 
                                src={eraserMode ? pencil_icon : eraser_icon} 
                                width={20} 
                                height={20} 
                                alt={eraserMode ? "Pencil" : "Eraser"} 
                            />
                        </Button>
                        <Button 
                            className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]' 
                            onClick={handleSave}
                        >
                            <IoIosSave size={20} />
                        </Button>
                        <Button 
                            className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]' 
                            onClick={() => document.getElementById('file-input').click()}
                        >
                            <IoIosOpen size={20} />
                            <input 
                                type="file" 
                                id="file-input" 
                                className='hidden' 
                                accept="image/*" 
                                onChange={handleLoad} 
                            />
                        </Button>
                        <Button 
                            className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]' 
                            onClick={handleUndo}
                        >
                            <img src={undo_icon
                            } width={20} height={20} alt="Undo" />
                        </Button>
                        <Button 
                            className='w-15 h-15 bg-[#9b6ae0] hover:bg-[#7d4ec7] focus:bg-[#b083ed] active:bg-[#6e3fa5]' 
                            onClick={handleRedo}
                        >
                            <img src={redo_icon
                            } width={20} height={20} alt="Redo" />
                        </Button>
                    </ButtonGroup>
                </div>
            </div>
        </div>
    )
}