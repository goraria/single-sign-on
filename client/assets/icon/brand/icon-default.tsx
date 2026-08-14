import { useId, type SVGProps } from "react"

interface IconDefaultProps extends SVGProps<SVGSVGElement> {
  title?: string
}

export interface BrandIconColorIds {
  royal: string
  goldMetal: string
  darkMetal: string
  silverMetal: string
}

type Coordinate = readonly [x: number, y: number]

export function brandColor(id: string): BrandIconColorIds {
  return {
    royal: `${id}-royal`,
    goldMetal: `${id}-gold-metal`,
    darkMetal: `${id}-dark-metal`,
    silverMetal: `${id}-silver-metal`,
  }
}

export function BrandIconColors({
  royal,
  goldMetal,
  darkMetal,
  silverMetal,
}: BrandIconColorIds) {
  return (
    <>
      <linearGradient id={royal} x1="1" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#8C6B3B" />
        <stop offset="25%" stopColor="#A08D57" />
        <stop offset="50%" stopColor="#B08D57" />
        <stop offset="75%" stopColor="#C89B41" />
        <stop offset="100%" stopColor="#D4AF37" />
      </linearGradient>

      <linearGradient id={goldMetal} x1="1" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#C5AB50" />
        <stop offset="25%" stopColor="#E4D674" />
        <stop offset="50%" stopColor="#FBF8AE" />
        <stop offset="75%" stopColor="#F9FADE" />
        <stop offset="100%" stopColor="#AC933E" />
      </linearGradient>

      <linearGradient id={darkMetal} x1="1" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#191919" />
        <stop offset="25%" stopColor="#393939" />
        <stop offset="50%" stopColor="#4B4B4B" />
        <stop offset="75%" stopColor="#535353" />
        <stop offset="100%" stopColor="#5D5D5D" />
      </linearGradient>

      <linearGradient id={silverMetal} x1="1" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#B4B5B8" />
        <stop offset="25%" stopColor="#C0C0C3" />
        <stop offset="50%" stopColor="#CBCCCD" />
        <stop offset="75%" stopColor="#D7D7D8" />
        <stop offset="100%" stopColor="#E3E3E3" />
      </linearGradient>
    </>
  )
}

export function points(...coordinates: Coordinate[]): string {
  const center = 1024
  const step = 256 / 5
  const squareRootOfThree = Math.sqrt(3)

  function x(position: number): number {
    return center + position * step * squareRootOfThree
  }
  function y(position: number): number {
    return center + position * step
  }
  function point([horizontal, vertical]: Coordinate): string {
    return `${x(horizontal)},${y(vertical)}`
  }

  return coordinates.map(point).join(" ")
}

