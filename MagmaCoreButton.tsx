
/**
 * Made with 💛 by Karim Saif
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 520
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */

import * as React from "react"
import {
    addPropertyControls,
    ControlType,
    useIsStaticRenderer,
} from "framer"

type Preset =
    | "volcanic"
    | "inferno"
    | "blue"
    | "toxic"
    | "gold"
    | "custom"

type Quality = "low" | "medium" | "high"

type Point = {
    x: number
    y: number
}

type Particle = {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
    radius: number
}

type Palette = {
    crust: string
    lava: string
    hot: string
    glow: string
    crack: string
}

interface Props {
    label: string
    font: React.CSSProperties
    backgroundColor: string
    preset: Preset
    crustColor: string
    lavaColor: string
    hotColor: string
    glowColor: string
    crackColor: string
    textColor: string
    buttonHeight: number
    buttonPadding: number
    cornerRadius: number
    lavaIntensity: number
    lavaScale: number
    lavaSpeed: number
    lavaFlow: number
    crustThickness: number
    crustRoughness: number
    crackDensity: number
    crackWidth: number
    crackGlow: number
    coreBrightness: number
    heatGlow: number
    heatDistortion: number
    surfaceGloss: number
    shadowIntensity: number
    cursorInteraction: boolean
    cursorRadius: number
    cursorHeat: number
    cursorFlow: number
    clickEruption: boolean
    eruptionStrength: number
    eruptionDuration: number
    particlesEnabled: boolean
    particleCount: number
    particleSize: number
    pressScale: number
    autoplay: boolean
    quality: Quality
    paused: boolean
    onClick?: () => void
    style?: React.CSSProperties
}

const TAU = Math.PI * 2

const clamp = (v: number, a: number, b: number) =>
    Math.max(a, Math.min(b, v))

const lerp = (a: number, b: number, t: number) =>
    a + (b - a) * t

const smoothstep = (a: number, b: number, x: number) => {
    const t = clamp(
        (x - a) / Math.max(0.00001, b - a),
        0,
        1
    )
    return t * t * (3 - 2 * t)
}

const fract = (v: number) => v - Math.floor(v)

function hash(x: number, y: number) {
    return fract(
        Math.sin(x * 127.1 + y * 311.7) *
            43758.5453123
    )
}

function noise(x: number, y: number) {
    const ix = Math.floor(x)
    const iy = Math.floor(y)

    const fx = fract(x)
    const fy = fract(y)

    const ux = fx * fx * (3 - 2 * fx)
    const uy = fy * fy * (3 - 2 * fy)

    const a = hash(ix, iy)
    const b = hash(ix + 1, iy)
    const c = hash(ix, iy + 1)
    const d = hash(ix + 1, iy + 1)

    return lerp(
        lerp(a, b, ux),
        lerp(c, d, ux),
        uy
    )
}

function fbm(x: number, y: number) {
    let value = 0
    let amplitude = 0.5
    let frequency = 1
    let total = 0

    for (let i = 0; i < 4; i++) {
        value +=
            noise(x * frequency, y * frequency) *
            amplitude

        total += amplitude
        frequency *= 2
        amplitude *= 0.5
    }

    return value / Math.max(0.001, total)
}

function parseColor(
    input: string
): [number, number, number] {
    const color = (input || "").trim()
    const hex = color.replace("#", "")

    if (/^[0-9a-f]{3}$/i.test(hex)) {
        return [
            parseInt(hex[0] + hex[0], 16),
            parseInt(hex[1] + hex[1], 16),
            parseInt(hex[2] + hex[2], 16),
        ]
    }

    if (/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) {
        return [
            parseInt(hex.slice(0, 2), 16),
            parseInt(hex.slice(2, 4), 16),
            parseInt(hex.slice(4, 6), 16),
        ]
    }

    const rgb = color.match(
        /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/
    )

    if (rgb) {
        return [
            clamp(Number(rgb[1]), 0, 255),
            clamp(Number(rgb[2]), 0, 255),
            clamp(Number(rgb[3]), 0, 255),
        ]
    }

    return [255, 90, 20]
}

function rgba(color: string, opacity: number) {
    const c = parseColor(color)

    return `rgba(${c[0]},${c[1]},${c[2]},${clamp(
        opacity,
        0,
        1
    )})`
}

function blend(
    a: [number, number, number],
    b: [number, number, number],
    t: number
): [number, number, number] {
    return [
        lerp(a[0], b[0], t),
        lerp(a[1], b[1], t),
        lerp(a[2], b[2], t),
    ]
}

