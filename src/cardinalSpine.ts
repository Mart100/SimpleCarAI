import { raceTrack, toScreen } from "./main"
import { Vector2 } from "./vector"

export function drawLines(ctx: CanvasRenderingContext2D, points: Vector2[]) {

	ctx.beginPath()

	points = points.map(p => toScreen(p))

	ctx.moveTo(points[0].x, points[0].y)
	points.shift()
	for(let p of points) ctx.lineTo(p.x, p.y)

	ctx.closePath()
	ctx.stroke()
}

export function getOffsetPoints(points: Vector2[], offset: number) {

  let offsetLines = new Array<Vector2>()
  for (let i = 1; i < points.length-2; i++) {
    let p1 = points[i]
    let p2 = points[(i+1)%points.length]
		if(p1.x == p2.x && p1.y == p2.y) continue
    let dir = p2.clone().subtract(p1).normalize()
    let normal = new Vector2(-dir.y, dir.x)
    let offsetLine = p1.clone().add(p2).multiply(new Vector2(0.5)).add(normal.multiply(new Vector2(offset)))
    offsetLines.push(offsetLine)
  }

	// remove intersecting lines
	let olen = offsetLines.length
	for (let i = 1; i < olen-1; i++) {
		let p1 = offsetLines[i]
		let p2 = offsetLines[(i+1)%olen]
		for (let k = 2; k < 50; k++) {
			let j = (i+k)%olen
			let offset = j-i
			if(i > j) offset = (olen-i)+j
			let min = Math.min(i, j)
			let p3 = offsetLines[j]
			let p4 = offsetLines[(j+1)%olen]
			if (lineIntersects(p1, p2, p3, p4)) {
				//console.log("intersecting lines", i, j, offset)
				offsetLines.splice(min, offset)
				olen = offsetLines.length
			}
		}
	}

	return offsetLines
}

export function findNearestBorderLines(pos: Vector2, maxDist: number) {

	let nearbyLines: [Vector2, Vector2][] = []

	let ip = raceTrack.innerPoints
	ip.forEach((point, index) => {
		let dist = point.clone().subtract(pos).length()
		if(dist > maxDist) return
		let next = ip[(index + 1) % ip.length]
		let previous = ip[(index - 1 + ip.length) % ip.length]
		nearbyLines.push([point, next], [point, previous])
	})

	let op = raceTrack.outerPoints
	op.forEach((point, index) => {
		let dist = point.clone().subtract(pos).length()
		if(dist > maxDist) return
		let next = op[(index + 1) % op.length]
		let previous = op[(index - 1 + op.length) % op.length]
		nearbyLines.push([point, next], [point, previous])
	})

	return nearbyLines
}

// https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
export function lineIntersects(p1: Vector2, p2: Vector2, p3: Vector2, p4: Vector2) {
  let denom, gamma, lambda
  denom = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y)
  if (denom === 0) return false
  else {
    lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / denom
    gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / denom
    if ((-0.01 < lambda && lambda < 1.01) && (-0.01 < gamma && gamma < 1.01)) {
			let x = p1.x + (lambda * (p2.x - p1.x))
			let y = p1.y + (lambda * (p2.y - p1.y))
			return new Vector2(x, y)
		}
		else return false
  }
}

export function getCurvePoints(pts: number[], tension: number, isClosed: boolean, numOfSegments: number) {

	// use input value if provided, or use a default value   
	tension = (typeof tension != 'undefined') ? tension : 0.5
	isClosed = isClosed ? isClosed : false
	numOfSegments = numOfSegments ? numOfSegments : 16

	var _pts = [], res = [],    // clone array
		x, y,           // our x,y coords
		t1x, t2x, t1y, t2y, // tension vectors
		c1, c2, c3, c4,     // cardinal points
		st, t, i;       // steps based on num. of segments

	// clone array so we don't change the original
	_pts = pts.slice(0)

	// The algorithm require a previous and next point to the actual point array.
	// Check if we will draw closed or open curve.
	// If closed, copy end points to beginning and first points to end
	// If open, duplicate first points to befinning, end points to end
	if (isClosed) {
		_pts.unshift(pts[pts.length - 1])
		_pts.unshift(pts[pts.length - 2])
		_pts.unshift(pts[pts.length - 1])
		_pts.unshift(pts[pts.length - 2])
		_pts.push(pts[0])
		_pts.push(pts[1])
	}
	else {
		_pts.unshift(pts[1])   //copy 1. point and insert at beginning
		_pts.unshift(pts[0])
		_pts.push(pts[pts.length - 2]) //copy last point and append
		_pts.push(pts[pts.length - 1])
	}

	// ok, lets start..

	// 1. loop goes through point array
	// 2. loop goes through each segment between the 2 pts + 1e point before and after
	for (i=2; i < (_pts.length - 4); i+=2) {
		for (t=0; t <= numOfSegments; t++) {

			// calc tension vectors
			t1x = (_pts[i+2] - _pts[i-2]) * tension
			t2x = (_pts[i+4] - _pts[i]) * tension

			t1y = (_pts[i+3] - _pts[i-1]) * tension
			t2y = (_pts[i+5] - _pts[i+1]) * tension

			// calc step
			st = t / numOfSegments

			// calc cardinals
			c1 =   2 * Math.pow(st, 3)  - 3 * Math.pow(st, 2) + 1
			c2 = -(2 * Math.pow(st, 3)) + 3 * Math.pow(st, 2)
			c3 =       Math.pow(st, 3)  - 2 * Math.pow(st, 2) + st
			c4 =       Math.pow(st, 3)  -     Math.pow(st, 2)

			// calc x and y cords with common control vectors
			x = c1 * _pts[i]    + c2 * _pts[i+2] + c3 * t1x + c4 * t2x
			y = c1 * _pts[i+1]  + c2 * _pts[i+3] + c3 * t1y + c4 * t2y

			//store points in array
			res.push(x)
			res.push(y)

		}
	}

	return res
}