import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js'

gsap.registerPlugin(ScrollTrigger)
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

// ===== SCROLL PROGRESS BAR =====
const bar = document.getElementById('progress-bar')
if (bar) {
  gsap.to(bar, {
    width: '100%',
    ease: 'none',
    scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 0.3 }
  })
}

// ===== HERO ENTRANCE =====
const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
heroTl
  .from('.hero__badge',    { y: -20, opacity: 0, duration: 0.7 })
  .from('.hero__title',    { y: 32,  opacity: 0, duration: 0.8 }, '-=0.4')
  .from('.hero__subtitle', { y: 20,  opacity: 0, duration: 0.6 }, '-=0.5')
  .from('.hero__video-wrapper', { y: 40, opacity: 0, duration: 0.9, scale: 0.97 }, '-=0.4')
  .from('.hero__scroll-cta',    { opacity: 0, duration: 0.5 }, '-=0.2')

// ===== HERO BACKGROUND PARALLAX (desktop only) =====
const mm = gsap.matchMedia()

mm.add('(min-width: 768px)', () => {
  gsap.to('.hero::before', {
    yPercent: 40,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  })
})

// ===== KICKERS =====
document.querySelectorAll('.kicker').forEach(k => {
  gsap.from(k, {
    y: 16,
    opacity: 0,
    duration: 0.6,
    ease: 'power3.out',
    scrollTrigger: { trigger: k, start: 'top 88%', toggleActions: 'play none none none' }
  })
})

// ===== SECTION REVEAL UTILITY =====
function revealSection(trigger, targets, stagger = 0.12) {
  gsap.from(targets, {
    y: 48,
    opacity: 0,
    duration: 0.75,
    stagger,
    ease: 'power3.out',
    scrollTrigger: {
      trigger,
      start: 'top 82%',
      toggleActions: 'play none none none'
    }
  })
}

// ===== CICLO SECTION =====
revealSection('#ciclo', '#ciclo .section-title', 0)
revealSection('#ciclo', '#ciclo .section-subtitle', 0)
gsap.from('.ciclo__stage', {
  y: 56,
  opacity: 0,
  duration: 0.65,
  stagger: 0.12,
  ease: 'power3.out',
  scrollTrigger: { trigger: '.ciclo__stages', start: 'top 85%' }
})
gsap.from('.ciclo__dato', {
  y: 32,
  opacity: 0,
  duration: 0.6,
  ease: 'power3.out',
  scrollTrigger: { trigger: '.ciclo__dato', start: 'top 88%' }
})

// Stage hover glow effect
document.querySelectorAll('.ciclo__stage').forEach(stage => {
  stage.addEventListener('mouseenter', () =>
    gsap.to(stage, { boxShadow: '0 0 0 1px rgba(230,57,70,0.4), 0 8px 30px rgba(230,57,70,0.15)', duration: 0.3 })
  )
  stage.addEventListener('mouseleave', () =>
    gsap.to(stage, { boxShadow: 'none', duration: 0.3 })
  )
})

// ===== DATOS SECTION =====
revealSection('#datos', '#datos .section-title')
revealSection('#datos', '#datos .section-subtitle')

gsap.from('.chart-wrapper', {
  y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
  scrollTrigger: { trigger: '.chart-wrapper', start: 'top 85%' }
})

// Animated counters (stats-row)
document.querySelectorAll('.stat-num').forEach(el => {
  const target = parseInt(el.dataset.target)
  const isSuffix = target === 4 ? '' : target === 300 ? '%' : '+'
  const snap = target > 1000 ? 500 : 1
  const obj = { val: 0 }
  gsap.to(obj, {
    val: target,
    duration: 2.2,
    ease: 'power2.out',
    snap: { val: snap },
    scrollTrigger: { trigger: '.stats-row', start: 'top 80%', toggleActions: 'play none none none' },
    onUpdate() {
      el.textContent = obj.val.toLocaleString('es-CR') + isSuffix
    }
  })
})
gsap.from('.stat-item:not(.stat-item--divider)', {
  y: 30, opacity: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out',
  scrollTrigger: { trigger: '.stats-row', start: 'top 85%' }
})

// ===== SECCIONES NUEVAS =====
revealSection('#que-es', '#que-es .section-title')
revealSection('#que-es', '#que-es .section-subtitle')
gsap.from('.info-card', { y: 40, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.cards-grid', start: 'top 85%' } })
gsap.from('.alerta-box', { y: 24, opacity: 0, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: '.alerta-box', start: 'top 88%' } })

revealSection('#sintomas', '#sintomas .section-title')
revealSection('#sintomas', '#sintomas .section-subtitle')
gsap.from('.fase', { y: 40, opacity: 0, duration: 0.65, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: '.fases', start: 'top 85%' } })
gsap.from('.alarma', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: '.alarma', start: 'top 85%' } })

revealSection('#sistema', '#sistema .section-title')
revealSection('#sistema', '#sistema .section-subtitle')
gsap.from('.sistema-argumento', { y: 36, opacity: 0, duration: 0.75, ease: 'power3.out', scrollTrigger: { trigger: '.sistema-argumento', start: 'top 85%' } })
gsap.from('.impacto-card', { y: 40, opacity: 0, duration: 0.65, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.impacto-grid', start: 'top 85%' } })
gsap.from('.sistema-conclusion', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: '.sistema-conclusion', start: 'top 88%' } })