function paletteFor(
    preset: Preset,
    custom: Palette
): Palette {
    switch (preset) {
        case "inferno":
            return {
                crust: "#170707",
                lava: "#FF3214",
                hot: "#FFF2A3",
                glow: "#FF2600",
                crack: "#FF8B24",
            }
        case "blue":
            return {
                crust: "#07121E",
                lava: "#168DFF",
                hot: "#D6FAFF",
                glow: "#075CFF",
                crack: "#61C8FF",
            }
        case "toxic":
            return {
                crust: "#0B170C",
                lava: "#60E529",
                hot: "#E8FF9E",
                glow: "#35C922",
                crack: "#A7FF50",
            }
        case "gold":
            return {
                crust: "#1B1209",
                lava: "#FFAE21",
                hot: "#FFF4BE",
                glow: "#E77B0C",
                crack: "#FFD26A",
            }
        case "custom":
            return custom
        default:
            return {
                crust: "#18110F",
                lava: "#F34A14",
                hot: "#FFE7A1",
                glow: "#F12708",
                crack: "#FF8C32",
            }
    }
}

function roundedPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
) {
    const r = clamp(radius, 0, Math.min(w, h) / 2)

    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
}

function createLavaTexture(
    width: number,
    height: number,
    time: number,
    cursor: Point,
    cursorActivity: number,
    eruption: number,
    props: Props,
    palette: Palette
): HTMLCanvasElement {
    const canvas = document.createElement("canvas")

    const resolution =
        props.quality === "high"
            ? 0.55
            : props.quality === "medium"
              ? 0.42
              : 0.3

    const w = clamp(
        Math.round(width * resolution),
        1,
        500
    )

    const h = clamp(
        Math.round(height * resolution),
        1,
        250
    )

    canvas.width = w
    canvas.height = h

    const ctx = canvas.getContext("2d")

    if (!ctx) return canvas

    const image = ctx.createImageData(w, h)
    const data = image.data

    const crust = parseColor(palette.crust)
    const lava = parseColor(palette.lava)
    const hot = parseColor(palette.hot)

    const scale = Math.max(0.1, props.lavaScale)
    const flow = props.lavaFlow
    const speed = props.lavaSpeed

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const u = x / w
            const v = y / h

            const nx =
                u * scale * 5 +
                time * speed * 0.12

            const ny =
                v * scale * 3 -
                time * speed * flow * 0.15

            const warpX =
                fbm(nx + 2.7, ny + 1.2) * 2 - 1

            const warpY =
                fbm(nx + 7.1, ny + 4.3) * 2 - 1

            const field = fbm(
                nx + warpX * 1.5,
                ny + warpY * 1.5
            )

            const ridge =
                1 -
                Math.abs(
                    2 *
                        fbm(
                            nx * 1.7 + warpY,
                            ny * 1.7 + warpX
                        ) -
                        1
                )

            let heat =
                field * 0.75 +
                ridge * 0.25

            const px = u * width
            const py = v * height

            const cursorDistance = Math.hypot(
                px - cursor.x,
                py - cursor.y
            )

            const cursorInfluence =
                (1 -
                    smoothstep(
                        0,
                        props.cursorRadius,
                        cursorDistance
                    )) *
                cursorActivity

            heat +=
                cursorInfluence *
                props.cursorHeat *
                0.3

            heat += eruption * 0.22

            const crackThreshold =
                0.57 -
                props.crackDensity * 0.11

            const molten = smoothstep(
                crackThreshold -
                    props.crackWidth * 0.08,
                crackThreshold +
                    props.crackWidth * 0.08,
                heat
            )

            const hotness = smoothstep(
                0.65,
                0.92,
                heat
            )

            const base = blend(
                crust,
                lava,
                molten * props.lavaIntensity
            )

            const final = blend(
                base,
                hot,
                hotness *
                    molten *
                    props.coreBrightness
            )

            const index = (y * w + x) * 4

            data[index] = clamp(final[0], 0, 255)
            data[index + 1] = clamp(final[1], 0, 255)
            data[index + 2] = clamp(final[2], 0, 255)
            data[index + 3] = 255
        }
    }

    ctx.putImageData(image, 0, 0)

    return canvas
}

