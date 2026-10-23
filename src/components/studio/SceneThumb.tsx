import { useEffect, useRef } from 'react'
import type { Scene } from '@/lib/types'
import { drawProcedural } from '@/engine/visuals'
import { cn } from '@/lib/utils'

/** Scene thumbnail: the uploaded/generated image, or locally-drawn artwork. */
export function SceneThumb({
  scene,
  className,
  width = 480,
  height = 270,
}: {
  scene: Scene
  className?: string
  width?: number
  height?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (scene.visual.dataUrl) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    drawProcedural(ctx, canvas.width, canvas.height, scene.visual.seed, scene.visual.palette)
  }, [scene.visual.seed, scene.visual.palette, scene.visual.dataUrl, width, height])

  if (scene.visual.dataUrl) {
    return <img src={scene.visual.dataUrl} alt="" className={cn('h-full w-full object-cover', className)} />
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      aria-hidden="true"
      className={cn('h-full w-full object-cover', className)}
    />
  )
}
