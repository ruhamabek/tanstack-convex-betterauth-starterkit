/**
 * Showreel 5-Story Canvas Engine & Exporter
 * Generates ultra-high-resolution 1080x1920 PNG story cards for all 5 slides:
 * 1. Intro Hook
 * 2. The Crown / Top Specimen
 * 3. Living Leaderboard
 * 4. Critic Personality & Sliders
 * 5. Signature Iridescent Squircle Card
 */

export interface ShowreelExportData {
  handle: string
  displayName?: string
  role?: string
  issueNumber: number
  allSpecimensCount: number
  champion: {
    name: string
    craftScore: number
    utilityScore: number
    category: string
    headline?: string
    quote?: string
    status?: string
  }
  topSpecimens: Array<{
    name: string
    craftScore: number
    utilityScore: number
    category: string
    status?: string
  }>
  archetype: {
    title: string
    narrative: string
    sliders: Array<{
      label: string
      score: number
    }>
  }
}

const WIDTH = 1080
const HEIGHT = 1920

// Helper to create and initialize a 1080x1920 2D canvas
function createBaseCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d', { alpha: false })!
  return { canvas, ctx }
}

// Helper to wrap text cleanly within a maxWidth
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign = 'center',
): number {
  ctx.textAlign = align
  const words = text.split(' ')
  let line = ''
  let y = startY

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, y)
      line = word
      y += lineHeight
    } else {
      line = testLine
    }
  }

  if (line) {
    ctx.fillText(line, x, y)
    y += lineHeight
  }

  return y
}

/**
 * Slide 1: The Intro Hook
 */
export function renderSlide1Intro(data: ShowreelExportData): HTMLCanvasElement {
  const { canvas, ctx } = createBaseCanvas()

  // Background
  ctx.fillStyle = '#edeae4'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Decorative vector lines
  ctx.strokeStyle = '#18181b'
  ctx.lineWidth = 4
  ctx.globalAlpha = 0.2
  ctx.beginPath()
  ctx.moveTo(-100, 400)
  ctx.bezierCurveTo(300, 250, 600, 650, 1180, 420)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(-50, 500)
  ctx.bezierCurveTo(280, 380, 650, 720, 1180, 520)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(-100, 1200)
  ctx.bezierCurveTo(250, 1000, 750, 1400, 1180, 1150)
  ctx.stroke()
  ctx.globalAlpha = 1.0

  // Top pill badge
  ctx.fillStyle = '#18181b'
  ctx.beginPath()
  ctx.roundRect(120, 240, 460, 64, 32)
  ctx.fill()

  ctx.fillStyle = '#fcd34d'
  ctx.font = '700 24px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('CURATED TASTE SHOWREEL', 350, 281)

  // Top greeting
  ctx.textAlign = 'left'
  ctx.fillStyle = '#18181b'
  ctx.font = '800 68px "Geist Sans", sans-serif'
  ctx.fillText('We’re ready for you,', 120, 400)

  ctx.fillStyle = '#f43f5e'
  ctx.font = '900 76px "Geist Sans", sans-serif'
  ctx.fillText(`@${data.handle}`, 120, 490)

  // Subtitle
  ctx.fillStyle = '#52525b'
  ctx.font = '500 34px "Geist Sans", sans-serif'
  ctx.fillText('Your curated software taste showreel is live.', 120, 580)
  ctx.fillText(`${data.allSpecimensCount} specimens evaluated this cycle.`, 120, 630)

  // Giant outline number in center
  ctx.textAlign = 'center'
  ctx.strokeStyle = '#f43f5e'
  ctx.lineWidth = 10
  ctx.font = '900 260px "Geist Sans", sans-serif'
  ctx.strokeText(`#${String(data.issueNumber).padStart(2, '0')}`, 540, 1120)

  ctx.fillStyle = '#71717a'
  ctx.font = '700 32px monospace'
  ctx.fillText(data.role || 'DIGITAL CRAFT SHOWCASE', 540, 1260)

  // Footer
  ctx.strokeStyle = 'rgba(0,0,0,0.1)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(120, 1680)
  ctx.lineTo(960, 1680)
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#18181b'
  ctx.font = '800 32px monospace'
  ctx.fillText('SCREENLOG · TASTE SHOWREEL', 120, 1750)

  ctx.textAlign = 'right'
  ctx.fillStyle = '#71717a'
  ctx.font = '500 28px monospace'
  ctx.fillText('CURATED CRAFT', 960, 1750)

  return canvas
}