function drawMagma(
    ctx: CanvasRenderingContext2D,
    pill: {
        x: number
        y: number
        w: number
        h: number
        radius: number
    },
    time: number,
    cursor: Point,
    cursorActivity: number,
    eruption: number,
    props: Props,
    palette: Palette
) {
    const { x, y, w, h, radius } = pill

    ctx.save()

    ctx.shadowColor = palette.glow
    ctx.shadowBlur =
        props.heatGlow * (18 + eruption * 25)
    ctx.shadowOffsetY = 10 * props.shadowIntensity

    roundedPath(ctx, x, y, w, h, radius)

    ctx.fillStyle = palette.crust
    ctx.fill()

    ctx.restore()

    ctx.save()

    roundedPath(ctx, x, y, w, h, radius)
    ctx.clip()

    const texture = createLavaTexture(
        w,
        h,
        time,
        {
            x: cursor.x - x,
            y: cursor.y - y,
        },
        cursorActivity,
        eruption,
        props,
        palette
    )

    ctx.imageSmoothingEnabled = true
    ctx.drawImage(texture, x, y, w, h)

    const shading = ctx.createLinearGradient(
        x,
        y,
        x,
        y + h
    )

    shading.addColorStop(
        0,
        "rgba(0,0,0,.38)"
    )
    shading.addColorStop(
        0.25,
        "rgba(0,0,0,.02)"
    )
    shading.addColorStop(
        0.75,
        "rgba(0,0,0,.08)"
    )
    shading.addColorStop(
        1,
        "rgba(0,0,0,.5)"
    )

    ctx.fillStyle = shading
    ctx.fillRect(x, y, w, h)

    const gloss = ctx.createLinearGradient(
        x,
        y,
        x + w * 0.3,
        y + h
    )

    gloss.addColorStop(
        0,
        `rgba(255,255,255,${clamp(
            props.surfaceGloss * 0.25,
            0,
            1
        )})`
    )
    gloss.addColorStop(
        0.3,
        "rgba(255,255,255,0)"
    )
    gloss.addColorStop(
        1,
        `rgba(255,255,255,${clamp(
            props.surfaceGloss * 0.1,
            0,
            1
        )})`
    )

    ctx.fillStyle = gloss
    ctx.fillRect(x, y, w, h)

    ctx.restore()

    ctx.save()

    roundedPath(ctx, x, y, w, h, radius)

    ctx.strokeStyle = rgba(
        palette.crack,
        0.45 + eruption * 0.35
    )

    ctx.lineWidth = Math.max(
        1,
        props.crustThickness
    )

    ctx.shadowColor = palette.glow
    ctx.shadowBlur =
        props.crackGlow * 12 +
        eruption * 18

    ctx.stroke()

    ctx.restore()

    ctx.save()

    roundedPath(
        ctx,
        x + 3,
        y + 3,
        Math.max(1, w - 6),
        Math.max(1, h - 6),
        Math.max(0, radius - 3)
    )

    ctx.strokeStyle = rgba(
        palette.hot,
        0.12 * props.surfaceGloss
    )

    ctx.lineWidth = 1
    ctx.stroke()

    ctx.restore()
}

const defaults: Props = {
    label: "UNLEASH THE CORE",
    font: {
        fontFamily: "Inter",
        fontSize: 22,
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: "-0.025em",
    },
    backgroundColor: "#090707",
    preset: "volcanic",
    crustColor: "#18110F",
    lavaColor: "#F34A14",
    hotColor: "#FFE7A1",
    glowColor: "#F12708",
    crackColor: "#FF8C32",
    textColor: "#FFFFFF",
    buttonHeight: 100,
    buttonPadding: 68,
    cornerRadius: 999,
    lavaIntensity: 1,
    lavaScale: 1,
    lavaSpeed: 1,
    lavaFlow: 1,
    crustThickness: 2,
    crustRoughness: 1,
    crackDensity: 1,
    crackWidth: 0.6,
    crackGlow: 1,
    coreBrightness: 1,
    heatGlow: 1,
    heatDistortion: 0.6,
    surfaceGloss: 0.8,
    shadowIntensity: 0.6,
    cursorInteraction: true,
    cursorRadius: 260,
    cursorHeat: 1,
    cursorFlow: 0.7,
    clickEruption: true,
    eruptionStrength: 1,
    eruptionDuration: 850,
    particlesEnabled: true,
    particleCount: 24,
    particleSize: 2,
    pressScale: 0.94,
    autoplay: true,
    quality: "medium",
    paused: false,
}

