export interface Line {
  color?: string
  width?: number
  dash?: number[]
}

export interface Handler {
  type: "rect" | "circle"
  color?: string
  borderColor?: string
  borderWidth?: number
  padding?: number
  width?: number // For 'rect' handlers
  height?: number // For 'rect' handlers
  radius?: number // For 'circle' handlers
}

export interface Point {
  x: number
  y: number
}

export interface ResizeEventPayload {
  canvas: Point[]
  image: Point[]
}