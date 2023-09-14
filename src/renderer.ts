import { drawLines } from "./cardinalSpine"
import { cars, raceTrack, toScreen } from "./main"
import { carFitness, evolutionSettings, generation, generationsInfo } from "./neuroEvolution"
import { totalTicks } from "./physics"
import { Camera, Car, RaceTrack } from "./types"
import { Vector2 } from "./vector"

const canvas = document.getElementById('canvas') as HTMLCanvasElement
export const ctx = canvas.getContext('2d')!

canvas.width = window.innerWidth
canvas.height = window.innerHeight

export const camera: Camera = {
  pos: new Vector2(canvas.width/2, canvas.height/2),
  zoom: 1.5,
  lockCar: null
}


export function frame() {

  if(canvas.width !== window.innerWidth) canvas.width = window.innerWidth
  if(canvas.height !== window.innerHeight) canvas.height = window.innerHeight

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  requestAnimationFrame(frame)

  drawRaceTrack(raceTrack)

  drawCars()

  if(camera.lockCar !== null) {
    drawCarInfo(cars[camera.lockCar])
  }

  if(generation !== null) {
    drawEvolutionInfo(generation)
    drawEvolutionGraph()
  }

}

function drawEvolutionInfo(generation: number) {

  let w = 140
  let h = 200
  let x = window.innerWidth - w - 10
  let y = 10

  if(camera.lockCar !== null) {
    y = 220
    x -= 150
  }

  let generationInfo = generationsInfo[generation]
  let ticksLeft = evolutionSettings.generationDuration - (totalTicks - generationInfo.tick)

  drawTable([
    { label: 'gen.', value: `${generation}` }, 
    { label: 'avg fitn.', value: `${generationInfo.averageFitness.toFixed(1)}` },
    { label: 'best fitn.', value: `${generationInfo.bestFitness.toFixed(1)}` },
    { label: 'ticks left', value: `${ticksLeft}` },
    { label: 'best time', value: `${generationInfo.bestTime}` }
  ], x, y, w, h)

  return
}

function drawTable(data: { label: string, value: string }[], x: number, y: number, w: number, h: number) {

  ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
  ctx.fillRect(x, y, w, h)

  ctx.fillStyle = 'white'
  ctx.font = '16px Arial'
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'

  let longestValue = 0
  for(let row of data) {
    let textLength = ctx.measureText(row.value).width
    if(textLength > longestValue) longestValue = textLength
  }

  for(let i = 0; i < data.length; i++) {
    let row = data[i]
    ctx.fillText(`${row.label}`, x+10, y+10 + i*20)
    ctx.fillText(`${row.value}`, x + w - 10 - longestValue, y+10 + i*20)
  }


}

