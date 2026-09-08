// Pulls the 11-char video id out of any common YouTube URL shape
// (watch?v=, youtu.be/, embed/, shorts/, live/). Returns null if none found.
export function youtubeId(url) {
  if (!url || typeof url !== 'string') return null
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  )
  return m ? m[1] : null
}

export const youtubeThumb = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`

export const youtubeEmbed = (id, { autoplay = false } = {}) =>
  `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1${autoplay ? '&autoplay=1' : ''}`
