import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Image generation
export default async function AppleIcon() {
  // Read the logo image
  const logoData = await readFile(join(process.cwd(), 'public', 'logo.png'))
  const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: '36px',
        }}
      >
        <img
          src={logoBase64}
          alt="AfriConnect"
          width={160}
          height={160}
          style={{
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