export function IconDefault({ title, ...props }: IconDefaultProps) {
  const id = useId().replaceAll(":", "")
  const titleId = title ? `${id}-title` : undefined
  const { royal, goldMetal, darkMetal, silverMetal } = brandColor(id)

  return (
    <svg
      width="512"
      height="512"
      viewBox="512 512 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-labelledby={titleId}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...props}
    >
      {title && <title id={titleId}>{title}</title>}

      <defs>
        <BrandIconColors
          royal={royal}
          goldMetal={goldMetal}
          darkMetal={darkMetal}
          silverMetal={silverMetal}
        />
      </defs>

      <polygon points={points([0, -8], [0, -6], [3, -3], [3, -5])} fill={`url(#${silverMetal})`} />
      <polygon points={points([0, -8], [0, -6], [-3, -3], [-3, -5])} fill={`url(#${darkMetal})`} />
      <polygon points={points([0, -2], [0, -4], [1, -5], [1, -3])} fill={`url(#${darkMetal})`} />
      <polygon points={points([0, -2], [0, -4], [-1, -5], [-1, -3])} fill={`url(#${silverMetal})`} />
      <polygon
        points={points([0, 0], [-5, -5], [0, -10], [5, -5], [0, 0], [0, -2], [-3, -5], [0, -8], [3, -5], [0, -2])}
        fillRule="evenodd"
        fill={`url(#${goldMetal})`}
      />

      <polygon points={points([-4, 2], [-4, 4], [-3, 3], [-3, 1])} fill={`url(#${darkMetal})`} />
      <polygon points={points([-1, 3], [0, 2], [-4, -2], [-5, -1])} fill={`url(#${goldMetal})`} />
      <polygon
        points={points([0, 0], [0, 6], [-4, 2], [-4, 4], [0, 8], [0, 10], [-5, 5], [-5, -1], [-1, 3], [-1, 1], [-5, -3], [-5, -5])}
        fill={`url(#${silverMetal})`}
      />

      <polygon points={points([4, 2], [4, 4], [3, 3], [3, 1])} fill={`url(#${silverMetal})`} />
      <polygon points={points([1, 3], [0, 2], [4, -2], [5, -1])} fill={`url(#${goldMetal})`} />
      <polygon
        points={points([0, 0], [0, 6], [4, 2], [4, 4], [0, 8], [0, 10], [5, 5], [5, -1], [1, 3], [1, 1], [5, -3], [5, -5])}
        fill={`url(#${darkMetal})`}
      />

      <polygon points={points([0, 6], [-3, 3], [-4, 4], [0, 8], [4, 4], [3, 3])} fill={`url(#${goldMetal})`} />
      
      {/* Royal */}
      <polygon points={points([0, -6], [1, -5], [0, -4], [-1, -5])} fill={`url(#${royal})`} />
      <polygon points={points([-3, 3], [-3, 1], [-2, 2], [-2, 4])} fill={`url(#${royal})`} />
      <polygon points={points([3, 1], [2, 2], [2, 4], [3, 3])} fill={`url(#${royal})`} />

      {/* <polygon points={points([0, -8], [0, -6], [3, -3], [3, -5])} fill={`url(#${silverMetal})`} />
      <polygon points={points([0, -8], [0, -6], [-3, -3], [-3, -5])} fill={`url(#${darkMetal})`} />
      <polygon points={points([0, -2], [0, -4], [1, -5], [1, -3])} fill={`url(#${darkMetal})`} />
      <polygon points={points([0, -2], [0, -4], [-1, -5], [-1, -3])} fill={`url(#${silverMetal})`} />
      <polygon
        points={points([0, 0], [-5, -5], [0, -10], [5, -5], [0, 0], [0, -2], [-3, -5], [0, -8], [3, -5], [0, -2])}
        fillRule="evenodd"
        fill={`url(#${goldMetal})`}
      />
      <polygon points={points([0, -6], [1, -5], [0, -4], [-1, -5])} fill={`url(#${royal})`} />

      <polygon points={points([-2, 8], [-2, 4], [-1, 3], [-1, 7])} fill={`url(#${darkMetal})`} />
      <polygon points={points([-5, 3], [-4, 2], [-2, 4], [-3, 5])} fill={`url(#${goldMetal})`} />
      <polygon points={points([-5, 5], [-5, 3], [-3, 5], [-3, 3], [-2, 4], [-2, 8])} fill={`url(#${silverMetal})`} />
      <polygon points={points([-1, 3], [-4, 0], [-3, -1], [0, 2])} fill={`url(#${goldMetal})`} />
      <polygon points={points([-4, -2], [-4, 0], [-3, -1], [-3, -3])} fill={`url(#${darkMetal})`} />
      <polygon
        points={points([0, 0], [0, 10], [-1, 9], [-1, 5], [-5, 1], [-5, -5], [-1, -1], [-1, 1], [-4, -2], [-4, 0], [-1, 3], [-1, -1])}
        fill={`url(#${silverMetal})`}
      />
      <polygon points={points([-3, 3], [-3, 1], [-2, 2], [-2, 4])} fill={`url(#${royal})`} />

      <polygon points={points([4, 2], [4, 4], [3, 3], [3, 1])} fill={`url(#${silverMetal})`} />
      <polygon points={points([0, 6], [1, 7], [4, 4], [3, 3])} fill={`url(#${goldMetal})`} />
      <polygon points={points([2, 4], [2, 2], [1, 1], [1, 3])} fill={`url(#${silverMetal})`} />
      <polygon points={points([2, 2], [1, 1], [4, -2], [5, -1])} fill={`url(#${goldMetal})`} />
      <polygon
        points={points([0, 0], [0, 10], [5, 5], [5, -1], [2, 2], [2, 4], [4, 2], [4, 4], [1, 7], [1, 1], [5, -3], [5, -5])}
        fill={`url(#${darkMetal})`}
      />
      <polygon points={points([3, 1], [2, 2], [2, 4], [3, 3])} fill={`url(#${royal})`} /> */}
    </svg>
  )
}
