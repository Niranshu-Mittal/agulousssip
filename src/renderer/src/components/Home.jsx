import React, { useEffect, useRef, useState } from 'react'
import { ButtonGroup, Button, Slider } from '@material-tailwind/react'
import icon from '../../../../resources/icon.png'
import color_pallete_icon from '../assets/pallete.png'
import line_width_icon from '../assets/line_width.png'
import eraser_icon from '../assets/eraser.png'
import pencil_icon from '../assets/pencil.png'
import { HexColorPicker } from 'react-colorful'

export default function Home() {
    const canvasRef = useRef(null)
    const [drawing, setDrawing] = useState(false)
    const [strokeColor, setStrokeColor] = useState("#000000")
    const [linewidth, setLineWidth] = useState(5)
    const [line_width_menu_active, set_line_width_Menu_Active] = useState(false)
    const [Color_pallete_menu_active, set_Color_Pallete_Menu_Active] = useState(false)
    const [eraserMode, setEraserMode] = useState(false)

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
        <div className='grid items-center justify-items-center justify-center gap-5 relative' style={{ backgroundColor: '#e1d4f1', padding: '20px' }}>
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
            <div className='absolute bottom-0 flex gap-2'>
                <ButtonGroup>
                    <Button 
                        className='w-15 h-15' 
                        onClick={toggleColorPaletteMenu}
                    >
                        <img src={color_pallete_icon} width={20} height={20} alt="Color Palette" />
                    </Button>
                    <Button 
                        className='w-15 h-15' 
                        onClick={toggleLineWidthMenu}
                    >
                        <img src={line_width_icon} width={20} height={20} alt="Line Width" />
                    </Button>
                    <Button 
                        className='w-15 h-15' 
                        onClick={toggleEraserMode}
                    >
                        <img 
                            src={eraserMode ? pencil_icon : eraser_icon} 
                            width={20} 
                            height={20} 
                            alt={eraserMode ? "Pencil" : "Eraser"} 
                        />
                    </Button>
                </ButtonGroup>
            </div>
        </div>
    )
}
