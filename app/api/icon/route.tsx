import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sizeParam = searchParams.get('size')
  const size = sizeParam ? parseInt(sizeParam, 10) : 192

  // Validate size
  const validSize = Math.min(Math.max(size, 16), 1024)
  const borderRadius = Math.round(validSize * 0.125) // 12.5% border radius
  const padding = Math.round(validSize * 0.1) // 10% padding
  const imgSize = validSize - (padding * 2)

  // Read the logo image
  const logoData = await readFile(join(process.cwd(), 'public', 'logo.png'))
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: validSize,
          height: validSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: `${borderRadius}px`,
          padding: `${padding}px`,
        }}
      >
        <img
          src={logoBase64}
          alt="AfriConnect"
          width={imgSize}
          height={imgSize}
          style={{
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    {
      width: validSize,
      height: validSize,
    }
  )
}
