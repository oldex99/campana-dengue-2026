import './style.css'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

// ===== VIDEO =====
const playBtn = document.getElementById('play-btn')
const iframe = document.getElementById('yt-iframe')
const VIDEO_ID = 'PENDIENTE' // reemplazar con el ID de YouTube cuando el video esté listo

playBtn?.addEventListener('click', () => {
  if (VIDEO_ID === 'PENDIENTE') {
    alert('El video estará disponible pronto. ¡Gracias por tu interés!')
    return
  }
  iframe.src = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0`
  playBtn.classList.add('hidden')
  iframe.classList.remove('hidden')
})
playBtn?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') playBtn.click() })

// ===== REVEAL ON SCROLL =====
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible')
      revealObserver.unobserve(entry.target)
    }
  })
}, { threshold: 0.15 })

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el))

// ===== GRÁFICO =====
const casosData = {
  labels: ['2020', '2021', '2022', '2023', '2024'],
  // Fuente: Ministerio de Salud CR / OPS-PLISA — en verificación
  valores: [5200, 4800, 8900, 31000, 31000]
}

const canvasEl = document.getElementById('grafico-casos')
if (canvasEl) {
  const chartObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      new Chart(canvasEl, {
        type: 'line',
        data: {
          labels: casosData.labels,
          datasets: [{
            label: 'Casos confirmados de dengue',
            data: casosData.valores,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239,68,68,0.15)',
            borderWidth: 3,
            pointBackgroundColor: '#ef4444',
            pointRadius: 5,
            tension: 0.4,
            fill: true,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          animation: { duration: 1200, easing: 'easeInOutQuart' },
          plugins: {
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.parsed.y.toLocaleString('es-CR')} casos`
              }
            },
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#9ca3af' }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#9ca3af',
                callback: v => v.toLocaleString('es-CR')
              }
            }
          }
        }
      })
      chartObserver.disconnect()
    }
  }, { threshold: 0.3 })
  chartObserver.observe(canvasEl)
}

// ===== CHECKLIST =====
const KEYS = ['lavar', 'tapar', 'voltear']
const STATUS_MSGS = [
  '', 'Bien. Seguí con las otras dos.', '¡Ya casi! Una más.',
  '¡Listo! Tu familia está más protegida. 💚'
]

function loadChecks() {
  KEYS.forEach(key => {
    const saved = localStorage.getItem(`dengue-check-${key}`)
    if (saved === 'true') {
      const item = document.querySelector(`.check-item[data-key="${key}"]`)
      const input = document.getElementById(`check-${key}`)
      if (item && input) { input.checked = true; item.classList.add('checked') }
    }
  })
  updateStatus()
}

function updateStatus() {
  const done = KEYS.filter(k => localStorage.getItem(`dengue-check-${k}`) === 'true').length
  const el = document.getElementById('checklist-status')
  if (el) el.textContent = STATUS_MSGS[done] || ''
}

document.querySelectorAll('.check-item').forEach(item => {
  item.addEventListener('click', () => {
    const key = item.dataset.key
    const input = document.getElementById(`check-${key}`)
    if (!input) return
    input.checked = !input.checked
    item.classList.toggle('checked', input.checked)
    localStorage.setItem(`dengue-check-${key}`, input.checked)
    updateStatus()
  })
})

loadChecks()
