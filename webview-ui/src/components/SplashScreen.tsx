import { useEffect, useState } from 'react'
import '../styles/splash.css'

interface SplashScreenProps {
  onComplete: () => void
}

const FULL_TEXT = 'Hello from Nodomia!'

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [displayed, setDisplayed] = useState('')
  const [phase, setPhase] = useState<'typing' | 'showing' | 'hiding'>('typing')

  //Более современный подход с AbortController
  useEffect(() => {
    const controller = new AbortController()
    let i = 0
    const typeTimer = setInterval(() => {
      i++
      setDisplayed(FULL_TEXT.slice(0, i))
      if (i >= FULL_TEXT.length) {
        clearInterval(typeTimer)
        //Сохраняем таймаут, чтобы очистить его при размонтировании
        const hideTimer = setTimeout(() => {
          //Проверяем, не был ли компонент размонтирован
          if (!controller.signal.aborted) setPhase('hiding')
        }, 1000)
        //Очищаем hideTimer через listener на abort, чтобы не было утечки
        controller.signal.addEventListener('abort', () => clearTimeout(hideTimer), { once: true })
        setPhase('showing')
      }
    }, 70)

    return () => {
      //При размонтировании отменяем все асинхронные операции
      controller.abort()
      clearInterval(typeTimer)
    }
  }, [])

  //Обрабатывает переход к onComplete после анимации скрытия
  //Зависит от phase и onComplete - пересоздается при их изменении
  useEffect(() => {
    if (phase === 'hiding') {
      const timer = setTimeout(() => onComplete(), 600)
      return () => clearTimeout(timer)
    }
  }, [phase, onComplete])

  return (
    <div className={`splash${phase === 'hiding' ? ' hidden' : ''}`}>
      <span className="splash__text">
        {displayed}
        {phase === 'typing' && <span className="splash__cursor" />}
      </span>
    </div>
  )
}