export default function KarimSaifMagmaCoreButton(
    incoming: Props
) {
    const props = { ...defaults, ...incoming }

    const {
        label,
        font,
        backgroundColor,
        preset,
        crustColor,
        lavaColor,
        hotColor,
        glowColor,
        crackColor,
        textColor,
        buttonHeight,
        buttonPadding,
        cornerRadius,
        lavaIntensity,
        lavaScale,
        lavaSpeed,
        lavaFlow,
        crustThickness,
        crustRoughness,
        crackDensity,
        crackWidth,
        crackGlow,
        coreBrightness,
        heatGlow,
        heatDistortion,
        surfaceGloss,
        shadowIntensity,
        cursorInteraction,
        cursorRadius,
        cursorHeat,
        cursorFlow,
        clickEruption,
        eruptionStrength,
        eruptionDuration,
        particlesEnabled,
        particleCount,
        particleSize,
        pressScale,
        autoplay,
        quality,
        paused,
        onClick,
        style,
    } = props

    const staticRenderer = useIsStaticRenderer()

    const stageRef = React.useRef<HTMLDivElement>(null)
    const canvasRef = React.useRef<HTMLCanvasElement>(null)
    const buttonRef = React.useRef<HTMLButtonElement>(null)

    const pointerRef = React.useRef({
        x: 0,
        y: 0,
        inside: false,
    })

    const pressedRef = React.useRef(false)
    const wakeRef = React.useRef<() => void>(() => {})
    const eruptionRef = React.useRef<() => void>(() => {})

    const [reducedMotion, setReducedMotion] =
        React.useState(false)

    React.useEffect(() => {
        if (typeof window === "undefined") return

        const query = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        )

        const update = () =>
            setReducedMotion(query.matches)

        update()

        if (query.addEventListener) {
            query.addEventListener("change", update)
        } else {
            query.addListener(update)
        }

        return () => {
            if (query.removeEventListener) {
                query.removeEventListener("change", update)
            } else {
                query.removeListener(update)
            }
        }
    }, [])

    const staticMode =
        staticRenderer || reducedMotion || paused

    const palette = React.useMemo(
        () =>
            paletteFor(preset, {
                crust: crustColor,
                lava: lavaColor,
                hot: hotColor,
                glow: glowColor,
                crack: crackColor,
            }),
        [
            preset,
            crustColor,
            lavaColor,
            hotColor,
            glowColor,
            crackColor,
        ]
    )

    const handleMove = React.useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const stage = stageRef.current
            if (!stage) return

            const rect = stage.getBoundingClientRect()

            pointerRef.current.x =
                (event.clientX - rect.left) *
                (stage.offsetWidth / Math.max(1, rect.width))

            pointerRef.current.y =
                (event.clientY - rect.top) *
                (stage.offsetHeight / Math.max(1, rect.height))

            pointerRef.current.inside = true
            wakeRef.current()
        },
        []
    )

    const handleLeave = React.useCallback(() => {
        pointerRef.current.inside = false
        wakeRef.current()
    }, [])

    const handleDown = React.useCallback(() => {
        pressedRef.current = true
        eruptionRef.current()
        wakeRef.current()
    }, [])

    const handleUp = React.useCallback(() => {
        pressedRef.current = false
        wakeRef.current()
    }, [])

    React.useEffect(() => {
        const stage = stageRef.current
        const canvas = canvasRef.current
        const button = buttonRef.current

        if (!stage || !canvas || !button) return

        const ctx = canvas.getContext("2d", {
            alpha: true,
        })

        if (!ctx) return

        const particles: Particle[] = []

        let width = 1
        let height = 1
        let dpr = 1
        let frame = 0
        let disposed = false
        let inView = true
        let pageVisible = !document.hidden

        let lastTime = 0
        let lastPaint = 0
        let elapsed = 0
        let eruptionStart = -Infinity
        let press = 1
        let cursorX = 0
        let cursorY = 0

        const resize = () => {
            width = Math.max(1, stage.offsetWidth)
            height = Math.max(1, stage.offsetHeight)

            const maxDpr =
                quality === "high"
                    ? 2
                    : quality === "medium"
                      ? 1.5
                      : 1

            dpr = Math.min(
                window.devicePixelRatio || 1,
                maxDpr
            )

            const maxPixels =
                quality === "high"
                    ? 1600000
                    : quality === "medium"
                      ? 900000
                      : 500000

            const pixels =
                width * height * dpr * dpr

            if (pixels > maxPixels) {
                dpr *= Math.sqrt(
                    maxPixels / pixels
                )
            }

            const pixelWidth = Math.max(
                1,
                Math.round(width * dpr)
            )

            const pixelHeight = Math.max(
                1,
                Math.round(height * dpr)
            )

            if (canvas.width !== pixelWidth) {
                canvas.width = pixelWidth
            }

            if (canvas.height !== pixelHeight) {
                canvas.height = pixelHeight
            }

            ctx.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            )
        }

        const spawnParticles = () => {
            if (!particlesEnabled) return

            const count = clamp(
                Math.round(particleCount),
                0,
                100
            )

            for (let i = 0; i < count; i++) {
                const angle = Math.random() * TAU
                const velocity =
                    40 +
                    Math.random() *
                        150 *
                        eruptionStrength

                const life =
                    0.35 +
                    Math.random() * 0.75

                particles.push({
                    x: width / 2,
                    y: height / 2,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity,
                    life,
                    maxLife: life,
                    radius: particleSize,
                })
            }

            if (particles.length > 100) {
                particles.splice(
                    0,
                    particles.length - 100
                )
            }
        }

        const triggerEruption = () => {
            if (
                staticMode ||
                !clickEruption
            ) {
                return
            }

            eruptionStart = performance.now()
            spawnParticles()
            wakeRef.current()
        }

        eruptionRef.current = triggerEruption

        const paint = (
            now: number,
            animate: boolean
        ) => {
            const dt = lastTime
                ? Math.min(
                      0.04,
                      (now - lastTime) / 1000
                  )
                : 0.016

            lastTime = now

            if (animate) {
                elapsed += dt
            }

            const pointer = pointerRef.current

            const targetX = pointer.inside
                ? pointer.x
                : width / 2

            const targetY = pointer.inside
                ? pointer.y
                : height / 2

            if (cursorX === 0 && cursorY === 0) {
                cursorX = targetX
                cursorY = targetY
            }

            const smoothing = animate
                ? 1 - Math.exp(-dt * 12)
                : 1

            cursorX = lerp(
                cursorX,
                targetX,
                smoothing
            )

            cursorY = lerp(
                cursorY,
                targetY,
                smoothing
            )

            const buttonW = button.offsetWidth
            const buttonH = button.offsetHeight

            const pill = {
                x: (width - buttonW) / 2,
                y: (height - buttonH) / 2,
                w: buttonW,
                h: buttonH,
                radius: Math.min(
                    cornerRadius,
                    buttonW / 2,
                    buttonH / 2
                ),
            }

            const distance = Math.hypot(
                cursorX - width / 2,
                cursorY - height / 2
            )

            const cursorActivity =
                animate &&
                cursorInteraction &&
                pointer.inside
                    ? 1 -
                      smoothstep(
                          0,
                          cursorRadius,
                          distance
                      )
                    : 0

            const eruptionElapsed =
                now - eruptionStart

            const duration = Math.max(
                100,
                eruptionDuration
            )

            const eruption =
                animate &&
                eruptionElapsed >= 0 &&
                eruptionElapsed < duration
                    ? Math.sin(
                          (eruptionElapsed /
                              duration) *
                              Math.PI
                      ) *
                      eruptionStrength
                    : 0

            const targetPress =
                animate && pressedRef.current
                    ? pressScale
                    : 1

            press = lerp(
                press,
                targetPress,
                animate
                    ? 1 - Math.exp(-dt * 18)
                    : 1
            )

            ctx.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            )

            ctx.clearRect(
                0,
                0,
                width,
                height
            )

            ctx.save()
            ctx.translate(
                width / 2,
                height / 2
            )
            ctx.scale(press, press)
            ctx.translate(
                -width / 2,
                -height / 2
            )

            drawMagma(
                ctx,
                pill,
                elapsed,
                {
                    x: cursorX,
                    y: cursorY,
                },
                cursorActivity,
                eruption,
                props,
                palette
            )

            ctx.restore()

            for (
                let i = particles.length - 1;
                i >= 0;
                i--
            ) {
                const particle = particles[i]

                if (animate) {
                    particle.life -= dt
                    particle.x +=
                        particle.vx * dt
                    particle.y +=
                        particle.vy * dt

                    particle.vx *=
                        Math.exp(-dt * 1.6)

                    particle.vy +=
                        80 * dt
                }

                if (particle.life <= 0) {
                    particles.splice(i, 1)
                    continue
                }

                const opacity =
                    particle.life /
                    particle.maxLife

                ctx.save()
                ctx.globalAlpha = opacity
                ctx.fillStyle = palette.hot
                ctx.shadowColor = palette.glow
                ctx.shadowBlur =
                    heatGlow * 10

                ctx.beginPath()
                ctx.arc(
                    particle.x,
                    particle.y,
                    particle.radius,
                    0,
                    TAU
                )
                ctx.fill()
                ctx.restore()
            }

            button.style.transform = animate
                ? `scale(${press})`
                : "none"

            return (
                autoplay ||
                pointer.inside ||
                pressedRef.current ||
                eruption > 0.001 ||
                particles.length > 0 ||
                Math.abs(press - 1) > 0.001
            )
        }

        const loop = (now: number) => {
            frame = 0

            if (
                disposed ||
                !inView ||
                !pageVisible ||
                staticMode
            ) {
                return
            }

            const fps =
                quality === "low"
                    ? 30
                    : quality === "medium"
                      ? 45
                      : 60

            if (
                lastPaint &&
                now - lastPaint <
                    1000 / fps - 1
            ) {
                frame =
                    requestAnimationFrame(loop)
                return
            }

            lastPaint = now

            const active = paint(
                now,
                true
            )

            if (active) {
                frame =
                    requestAnimationFrame(loop)
            }
        }

        const wake = () => {
            if (
                disposed ||
                !inView ||
                !pageVisible ||
                staticMode ||
                frame
            ) {
                return
            }

            lastTime = 0
            lastPaint = 0

            frame =
                requestAnimationFrame(loop)
        }

        const stop = () => {
            if (frame) {
                cancelAnimationFrame(frame)
                frame = 0
            }

            lastTime = 0
            lastPaint = 0
        }

        wakeRef.current = wake

        const observer =
            typeof IntersectionObserver !==
            "undefined"
                ? new IntersectionObserver(
                      ([entry]) => {
                          inView =
                              entry?.isIntersecting ??
                              false

                          if (inView) {
                              wake()
                          } else {
                              stop()
                          }
                      },
                      { threshold: 0.01 }
                  )
                : null

        observer?.observe(stage)

        const resizeObserver =
            typeof ResizeObserver !==
            "undefined"
                ? new ResizeObserver(() => {
                      resize()

                      if (staticMode) {
                          paint(
                              performance.now(),
                              false
                          )
                      } else {
                          wake()
                      }
                  })
                : null

        resizeObserver?.observe(stage)
        resizeObserver?.observe(button)

        const onVisibility = () => {
            pageVisible =
                !document.hidden

            if (pageVisible) {
                wake()
            } else {
                stop()
            }
        }

        document.addEventListener(
            "visibilitychange",
            onVisibility
        )

        resize()

        if (staticMode) {
            paint(0, false)
        } else {
            wake()
        }

        return () => {
            disposed = true
            stop()

            wakeRef.current = () => {}
            eruptionRef.current = () => {}

            observer?.disconnect()
            resizeObserver?.disconnect()

            document.removeEventListener(
                "visibilitychange",
                onVisibility
            )

            button.style.transform = "none"
            particles.length = 0
        }
    }, [
        staticMode,
        palette,
        lavaIntensity,
        lavaScale,
        lavaSpeed,
        lavaFlow,
        crustThickness,
        crustRoughness,
        crackDensity,
        crackWidth,
        crackGlow,
        coreBrightness,
        heatGlow,
        heatDistortion,
        surfaceGloss,
        shadowIntensity,
        cursorInteraction,
        cursorRadius,
        cursorHeat,
        cursorFlow,
        clickEruption,
        eruptionStrength,
        eruptionDuration,
        particlesEnabled,
        particleCount,
        particleSize,
        pressScale,
        autoplay,
        quality,
        buttonHeight,
        buttonPadding,
        cornerRadius,
    ])

    const fontStyle: React.CSSProperties = {
        fontFamily: "Inter, sans-serif",
        fontSize: 22,
        fontWeight: 800,
        lineHeight: 1,
        letterSpacing: "-0.025em",
        ...font,
    }

    return (
        <div
            ref={stageRef}
            onPointerMove={handleMove}
            onPointerLeave={handleLeave}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                minWidth: 1,
                minHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                isolation: "isolate",
                background: backgroundColor,
                touchAction: "pan-y",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 1,
                    pointerEvents: "none",
                }}
            />

            <button
                ref={buttonRef}
                type="button"
                onClick={() => onClick?.()}
                onPointerDown={handleDown}
                onPointerUp={handleUp}
                onPointerCancel={handleUp}
                onLostPointerCapture={handleUp}
                onKeyDown={(event) => {
                    if (
                        !event.repeat &&
                        (event.key === " " ||
                            event.key === "Enter")
                    ) {
                        pressedRef.current = true
                        eruptionRef.current()
                        wakeRef.current()
                    }
                }}
                onKeyUp={(event) => {
                    if (
                        event.key === " " ||
                        event.key === "Enter"
                    ) {
                        pressedRef.current = false
                        wakeRef.current()
                    }
                }}
                onBlur={handleUp}
                style={{
                    position: "relative",
                    zIndex: 2,
                    flexShrink: 0,
                    maxWidth:
                        "calc(100% - 24px)",
                    height: clamp(
                        buttonHeight,
                        24,
                        240
                    ),
                    padding: `0 ${clamp(
                        buttonPadding,
                        8,
                        180
                    )}px`,
                    border: 0,
                    margin: 0,
                    borderRadius:
                        cornerRadius,
                    background:
                        "transparent",
                    appearance: "none",
                    WebkitAppearance: "none",
                    WebkitTapHighlightColor:
                        "transparent",
                    color: textColor,
                    cursor: "pointer",
                    outlineOffset: 5,
                    transformOrigin: "center",
                    ...fontStyle,
                }}
            >
                <span
                    style={{
                        display: "block",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow:
                            "ellipsis",
                        textShadow:
                            "0 1px 8px rgba(0,0,0,.8)",
                    }}
                >
                    {label}
                </span>
            </button>
        </div>
    )
}

