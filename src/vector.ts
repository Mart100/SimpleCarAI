export class Vector2 {
	x: number
	y: number

	constructor(x: number, y?: number) {
		if (y === undefined) {
			this .x = this.y = x
		} else {
			this.x = x
			this.y = y
		}
	}

	add(v: Vector2): Vector2 {
		this.x += v.x
		this.y += v.y
		return this
	}
	
	subtract(v: Vector2): Vector2 {
		this.x -= v.x
		this.y -= v.y
		return this
	}

	multiply(v: Vector2): Vector2 {
		this.x *= v.x
		this.y *= v.y
		return this
	}

	rotate(angle: number): Vector2 {
		let newX = this.x * Math.cos(angle) - this.y * Math.sin(angle)
		let newY = this.x * Math.sin(angle) + this.y * Math.cos(angle)
		
		this.x = newX
		this.y = newY

		return this
	}

	distance(v: Vector2): number {
		return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2))
	}

	dot(v: Vector2): number {
		return this.x * v.x + this.y * v.y
	}

	length(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y)
	}

	angle(): number {
		return Math.atan2(this.y, this.x)
	}

	normalize(): Vector2 {
		let length = this.length()
		this.x /= length
		this.y /= length
		return this
	}

	find3PointAngle(p1: Vector2, p3: Vector2): number {
		let p2 = this
    let AB = Math.sqrt(Math.pow(p2.x-p1.x,2)+ Math.pow(p2.y-p1.y,2))  
    let BC = Math.sqrt(Math.pow(p2.x-p3.x,2)+ Math.pow(p2.y-p3.y,2))
    let AC = Math.sqrt(Math.pow(p3.x-p1.x,2)+ Math.pow(p3.y-p1.y,2))

    return Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB))
	}

	toArray(): number[] {
		return [this.x, this.y]
	}

	clone(): Vector2 {
		return new Vector2(this.x, this.y)
	}
}
