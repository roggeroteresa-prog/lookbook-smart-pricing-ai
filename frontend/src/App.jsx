import { useEffect, useMemo, useState } from 'react'
import './App.css'

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Formato immagine non valido.'))
        return
      }

      resolve(result.split(',')[1])
    }
    reader.onerror = () => reject(new Error('Errore durante la lettura del file.'))
    reader.readAsDataURL(file)
  })
}

function App() {
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [condition, setCondition] = useState('buono')
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const sessionId = useMemo(() => {
    const existing = localStorage.getItem('lookbook-session-id')
    if (existing) {
      return existing
    }

    const generated = crypto.randomUUID()
    localStorage.setItem('lookbook-session-id', generated)
    return generated
  }, [])

  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) {
      return ''
    }
    return URL.createObjectURL(imageFile)
  }, [imageFile])

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl)
      }
    }
  }, [imagePreviewUrl])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setResult(null)

    if (!imageFile) {
      setError('Carica una foto del capo prima di continuare.')
      return
    }

    try {
      setLoading(true)

      const imageBase64 = await toBase64(imageFile)
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/valuate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            category,
            brand,
            condition,
            imageBase64,
            imageMimeType: imageFile.type,
          }),
        },
      )

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Errore durante la valutazione.')
      }

      localStorage.setItem('lookbook-session-id', data.sessionId)
      setResult(data.estimate)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <div className="bg-shape bg-shape-one" aria-hidden="true"></div>
      <div className="bg-shape bg-shape-two" aria-hidden="true"></div>

      <section className="hero">
        <p className="eyebrow">LookBook Smart Pricing AI</p>
        <h1>Valuta i tuoi capi usati in pochi secondi</h1>
        <p className="hero-copy">
          Inserisci i dati del capo, carica una foto e ricevi una stima AI con
          prezzo consigliato, range realistico e suggerimenti per vendere prima.
        </p>
      </section>

      <section className="card-grid">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h2>Dati del capo</h2>

          <label>
            Categoria
            <input
              type="text"
              placeholder="Es. Giacca, Jeans, Sneakers"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            />
          </label>

          <label>
            Brand
            <input
              type="text"
              placeholder="Es. Levi's, Zara, Nike"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              required
            />
          </label>

          <label>
            Stato
            <select value={condition} onChange={(event) => setCondition(event.target.value)}>
              <option value="nuovo">Nuovo</option>
              <option value="buono">Buono</option>
              <option value="usato">Usato</option>
            </select>
          </label>

          <label>
            Foto del capo
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Valutazione in corso...' : 'Valuta'}
          </button>

          {error ? <p className="error-box">{error}</p> : null}
        </form>

        <article className="card result-card">
          <h2>Risultato AI</h2>

          {imagePreviewUrl ? (
            <img className="preview" src={imagePreviewUrl} alt="Anteprima capo" />
          ) : (
            <p className="placeholder">Carica una foto per vedere l'anteprima.</p>
          )}

          {result ? (
            <>
              <div className="price-block">
                <p className="price">{result.suggested_price} EUR</p>
                <p>
                  Range: {result.range.min} EUR - {result.range.max} EUR
                </p>
              </div>

              <div className="text-block">
                <h3>Motivazione</h3>
                <p>{result.motivation}</p>
              </div>

              <div className="text-block">
                <h3>Suggerimenti di vendita</h3>
                <ul>
                  {result.selling_tips.map((tip, index) => (
                    <li key={`${tip}-${index}`}>{tip}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="placeholder">Il risultato della valutazione comparira qui dopo la richiesta.</p>
          )}
        </article>
      </section>
    </main>
  )
}

export default App
