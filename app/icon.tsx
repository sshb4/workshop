import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import path from 'path'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default async function Icon() {
  try {
    // Read the icon.png file
    const iconPath = path.join(process.cwd(), 'app', 'icon.png')
    const iconBuffer = await readFile(iconPath)
    const iconBase64 = iconBuffer.toString('base64')
    
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: `url(data:image/png;base64,${iconBase64})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        />
      ),
      {
        ...size,
      }
    )
  } catch (error) {
    // Fallback if file reading fails
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold',
          }}
        >
          B
        </div>
      ),
      {
        ...size,
      }
    )
  }
}