/**
 * Slide 2: The Consensus Champion / Top Rated Specimen
 */
export function renderSlide2Champion(data: ShowreelExportData): HTMLCanvasElement {
  const { canvas, ctx } = createBaseCanvas()

  // Background
  ctx.fillStyle = '#141416'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Concentric ripples in corner
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.lineWidth = 20
  ctx.beginPath()
  ctx.arc(1080, 1920, 450, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(1080, 1920, 650, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(1080, 1920, 850, 0, Math.PI * 2)
  ctx.stroke()

  // Top pill badge
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'
  ctx.fillStyle = 'rgba(245, 158, 11, 0.15)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(120, 240, 420, 64, 32)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#fbbf24'
  ctx.font = '700 24px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('★ YOUR TOP SPECIMEN', 330, 281)

  // Metric Header
  ctx.textAlign = 'left'
  ctx.fillStyle = '#a1a1aa'
  ctx.font = '700 28px monospace'
  ctx.fillText('TOP EVALUATED CRAFT SCORE', 120, 420)

  // Giant Score
  ctx.fillStyle = '#a5b4fc'
  ctx.font = '900 180px "Geist Sans", sans-serif'
  ctx.fillText(`${data.champion.craftScore}%`, 120, 590)

  // Title
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 64px "Geist Sans", sans-serif'
  ctx.fillText(`${data.champion.name} took the crown.`, 120, 720)

  // Quote or Tagline
  const textBody =
    data.champion.headline ||
    data.champion.quote ||
    `${data.champion.craftScore}% Craft / ${data.champion.utilityScore}% Utility. Highest rated in your showcase.`

  ctx.fillStyle = '#d4d4d8'
  ctx.font = '400 36px "Geist Sans", sans-serif'
  drawWrappedText(ctx, textBody, 120, 810, 840, 52, 'left')

  // Status Stamp Badge
  ctx.save()
  ctx.translate(140, 1160)
  ctx.rotate((-4 * Math.PI) / 180)
  const isLgtm = data.champion.craftScore >= 90
  const stampColor = isLgtm ? '#10b981' : '#f59e0b'

  ctx.strokeStyle = stampColor
  ctx.lineWidth = 6
  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.beginPath()
  ctx.roundRect(0, 0, 360, 90, 16)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = stampColor
  ctx.font = '900 32px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(isLgtm ? 'CERTIFIED LGTM' : 'NEEDS POLISH', 180, 56)
  ctx.restore()

  // Bottom Specimen Pill
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(120, 1420, 840, 150, 30)
  ctx.fill()
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 44px "Geist Sans", sans-serif'
  ctx.fillText(data.champion.name, 170, 1488)

  ctx.fillStyle = '#9ca3af'
  ctx.font = '500 26px monospace'
  ctx.fillText(data.champion.category, 170, 1532)

  ctx.textAlign = 'right'
  ctx.fillStyle = '#34d399'
  ctx.font = '700 32px monospace'
  ctx.fillText('#1 Ranked', 910, 1505)

  // Footer
  ctx.textAlign = 'center'
  ctx.fillStyle = '#71717a'
  ctx.font = '500 26px monospace'
  ctx.fillText('SCREENLOG · TASTE SHOWREEL', 540, 1770)

  return canvas
}

/**
 * Slide 3: Living Leaderboard (Top Specimens)
 */
export function renderSlide3Leaderboard(data: ShowreelExportData): HTMLCanvasElement {
  const { canvas, ctx } = createBaseCanvas()

  // Background
  ctx.fillStyle = '#f2efe9'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Header Tag
  ctx.textAlign = 'left'
  ctx.fillStyle = '#71717a'
  ctx.font = '700 28px monospace'
  ctx.fillText(`TASTE STORY #${String(data.issueNumber).padStart(2, '0')}`, 120, 260)

  // Title
  ctx.fillStyle = '#09090b'
  ctx.font = '900 68px "Geist Sans", sans-serif'
  ctx.fillText('Top Evaluated Specimens', 120, 345)

  // 3 Staggered Blocks
  const offsets = [0, 35, -25]
  data.topSpecimens.forEach((item, idx) => {
    const y = 470 + idx * 320
    const x = 120 + offsets[idx]

    // Inverted Black Block
    ctx.fillStyle = '#09090b'
    ctx.beginPath()
    ctx.roundRect(x, y, 840, 260, 32)
    ctx.fill()

    // Rank Number
    ctx.textAlign = 'left'
    ctx.fillStyle = '#a1a1aa'
    ctx.font = '900 64px monospace'
    ctx.fillText(`${idx + 1}`, x + 40, y + 105)

    // Name
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 48px "Geist Sans", sans-serif'
    ctx.fillText(item.name, x + 120, y + 90)

    // Category
    ctx.fillStyle = '#9ca3af'
    ctx.font = '500 26px monospace'
    ctx.fillText(item.category, x + 120, y + 140)

    // Craft score pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
    ctx.beginPath()
    ctx.roundRect(x + 40, y + 180, 240, 52, 26)
    ctx.fill()

    ctx.fillStyle = '#fcd34d'
    ctx.font = '700 24px monospace'
    ctx.fillText(`${item.craftScore}% CRAFT`, x + 65, y + 215)

    // Verdict Stamp
    const isLgtm = item.craftScore >= 90
    ctx.save()
    ctx.translate(x + 650, y + 180)
    ctx.rotate((-4 * Math.PI) / 180)
    ctx.strokeStyle = isLgtm ? '#10b981' : '#f59e0b'
    ctx.lineWidth = 3
    ctx.strokeRect(-80, -25, 160, 48)
    ctx.fillStyle = isLgtm ? '#10b981' : '#f59e0b'
    ctx.font = '800 22px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(isLgtm ? 'LGTM' : 'POLISH', 0, 7)
    ctx.restore()
  })

  // Footer
  ctx.strokeStyle = 'rgba(0,0,0,0.1)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(120, 1680)
  ctx.lineTo(960, 1680)
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.fillStyle = '#18181b'
  ctx.font = '800 30px monospace'
  ctx.fillText(`SCREENLOG · ISSUE #${String(data.issueNumber).padStart(2, '0')}`, 120, 1750)

  ctx.textAlign = 'right'
  ctx.fillStyle = '#71717a'
  ctx.font = '500 28px monospace'
  ctx.fillText('TASTE STORY', 960, 1750)

  return canvas
}

/**
 * Slide 4: Critic Personality Type & Sliders (YouTube Recap 2026 Style)
 */
export function renderSlide4Personality(data: ShowreelExportData): HTMLCanvasElement {
  const { canvas, ctx } = createBaseCanvas()

  // Background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Ambient glows
  const gradLeft = ctx.createRadialGradient(200, 1800, 50, 200, 1800, 600)
  gradLeft.addColorStop(0, 'rgba(244, 63, 94, 0.35)')
  gradLeft.addColorStop(1, 'transparent')
  ctx.fillStyle = gradLeft
  ctx.fillRect(0, 1200, 700, 720)

  const gradRight = ctx.createRadialGradient(880, 1800, 50, 880, 1800, 600)
  gradRight.addColorStop(0, 'rgba(168, 85, 247, 0.3)')
  gradRight.addColorStop(1, 'transparent')
  ctx.fillStyle = gradRight
  ctx.fillRect(380, 1200, 700, 720)

  // Header
  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 68px "Geist Sans", sans-serif'
  ctx.fillText('TASTE PROFILE ✦ ✦', 120, 260)

  // Personality subhead
  ctx.fillStyle = '#9ca3af'
  ctx.font = '500 32px "Geist Sans", sans-serif'
  ctx.fillText('Personality type', 120, 390)

  // Personality Title
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 72px "Geist Sans", sans-serif'
  ctx.fillText(data.archetype.title, 120, 475)

  // Top interests header
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 42px "Geist Sans", sans-serif'
  ctx.fillText('Top interests', 120, 630)

  // 3 Sliders
  data.archetype.sliders.forEach((slider, idx) => {
    const y = 720 + idx * 140

    ctx.textAlign = 'left'
    ctx.fillStyle = '#f4f4f5'
    ctx.font = '500 32px "Geist Sans", sans-serif'
    ctx.fillText(slider.label, 120, y)

    // Slider track
    ctx.fillStyle = '#27272a'
    ctx.beginPath()
    ctx.roundRect(120, y + 25, 840, 10, 5)
    ctx.fill()

    // Slider fill
    const fillW = Math.round(840 * (slider.score / 100))
    const barGrad = ctx.createLinearGradient(120, y + 25, 120 + fillW, y + 25)
    barGrad.addColorStop(0, '#ff0055')
    barGrad.addColorStop(1, '#ff2a6d')

    ctx.fillStyle = barGrad
    ctx.beginPath()
    ctx.roundRect(120, y + 25, fillW, 10, 5)
    ctx.fill()

    // Slider Thumb
    ctx.fillStyle = '#ff0055'
    ctx.beginPath()
    ctx.arc(120 + fillW, y + 30, 16, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(120 + fillW, y + 30, 6, 0, Math.PI * 2)
    ctx.fill()
  })

  // Top specimens approved section
  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 42px "Geist Sans", sans-serif'
  ctx.fillText('Top specimens approved', 120, 1200)

  data.topSpecimens.forEach((item, idx) => {
    const y = 1290 + idx * 95

    ctx.fillStyle = '#a1a1aa'
    ctx.font = '700 34px monospace'
    ctx.fillText(`${idx + 1}.`, 120, y)

    ctx.fillStyle = '#ffffff'
    ctx.font = '700 38px "Geist Sans", sans-serif'
    ctx.fillText(item.name, 175, y)

    ctx.fillStyle = '#34d399'
    ctx.font = '700 28px monospace'
    ctx.fillText(`${item.craftScore}% Craft`, 780, y)
  })

  // Footer (Clean Screenlog Brandmark - No YouTube icon)
  ctx.textAlign = 'center'
  ctx.fillStyle = '#71717a'
  ctx.font = '500 28px monospace'
  ctx.fillText(`SCREENLOG · CRITIC SHOWREEL #${String(data.issueNumber).padStart(2, '0')}`, 540, 1770)

  return canvas
}

/**
 * Slide 5: The Signature Iridescent Squircle Share Card
 */
export function renderSlide5Card(data: ShowreelExportData): HTMLCanvasElement {
  const { canvas, ctx } = createBaseCanvas()

  // Background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Iridescent squircle portal
  const grad = ctx.createLinearGradient(140, 280, 940, 1550)
  grad.addColorStop(0, '#84cc16')
  grad.addColorStop(0.35, '#f59e0b')
  grad.addColorStop(0.7, '#ec4899')
  grad.addColorStop(1, '#8b5cf6')

  ctx.lineWidth = 10
  ctx.strokeStyle = grad
  ctx.beginPath()
  ctx.roundRect(140, 280, 800, 1260, 70)
  ctx.stroke()

  // Inner Dark Fill
  ctx.fillStyle = '#09090c'
  ctx.beginPath()
  ctx.roundRect(145, 285, 790, 1250, 65)
  ctx.fill()

  // Header Tag inside squircle
  ctx.textAlign = 'center'
  ctx.fillStyle = '#9ca3af'
  ctx.font = '500 36px "Geist Sans", sans-serif'
  ctx.fillText(`Showreel #${String(data.issueNumber).padStart(2, '0')} · @${data.handle}`, 540, 440)

  // Title
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 70px "Geist Sans", sans-serif'
  ctx.fillText(data.archetype.title, 540, 560)

  // Narrative text wrap
  ctx.fillStyle = '#d1d5db'
  ctx.font = '400 32px "Geist Sans", sans-serif'
  drawWrappedText(ctx, data.archetype.narrative, 540, 670, 680, 48, 'center')

  // Top specimens subhead
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 40px "Geist Sans", sans-serif'
  ctx.fillText('Top specimens approved', 540, 970)

  // Specimen list
  data.topSpecimens.forEach((item, idx) => {
    const itemY = 1080 + idx * 120
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 42px "Geist Sans", sans-serif'
    ctx.fillText(`${idx + 1}. ${item.name} (${item.craftScore}% Craft)`, 540, itemY)
  })

  // Footer brandmark
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 38px "Geist Sans", sans-serif'
  ctx.fillText('SCREENLOG', 540, 1720)

  ctx.fillStyle = '#6b7280'
  ctx.font = '400 28px "Geist Sans", sans-serif'
  ctx.fillText('CURATED SOFTWARE APPRAISAL', 540, 1770)

  return canvas
}

/**
 * Generate all 5 story canvases
 */
export function generateAllStoryCanvases(data: ShowreelExportData): Array<{
  canvas: HTMLCanvasElement
  filename: string
  title: string
}> {
  return [
    {
      canvas: renderSlide1Intro(data),
      filename: `01-screenlog-${data.handle}-intro.png`,
      title: 'Slide 1: Intro Hook',
    },
    {
      canvas: renderSlide2Champion(data),
      filename: `02-screenlog-${data.handle}-champion.png`,
      title: 'Slide 2: Top Specimen',
    },
    {
      canvas: renderSlide3Leaderboard(data),
      filename: `03-screenlog-${data.handle}-specimens.png`,
      title: 'Slide 3: Living Leaderboard',
    },
    {
      canvas: renderSlide4Personality(data),
      filename: `04-screenlog-${data.handle}-personality.png`,
      title: 'Slide 4: Personality & Metrics',
    },
    {
      canvas: renderSlide5Card(data),
      filename: `05-screenlog-${data.handle}-sharecard.png`,
      title: 'Slide 5: Signature Share Card',
    },
  ]
}

/**
 * Downloads all 5 stories with smooth sequential delays to avoid browser download blocking
 */
export async function downloadAllStories(
  data: ShowreelExportData,
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const stories = generateAllStoryCanvases(data)
  const total = stories.length

  for (let i = 0; i < total; i++) {
    onProgress?.(i + 1, total)
    const { canvas, filename } = stories[i]

    await new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve()
          return
        }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => {
          URL.revokeObjectURL(url)
          resolve()
        }, 250)
      }, 'image/png')
    })
  }
}

