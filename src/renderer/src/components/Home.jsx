import React, {useEffect, useRef, useState} from 'react'

export default function Home() {

    const canvasRef = useRef(null)

    const [drawing,setDrawing] = useState(false)

    useEffect(()=>{

        /**@type {HTMLCanvasElement} */
        const canvas = canvasRef.current


        const context = canvas.getContext("2d")

        let is_drawing = false

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

    })

  return (
    <div className='flex items-center justify-items-center justify-center'>

        <canvas className='rounded-sm shadow-sm' width={800} height={500}  ref={canvasRef}> 

        </canvas>


    </div>
  )
}
