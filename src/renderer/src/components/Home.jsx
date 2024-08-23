import React, {useContext, useEffect, useRef, useState} from 'react'
import { ButtonGroup, Button } from '@material-tailwind/react'
import icon from '../../../../resources/icon.png'
import color_pallete_icon from '../assets/pallete.png'
import line_width_icon from '../assets/line_width.png'
import { Slider } from '@material-tailwind/react'
import { storeContext } from '../context/store.context'
// import { ColorPicker, useColor } from 'react-color-palette'
import { HexColorPicker } from 'react-colorful'

export default function Home() {

    // const {} = useContext(storeContext)

    const canvasRef = useRef(null)
    const linewidthRef = useRef(1)
    const strokecolorRef = useRef("#000000")

    const [drawing,setDrawing] = useState(false)

    const [strokeColor,setStrokeColor] = useState("#000000")

    const [linewidth,setLineWidth] = useState(1)   //for live change both useRef and useState should be used

    const [line_width_menu_active,set_line_width_Menu_Active] = useState(false)

    const [Color_pallete_menu_active,set_Color_Pallete_Menu_Active] = useState(false)

    useEffect(()=>{
        /**@type {HTMLCanvasElement} */
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        let is_drawing = false
        let draw_color = strokeColor
        let line_width = linewidth

        canvas.addEventListener('mousedown',(e)=>{
            if(e.button === 0){
                is_drawing = true
                context.beginPath()
                context.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop)
                e.preventDefault()
            }
        })

        canvas.addEventListener('mousemove',(e)=>{
            if(is_drawing){
                context.lineWidth = linewidthRef.current
                context.strokeStyle = strokecolorRef.current
                context.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop)
                context.stroke()
            }
            else{
                is_drawing = false
            }
        })

        canvas.addEventListener('mouseup',(e)=>{
            is_drawing = false
        })

        canvas.addEventListener('mouseout',(e)=>{
            is_drawing = false
        })

    },[linewidth,strokeColor])

    
    /**@type {HTMLCanvasElement} */
    const SliderValueChangeHandler = (e) =>{

        const newValue = parseInt(e.target.value)
        
        console.log(newValue)
        setLineWidth(newValue)
        linewidthRef.current = newValue
    }

    const StrokeColorChangeHandler = (value) =>{

        console.log(value)
        setStrokeColor(value)
        strokecolorRef.current = value
    
    }


  return (
    <div className='grid items-center justify-items-center justify-center gap-5'>

        <div className='items-center justify-center justify-items-center'>

            <canvas className='rounded-sm shadow-sm relative' width={800} height={500}  ref={canvasRef}> 
            </canvas>
            {line_width_menu_active ? <Slider className='absolute w-10 left-1/2 transform -translate-x-1/2 ' value={linewidthRef.current} onChange={SliderValueChangeHandler} step={1}/> : null}
            {Color_pallete_menu_active ? <HexColorPicker className='absolute left-1/2 transform -translate-x-1/2 z-20' color={strokecolorRef.current} onChange={StrokeColorChangeHandler}/> : null}
        </div>

        <div className=''>
            <ButtonGroup>
                <Button className='w-15 h-15' onClick={()=>{set_Color_Pallete_Menu_Active(!Color_pallete_menu_active)}}><img src={color_pallete_icon} width={20} height={20}></img></Button>
                <Button className='w-15 h-15' onClick={()=>{set_line_width_Menu_Active(!line_width_menu_active)}}><img src={line_width_icon} width={20} height={20}></img></Button>
                <Button className='w-15 h-15'><img src={icon} width={15} height={15}></img></Button>
            </ButtonGroup>
        </div>


    </div>
  )
}
