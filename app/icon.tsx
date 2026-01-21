import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default async function Icon() {
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
          borderRadius: '6px',
        }}
      >
        <img
          src={logoBase64}
          alt="AfriConnect"
          width={32}
          height={32}
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
