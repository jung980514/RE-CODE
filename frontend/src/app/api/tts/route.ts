import { NextResponse } from 'next/server'
import textToSpeech, { protos } from '@google-cloud/text-to-speech'

interface TTSRequest {
  text: string;
}

type AudioEncoding = protos.google.cloud.texttospeech.v1.AudioEncoding;
type SynthesizeSpeechRequest = protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest;

export async function POST(req: Request) {
  try {
    const { text } = await req.json() as TTSRequest;

    // Google Cloud 클라이언트 초기화
    const client = new textToSpeech.TextToSpeechClient({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    })

    // TTS 요청 설정
    const ttsRequest: SynthesizeSpeechRequest = {
      input: { text },
      voice: {
        languageCode: 'ko-KR',
        name: 'ko-KR-Neural2-A',
      },
      audioConfig: { audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3 },
    }

    // TTS 변환 실행
    const [response] = await client.synthesizeSpeech(ttsRequest)
    const audioContent = response.audioContent

    // 오디오 응답 반환
    return new NextResponse(audioContent, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    })
  } catch (error) {
    console.error('TTS 에러:', error)
    return NextResponse.json(
      { error: 'TTS 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}