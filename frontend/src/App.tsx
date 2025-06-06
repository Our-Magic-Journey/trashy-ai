import { useState } from 'react'

import leafImg from './assets/leaf.png'
import recycleBg from './assets/recycle-bg.png'
import bioBin from './assets/bio.png'
import plasticBin from './assets/plastik.png'
import paperBin from './assets/papier.png'
import glassBin from './assets/szklo.png'
import otherBin from './assets/zmieszane.png'

type WasteResult = {
  predicted_class: string
  confidence: number
  predictions: Record<string, number>
}

const binIcons: Record<string, string> = {
  biological: bioBin,
  plastic: plasticBin,
  paper: paperBin,
  glass: glassBin,
  other: otherBin,
}

const binLabels: Record<string, string> = {
  biological: 'Bio',
  plastic: 'Plastik',
  paper: 'Papier',
  glass: 'Szkło',
  other: 'Zmieszane',
}

export default function App() {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<WasteResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSelect = (file: File) => {
    setImage(file)
    setResult(null)
    setPreview(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!image) return
    setLoading(true)
    setResult(null)
    const formData = new FormData()
    formData.append('file', image)
    try {
      const res = await fetch('https://api_ai.purgal.xyz/predict', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      console.log(data);

      setResult(data)
    } catch (e) {
      setResult(null)
    }
    setLoading(false)
  }

  const handleReset = () => {
    setImage(null)
    setPreview(null)
    setResult(null)
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 via-blue-50 to-green-100 flex flex-col">
      <header className="w-full py-8 bg-white/80 shadow flex flex-col items-center rounded-b-3xl">
        <img src={leafImg} alt="Liść Eko" className="w-16 mb-2 drop-shadow-lg" />
        <h1 className="text-4xl font-bold text-green-700 tracking-tight">Śmieciowe AI</h1>
        <p className="text-green-600 mt-1 text-lg">Inteligentne rozpoznawanie odpadów</p>
      </header>

      <main className="flex-1 flex flex-col md:flex-row justify-center items-center md:items-start gap-12 px-8 py-12 max-w-[1600px] mx-auto w-full">
        <section className="flex-1 bg-white/90 rounded-2xl shadow-lg p-10 flex flex-col items-center w-full max-w-[500px]">
          {!preview && (
            <label className="cursor-pointer flex flex-col items-center gap-4">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) handleSelect(e.target.files[0])
                }}
              />

              <span className="inline-flex items-center gap-2 px-8 py-4 bg-green-100 border-2 border-green-400 text-green-700 font-semibold rounded-xl shadow hover:bg-green-200 transition">
                <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
                Prześlij zdjęcie odpadu
              </span>
              <span className="text-green-500 text-sm">JPG, PNG lub HEIC. Maks. 10MB.</span>
            </label>
          )}

          {preview && (
            <div className="flex flex-col items-center">
              <img src={preview} alt="Podgląd" className="w-56 h-56 object-contain rounded-xl border-2 border-green-200 bg-green-50 shadow" />
              <div className="flex gap-4 mt-6">
                <button
                  className={`bg-green-600 text-white px-8 py-2 rounded-lg font-bold shadow hover:bg-green-700 transition ${loading ? 'cursor-not-allowed' : 'cursor-pointer' } ${!!result ? 'hidden' : 'block'}`}
                  onClick={handleUpload}
                  disabled={loading}
                >
                  {loading ? "Wysyłanie..." : "Analizuj"}
                </button>
                <button
                  className={`bg-blue-50 text-green-700 border border-green-300 px-8 py-2 rounded-lg font-bold hover:bg-blue-100 transition ${loading ? 'cursor-not-allowed' : 'cursor-pointer' }`}
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="flex-1 bg-white/90 rounded-2xl shadow-lg p-10 flex flex-col items-center min-h-[500px] w-full max-w-[500px]">
          {loading && (
            <div className="flex flex-col items-center justify-center my-auto">
              <svg className="animate-spin w-14 h-14 text-green-400 mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              <span className="text-green-700 font-semibold">Analizowanie...</span>
            </div>
          )}

          {!loading && result && preview && (
            <div className="w-full flex flex-col items-center">
              <h2 className="text-2xl font-bold text-green-700 mb-4">Wyniki klasyfikacji</h2>
              <div className="w-full max-w-xs space-y-2 mb-4">
                {Object.entries(result.predictions).sort((a, b) => b[1] - a[1]).map(([type, conf]) => {
                    const percent = Math.max(0, Math.round(conf * 100));

                    return (
                      <div key={type} className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="capitalize text-green-800">{binLabels[type] || type}</span>
                          <span className="font-bold text-green-600">{percent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-green-100 rounded-full h-3">
                          <div
                            className="bg-green-400 h-3 rounded-full transition-all duration-500"
                            style={{ width: percent > 0 ? `${percent}%` : '0%' }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
              <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl shadow w-full justify-center">
                <img src={binIcons[result.predicted_class] || binIcons.other} alt="Kosz" className="" />
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="flex flex-col items-center opacity-60 my-auto">
              <img src={recycleBg} alt="Recykling" className="w-24 h-24 mb-2" />
              <span className="text-green-500 font-medium">Tutaj pojawi się Twój wynik</span>
            </div>
          )}
        </section>
      </main>

      <footer className="w-full py-6 bg-white/80 text-center text-green-700 font-medium rounded-t-3xl shadow-inner mt-8">
        ♻️ Spraw, aby świat był czystszy.
      </footer>
    </div>
  )
}