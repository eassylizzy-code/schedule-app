'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavBarProps {
  onAddClick: () => void
  title: string
  onPrev: () => void
  onNext: () => void
}

export default function NavBar({ onAddClick, title, onPrev, onNext }: NavBarProps) {
  const pathname = usePathname()

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
      <button onClick={onPrev} className="text-gray-400 text-2xl leading-none px-1">‹</button>

      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-400 font-medium">{title}</span>
        <div className="flex gap-4 mt-1">
          <Link
            href="/"
            className={`text-sm font-semibold pb-0.5 ${
              pathname === '/'
                ? 'text-gray-900 border-b-2 border-orange-400'
                : 'text-gray-400'
            }`}
          >
            Неделя
          </Link>
          <Link
            href="/month"
            className={`text-sm font-semibold pb-0.5 ${
              pathname === '/month'
                ? 'text-gray-900 border-b-2 border-orange-400'
                : 'text-gray-400'
            }`}
          >
            Месяц
          </Link>
        </div>
        <Link href="/settings" className="text-[10px] text-gray-400 mt-0.5">⚙️ iCloud</Link>
      </div>

      <div className="flex gap-2 items-center">
        <button onClick={onNext} className="text-gray-400 text-2xl leading-none px-1">›</button>
        <button
          onClick={onAddClick}
          className="bg-orange-400 text-white rounded-full w-8 h-8 text-xl leading-none flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  )
}