/**
 * Shares all 5 stories via Web Share API (native sheet on iOS / Android / macOS)
 * or falls back to downloading all 5 + opening Twitter intent.
 */
export async function shareAllStories(data: ShowreelExportData): Promise<boolean> {
  const stories = generateAllStoryCanvases(data)
  const files: File[] = []

  for (const item of stories) {
    const blob = await new Promise<Blob | null>((resolve) =>
      item.canvas.toBlob((b) => resolve(b), 'image/png'),
    )
    if (blob) {
      files.push(new File([blob], item.filename, { type: 'image/png' }))
    }
  }

  const specimenLines = data.topSpecimens
    .map((item, idx) => `${idx + 1}. ${item.name} (${item.craftScore}% Craft)`)
    .join('\n')

  const shareText = `My 2026 Taste Story on Screenlog:\n\n${specimenLines}\n\nPersonality: ${data.archetype.title}\nCritic: @${data.handle}\n\n#screenlog #softwarecraft`

  if (
    typeof navigator !== 'undefined' &&
    navigator.canShare &&
    navigator.canShare({ files })
  ) {
    try {
      await navigator.share({
        title: `Screenlog Taste Story · @${data.handle}`,
        text: shareText,
        files,
      })
      return true
    } catch (err: any) {
      if (err.name === 'AbortError') return true // User cancelled sheet
    }
  }

  // Fallback: Trigger download of all 5 and open Twitter intent
  const encodedText = encodeURIComponent(shareText)
  window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank')
  await downloadAllStories(data)
  return false
}