function drawEvolutionGraph() {

  let w = 400
  let h = 200
  let x = window.innerWidth - w - 160
  let y = 10
  let p = 10

  if(camera.lockCar !== null) {
    x -= 340
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
  ctx.fillRect(x, y, w, h)

  let lastGenerationInfo = generationsInfo[generationsInfo.length-1]
  let hasCompleted = lastGenerationInfo.bestTime !== 0

  if(!hasCompleted) {

    let maxFitness = 0
    for(let generationInfo of generationsInfo) if(generationInfo.bestFitness > maxFitness) maxFitness = generationInfo.bestFitness

    let xScale = (w-p*2) / (generationsInfo.length-1)
    let yScale = (h-p*2) / maxFitness

    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(p + x, y + h - p)
    for(let generationIdx in generationsInfo) {
      let generationInfo = generationsInfo[generationIdx]
      ctx.lineTo(p + x + xScale*+generationIdx, y + h - p - yScale*generationInfo.bestFitness)
    }
    ctx.stroke()

    ctx.fillStyle = 'white'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(`best fitness`, x+p, y+p)


  } else {

    let completedGenerations = generationsInfo.filter(generationInfo => generationInfo.bestTime !== 0)

    let maxBestTime = 0
    let minBestTime = Infinity
    for(let generationInfo of completedGenerations) {
      if(generationInfo.bestTime > maxBestTime) maxBestTime = generationInfo.bestTime
      if(generationInfo.bestTime < minBestTime) minBestTime = generationInfo.bestTime
    }

    console.log(minBestTime, maxBestTime)

    let xScale = (w-p*2) / (completedGenerations.length-1)
    let yScale = (h-p*2) / (maxBestTime-minBestTime)

    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(p + x, y + p)
    for(let generationIdx in completedGenerations) {
      let generation = completedGenerations[generationIdx]
      ctx.lineTo(p + x + xScale*+generationIdx, y + p + yScale*(maxBestTime-generation.bestTime))
    }
    ctx.stroke()

    ctx.fillStyle = 'white'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillText(`best time`, x-p+w, y+p)
    
  }

}


function drawCarInfo(car: Car) {

  drawCarSensor(car)

  if(car.control == 'ai') drawCarBrain(car)

  drawCarInfoBox(car)

}

function drawCarSensor(car: Car) {

  let pos = toScreen(car.pos)

  ctx.save()
  ctx.beginPath()
  ctx.translate(pos.x, pos.y)
  ctx.rotate(car.dir)

  let sens = car.sensors
  ctx.lineWidth = camera.zoom/3
  ctx.strokeStyle = "rgb(255, 255, 255)"

  for(let sensorIdx in car.sensorConfig) {
    let sensor = car.sensorConfig[sensorIdx]
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.strokeStyle = "rgb(255, 255, 255)"
    ctx.lineTo(camera.zoom*sensor.x*sens[sensorIdx], camera.zoom*sensor.y*sens[sensorIdx])
    ctx.stroke()
    ctx.strokeStyle = "rgb(0, 0, 0)"
    ctx.beginPath()
    ctx.moveTo(camera.zoom*sensor.x*sens[sensorIdx], camera.zoom*sensor.y*sens[sensorIdx])
    ctx.lineTo(camera.zoom*sensor.x, camera.zoom*sensor.y)
    ctx.stroke()
  }

  ctx.restore()
}

function drawCarInfoBox(car: Car) {

  let w = 140
  let h = 200
  let x = window.innerWidth - w - 10
  let y = 220

  drawTable([
    { label: 'speed', value: `${Math.floor(car.vel*100)/100}` },
    { label: 'direction', value: `${Math.floor(Math.sin(car.dir)*100)/100}` },
    { label: 'progress', value: `${car.progress}` },
    { label: 'lap', value: `${car.lap+1}` },
    { label: 'fitness', value: `${carFitness(car)}` },
  ], x, y, w, h)
}

function drawCarBrain(car: Car) {

  let brain = car.brain!


  let w = 480
  let h = 200
  let x = window.innerWidth - w + 70
  let y = 30

  ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
  ctx.fillRect(x-w/6, y-20, w, h)

  let layers = [brain.inputLayer, ...brain.hiddenLayers, brain.outputLayer]
  let inputLabels = []
  for(let i = 0; i < car.sensorConfig.length; i++) inputLabels.push(`sensor ${i}`)
  inputLabels.push('speed', 'direction')
  let outputLabels = ['accelerate', 'brake', 'steer']

  // draw nodes in layers
  let xoffset = 0
  for(let i = 0; i < layers.length; i++) {
    let yoffset = 0
    for(let j = 0; j < layers[i].length; j++) {
      let color = Math.floor(255*(Math.abs(layers[i][j])))
      color = Math.min(255, color)
      ctx.fillStyle = `rgb(${color}, ${color}, ${color})`
      ctx.beginPath()
      ctx.arc(x+xoffset, y+yoffset, 10, 0, Math.PI*2)
      ctx.fill()

      if(i === 0 || i === layers.length-1) {

        ctx.fillStyle = 'white'
        ctx.font = '12px Arial'
        ctx.textBaseline = 'middle'

        if(i === 0) {
          ctx.textAlign = 'right'
          ctx.fillText(inputLabels[j], x+xoffset-20, y+yoffset)
        } else {
          if(layers[i][j] < 0.9) ctx.fillStyle = 'black'
          if(outputLabels[j] == 'steer') ctx.fillStyle = `rgb(${color}, ${color}, ${color})`
          ctx.textAlign = 'left'
          ctx.fillText(outputLabels[j], x+xoffset-10, y+yoffset+20)
        }

        
      }

      yoffset += h/layers[i].length
    }
    xoffset += w/layers.length
  }

  // draw weights as lines between nodes
  xoffset = 0
  for(let i = 0; i < brain.weights.length; i++) {
    let yoffset = 0
    for(let j = 0; j < brain.weights[i].length; j++) {
      let yoffset2 = 0
      for(let k = 0; k < brain.weights[i][j].length; k++) {
        let color = Math.floor(255*(Math.abs(layers[i][j])))
        ctx.lineWidth = Math.abs(brain.weights[i][j][k]) * 3
        color = Math.min(255, color)
        ctx.strokeStyle = `rgb(${color}, ${color}, ${color})`
        ctx.beginPath()
        ctx.moveTo(x+xoffset, y+yoffset)
        ctx.lineTo(x+xoffset+w/layers.length, y+yoffset2)
        ctx.stroke()
        yoffset2 += h/brain.weights[i][j].length
      }
      yoffset += h/brain.weights[i].length
    }
    xoffset += w/layers.length
  }

  ctx.fill()
}

function drawCars() {
  
  for(let car of cars) {

    let pos = toScreen(car.pos)

    ctx.save()

    if(car.crashed) ctx.globalAlpha = 0.2
    else ctx.globalAlpha = 1

    ctx.beginPath()
    ctx.translate(pos.x, pos.y)
    ctx.rotate(car.dir)
    ctx.fillStyle = `rgb(${car.color[0]}, ${car.color[1]}, ${car.color[2]})`
    ctx.fillRect(-camera.zoom*2, -camera.zoom*1, camera.zoom*4, camera.zoom*2)

    // headlights
    ctx.fillStyle = "rgb(250, 250, 150)"
    let hls = new Vector2(camera.zoom*0.3, camera.zoom*0.5)
    ctx.fillRect(camera.zoom*2 - hls.x, -camera.zoom*0.5  - hls.y/2, hls.x, hls.y)
    ctx.fillRect(camera.zoom*2 - hls.x,  camera.zoom*0.5- hls.y/2, hls.x, hls.y)

    ctx.restore()

  }
}


function drawRaceTrack(raceTrack: RaceTrack) {

  let rt = raceTrack

  ctx.save()
  let points = rt.points.map(p => toScreen(p))
  //let pts = points.map(p => p.toArray()).flat()

	ctx.lineWidth = camera.zoom*20
	ctx.strokeStyle = "rgb(40, 40, 40)"
	drawLines(ctx, rt.curvePointsVecs)

  // draw points
	ctx.fillStyle = "rgb(255, 0, 0)"
	ctx.beginPath()
	for(let point of points) ctx.rect(point.x - 2, point.y - 2, 4, 4)
	ctx.fill()

  // draw outer lines
  let outerPoints = rt.outerPoints.map(p => toScreen(p))
  ctx.strokeStyle = 'rgb(255, 0, 255)'
  ctx.lineWidth = camera.zoom/3
  ctx.beginPath()
  ctx.moveTo(outerPoints[0].x, outerPoints[0].y)
  for(let point in outerPoints) ctx.lineTo(outerPoints[point].x, outerPoints[point].y)
  ctx.closePath()
  ctx.stroke()

  // draw inner lines
  let innerPoints = rt.innerPoints.map(p => toScreen(p))
  ctx.strokeStyle = 'rgb(255, 0, 255)'
  ctx.lineWidth = camera.zoom/3
  ctx.beginPath()
  ctx.moveTo(innerPoints[0].x, innerPoints[0].y)
  for(let point in innerPoints) ctx.lineTo(innerPoints[point].x, innerPoints[point].y)
  ctx.closePath()
  ctx.stroke()

  // ctx.fillStyle = 'rgb(0, 255, 255)'
  // ctx.font = `${camera.zoom}px Arial`
  // for(let point in Object.entries(innerPoints)) {
  //   ctx.beginPath()
  //   ctx.fillText(point, innerPoints[point].x, innerPoints[point].y)
  // }
  // ctx.fill()

  // draw middle lines
  ctx.beginPath()
  ctx.setLineDash([5*camera.zoom / 2, 3*camera.zoom / 2])
	ctx.lineWidth = camera.zoom/3
	ctx.strokeStyle = "rgb(255, 255, 255)"
	drawLines(ctx, rt.curvePointsVecs)
  ctx.stroke()

  ctx.restore()

}