KarimSaifMagmaCoreButton.defaultProps = defaults

addPropertyControls(KarimSaifMagmaCoreButton, {
    label: {
        type: ControlType.String,
        title: "Button Text",
        description: "Text displayed inside the magma button.",
    },
    font: {
        type: ControlType.Font,
        title: "Typography",
        description:
            "Customize the font family, size, weight, line height, and letter spacing.",
        controls: "extended",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        description: "Background color of the component area.",
    },
    preset: {
        type: ControlType.Enum,
        title: "Magma Preset",
        description:
            "Choose a volcanic material theme or define your own colors.",
        options: [
            "volcanic",
            "inferno",
            "blue",
            "toxic",
            "gold",
            "custom",
        ],
        optionTitles: [
            "Volcanic",
            "Inferno",
            "Blue Flame",
            "Toxic",
            "Molten Gold",
            "Custom",
        ],
    },
    crustColor: {
        type: ControlType.Color,
        title: "Crust Color",
        description: "Color of the cooled volcanic crust.",
        hidden: (p) => p.preset !== "custom",
    },
    lavaColor: {
        type: ControlType.Color,
        title: "Lava Color",
        description: "Main color of the molten lava.",
        hidden: (p) => p.preset !== "custom",
    },
    hotColor: {
        type: ControlType.Color,
        title: "Hot Core",
        description: "Color of the hottest magma regions.",
        hidden: (p) => p.preset !== "custom",
    },
    glowColor: {
        type: ControlType.Color,
        title: "Glow Color",
        description: "Color of the surrounding thermal glow.",
        hidden: (p) => p.preset !== "custom",
    },
    crackColor: {
        type: ControlType.Color,
        title: "Crack Color",
        description: "Color of glowing volcanic fissures.",
        hidden: (p) => p.preset !== "custom",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text Color",
        description: "Color of the button label.",
    },
    buttonHeight: {
        type: ControlType.Number,
        title: "Button Height",
        description: "Height of the magma button.",
        min: 24,
        max: 240,
        step: 1,
        unit: "px",
    },
    buttonPadding: {
        type: ControlType.Number,
        title: "Side Padding",
        description: "Horizontal padding around the button text.",
        min: 8,
        max: 180,
        step: 1,
        unit: "px",
    },
    cornerRadius: {
        type: ControlType.Number,
        title: "Corner Radius",
        description: "Roundness of the magma button.",
        min: 0,
        max: 999,
        step: 1,
        unit: "px",
    },
    lavaIntensity: {
        type: ControlType.Number,
        title: "Lava Intensity",
        description: "Brightness and visibility of molten lava.",
        min: 0,
        max: 2,
        step: 0.05,
    },
    lavaScale: {
        type: ControlType.Number,
        title: "Lava Scale",
        description: "Scale of the procedural magma texture.",
        min: 0.1,
        max: 4,
        step: 0.05,
    },
    lavaSpeed: {
        type: ControlType.Number,
        title: "Lava Speed",
        description: "Speed of the molten lava animation.",
        min: 0.1,
        max: 4,
        step: 0.05,
    },
    lavaFlow: {
        type: ControlType.Number,
        title: "Lava Flow",
        description: "Strength of directional magma movement.",
        min: 0,
        max: 3,
        step: 0.05,
    },
    crustThickness: {
        type: ControlType.Number,
        title: "Crust Thickness",
        description: "Thickness of the volcanic crust border.",
        min: 0.5,
        max: 10,
        step: 0.5,
    },
    crustRoughness: {
        type: ControlType.Number,
        title: "Crust Roughness",
        description: "Amount of rough detail in the volcanic crust.",
        min: 0,
        max: 3,
        step: 0.05,
    },
    crackDensity: {
        type: ControlType.Number,
        title: "Crack Density",
        description: "Density of glowing magma fissures.",
        min: 0,
        max: 3,
        step: 0.05,
    },
    crackWidth: {
        type: ControlType.Number,
        title: "Crack Width",
        description: "Thickness of the molten cracks.",
        min: 0.1,
        max: 2,
        step: 0.05,
    },
    crackGlow: {
        type: ControlType.Number,
        title: "Crack Glow",
        description: "Glow intensity around volcanic cracks.",
        min: 0,
        max: 2,
        step: 0.05,
    },
    coreBrightness: {
        type: ControlType.Number,
        title: "Core Brightness",
        description: "Brightness of the hottest magma regions.",
        min: 0,
        max: 2,
        step: 0.05,
    },
    heatGlow: {
        type: ControlType.Number,
        title: "Heat Glow",
        description: "Strength of the outer thermal glow.",
        min: 0,
        max: 2,
        step: 0.05,
    },
    heatDistortion: {
        type: ControlType.Number,
        title: "Heat Distortion",
        description: "Strength of animated thermal distortion.",
        min: 0,
        max: 2,
        step: 0.05,
    },
    surfaceGloss: {
        type: ControlType.Number,
        title: "Surface Gloss",
        description: "Intensity of glossy reflections on the magma surface.",
        min: 0,
        max: 2,
        step: 0.05,
    },
    shadowIntensity: {
        type: ControlType.Number,
        title: "Shadow",
        description: "Strength of the shadow beneath the button.",
        min: 0,
        max: 2,
        step: 0.05,
    },
    cursorInteraction: {
        type: ControlType.Boolean,
        title: "Cursor Reaction",
        description: "Allow the cursor to heat and disturb the lava.",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    cursorRadius: {
        type: ControlType.Number,
        title: "Cursor Radius",
        description: "Distance at which the cursor affects the lava.",
        min: 20,
        max: 800,
        step: 5,
        unit: "px",
        hidden: (p) => !p.cursorInteraction,
    },
    cursorHeat: {
        type: ControlType.Number,
        title: "Cursor Heat",
        description: "Amount of additional heat generated near the pointer.",
        min: 0,
        max: 3,
        step: 0.05,
        hidden: (p) => !p.cursorInteraction,
    },
    cursorFlow: {
        type: ControlType.Number,
        title: "Cursor Flow",
        description: "Strength of lava displacement caused by the pointer.",
        min: 0,
        max: 3,
        step: 0.05,
        hidden: (p) => !p.cursorInteraction,
    },
    clickEruption: {
        type: ControlType.Boolean,
        title: "Click Eruption",
        description: "Trigger a burst of magma when the button is pressed.",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    eruptionStrength: {
        type: ControlType.Number,
        title: "Eruption Power",
        description: "Intensity of the click-triggered magma eruption.",
        min: 0,
        max: 3,
        step: 0.05,
        hidden: (p) => !p.clickEruption,
    },
    eruptionDuration: {
        type: ControlType.Number,
        title: "Eruption Time",
        description: "Duration of the eruption and cooling animation.",
        min: 100,
        max: 3000,
        step: 25,
        unit: "ms",
        hidden: (p) => !p.clickEruption,
    },
    particlesEnabled: {
        type: ControlType.Boolean,
        title: "Ember Particles",
        description: "Show glowing embers during magma eruptions.",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    particleCount: {
        type: ControlType.Number,
        title: "Particle Count",
        description: "Number of embers emitted per eruption.",
        min: 0,
        max: 100,
        step: 1,
        hidden: (p) => !p.particlesEnabled,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Particle Size",
        description: "Size of the glowing ember particles.",
        min: 0.5,
        max: 8,
        step: 0.1,
        hidden: (p) => !p.particlesEnabled,
    },
    pressScale: {
        type: ControlType.Number,
        title: "Press Scale",
        description: "Compression of the button when pressed.",
        min: 0.7,
        max: 1,
        step: 0.01,
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        description: "Continuously animate the magma without cursor interaction.",
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    quality: {
        type: ControlType.Enum,
        title: "Quality",
        description: "Rendering resolution and target frame rate.",
        options: ["low", "medium", "high"],
        optionTitles: ["Low", "Medium", "High"],
    },
    paused: {
        type: ControlType.Boolean,
        title: "Pause Motion",
        description: "Freeze the magma animation while keeping the button usable.",
        enabledTitle: "Paused",
        disabledTitle: "Playing",
    },
    onClick: {
        type: ControlType.EventHandler,
        title: "On Click",
        description: "Connect the button to a Framer interaction or action.",
    },
})