// ===== CHECKLIST SECTION =====
revealSection('#accion', '#accion .section-title')
revealSection('#accion', '#accion .section-subtitle')

gsap.from('.check-item', {
  x: -40,
  opacity: 0,
  duration: 0.6,
  stagger: 0.15,
  ease: 'power3.out',
  scrollTrigger: { trigger: '.checklist', start: 'top 85%' }
})

// ===== GRÁFICO =====
const canvasEl = document.getElementById('grafico-casos')
let chartCreated = false
if (canvasEl) {
  ScrollTrigger.create({
    trigger: canvasEl,
    start: 'top 80%',
    onEnter() {
      if (chartCreated) return
      chartCreated = true
      new Chart(canvasEl, {
        type: 'line',
        data: {
          labels: ['2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024*'],
          datasets: [{
            label: 'Casos confirmados',
            data: [52247, 19800, 8700, 11200, 9100, 8300, 11200, 5200, 4800, 8900, 11500, 33000],
            borderColor: '#ff4757',
            backgroundColor: ctx => {
              const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300)
              g.addColorStop(0, 'rgba(255,71,87,0.28)')
              g.addColorStop(1, 'rgba(255,71,87,0)')
              return g
            },
            borderWidth: 2.5,
            pointBackgroundColor: (ctx) => ctx.dataIndex === 0 ? '#ff6b35' : '#ff4757',
            pointBorderColor: '#0a0e14',
            pointBorderWidth: (ctx) => ctx.dataIndex === 0 ? 3 : 2,
            pointRadius: (ctx) => ctx.dataIndex === 0 ? 9 : 5,
            pointHoverRadius: (ctx) => ctx.dataIndex === 0 ? 12 : 8,
            tension: 0.45,
            fill: true,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          animation: { duration: 1800, easing: 'easeInOutQuart' },
          plugins: {
            tooltip: {
              backgroundColor: '#161b22',
              borderColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              padding: 12,
              callbacks: { label: ctx => ` ${ctx.parsed.y.toLocaleString('es-CR')} casos` }
            },
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: { color: '#8b949e', font: { size: 12 } }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: {
                color: '#8b949e',
                font: { size: 12 },
                callback: v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v
              }
            }
          }
        }
      })
    }
  })
}

// ===== VIDEO =====
const playBtn = document.getElementById('play-btn')
const iframe  = document.getElementById('yt-iframe')
const VIDEO_ID = 'PENDIENTE'

playBtn?.addEventListener('click', () => {
  if (VIDEO_ID === 'PENDIENTE') {
    const label = playBtn.querySelector('.play-label')
    if (label) {
      gsap.to(label, { opacity: 0, duration: 0.2, onComplete() {
        label.textContent = '🎬 Video en producción — ¡pronto!'
        label.style.color = '#ff4757'
        gsap.to(label, { opacity: 1, duration: 0.3 })
      }})
    }
    return
  }
  gsap.to(playBtn, { opacity: 0, scale: 0.9, duration: 0.3, onComplete() {
    playBtn.classList.add('hidden')
    iframe.classList.remove('hidden')
    iframe.src = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0`
  }})
})
playBtn?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') playBtn.click() })

// ===== CHECKLIST LOGIC =====
const KEYS = ['lavar', 'tapar', 'voltear']
const MSGS = [null, 'Bien. Dos más y tu familia está protegida.', '¡Ya casi! Solo falta una acción.', '¡Hecho! Tu comunidad te lo agradece. 💚']

function updateStatus(animate = true) {
  const done = KEYS.filter(k => localStorage.getItem(`d-${k}`) === '1').length
  const el = document.getElementById('checklist-status')
  if (!el) return
  const msg = MSGS[done]
  if (!msg) { el.textContent = ''; el.classList.remove('visible'); return }
  if (animate) {
    gsap.to(el, { opacity: 0, y: 8, duration: 0.2, onComplete() {
      el.textContent = msg
      el.classList.add('visible')
      gsap.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
    }})
  } else {
    el.textContent = msg || ''
    if (msg) el.classList.add('visible')
  }
}

function loadChecks() {
  KEYS.forEach(key => {
    if (localStorage.getItem(`d-${key}`) === '1') {
      const item = document.querySelector(`.check-item[data-key="${key}"]`)
      const input = document.getElementById(`check-${key}`)
      if (item && input) { input.checked = true; item.classList.add('checked') }
    }
  })
  updateStatus(false)
}

document.querySelectorAll('.check-item').forEach(item => {
  item.addEventListener('click', () => {
    const key = item.dataset.key
    const input = document.getElementById(`check-${key}`)
    if (!input) return
    input.checked = !input.checked
    item.classList.toggle('checked', input.checked)
    localStorage.setItem(`d-${key}`, input.checked ? '1' : '0')

    if (input.checked) {
      gsap.fromTo(item,
        { x: 0 },
        { x: 8, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.inOut' }
      )
      gsap.fromTo(item.querySelector('.check-mark'),
        { scale: 0, rotation: -20 },
        { scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(2)' }
      )
    }
    updateStatus()
  })
})

loadChecks()

// ===== FOOTER REVEAL =====
gsap.from('.footer__orgs, .footer__copy, .footer__fuentes', {
  y: 24, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
  scrollTrigger: { trigger: '.footer', start: 'top 90%' }
})
